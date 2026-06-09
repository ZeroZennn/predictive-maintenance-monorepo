'use strict';

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * telemetryLimiter - 300 req/min per IP for IoT ingest endpoints.
 * High ceiling because a single IoT gateway may batch many machines.
 */
const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`[RateLimit] Telemetry rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many telemetry requests. Slow down.',
    });
  },
});

/**
 * authLimiter - 10 req/min per IP for login/register endpoints.
 * Tight limit to slow brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`[RateLimit] Auth rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      status:  'error',
      message: 'Too many login attempts. Try again in 1 minute.',
    });
  },
});

/**
 * nlpLimiter - 30 req/min per IP for AI Copilot endpoints.
 * LLM inference is expensive; 30 req/min is generous for interactive use.
 */
const nlpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`[RateLimit] NLP rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many AI Copilot requests. Try again in 1 minute.',
    });
  },
});

/**
 * generalLimiter - 300 req/min per IP for all other routes.
 * Acts as a global safety net; specific limiters above are stricter where needed.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`[RateLimit] General rate limit exceeded: ${req.ip}`);
    res.status(429).json({
      status:  'error',
      message: 'Too many requests.',
    });
  },
});

module.exports = { telemetryLimiter, authLimiter, nlpLimiter, generalLimiter };
