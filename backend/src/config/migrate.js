'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');
const timescalePool = require('./timescaleClient');

// migratePostgres - creates the maintenance_logs table in PostgreSQL
async function migratePostgres() {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        log_id           VARCHAR(20) PRIMARY KEY,
        date             DATE NOT NULL,
        machine_id       VARCHAR(10) NOT NULL,
        type             VARCHAR(20) NOT NULL CHECK (type IN ('Preventive', 'Corrective')),
        technician_notes TEXT,
        part_replaced    VARCHAR(100),
        downtime_hrs     NUMERIC(6,2),
        cost_idr         BIGINT,
        created_at       TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_maintenance_machine_id
        ON maintenance_logs(machine_id);

      CREATE INDEX IF NOT EXISTS idx_maintenance_date
        ON maintenance_logs(date);
    `);

    logger.info('✅ PostgreSQL: maintenance_logs table ready.');
  } catch (err) {
    logger.error(`PostgreSQL migration error: ${err.message}`);
    throw err;
  }
}

// migrateTimescale - creates sensor_readings hypertable in TimescaleDB
async function migrateTimescale() {
  try {
    // Base table
    await timescalePool.query(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        timestamp         TIMESTAMPTZ NOT NULL,
        machine_id        VARCHAR(10) NOT NULL,
        temperature       NUMERIC(6,2),
        vibration         NUMERIC(8,4),
        pressure          NUMERIC(8,2),
        rpm               INTEGER,
        power_consumption NUMERIC(8,2),
        noise_level       NUMERIC(6,2),
        humidity          NUMERIC(5,2),
        operating_hours   NUMERIC(10,2),
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Convert to hypertable (safe to re-run)
    await timescalePool.query(`
      SELECT create_hypertable('sensor_readings', 'timestamp',
        if_not_exists => TRUE);
    `);

    // Composite index for fast per-machine time-series queries
    await timescalePool.query(`
      CREATE INDEX IF NOT EXISTS idx_sensor_machine_id
        ON sensor_readings(machine_id, timestamp DESC);
    `);

    logger.info('✅ TimescaleDB: sensor_readings hypertable ready.');
  } catch (err) {
    logger.error(`TimescaleDB migration error: ${err.message}`);
    throw err;
  }
}

// runMigrations - top-level orchestrator (sequential for error isolation)
async function runMigrations() {
  logger.info('Starting database migrations...');

  try {
    await migratePostgres();
    await migrateTimescale();

    logger.info('✅ All migrations completed successfully.');
    logger.info('You can now start the server with: npm run dev');
  } catch (err) {
    logger.error('❌ Migration failed. Fix the error above and re-run.');
    process.exit(1);
  } finally {
    // Always close pools - even on success - so the process exits cleanly
    await pgPool.end();
    await timescalePool.end();
  }
}

// Entry point - called directly when running: node src/config/migrate.js
// How to run migrate: node src/config/migrate.js
runMigrations();
