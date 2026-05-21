'use strict';

const Redis = require('ioredis');
const logger = require('./logger');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,

  retryStrategy(times) {
    if (times > 10) {
      logger.error('❌ Redis: Maximum retry attempts (10) reached. Giving up.');
      return null; // stop retrying
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },

  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redisClient.on('connect', () => {
  logger.info('Redis: Connecting...');
});

redisClient.on('ready', () => {
  logger.info('✅ Redis: Connection established and ready.');
});

redisClient.on('error', (err) => {
  logger.error(`❌ Redis Error: ${err.message}`);
});

redisClient.on('close', () => {
  logger.warn('⚠️ Redis: Connection closed.');
});

redisClient.on('reconnecting', (times) => {
  logger.warn(`Redis: Reconnecting... (attempt ${times})`);
});

module.exports = redisClient;
