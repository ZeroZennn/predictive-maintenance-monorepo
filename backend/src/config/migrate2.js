'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');
const timescalePool = require('./timescaleClient');

// migratePostgresV2 - creates users, machines, maintenance_schedules,
async function migratePostgresV2() {
  try {
    // users table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(50) UNIQUE NOT NULL,
        email         VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(20) NOT NULL DEFAULT 'technician'
                      CHECK (role IN ('admin', 'technician')),
        is_active     BOOLEAN DEFAULT true,
        last_login    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // machines table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS machines (
        machine_id    VARCHAR(10) PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        location      VARCHAR(100),
        description   TEXT,
        status        VARCHAR(20) DEFAULT 'healthy'
                      CHECK (status IN ('healthy', 'warning', 'critical', 'offline')),
        installed_at  DATE,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // maintenance_schedules table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id                  SERIAL PRIMARY KEY,
        machine_id          VARCHAR(10) NOT NULL REFERENCES machines(machine_id),
        rul_days            INTEGER NOT NULL,
        scheduled_date      DATE NOT NULL,
        safety_margin_date  DATE NOT NULL,
        priority            VARCHAR(20) DEFAULT 'normal'
                            CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        status              VARCHAR(20) DEFAULT 'pending'
                            CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
        notes               TEXT,
        created_at          TIMESTAMPTZ DEFAULT NOW(),
        updated_at          TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_schedules_machine_id
        ON maintenance_schedules(machine_id);

      CREATE INDEX IF NOT EXISTS idx_schedules_status
        ON maintenance_schedules(status);

      CREATE INDEX IF NOT EXISTS idx_schedules_scheduled_date
        ON maintenance_schedules(scheduled_date);
    `);

    // documents table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id              SERIAL PRIMARY KEY,
        filename        VARCHAR(255) NOT NULL,
        original_name   VARCHAR(255) NOT NULL,
        file_type       VARCHAR(10) NOT NULL
                        CHECK (file_type IN ('pdf', 'docx', 'txt')),
        file_size       INTEGER NOT NULL,
        storage_path    VARCHAR(500) NOT NULL,
        index_status    VARCHAR(20) DEFAULT 'pending'
                        CHECK (index_status IN ('pending', 'processing', 'indexed', 'failed')),
        uploaded_by     INTEGER REFERENCES users(id),
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // alerts table
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id          SERIAL PRIMARY KEY,
        machine_id  VARCHAR(10) NOT NULL REFERENCES machines(machine_id),
        type        VARCHAR(30) NOT NULL
                    CHECK (type IN ('health_critical', 'health_warning', 'rul_critical', 'maintenance_due')),
        message     TEXT NOT NULL,
        severity    VARCHAR(20) NOT NULL
                    CHECK (severity IN ('info', 'warning', 'critical')),
        is_read     BOOLEAN DEFAULT false,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_alerts_machine_id ON alerts(machine_id);
      CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
      CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
    `);

    logger.info('✅ PostgreSQL V2: users, machines, maintenance_schedules, documents, alerts tables ready.');
  } catch (err) {
    logger.error(`PostgreSQL V2 migration error: ${err.message}`);
    throw err;
  }
}

// migrateTimescaleV2 - creates ml_predictions hypertable in TimescaleDB
async function migrateTimescaleV2() {
  try {
    // ml_predictions base table
    await timescalePool.query(`
      CREATE TABLE IF NOT EXISTS ml_predictions (
        timestamp         TIMESTAMPTZ NOT NULL,
        machine_id        VARCHAR(10) NOT NULL,
        health_score      NUMERIC(5,2) NOT NULL,
        rul_days          INTEGER NOT NULL,
        classification    VARCHAR(20) NOT NULL
                          CHECK (classification IN ('HEALTHY', 'WARNING', 'CRITICAL')),
        confidence_score  NUMERIC(5,4),
        created_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Convert to hypertable (safe to re-run)
    await timescalePool.query(`
      SELECT create_hypertable('ml_predictions', 'timestamp',
        if_not_exists => TRUE);
    `);

    // Composite index for fast per-machine time-series queries
    await timescalePool.query(`
      CREATE INDEX IF NOT EXISTS idx_ml_predictions_machine_id
        ON ml_predictions(machine_id, timestamp DESC);
    `);

    logger.info('✅ TimescaleDB V2: ml_predictions hypertable ready.');
  } catch (err) {
    logger.error(`TimescaleDB V2 migration error: ${err.message}`);
    throw err;
  }
}

// seedMachines - inserts 20 factory machines if the table is empty
async function seedMachines() {
  try {
    const countResult = await pgPool.query('SELECT COUNT(*) as count FROM machines');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count > 0) {
      logger.info('✅ Seed: machines table already seeded. Skipping.');
      return;
    }

    await pgPool.query(`
      INSERT INTO machines (machine_id, name, location, description, status, installed_at) VALUES
        ('M-01', 'Centrifugal Pump A1', 'Production Line 1', 'Primary coolant circulation pump', 'healthy', '2023-01-15'),
        ('M-02', 'Centrifugal Pump A2', 'Production Line 1', 'Secondary coolant circulation pump', 'healthy', '2023-01-15'),
        ('M-03', 'Hydraulic Press B1', 'Production Line 2', 'Main hydraulic forming press', 'healthy', '2023-01-15'),
        ('M-04', 'Hydraulic Press B2', 'Production Line 2', 'Secondary hydraulic forming press', 'healthy', '2023-01-15'),
        ('M-05', 'Conveyor Belt C1', 'Assembly Area', 'Main assembly line conveyor', 'healthy', '2023-01-15'),
        ('M-06', 'Conveyor Belt C2', 'Assembly Area', 'Secondary assembly line conveyor', 'healthy', '2023-01-15'),
        ('M-07', 'Air Compressor D1' 'Utility Room', 'Primary pneumatic system compressor', 'healthy', '2023-01-15'),
        ('M-08', 'Air Compressor D2', 'Utility Room', 'Backup pneumatic system compressor', 'healthy', '2023-01-15'),
        ('M-09', 'CNC Milling Machine E1', 'Machining Center', 'Precision milling unit 1', 'healthy', '2023-01-15'),
        ('M-10', 'CNC Milling Machine E2', 'Machining Center', 'Precision milling unit 2', 'healthy', '2023-01-15'),
        ('M-11', 'Rotary Kiln F1', 'Furnace Area', 'Primary rotary kiln unit', 'healthy', '2023-01-15'),
        ('M-12', 'Rotary Kiln F2', 'Furnace Area', 'Secondary rotary kiln unit', 'healthy', '2023-01-15'),
        ('M-13', 'Steam Turbine G1', 'Power Generation', 'Primary steam turbine generator', 'healthy', '2023-01-15'),
        ('M-14', 'Steam Turbine G2', 'Power Generation', 'Backup steam turbine generator', 'healthy', '2023-01-15'),
        ('M-15', 'Industrial Fan H1', 'HVAC System', 'Main ventilation fan unit', 'healthy', '2023-01-15'),
        ('M-16', 'Industrial Fan H2', 'HVAC System', 'Secondary ventilation fan unit', 'healthy', '2023-01-15'),
        ('M-17', 'Robotic Arm I1', 'Welding Station', 'Automated welding robotic arm 1', 'healthy', '2023-01-15'),
        ('M-18', 'Robotic Arm I2', 'Welding Station', 'Automated welding robotic arm 2', 'healthy', '2023-01-15'),
        ('M-19', 'Water Treatment Pump J1', 'Utility Room', 'Primary water treatment pump', 'healthy', '2023-01-15'),
        ('M-20', 'Water Treatment Pump J2', 'Utility Room', 'Secondary water treatment pump', 'healthy', '2023-01-15');
    `);

    logger.info('✅ Seed: 20 machines inserted successfully.');
  } catch (err) {
    logger.error(`Seed machines error: ${err.message}`);
    throw err;
  }
}

// runMigrationsV2 - top-level orchestrator (sequential for error isolation)
async function runMigrationsV2() {
  logger.info('Starting database migrations V2...');

  try {
    await migratePostgresV2();
    await migrateTimescaleV2();
    await seedMachines();

    logger.info('✅ All V2 migrations completed successfully.');
    logger.info('✅ Database is ready!');
  } catch (err) {
    logger.error('❌ Migration V2 failed.');
    process.exit(1);
  } finally {
    // Always close pools - even on success - so the process exits cleanly
    await pgPool.end();
    await timescalePool.end();
  }
}

// Entry point - run via: node src/config/migrate2.js
runMigrationsV2();
