'use strict';

const axios = require('axios');
const logger = require('../config/logger');
const redisClient = require('../config/redisClient');
const timescalePool = require('../config/timescaleClient');

const mlService = {
  /**
   * Sends sensor data to the ML Engine and parses the nested response.
   * Returns a normalized prediction object, or null if ML Engine is unavailable.
   *
   * ML ENGINE CONTRACT (confirmed by ML Engineer):
   *   POST  {ML_ENGINE_URL}/api/ml/predict
   *   Body field: "sensor_readings" (NOT "features")
   *   Response: nested object with model_1_classifier, model_2_rul, metadata
   *
   * @param {Object} payload - validated IoT telemetry payload
   * @returns {Object|null} normalized prediction, or null on any error
   */
  async requestPrediction(payload) {
    try {
      const requestBody = {
        machine_id: payload.machine_id,
        timestamp: payload.timestamp,
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

      const response = await axios.post(
        process.env.ML_ENGINE_URL + '/api/ml/predict',
        requestBody,
        { timeout: 5000 }
      );

      // Parse nested response into normalized prediction object
      const raw = response.data;

      const prediction = {
        machine_id: raw.machine_id,
        timestamp: raw.timestamp,

        // From model_1_classifier
        classification: raw.model_1_classifier.predicted_label,
        predicted_code: raw.model_1_classifier.predicted_code,
        confidence_score: raw.model_1_classifier.confidence,
        probabilities: raw.model_1_classifier.probabilities,

        // health_score derived from HEALTHY probability (0-100 scale)
        health_score: Math.round(
          (raw.model_1_classifier.probabilities?.HEALTHY || 0) * 100
        ),

        // From model_2_rul
        rul_days: Math.ceil(raw.model_2_rul.rul_days),
        rul_hours: raw.model_2_rul.rul_hours,
        urgency_level: raw.model_2_rul.urgency_level,

        // From metadata
        model_version: `${raw.metadata?.model_1_version || 'unknown'} | ${raw.metadata?.model_2_version || 'unknown'}`,
        inference_time_ms: raw.metadata?.inference_time_ms || null,
        pipeline_version: raw.metadata?.pipeline_version  || null,

        // Store entire raw response for future-proofing
        raw_response: raw,
      };

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
        `[ML] ML Engine unavailable for ${payload.machine_id}: ${err.message} - skipping prediction`
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
           confidence_score, urgency_level, model_version,
           inference_time_ms, raw_response)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        timestamp,
        machineId,
        prediction.health_score,
        prediction.rul_days,
        prediction.classification,
        prediction.confidence_score,
        prediction.urgency_level   || null,
        prediction.model_version   || null,
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
