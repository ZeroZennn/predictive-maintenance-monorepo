'use strict';

const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    const currentTime = result.rows[0].current_time;
    logger.info(`✅ PostgreSQL: Connection pool established. Server time: ${currentTime}`);
  } catch (err) {
    logger.error(`❌ PostgreSQL Connection Error: ${err.message}`);
  }
}

testConnection();

pool.on('error', (err) => {
  logger.error('❌ PostgreSQL Pool: Unexpected error on idle client', err);
});

module.exports = pool;
