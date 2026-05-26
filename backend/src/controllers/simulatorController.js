'use strict';

const simulatorService = require('../services/simulatorService');
const logger = require('../config/logger');

const simulatorController = {
  async start(req, res, next) {
    try {
      const { start_date, tick_interval_seconds } = req.body;
      if (
        tick_interval_seconds !== undefined &&
        (tick_interval_seconds < 0.1 || tick_interval_seconds > 3600)
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'tick_interval_seconds must be between 0.1 and 3600',
        });
      }
      await simulatorService.start({ start_date, tick_interval_seconds });
      logger.info(`[SimulatorController] Started by user ${req.user?.id || 'unknown'}`);
      return res.status(200).json({
        status: 'success',
        message: 'Simulator started',
        data: simulatorService.getStatus(),
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  stop(req, res) {
    simulatorService.stop();
    logger.info(`[SimulatorController] Stopped by user ${req.user?.id || 'unknown'}`);
    return res.status(200).json({
      status: 'success',
      message: 'Simulator stopped',
      data: simulatorService.getStatus(),
    });
  },

  async reset(req, res) {
    try {
      await simulatorService.resetData();
      return res.status(200).json({
        status: 'success',
        message: 'Simulator data reset successfully',
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  },

  getStatus(req, res) {
    return res.status(200).json({
      status: 'success',
      data: simulatorService.getStatus(),
    });
  },
};

module.exports = simulatorController;
