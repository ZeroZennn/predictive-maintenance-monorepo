'use strict';

require('dotenv').config();

const logger = require('./logger');
const timescalePool = require('./timescaleClient');

// migrateTimescaleV3 - extends ml_predictions with V3 columns
async function migrateTimescaleV3() {
  try {
    // add urgency_level
    await timescalePool.query(`
      ALTER TABLE ml_predictions
      ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20);
    `);

    // add model_version
    await timescalePool.query(`
      ALTER TABLE ml_predictions
      ADD COLUMN IF NOT EXISTS model_version VARCHAR(100);
    `);

    // add inference_time_ms
    await timescalePool.query(`
      ALTER TABLE ml_predictions
      ADD COLUMN IF NOT EXISTS inference_time_ms NUMERIC(8,3);
    `);

    // add raw_response (full ML JSON for future-proofing)
    await timescalePool.query(`
      ALTER TABLE ml_predictions
      ADD COLUMN IF NOT EXISTS raw_response JSONB;
    `);

    logger.info('✅ TimescaleDB V3: ml_predictions columns extended.');
  } catch (err) {
    logger.error(`TimescaleDB V3 migration error: ${err.message}`);
    throw err;
  }
}

// runMigrationsV3 - top-level orchestrator
async function runMigrationsV3() {
  logger.info('Starting database migrations V3...');

  try {
    await migrateTimescaleV3();

    logger.info('✅ All V3 migrations completed.');
    logger.info('✅ ml_predictions now stores full ML response.');
  } catch (err) {
    logger.error('❌ Migration V3 failed.');
    process.exit(1);
  } finally {
    await timescalePool.end();
  }
}

// Entry point - run via: node src/config/migrate3.js
runMigrationsV3();
