'use strict';

const socketManager = require('./socketManager');
const logger = require('../config/logger');

/**
 * broadcastService - clean emit interface for all real-time push events.
 * All methods are fire-and-forget: they never throw or block callers.
 */
const broadcastService = {
  /**
   * Pushes the latest sensor reading + ML prediction + KPIs to all
   * clients subscribed to a specific machine room.
   
   * @param {string} machineId
   * @param {Object} sensorData
   * @param {Object|null} prediction
   * @param {Object|null} kpis
   */
  broadcastSensorUpdate(machineId, sensorData, prediction = null, kpis = null) {
    try {
      const io = socketManager.getIO();

      const payload = {
        machine_id: machineId,
        timestamp: sensorData.timestamp,

        // Raw sensor snapshot (field name changed from 'sensors' to 'sensor_live')
        sensor_live: sensorData.sensors,

        // Structured classifier output
        health_status: prediction ? {
          label: prediction.classification,
          health_score: prediction.health_score,
          confidence: prediction.confidence,
          probabilities: prediction.probabilities,
        } : null,

        // Structured RUL output - safe defaults when model_2_rul is inactive
        rul: prediction ? {
          is_active: prediction.rul_is_active,
          rul_days: prediction.rul_days,
          urgency_level: prediction.urgency_level,
        } : {
          is_active: false,
          rul_days: null,
          urgency_level: 'MONITOR',
        },

        // Maintenance KPIs - cached in Redis (5 min TTL), null on first tick
        maintenance_kpis: kpis || null,

        broadcast_at: new Date().toISOString(),
      };

      io.to(`machine:${machineId}`).emit('sensor:update', payload);

      logger.debug(`[Broadcast] sensor:update → room machine:${machineId}`);
    } catch (err) {
      logger.error(`[Broadcast] Failed to broadcast: ${err.message}`);
    }
  },

  /**
   * Pushes an alert to BOTH the machine-specific room AND the global
   * alerts channel so dashboard-level listeners always receive it.
   *
   * @param {string} machineId - e.g. 'M-01'
   * @param {Object} alertData - { type, message, severity }
   */
  broadcastAlert(machineId, alertData) {
    try {
      const io = socketManager.getIO();

      const payload = {
        machine_id: machineId,
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity,
        timestamp: new Date().toISOString(),
      };

      io.to(`machine:${machineId}`).emit('alert:new', payload);
      io.to('global').emit('alert:new', payload);

      logger.warn(`[Broadcast] alert:new → ${machineId} | severity: ${alertData.severity}`);
    } catch (err) {
      logger.error(`[Broadcast] Failed to broadcast: ${err.message}`);
    }
  },

  /**
   * Pushes a machine status change to ALL connected clients via the
   * global channel (every sidebar / overview widget needs this).
   *
   * @param {string} machineId - e.g. 'M-01'
   * @param {string} status    - 'healthy' | 'warning' | 'critical' | 'offline'
   */
  broadcastMachineStatusUpdate(machineId, status) {
    try {
      const io = socketManager.getIO();

      const payload = {
        machine_id: machineId,
        status,
        updated_at: new Date().toISOString(),
      };

      io.to('global').emit('machine:status_update', payload);

      logger.info(`[Broadcast] machine:status_update → ${machineId} status: ${status}`);
    } catch (err) {
      logger.error(`[Broadcast] Failed to broadcast: ${err.message}`);
    }
  },
};

module.exports = broadcastService;
