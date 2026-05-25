'use strict';

require('dotenv').config();

const logger = require('./logger');
const timescalePool = require('./timescaleClient');

async function migrate6() {
  const client = await timescalePool.connect();
  try {
    logger.info('[migrate6] Starting schema fix...');

    await client.query('BEGIN');

    // Fix A: Ubah rul_days dari INTEGER ke NUMERIC(10,2)
    await client.query(`
      ALTER TABLE ml_predictions
      ALTER COLUMN rul_days
      TYPE NUMERIC(10,2)
      USING rul_days::NUMERIC(10,2)
    `);
    logger.info('[migrate6] ✅ rul_days: INTEGER → NUMERIC(10,2)');

    // Fix B: Hapus NOT NULL constraint dari rul_days
    await client.query(`
      ALTER TABLE ml_predictions
      ALTER COLUMN rul_days
      DROP NOT NULL
    `);
    logger.info('[migrate6] ✅ rul_days: NOT NULL → NULLABLE');

    await client.query('COMMIT');
    logger.info('[migrate6] Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`[migrate6] Migration failed: ${err.message}`);
    throw err;
  } finally {
    client.release();
    await timescalePool.end();
  }
}

migrate6().catch(console.error);
