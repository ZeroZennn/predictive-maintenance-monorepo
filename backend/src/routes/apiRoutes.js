'use strict';

const { Router } = require('express');
const { param, body, query } = require('express-validator');

const telemetryHistoryController = require('../controllers/telemetryHistoryController');
const maintenanceController = require('../controllers/maintenanceController');
const simulatorController = require('../controllers/simulatorController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Shared validation
const validateMachineId = [
  param('machine_id')
    .matches(/^M-\d{2}$/)
    .withMessage('machine_id must match M-XX format'),
];

const validateLimit = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100'),
];

// TELEMETRY HISTORY routes
// last N readings for chart load
router.get(
  '/telemetry/history/:machine_id',
  authenticate,
  validateMachineId,
  validateLimit,
  telemetryHistoryController.getHistory
);

// merged anomaly timeline
router.get(
  '/telemetry/anomaly/:machine_id',
  authenticate,
  validateMachineId,
  validateLimit,
  telemetryHistoryController.getAnomalyTimeline
);

// MAINTENANCE routes
// KPI panel (Redis-cached)
router.get(
  '/maintenance/kpis/:machine_id',
  authenticate,
  validateMachineId,
  maintenanceController.getKPIs
);

// Kanban board data (all machines)
router.get(
  '/maintenance/schedules',
  authenticate,
  maintenanceController.getSchedules
);

// machine schedule history
router.get(
  '/maintenance/schedules/:machine_id',
  authenticate,
  validateMachineId,
  maintenanceController.getMachineSchedule
);

// technician status update
router.patch(
  '/maintenance/schedules/:id/status',
  authenticate,
  body('status')
    .isIn(['in_progress', 'completed', 'cancelled'])
    .withMessage('status must be in_progress, completed, or cancelled'),
  maintenanceController.updateScheduleStatus
);

// SIMULATOR routes - exhibition/demo mode (all authenticated users can start/stop)
router.post(
  '/simulator/start',
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date'),
  body('tick_interval_seconds')
    .optional()
    .isFloat({ min: 0.1, max: 60 })
    .withMessage('tick_interval_seconds must be between 0.1 and 60'),
  simulatorController.start
);

router.post(
  '/simulator/stop',
  simulatorController.stop
);

router.post(
  '/simulator/reset',
  simulatorController.reset
);

// Status all users can monitor progress
router.get(
  '/simulator/status',
  simulatorController.getStatus
);

module.exports = router;
