'use strict';

const logger = require('../config/logger');
const pgPool = require('../config/postgresClient');
const broadcastService = require('../websockets/broadcastService');

// Alert thresholds - tune these without touching business logic
const THRESHOLDS = {
  CRITICAL_HEALTH: 30,
  WARNING_HEALTH:  60,
  IMMEDIATE_RUL: 1.0,
  CRITICAL_RUL: 2.0,
  WARNING_RUL: 7.0,
};

const alertService = {
  /**
   * Evaluates prediction against thresholds and triggers alert + status update
   * if conditions are met. RUL override takes precedence over health classification.
   * Never throws - errors are contained.
   *
   * @param {string} machineId
   * @param {Object|null} prediction - normalized ML prediction
   */
  async checkAndTrigger(machineId, prediction) {
    try {
      if (!prediction) return;

      let alertData = null;

      // Primary trigger: urgency_level from ML model_2_rul (most authoritative)
      if (prediction.urgency_level === 'IMMEDIATE') {
        alertData = {
          type: 'rul_critical',
          message: `IMMEDIATE: Machine ${machineId} requires service within 24 hours. RUL: ${prediction.rul_days} days.`,
          severity: 'critical',
        };
      } else if (prediction.urgency_level === 'CRITICAL') {
        alertData = {
          type: 'rul_critical',
          message: `CRITICAL: Machine ${machineId} requires service within 48 hours. RUL: ${prediction.rul_days} days.`,
          severity: 'critical',
        };
      } else if (
        prediction.classification === 'WARNING' ||
        prediction.health_score <= THRESHOLDS.WARNING_HEALTH
      ) {
        // Fallback: health-score based when urgency is not IMMEDIATE/CRITICAL
        alertData = {
          type: 'health_warning',
          message: `WARNING: Machine ${machineId} health at ${prediction.health_score}%. RUL: ${prediction.rul_days} days.`,
          severity: 'warning',
        };
      }

      // Only act if there's something to alert on
      if (alertData !== null) {
        await Promise.all([
          this.saveAlert(machineId, alertData),
          this.updateMachineStatus(machineId, prediction.classification.toLowerCase()),
          broadcastService.broadcastAlert(machineId, alertData),
          broadcastService.broadcastMachineStatusUpdate(machineId, prediction.classification.toLowerCase()),
        ]);
      }
    } catch (err) {
      logger.error(`[Alert] checkAndTrigger failed for ${machineId}: ${err.message}`);
    }
  },

  /**
   * Persists an alert record to PostgreSQL.
   * Never throws - errors are contained.
   *
   * @param {string} machineId
   * @param {Object} alertData - { type, message, severity }
   */
  async saveAlert(machineId, alertData) {
    try {
      await pgPool.query(
        `INSERT INTO alerts (machine_id, type, message, severity)
         VALUES ($1, $2, $3, $4)`,
        [machineId, alertData.type, alertData.message, alertData.severity]
      );

      logger.debug(`[Alert] Saved: ${alertData.type} for ${machineId}`);
    } catch (err) {
      logger.error(`[Alert] saveAlert failed for ${machineId}: ${err.message}`);
    }
  },

  /**
   * Updates the machine's operational status in PostgreSQL.
   * Never throws - errors are contained.
   *
   * @param {string} machineId
   * @param {string} status - 'healthy' | 'warning' | 'critical' | 'offline'
   */
  async updateMachineStatus(machineId, status) {
    try {
      await pgPool.query(
        `UPDATE machines SET status = $1, updated_at = NOW()
         WHERE machine_id = $2`,
        [status, machineId]
      );

      logger.info(`[Alert] ${machineId} status → ${status}`);
    } catch (err) {
      logger.error(`[Alert] updateMachineStatus failed for ${machineId}: ${err.message}`);
    }
  },
};

module.exports = alertService;