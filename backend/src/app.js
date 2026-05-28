"use strict";

// Imports
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const logger = require("./config/logger");
const telemetryRoutes = require("./routes/telemetryRoutes");
const authRoutes = require("./routes/authRoutes");
const nlpRoutes = require('./routes/nlpRoutes');
const adminRoutes  = require('./routes/adminRoutes');
const apiRoutes    = require('./routes/apiRoutes');
const { telemetryLimiter, authLimiter, nlpLimiter, generalLimiter } =
  require('./middlewares/rateLimitMiddleware');
const { sanitizeBody, sanitizeParams } =
  require('./middlewares/sanitizeMiddleware');
const socketManager = require('./websockets/socketManager')

// Database & Cache connections - initialize on startup
const redisClient = require("./config/redisClient");
const pgPool = require("./config/postgresClient");
const timescalePool = require("./config/timescaleClient");
const { verifyTables } = require("./config/initDb");

// App initialization
const app = express();
const server = http.createServer(app);
const PORT = process.env.BACKEND_PORT || 3000;

// Middleware stack
// 1. Security headers
app.use(helmet());

// 2. CORS - open for development, restrict in production
app.use(cors({ origin: "*" }));

// 3. Global rate limiter — safety net for all routes
app.use(generalLimiter);

// 4. Global input sanitization — strip XSS payloads from body + params
app.use(sanitizeBody);
app.use(sanitizeParams);

// 5. JSON body parser - large limit for IoT batch payloads
app.use(express.json({ limit: "10mb" }));

// 6. URL-encoded body parser
app.use(express.urlencoded({ extended: true }));

// 5. HTTP request logging piped through Winston
app.use(
  morgan("combined", {
    stream: {
      write: (msg) => logger.info(msg.trim()),
    },
  }),
);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "lapis-backend",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes — specific rate limiters applied per route group
app.use("/api/telemetry", telemetryLimiter, telemetryRoutes);
app.use("/api/auth",     authLimiter,      authRoutes);
app.use('/api/nlp',      nlpLimiter,       nlpRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api',          apiRoutes);

// 404 handler (catch-all for undefined routes)
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global error handler (Express 5 style, 4-parameter)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// Server startup
server.listen(PORT, async () => {
  // Initialize Socket.IO — MUST be before any broadcast calls
  socketManager.initialize(server);

  logger.info(`Lapis AI Backend running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  await verifyTables();
});

// Graceful shutdown handlers
const shutdown = (signal) => {
  logger.warn(`⚠️  ${signal} received — shutting down gracefully...`);
  server.close(() => {
    logger.info("✅ HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Export
module.exports = { app, server };
