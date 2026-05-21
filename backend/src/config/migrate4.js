'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');

// migratePostgresV4 aligns documents table with NLP Engine schema
async function migratePostgresV4() {
  try {
    // Add missing columns to documents table
    await pgPool.query(`
      ALTER TABLE documents
      ADD COLUMN IF NOT EXISTS document_id VARCHAR(30) UNIQUE,
      ADD COLUMN IF NOT EXISTS label VARCHAR(255),
      ADD COLUMN IF NOT EXISTS doc_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS chunks_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS error_message TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);

    // Rename existing columns to match NLP schema
    await pgPool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='documents' AND column_name='storage_path'
        ) THEN
          ALTER TABLE documents RENAME COLUMN storage_path TO file_path;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='documents' AND column_name='file_type'
        ) THEN
          ALTER TABLE documents RENAME COLUMN file_type TO file_format;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='documents' AND column_name='index_status'
        ) THEN
          ALTER TABLE documents RENAME COLUMN index_status TO status;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='documents' AND column_name='created_at'
        ) THEN
          ALTER TABLE documents RENAME COLUMN created_at TO uploaded_at;
        END IF;
      END $$;
    `);

    // Indexes for fast lookups
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_document_id
        ON documents(document_id);
      CREATE INDEX IF NOT EXISTS idx_documents_status
        ON documents(status);
    `);

    logger.info('✅ PostgreSQL V4: documents table aligned with NLP schema.');
  } catch (err) {
    logger.error(`PostgreSQL V4 migration error: ${err.message}`);
    throw err;
  }
}

// runMigrationsV4 top-level orchestrator
async function runMigrationsV4() {
  logger.info('Starting migrations V4...');

  try {
    await migratePostgresV4();

    logger.info('✅ All V4 migrations completed.');
  } catch (err) {
    logger.error('❌ Migration V4 failed.');
    process.exit(1);
  } finally {
    // Close pool
    await pgPool.end();
  }
}

// Entry point run via: node src/config/migrate4.js
runMigrationsV4();
