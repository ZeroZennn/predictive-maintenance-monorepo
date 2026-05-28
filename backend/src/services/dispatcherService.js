'use strict';

const logger = require('../config/logger');
const redisClient = require('../config/redisClient');
const timescalePool = require('../config/timescaleClient');
const pgPool = require('../config/postgresClient');
const broadcastService = require('../websockets/broadcastService');
const mlService = require('./mlService');
const safetyMarginService = require('./safetyMarginService');
const alertService = require('./alertService');

class Dispatcher {
  /**
   * Writes the latest machine reading to Redis with a 15-minute TTL.
   * Errors are contained - this method never throws.
   * @param {Object} payload - The validated IoT telemetry payload.
   */
  async writeToRedis(payload) {
    try {
      const key = `machine:${payload.machine_id}:last_reading`;
      const value = JSON.stringify({
        machine_id: payload.machine_id,
        timestamp: payload.timestamp,
        sensors: payload.sensors,
        cached_at: new Date().toISOString(),
      });

      await redisClient.set(key, value, 'EX', 900);

      logger.debug(`[Dispatcher] Redis updated for ${payload.machine_id}`);
    } catch (err) {
      logger.error(`[Dispatcher] Redis write failed for ${payload.machine_id}: ${err.message}`);
    }
  }

  /**
   * Persists sensor readings to TimescaleDB using a parameterized query.
   * Errors are contained - this method never throws.
   * @param {Object} payload - The validated IoT telemetry payload.
   */
  async writeToTimescale(payload) {
    try {
      const query = `
        INSERT INTO sensor_readings 
          (timestamp, machine_id, temperature, vibration, pressure, rpm,
           power_consumption, noise_level, humidity, operating_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        payload.timestamp,
        payload.machine_id,
        payload.sensors.temperature,
        payload.sensors.vibration,
        payload.sensors.pressure,
        payload.sensors.rpm,
        payload.sensors.power_consumption,
        payload.sensors.noise_level,
        payload.sensors.humidity,
        payload.sensors.operating_hours,
      ];

      await timescalePool.query(query, params);

      logger.debug(`[Dispatcher] TimescaleDB written for ${payload.machine_id}`);
    } catch (err) {
      logger.error(`[Dispatcher] TimescaleDB write failed for ${payload.machine_id}: ${err.message}`);
    }
  }

  /**
   * Fetches the last 23 sensor readings for this machine (oldest-first order).
   * Combined with the current reading, this gives SEQ_LEN=24 for LSTM input.
   *
   * @param {string} machineId
   * @param {string} currentTimestamp
   * @returns {Object[]}
   */
  async fetchSensorHistory(machineId, currentTimestamp) {
    try {
      const result = await timescalePool.query(
        `SELECT DISTINCT ON (timestamp) timestamp, temperature, vibration, pressure, rpm,
                power_consumption, noise_level, humidity, operating_hours
         FROM sensor_readings
         WHERE machine_id = $1 AND timestamp < $2
         ORDER BY timestamp DESC
         LIMIT 23`,
        [machineId, currentTimestamp]
      );
      // Reverse so array is oldest-first
      return result.rows.reverse();
    } catch (err) {
      logger.warn(`[Dispatcher] fetchSensorHistory failed for ${machineId}: ${err.message}`);
      return [];
    }
  }

  /**
   * Fetches maintenance KPI metrics for the WebSocket broadcast payload.
   *
   * @param {string} machineId
   * @returns {Object|null} KPI object, or null on error
   */
  async fetchMaintenanceKPIs(machineId) {
    try {
      const cacheKey = `machine:${machineId}:kpis`;

      // Fast path - Redis cache (5 min TTL)
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Slow path - 4 parallel DB queries
      const results = await Promise.all([
        // Non-HEALTHY predictions in the last 7 days (TimescaleDB)
        timescalePool.query(
          `SELECT COUNT(*) as count
           FROM ml_predictions
           WHERE machine_id = $1
             AND classification != 'HEALTHY'
             AND timestamp > NOW() - INTERVAL '7 days'`,
          [machineId]
        ),

        // Date of most recent maintenance log entry (PostgreSQL)
        pgPool.query(
          `SELECT MAX(date) as last_date
           FROM maintenance_logs
           WHERE machine_id = $1`,
          [machineId]
        ),

        // Total downtime hours in current calendar month (PostgreSQL)
        pgPool.query(
          `SELECT COALESCE(SUM(downtime_hrs), 0) as total
           FROM maintenance_logs
           WHERE machine_id = $1
             AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
          [machineId]
        ),

        // MTBF - average gap in days between corrective failures (PostgreSQL)
        pgPool.query(
          `SELECT AVG(gap_days)::numeric as mtbf FROM (
             SELECT
               (date - LAG(date) OVER (
                  PARTITION BY machine_id ORDER BY date
               ))::numeric as gap_days
             FROM maintenance_logs
             WHERE machine_id = $1 AND type = 'Corrective'
           ) gaps WHERE gap_days IS NOT NULL`,
          [machineId]
        ),
      ]);

      const kpis = {
        issues_this_week: parseInt(results[0].rows[0].count) || 0,
        days_since_last_maintenance: results[1].rows[0].last_date
          ? Math.floor(
              (Date.now() - new Date(results[1].rows[0].last_date)) /
              (1000 * 60 * 60 * 24)
            )
          : null,
        total_downtime_hours: parseFloat(results[2].rows[0].total) || 0,
        mtbf_days: results[3].rows[0].mtbf
          ? Math.round(parseFloat(results[3].rows[0].mtbf))
          : null,
      };

      // Cache result for 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(kpis), 'EX', 300);

      return kpis;
    } catch (err) {
      logger.warn(`[Dispatcher] fetchMaintenanceKPIs failed for ${machineId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Main orchestrator - full 4-dispatch step from ML pipeline.
   * @param {Object} payload
   */
  async dispatch(payload) {
    try {
      logger.debug(`[Dispatcher] Processing ${payload.machine_id} @ ${payload.timestamp}`);

      // Dual-write in parallel (Redis cache + TimescaleDB persistence)
      await Promise.all([
        this.writeToRedis(payload),
        this.writeToTimescale(payload),
      ]);

      // Fetch sensor history for LSTM SEQ_LEN=24
      const sensorHistory = await this.fetchSensorHistory(payload.machine_id, payload.timestamp);
      logger.debug(
        `[Dispatcher] History fetched for ${payload.machine_id}: ${sensorHistory.length} rows`
      );

      // Request ML prediction with history
      const prediction = await mlService.requestPrediction(payload, sensorHistory);

      // Fetch KPIs then broadcast to Frontend
      const kpis = await this.fetchMaintenanceKPIs(payload.machine_id);
      broadcastService.broadcastSensorUpdate(payload.machine_id, payload, prediction, kpis);

      // Downstream ML logic (only if prediction is available)
      if (prediction) {
        await Promise.all([
          safetyMarginService.createOrUpdateSchedule(
            payload.machine_id,
            prediction.rul_days,
            prediction.classification,
            prediction.urgency_level,
            prediction.confidence,
            payload.timestamp
          ),
          alertService.checkAndTrigger(payload.machine_id, prediction),
        ]);
      }

      logger.info(`[Dispatcher] ✅ ${payload.machine_id} dispatched successfully.`);
    } catch (err) {
      logger.error(`[Dispatcher] ❌ Critical dispatch error for ${payload.machine_id}: ${err.message}`);
    }
  }
}

// Export singleton instance - one dispatcher shared across the entire process
module.exports = new Dispatcher();
