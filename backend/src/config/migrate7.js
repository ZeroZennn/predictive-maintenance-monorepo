'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');

async function migrate7() {
  const client = await pgPool.connect();
  try {
    logger.info('[migrate7] Starting Maintenance Scheduler schema upgrade...');
    await client.query('BEGIN');

    // ── 1. Tambah kolom TYPE & SOURCE ─────────────────────────────────────────
    await client.query(`
      ALTER TABLE maintenance_schedules
      ADD COLUMN IF NOT EXISTS type   VARCHAR(20),
      ADD COLUMN IF NOT EXISTS source VARCHAR(20)
    `);
    logger.info('[migrate7] ✅ Added: type, source');

    // ── 2. Set default untuk baris existing ──────────────────────────────────
    await client.query(`
      UPDATE maintenance_schedules
      SET
        type   = COALESCE(type,   maintenance_type, 'PREVENTIVE'),
        source = COALESCE(source, 'PREDICTIVE')
      WHERE type IS NULL OR source IS NULL
    `);
    logger.info('[migrate7] ✅ Backfilled: type, source for existing rows');

    // ── 3. Kolom PREDICTIVE-only fields ───────────────────────────────────────
    await client.query(`
      ALTER TABLE maintenance_schedules
      ALTER COLUMN rul_days TYPE FLOAT,
      ADD COLUMN IF NOT EXISTS rul_at_creation  FLOAT,
      ADD COLUMN IF NOT EXISTS urgency_level    VARCHAR(20),
      ADD COLUMN IF NOT EXISTS ml_confidence    FLOAT
    `);
    logger.info('[migrate7] ✅ Added: rul_at_creation, urgency_level, ml_confidence and changed rul_days to FLOAT');

    // Backfill dari kolom lama jika ada
    await client.query(`
      UPDATE maintenance_schedules
      SET rul_at_creation = COALESCE(rul_at_creation, rul_days)
      WHERE rul_at_creation IS NULL AND rul_days IS NOT NULL
    `);

    // ── 4. Kolom COMPLETION fields ────────────────────────────────────────────
    await client.query(`
      ALTER TABLE maintenance_schedules
      ADD COLUMN IF NOT EXISTS actual_date          TIMESTAMP,
      ADD COLUMN IF NOT EXISTS actual_duration_hrs  FLOAT,
      ADD COLUMN IF NOT EXISTS part_replaced        VARCHAR(255),
      ADD COLUMN IF NOT EXISTS cost_idr             BIGINT,
      ADD COLUMN IF NOT EXISTS completion_notes     TEXT
    `);
    logger.info('[migrate7] ✅ Added: completion fields (actual_date, actual_duration_hrs, etc.)');

    // ── 5. Normalise status values ke UPPER_CASE ──────────────────────────────
    // Status lama: 'pending', 'in_progress', 'completed', 'cancelled'
    // Status baru: 'PENDING_CONFIRMATION', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
    
    // Harus membuang CHECK constraint lama agar nilai baru bisa masuk
    await client.query(`
      ALTER TABLE maintenance_schedules 
      DROP CONSTRAINT IF EXISTS maintenance_schedules_status_check
    `);
    logger.info('[migrate7] ✅ Dropped old status CHECK constraint');

    await client.query(`
      UPDATE maintenance_schedules
      SET status = CASE
        WHEN status = 'pending'     THEN 'PENDING_CONFIRMATION'
        WHEN status = 'in_progress' THEN 'IN_PROGRESS'
        WHEN status = 'completed'   THEN 'COMPLETED'
        WHEN status = 'cancelled'   THEN 'CANCELLED'
        WHEN status = 'scheduled'   THEN 'SCHEDULED'
        ELSE status
      END
    `);
    logger.info('[migrate7] ✅ Normalised: status values to UPPER_CASE');

    // ── 6. Set default status untuk baris tanpa status ───────────────────────
    await client.query(`
      ALTER TABLE maintenance_schedules
      ALTER COLUMN status SET DEFAULT 'PENDING_CONFIRMATION'
    `);
    logger.info('[migrate7] ✅ Updated: status DEFAULT → PENDING_CONFIRMATION');

    // ── 7. Indexes untuk query umum ───────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ms_machine_id  ON maintenance_schedules (machine_id);
      CREATE INDEX IF NOT EXISTS idx_ms_status      ON maintenance_schedules (status);
      CREATE INDEX IF NOT EXISTS idx_ms_scheduled   ON maintenance_schedules (scheduled_date DESC);
      CREATE INDEX IF NOT EXISTS idx_ms_source      ON maintenance_schedules (source);
    `);
    logger.info('[migrate7] ✅ Indexes created');

    // ── 8. Pastikan maintenance_logs punya kolom yang dibutuhkan ─────────────
    // Tidak menghapus kolom existing, hanya tambah yang kurang
    await client.query(`
      ALTER TABLE maintenance_logs
      ADD COLUMN IF NOT EXISTS type               VARCHAR(20),
      ADD COLUMN IF NOT EXISTS technician_notes   TEXT,
      ADD COLUMN IF NOT EXISTS downtime_hrs       FLOAT,
      ADD COLUMN IF NOT EXISTS cost_idr           BIGINT,
      ADD COLUMN IF NOT EXISTS created_at         TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at         TIMESTAMP DEFAULT NOW()
    `);
    logger.info('[migrate7] ✅ maintenance_logs: ensured required columns');

    // ── 9. Index pada maintenance_logs ────────────────────────────────────────
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ml_machine_id ON maintenance_logs (machine_id);
      CREATE INDEX IF NOT EXISTS idx_ml_date       ON maintenance_logs (date DESC);
    `);
    logger.info('[migrate7] ✅ maintenance_logs indexes created');

    await client.query('COMMIT');
    logger.info('[migrate7] ✅ Migration complete. Maintenance Scheduler schema upgraded.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`[migrate7] ❌ Migration failed: ${err.message}`);
    logger.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pgPool.end();
  }
}

migrate7().catch(console.error);
