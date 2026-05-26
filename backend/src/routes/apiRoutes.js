'use strict';

const { Router } = require('express');
const { param, body, query } = require('express-validator');

const telemetryHistoryController = require('../controllers/telemetryHistoryController');
const maintenanceController = require('../controllers/maintenanceController');
const maintenanceLogController = require('../controllers/maintenanceLogController');
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

// ── TELEMETRY HISTORY ───────────────────────────────────────────────────────
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

// ── MAINTENANCE SCHEDULES ───────────────────────────────────────────────────

// KPI panel (Redis-cached)
router.get(
  '/maintenance/kpis/:machine_id',
  authenticate,
  validateMachineId,
  maintenanceController.getKPIs
);

// Triage Center - pending schedules only
router.get(
  '/maintenance/schedules/pending',
  authenticate,
  maintenanceController.getPendingSchedules
);

// Calendar / Kanban board data (all machines, filterable)
router.get(
  '/maintenance/schedules',
  authenticate,
  maintenanceController.getSchedules
);

// Get single schedule detail
router.get(
  '/maintenance/schedules/:id',
  authenticate,
  maintenanceController.getScheduleById
);

// Create manual PREVENTIVE schedule
router.post(
  '/maintenance/schedules',
  authenticate,
  body('machine_id').matches(/^M-\d{2}$/).withMessage('Valid machine_id required'),
  body('scheduled_date').isISO8601().withMessage('Valid ISO8601 date required'),
  maintenanceController.createManualSchedule
);

// Technician confirm schedule
router.patch(
  '/maintenance/schedules/:id/confirm',
  authenticate,
  body('scheduled_date').optional().isISO8601(),
  maintenanceController.confirmSchedule
);

// Technician complete schedule
router.patch(
  '/maintenance/schedules/:id/complete',
  authenticate,
  body('actual_date').isISO8601().withMessage('actual_date is required'),
  maintenanceController.completeSchedule
);

// Edit manual schedule
router.patch(
  '/maintenance/schedules/:id',
  authenticate,
  maintenanceController.updateManualSchedule
);

// Cancel schedule (admin only)
router.delete(
  '/maintenance/schedules/:id',
  authenticate,
  requireRole('admin'),
  maintenanceController.cancelSchedule
);

// Legacy machine schedule history (Retained for compatibility)
router.get(
  '/maintenance/schedules/machine/:machine_id',
  authenticate,
  validateMachineId,
  maintenanceController.getMachineSchedule
);

// ── ADMIN: MAINTENANCE LOGS ─────────────────────────────────────────────────

router.get(
  '/admin/maintenance-logs',
  authenticate,
  requireRole('admin'),
  maintenanceLogController.getLogs
);

router.get(
  '/admin/maintenance-logs/:log_id',
  authenticate,
  requireRole('admin'),
  maintenanceLogController.getLogById
);

router.post(
  '/admin/maintenance-logs',
  authenticate,
  requireRole('admin'),
  body('date').isISO8601(),
  body('machine_id').matches(/^M-\d{2}$/),
  body('type').notEmpty(),
  maintenanceLogController.createLog
);

router.patch(
  '/admin/maintenance-logs/:log_id',
  authenticate,
  requireRole('admin'),
  maintenanceLogController.updateLog
);

router.delete(
  '/admin/maintenance-logs/:log_id',
  authenticate,
  requireRole('admin'),
  maintenanceLogController.deleteLog
);

// ── SIMULATOR ───────────────────────────────────────────────────────────────
// Exhibition/demo mode (all authenticated users can start/stop)
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
