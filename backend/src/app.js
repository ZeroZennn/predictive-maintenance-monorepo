'use strict';

// SECTION 1 - Imports
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const telemetryRoutes = require('./routes/telemetryRoutes');

// Database & Cache connections - initialize on startup
const redisClient = require('./config/redisClient');
const pgPool = require('./config/postgresClient');
const timescalePool = require('./config/timescaleClient');
const { verifyTables } = require('./config/initDb');

// SECTION 2 - App initialization
const app = express();
const server = http.createServer(app);
const PORT = process.env.BACKEND_PORT || 3000;

// SECTION 3 - Middleware stack
// 1. Security headers
app.use(helmet());

// 2. CORS - open for development, restrict in production
app.use(cors({ origin: '*' }));

// 3. JSON body parser - large limit for IoT batch payloads
app.use(express.json({ limit: '10mb' }));

// 4. URL-encoded body parser
app.use(express.urlencoded({ extended: true }));

// 5. HTTP request logging piped through Winston
app.use(
  morgan('combined', {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  })
);

// SECTION 4 - Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'lapis-backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/telemetry', telemetryRoutes);

// SECTION 5 - 404 handler (catch-all for undefined routes)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// SECTION 6 — Global error handler (Express 5 style, 4-parameter)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

// SECTION 7 - Server startup
server.listen(PORT, async () => {
  logger.info(`Lapis AI Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  await verifyTables();
});

// SECTION 8 - Graceful shutdown handlers
const shutdown = (signal) => {
  logger.warn(`⚠️  ${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// SECTION 9 - Export
module.exports = { app, server };
