'use strict';

const logger = require('../config/logger');
const redisClient = require('../config/redisClient');
const timescalePool = require('../config/timescaleClient');
const broadcastService = require('../websockets/broadcastService');

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
   * Main orchestrator - runs Redis and TimescaleDB writes in parallel.
   * Errors are contained - this method never throws.
   * @param {Object} payload - The validated IoT telemetry payload.
   */
  async dispatch(payload) {
    try {
      logger.debug(`[Dispatcher] Processing ${payload.machine_id} @ ${payload.timestamp}`);

      await Promise.all([
        this.writeToRedis(payload),
        this.writeToTimescale(payload),
      ]);

      // Broadcast real-time update to subscribed Frontend clients
      // NOTE: not awaited — fire and forget, must never block the dispatch pipeline
      broadcastService.broadcastSensorUpdate(payload.machine_id, payload);

      logger.info(`[Dispatcher] ✅ ${payload.machine_id} dispatched successfully.`);
    } catch (err) {
      logger.error(`[Dispatcher] ❌ Critical dispatch error for ${payload.machine_id}: ${err.message}`);
    }
  }
}

// Export singleton instance - one dispatcher shared across the entire process
module.exports = new Dispatcher();
