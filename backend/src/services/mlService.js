'use strict';

const axios = require('axios');
const logger = require('../config/logger');
const redisClient = require('../config/redisClient');
const timescalePool = require('../config/timescaleClient');

const mlService = {
  /**
   * Normalizes any timestamp to "YYYY-MM-DD HH:MM:SS" (tz-naive, no ms).
   *
   * @param {string|Date} ts - any timestamp value
   * @returns {string}
   */
  normalizeTimestamp(ts) {
    if (!ts) return ts;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    // "2025-07-01T00:00:00.000Z" → "2025-07-01 00:00:00"
    return d.toISOString()
      .replace('T', ' ')
      .replace(/\.\d{3}Z$/, '');
  },

  /**
   * Sends sensor data to the ML Engine and parses the nested response.
   * Returns a normalized prediction object, or null if ML Engine is unavailable.
   *
   * @param {Object} payload - validated IoT telemetry payload
   * @returns {Object|null} normalized prediction, or null on any error
   */
  async requestPrediction(payload, sensorHistory = []) {
    try {
      // Build request body per confirmed ML Engineer contract
      const requestBody = {
        machine_id: payload.machine_id,
        timestamp: this.normalizeTimestamp(payload.timestamp),
        sensor_readings: {
          temperature: payload.sensors.temperature,
          vibration: payload.sensors.vibration,
          pressure: payload.sensors.pressure,
          rpm: payload.sensors.rpm,
          power_consumption: payload.sensors.power_consumption,
          noise_level: payload.sensors.noise_level,
          humidity: payload.sensors.humidity,
          operating_hours: payload.sensors.operating_hours,
        },
      };

      // Include sensor_history only when we actually have history data
      // (LSTM SEQ_LEN=24: dispatcher sends last 23 rows, current reading = 24th)
      if (sensorHistory && sensorHistory.length > 0) {
        requestBody.sensor_history = sensorHistory.map(row => ({
          timestamp: this.normalizeTimestamp(row.timestamp),
          temperature: parseFloat(row.temperature),
          vibration: parseFloat(row.vibration),
          pressure: parseFloat(row.pressure),
          rpm: parseInt(row.rpm),
          power_consumption: parseFloat(row.power_consumption),
          noise_level: parseFloat(row.noise_level),
          humidity: parseFloat(row.humidity),
          operating_hours: parseFloat(row.operating_hours),
        }));
      }

      const response = await axios.post(
        process.env.ML_ENGINE_URL + '/api/ml/predict',
        requestBody,
        { timeout: 5000 }
      );

      // Parse nested response into normalized prediction object
      const raw = response.data;

      // --- health_score: weighted formula ---
      // Simple HEALTHY*100 over-estimates health when WARNING/CRITICAL probs are high
      const p = raw.model_1_classifier.probabilities || {};
      const rawHealthScore = (
        (p.HEALTHY || 0) * 100 -
        (p.WARNING || 0) * 30 -
        (p.CRITICAL || 0) * 70
      );
      const health_score = Math.min(100, Math.max(0, Math.round(rawHealthScore)));

      // --- model_2_rul: guard for is_active flag ---
      // When is_active=false, the RUL model did not produce a valid estimate
      const rulData = raw.model_2_rul || {};
      const isActive = rulData.is_active === true;

      const prediction = {
        machine_id: raw.machine_id,
        timestamp:  raw.timestamp,

        // From model_1_classifier
        classification: raw.model_1_classifier.predicted_label,
        predicted_code: raw.model_1_classifier.predicted_code,
        confidence_score: raw.model_1_classifier.confidence,
        confidence: raw.model_1_classifier.confidence,   // alias for WebSocket payload
        probabilities: raw.model_1_classifier.probabilities,

        // Weighted health score (clamped 0-100)
        health_score,

        // From model_2_rul — null when is_active=false
        rul_is_active: isActive,
        rul_days: isActive && rulData.rul_days !== null && rulData.rul_days !== undefined ? parseFloat(rulData.rul_days.toFixed(2)) : null,
        rul_hours: isActive ? rulData.rul_hours : null,
        urgency_level: isActive ? rulData.urgency_level : 'MONITOR',

        // From metadata
        model_version: `${raw.metadata?.model_1_version || 'unknown'} | ${raw.metadata?.model_2_version || 'unknown'}`,
        inference_time_ms: raw.metadata?.inference_time_ms || null,
        pipeline_version: raw.metadata?.pipeline_version || null,

        // Full raw response for future-proofing
        raw_response: raw,
      };

      // Persist to Redis + TimescaleDB in parallel (non-blocking on failure)
      await Promise.all([
        this.cachePrediction(payload.machine_id, prediction),
        this.savePredictionToTimescale(payload.machine_id, payload.timestamp, prediction),
      ]);

      logger.info(
        `[ML] Prediction for ${payload.machine_id}: ` +
        `${prediction.classification} | Health: ${prediction.health_score}% ` +
        `| RUL: ${prediction.rul_days}d | Confidence: ${prediction.confidence_score}`
      );

      return prediction;
    } catch (err) {
      logger.warn(
        `[ML] ML Engine unavailable for ${payload.machine_id}: ${err.message} — skipping prediction`
      );
      return null;
    }
  },

  /**
   * Caches the normalized prediction in Redis with a 15-minute TTL.
   * Never throws - errors are contained.
   *
   * @param {string} machineId
   * @param {Object} prediction - normalized prediction object
   */
  async cachePrediction(machineId, prediction) {
    try {
      const key   = `machine:${machineId}:prediction`;
      // Spread entire prediction - future fields auto-included
      const value = JSON.stringify({
        ...prediction,
        cached_at: new Date().toISOString(),
      });

      await redisClient.set(key, value, 'EX', 900);

      logger.debug(`[ML] Prediction cached for ${machineId}`);
    } catch (err) {
      logger.error(`[ML] Redis cache failed for ${machineId}: ${err.message}`);
    }
  },

  /**
   * Persists the prediction to TimescaleDB using a parameterized query.
   * Never throws - errors are contained.
   *
   * @param {string} machineId
   * @param {string} timestamp  - ISO 8601 timestamp from payload
   * @param {Object} prediction - normalized prediction object
   */
  async savePredictionToTimescale(machineId, timestamp, prediction) {
    try {
      const query = `
        INSERT INTO ml_predictions
          (timestamp, machine_id, health_score, rul_days, classification,
           confidence_score, confidence, urgency_level, model_version,
           inference_time_ms, raw_response)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      const params = [
        timestamp,
        machineId,
        prediction.health_score,
        prediction.rul_days,
        prediction.classification,
        prediction.confidence_score,
        prediction.confidence || null,
        prediction.urgency_level || null,
        prediction.model_version || null,
        prediction.inference_time_ms || null,
        JSON.stringify(prediction.raw_response),
      ];

      await timescalePool.query(query, params);

      logger.debug(`[ML] Prediction saved to TimescaleDB for ${machineId}`);
    } catch (err) {
      logger.error(`[ML] TimescaleDB save failed for ${machineId}: ${err.message}`);
    }
  },

  /**
   * Retrieves the latest prediction for a machine.
   * Tries Redis first (fast path), falls back to TimescaleDB.
   * Used by NLP context injection in Phase 6.
   *
   * @param {string} machineId
   * @returns {Object|null} latest prediction, or null if not found
   */
  async getLatestPrediction(machineId) {
    try {
      // Fast path - Redis cache
      const cached = await redisClient.get(`machine:${machineId}:prediction`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Slow path - TimescaleDB
      const result = await timescalePool.query(
        `SELECT * FROM ml_predictions
         WHERE machine_id = $1
         ORDER BY timestamp DESC
         LIMIT 1`,
        [machineId]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      return null;
    } catch (err) {
      logger.error(`[ML] getLatestPrediction failed for ${machineId}: ${err.message}`);
      return null;
    }
  },
};

module.exports = mlService;

/*
  === VERIFIKASI UNIT TEST MANUAL ===
  Input dari ML: rul_days = 1.585
  Expected output: 1.59 (bukan 2)

  Input dari ML: rul_days = null (HEALTHY)
  Expected output: null (bukan error)

  Input dari ML: rul_days = 0.04
  Expected output: 0.04 (presisi terjaga)
*/
