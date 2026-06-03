'use strict';

require('dotenv').config();

const logger = require('./logger');
const pgPool = require('./postgresClient');

async function migratePostgresV9() {
  try {
    // Memperbesar limit karakter pada kolom file_format 
    // karena mimetype seperti application/pdf panjangnya > 10
    await pgPool.query(`
      ALTER TABLE documents
      DROP CONSTRAINT IF EXISTS documents_file_type_check;

      ALTER TABLE documents
      ALTER COLUMN file_format TYPE VARCHAR(255);
    `);

    logger.info('✅ PostgreSQL V9: Kolom file_format pada tabel documents berhasil diperbesar menjadi VARCHAR(255).');
  } catch (err) {
    logger.error(`PostgreSQL V9 migration error: ${err.message}`);
    throw err;
  }
}

async function runMigrationsV9() {
  logger.info('Starting migrations V9...');

  try {
    await migratePostgresV9();
    logger.info('✅ All V9 migrations completed.');
  } catch (err) {
    logger.error('❌ Migration V9 failed.');
    process.exit(1);
  } finally {
    // Close pool
    await pgPool.end();
  }
}

runMigrationsV9();
