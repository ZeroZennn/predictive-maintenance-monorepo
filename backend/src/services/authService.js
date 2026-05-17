'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pgPool = require('../config/postgresClient');
const logger = require('../config/logger');

const authService = {
  /**
   * Authenticates a user by email and password.
   * Returns a JWT token and sanitized user object on success.
   * Throws named errors for the controller to handle.
   */
  async login(email, password) {
    try {
      // Query user by email
      const result = await pgPool.query(
        `SELECT id, username, email, password_hash, role, is_active
         FROM users WHERE email = $1`,
        [email]
      );

      // No user found
      if (result.rows.length === 0) {
        throw new Error('INVALID_CREDENTIALS');
      }

      const user = result.rows[0];

      // Account disabled
      if (!user.is_active) {
        throw new Error('ACCOUNT_DISABLED');
      }

      // Password verification
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last_login timestamp
      await pgPool.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Return token + sanitized user
      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Hashes a plain-text password with bcrypt (saltRounds = 12).
   */
  async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, 12);
  },

  /**
   * Verifies a JWT token. Throws naturally if invalid or expired.
   */
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  },
};

module.exports = authService;
