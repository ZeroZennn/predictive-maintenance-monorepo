'use strict';

const logger = require('./logger');
const timescalePool = require('./timescaleClient');

/**
 * Verifies that the expected DB tables exist at server startup.
 * This function NEVER creates tables — it only checks and warns.
 * Errors are contained — this function never throws.
 */
async function verifyTables() {
  try {
    const result = await timescalePool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sensor_readings'
      ) AS exists
    `);

    if (result.rows[0].exists) {
      logger.info('✅ DB Verify: sensor_readings table confirmed.');
    } else {
      logger.warn('⚠️  DB Verify: sensor_readings table NOT FOUND.');
      logger.warn('⚠️  Run migration first: node src/config/migrate.js');
    }
  } catch (err) {
    logger.error(`DB Verify: table check failed — ${err.message}`);
  }
}

module.exports = { verifyTables };
