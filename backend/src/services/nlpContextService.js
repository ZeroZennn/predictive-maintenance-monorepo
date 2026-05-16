'use strict';

const redisClient = require('../config/redisClient');
const mlService = require('./mlService');
const logger = require('../config/logger');

const nlpContextService = {
  /**
   * Assembles a complete live context snapshot for a single machine.
   * Combines the latest sensor reading (from Redis) and the latest ML prediction (via mlService cache → TimescaleDB fallback).
   * Returns null if neither source has data yet.
   * Never throws errors are contained.
   *
   * @param {string} machineId - e.g. 'M-01'
   * @returns {Object|null} live context object, or null
   */
  async buildContext(machineId) {
    try {
      // Fetch latest sensor snapshot from Redis
      const sensorRaw = await redisClient.get(`machine:${machineId}:last_reading`);
      const sensorData = sensorRaw ? JSON.parse(sensorRaw) : null;

      // Fetch latest ML prediction (Redis → TimescaleDB fallback)
      const prediction = await mlService.getLatestPrediction(machineId);

      // Nothing available yet
      if (!sensorData && !prediction) {
        logger.warn(`[NLPContext] No context available for ${machineId}`);
        return null;
      }

      // Assemble and return context
      return {
        machine_id: machineId,
        timestamp: sensorData?.timestamp || new Date().toISOString(),
        sensors: sensorData?.sensors || null,
        prediction: prediction
          ? {
              classification: prediction.classification,
              health_score: prediction.health_score,
              rul_days: prediction.rul_days,
              urgency_level: prediction.urgency_level || null,
              confidence_score: prediction.confidence_score || null,
              cached_at: prediction.cached_at || null,
            }
          : null,
      };
    } catch (err) {
      logger.error(`[NLPContext] buildContext failed for ${machineId}: ${err.message}`);
      return null;
    }
  },

  /**
   * Extracts all machine IDs that appear in a natural-language query string.
   * Pattern: M-XX where XX is exactly two digits.
   *
   * @param {string} query - user's chat message
   * @returns {string[]} unique array of machine IDs found, e.g. ['M-01', 'M-07']
   *
   * @example
   * detectMachineId('Kenapa M-01 dan M-07 sering panas?')
   * // → ['M-01', 'M-07']
   */
  detectMachineId(query) {
    const pattern = /\bM-(\d{2})\b/gi;
    const matches = [];
    let match;

    while ((match = pattern.exec(query)) !== null) {
      // Reconstruct canonical form (uppercase) from full match
      matches.push(match[0].toUpperCase());
    }

    // Return unique values only
    return [...new Set(matches)];
  },
};

module.exports = nlpContextService;
