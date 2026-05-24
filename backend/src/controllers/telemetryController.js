'use strict';

const { validationResult } = require('express-validator');
const logger = require('../config/logger');
const dispatcher = require('../services/dispatcherService');

const telemetryController = {
  /**
   * POST /api/telemetry/ingest
   *
   * Synchronous handler - validates the request synchronously, then fires the
   * dispatcher asynchronously via setImmediate so the HTTP response is sent
   * BEFORE any I/O operations begin (true fire-and-forget pattern).
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  ingest(req, res) {
    // Validate input using express-validator results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Extract payload from the request body
    const payload = req.body;

    // Log receipt of the telemetry data
    logger.info(`[Ingestion] Received data from ${payload.machine_id} @ ${payload.timestamp}`);

    // Fire dispatcher asynchronously (NON-BLOCKING)
    // setImmediate defers execution to the next iteration of the event loop,
    // guaranteeing the HTTP 202 response is flushed before any DB work starts.
    setImmediate(() => {
      dispatcher.dispatch(payload);
    });

    // Immediately return 202 Accepted
    return res.status(202).json({
      status: 'accepted',
      message: 'Telemetry data received and queued for processing',
      machine_id: payload.machine_id,
      timestamp: payload.timestamp,
    });
  },
};

module.exports = telemetryController;
