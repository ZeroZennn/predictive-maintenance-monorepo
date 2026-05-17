'use strict';

const logger = require('../config/logger');
const pgPool = require('../config/postgresClient');
const broadcastService = require('../websockets/broadcastService');

// Alert thresholds - tune these without touching business logic
const THRESHOLDS = {
  CRITICAL_HEALTH: 30,
  WARNING_HEALTH: 60,
  CRITICAL_RUL: 7,
  WARNING_RUL: 14,
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

      // Health-based classification
      if (
        prediction.classification === 'CRITICAL' ||
        prediction.health_score <= THRESHOLDS.CRITICAL_HEALTH
      ) {
        alertData = {
          type:     'health_critical',
          message:  `CRITICAL: Machine ${machineId} health at ${prediction.health_score}%. RUL: ${prediction.rul_days} days.`,
          severity: 'critical',
        };
      } else if (
        prediction.classification === 'WARNING' ||
        prediction.health_score <= THRESHOLDS.WARNING_HEALTH
      ) {
        alertData = {
          type: 'health_warning',
          message: `WARNING: Machine ${machineId} health at ${prediction.health_score}%. RUL: ${prediction.rul_days} days.`,
          severity: 'warning',
        };
      }

      // RUL override - more urgent than health classification
      if (prediction.rul_days <= THRESHOLDS.CRITICAL_RUL) {
        alertData = {
          type: 'rul_critical',
          message: `URGENT: Machine ${machineId} has only ${prediction.rul_days} days remaining. Immediate service required.`,
          severity: 'critical',
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
