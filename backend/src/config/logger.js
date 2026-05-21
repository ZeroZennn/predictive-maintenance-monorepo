'use strict';

const { createLogger, format, transports } = require('winston');

const { combine, timestamp, colorize, printf, json, simple } = format;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Custom format for development: [TIMESTAMP] LEVEL: MESSAGE
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// JSON format for production
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
);

const logger = createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: isDevelopment ? devFormat : prodFormat,
  transports: [
    // 1. Console - always active
    new transports.Console(),

    // 2. Error-only file transport
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    // 3. Combined file transport - all levels
    new transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

module.exports = logger;
