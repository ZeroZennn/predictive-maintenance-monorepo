'use strict';

const xss = require('xss');
const logger = require('../config/logger');

/**
 * sanitizeValue - recursively strips XSS payloads from any value.
 *
 * Rules:
 *   string → xss(trimmed)
 *   array → map each element through sanitizeValue
 *   object → sanitize each value (keys are not user-supplied, left as-is)
 *   other → returned unchanged (numbers, booleans, null, undefined)
 *
 * @param {*} value
 * @returns {*} sanitized value
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
    );
  }
  return value;
}

/**
 * sanitizeBody - Express middleware that sanitizes req.body in-place.
 *
 * Designed to be fail-open: if sanitization itself throws (malformed body),
 * the error is logged and the request continues un-sanitized rather than
 * returning a 500 that would mask the real issue upstream.
 */
function sanitizeBody(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }
  } catch (err) {
    logger.warn(`[Sanitize] Body sanitization failed: ${err.message}`);
  }
  next();
}

/**
 * sanitizeParams - Express middleware that sanitizes req.params in-place.
 *
 * Params are typically machine_id, document_id, dll.
 * Same fail-open contract as sanitizeBody.
 */
function sanitizeParams(req, res, next) {
  try {
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }
  } catch (err) {
    logger.warn(`[Sanitize] Params sanitization failed: ${err.message}`);
  }
  next();
}

module.exports = { sanitizeBody, sanitizeParams };
