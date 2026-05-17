'use strict';

require('dotenv').config();

const authService = require('../services/authService');
const pgPool = require('./postgresClient');
const logger = require('./logger');

async function seedUsers() {
  try {
    // Check if users already seeded
    const countResult = await pgPool.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      logger.info('✅ Seed: users already seeded. Skipping.');
      return;
    }

    // Hash passwords
    const adminHash = await authService.hashPassword('Admin@Lapis123');
    const techHash  = await authService.hashPassword('Tech@Lapis123');

    // Insert both users in a single statement
    await pgPool.query(
      `INSERT INTO users (username, email, password_hash, role, is_active) VALUES
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10)`,
      [
        'admin_lapis',    'admin@lapis-ai.com',  adminHash, 'admin',      true,
        'technician_01',  'tech01@lapis-ai.com', techHash,  'technician', true,
      ]
    );

    // Log credentials (dev only)
    logger.info('✅ Seed: 2 users created successfully.');
    logger.info('📋 Admin credentials: admin@lapis-ai.com / Admin@Lapis123');
    logger.info('📋 Tech credentials: tech01@lapis-ai.com / Tech@Lapis123');
  } catch (err) {
    logger.error(`Seed users error: ${err.message}`);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

// Entry point - run via: node src/config/seedUsers.js
seedUsers();
