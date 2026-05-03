'use strict';

const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.TIMESCALE_HOST || 'localhost',
  port: parseInt(process.env.TIMESCALE_PORT, 10) || 5433,
  user: process.env.TIMESCALE_USER,
  password: process.env.TIMESCALE_PASSWORD,
  database: process.env.TIMESCALE_DB,
  max: 30, // higher than postgres - time-series has more write volume
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    const currentTime = result.rows[0].current_time;
    logger.info(`✅ TimescaleDB: Connection pool established. Server time: ${currentTime}`);
  } catch (err) {
    logger.error(`❌ TimescaleDB Connection Error: ${err.message}`);
  }
}

testConnection();

pool.on('error', (err) => {
  logger.error('❌ TimescaleDB Pool: Unexpected error on idle client', err);
});

module.exports = pool;
