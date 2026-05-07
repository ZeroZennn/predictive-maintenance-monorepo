'use strict';

const socketManager = require('./socketManager');
const logger = require('../config/logger');

/**
 * broadcastService — clean emit interface for all real-time push events.
 * All methods are fire-and-forget: they never throw or block callers.
 */
const broadcastService = {
  /**
   * Pushes the latest sensor reading (+ optional ML prediction) to all
   * clients subscribed to a specific machine room.
   *
   * @param {string} machineId - e.g. 'M-01'
   * @param {Object} sensorData - validated IoT payload
   * @param {Object|null} prediction - ML output, if available
   */
  broadcastSensorUpdate(machineId, sensorData, prediction = null) {
    try {
      const io = socketManager.getIO();

      const payload = {
        machine_id: machineId,
        timestamp: sensorData.timestamp,
        sensors: sensorData.sensors,
        prediction: prediction,
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
