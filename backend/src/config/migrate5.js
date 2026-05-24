'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');
const timescalePool = require('./timescaleClient');

// migrateV5 - adds maintenance_type and confidence columns
async function migrateV5() {
  try {
    // Add maintenance_type to maintenance_schedules (PostgresDB)
    await pgPool.query(`
      ALTER TABLE maintenance_schedules
      ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(20)
        CHECK (maintenance_type IN ('EMERGENCY', 'CORRECTIVE', 'PREVENTIVE'));
    `);

    // Add confidence column to ml_predictions (TimescaleDB)
    await timescalePool.query(`
      ALTER TABLE ml_predictions
      ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4);
    `);

    logger.info('✅ V5: maintenance_type + confidence columns added.');
  } catch (err) {
    logger.error(`Migration V5 error: ${err.message}`);
    throw err;
  }
}

// runMigrationsV5 - top-level orchestrator
async function runMigrationsV5() {
  logger.info('Starting migrations V5...');

  try {
    await migrateV5();
    logger.info('✅ All V5 migrations completed.');
  } catch (err) {
    logger.error('❌ Migration V5 failed.');
    process.exit(1);
  } finally {
    await pgPool.end();
    await timescalePool.end();
  }
}

// Entry point - run via: node src/config/migrate5.js
runMigrationsV5();
