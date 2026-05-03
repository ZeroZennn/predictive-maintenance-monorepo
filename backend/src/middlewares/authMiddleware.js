'use strict';

const authService = require('../services/authService');
const logger = require('../config/logger');

/**
 * authenticate — verifies Bearer JWT from Authorization header.
 * On success: attaches decoded payload to req.user and calls next().
 * On failure: responds with 401 and a descriptive message.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      status:  'error',
      message: 'Access denied. No token provided.',
    });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status:  'error',
        message: 'Token expired. Please login again.',
      });
    }
    // JsonWebTokenError or any other JWT error
    return res.status(401).json({
      status:  'error',
      message: 'Invalid token.',
    });
  }
}

/**
 * requireRole(...roles) — middleware factory for role-based access control.
 * Usage: requireRole('admin') or requireRole('admin', 'technician')
 */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status:  'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
