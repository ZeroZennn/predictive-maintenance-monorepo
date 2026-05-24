'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const telemetryController = require('../controllers/telemetryController');

// Validation middleware - runs before the controller on every POST /ingest

const validateTelemetry = [
  // Top-level fields
  body('machine_id')
    .notEmpty()
    .withMessage('machine_id is required')
    .matches(/^M-\d{2}$/)
    .withMessage('machine_id must match pattern M-XX (e.g. M-01)'),

  body('timestamp')
    .notEmpty()
    .isISO8601()
    .withMessage('timestamp must be valid ISO8601'),

  body('sensors')
    .notEmpty()
    .withMessage('sensors object is required'),

  // Sensor sub-fields
  body('sensors.temperature')
    .isFloat()
    .withMessage('temperature must be a number'),

  body('sensors.vibration')
    .isFloat()
    .withMessage('vibration must be a number'),

  body('sensors.pressure')
    .isFloat()
    .withMessage('pressure must be a number'),

  body('sensors.rpm')
    .isInt()
    .withMessage('rpm must be an integer'),

  body('sensors.power_consumption')
    .isFloat()
    .withMessage('power_consumption must be a number'),

  body('sensors.noise_level')
    .isFloat()
    .withMessage('noise_level must be a number'),

  body('sensors.humidity')
    .isFloat()
    .withMessage('humidity must be a number'),

  body('sensors.operating_hours')
    .isFloat()
    .withMessage('operating_hours must be a number'),
];

// Router
const router = Router();

router.post('/ingest', validateTelemetry, telemetryController.ingest);

module.exports = router;
