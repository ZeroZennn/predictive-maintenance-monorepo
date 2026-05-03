'use strict';

const logger = require('./logger');
const timescalePool = require('./timescaleClient');
const pgPool = require('./postgresClient');

/**
 * Verifies that all expected DB tables exist at server startup.
 * Checks both TimescaleDB and PostgreSQL.
 */
async function verifyTables() {
  try {
    // CHECK 1 - sensor_readings in TimescaleDB
    const sensorResult = await timescalePool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'sensor_readings'
      ) as exists
    `);

    // CHECK 2 - ml_predictions in TimescaleDB
    const mlResult = await timescalePool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'ml_predictions'
      ) as exists
    `);

    // CHECK 3 - users in PostgreSQL
    const usersResult = await pgPool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'users'
      ) as exists
    `);

    // CHECK 4 - machines count in PostgreSQL
    const machinesResult = await pgPool.query(`
      SELECT COUNT(*) as count FROM machines
    `);

    const sensorExists  = sensorResult.rows[0].exists;
    const mlExists      = mlResult.rows[0].exists;
    const usersExists   = usersResult.rows[0].exists;
    const machinesCount = parseInt(machinesResult.rows[0].count, 10);

    const allTablesExist = sensorExists && mlExists && usersExists;

    if (allTablesExist && machinesCount === 20) {
      logger.info('✅ DB Verify: All tables confirmed. 20 machines seeded.');
    } else if (!allTablesExist) {
      logger.warn('⚠️  DB Verify: Some tables missing - run: node src/config/migrate.js && node src/config/migrate2.js');
    } else if (machinesCount < 20) {
      logger.warn('⚠️  DB Verify: machines table incomplete - run: node src/config/migrate2.js');
    }
  } catch (err) {
    logger.error(`DB Verify: table check failed - ${err.message}`);
  }
}

module.exports = { verifyTables };
