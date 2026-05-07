'use strict';

const authService = require('../services/authService');
const logger = require('../config/logger');

const authController = {
  /**
   * POST /api/auth/login
   * Validates credentials and returns a JWT token.
   */
  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const result = await authService.login(email, password);

      logger.info(`[Auth] Login successful: ${result.user.email} (${result.user.role})`);

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (err) {
      if (err.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
        });
      }

      if (err.message === 'ACCOUNT_DISABLED') {
        return res.status(403).json({
          status: 'error',
          message: 'Account is disabled.',
        });
      }

      // Unexpected errors → global error handler
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user from the JWT payload.
   */
  getMe(req, res) {
    return res.status(200).json({
      status: 'success',
      data: { user: req.user },
    });
  },

  /**
   * POST /api/auth/logout
   * JWT is stateless - client is responsible for discarding the token.
   * Server logs the event and confirms success.
   */
  logout(req, res) {
    logger.info(`[Auth] Logout: ${req.user.email}`);
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  },
};

module.exports = authController;
