'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../config/logger');
const socketManager = require('../websockets/socketManager');

// CSV path relative to monorepo root: machine_learning/data/raw/
const CSV_PATH = path.join(
  __dirname,
  '../../../machine_learning/data/raw/sensor_readings.csv'
);

class SimulatorService {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.groups = []; // [{timestamp, rows:[]}]
    this.tickInterval = null;
    this.stats = {
      total_ticks: 0,
      ticks_sent: 0,
      current_timestamp: null,
      start_time: null,
      tick_interval_seconds: 1,
    };
  }

  // loadCSV
  /**
   * Reads and parses the sensor_readings CSV, then groups rows by timestamp.
   * Each group = one simulator "tick" (all 20 machines at a given moment).
   *
   * @throws {Error}
   */
  loadCSV() {
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV not found at ${CSV_PATH}`);
    }

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');

    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    // Parse header to build column index map
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV split - handles unquoted fields (standard ML export format)
      const values = line.split(',');
      if (values.length < headers.length) continue;

      const row = {};
      headers.forEach((header, idx) => {
        row[header] = (values[idx] || '').trim().replace(/^"|"$/g, '');
      });

      // Ensure required fields exist
      if (!row.timestamp || !row.machine_id) continue;

      parsedRows.push(row);
    }

    // Group by timestamp (Map preserves insertion order)
    const grouped = new Map();
    for (const row of parsedRows) {
      if (!grouped.has(row.timestamp)) {
        grouped.set(row.timestamp, []);
      }
      grouped.get(row.timestamp).push(row);
    }

    // Sort groups chronologically (oldest-first)
    this.groups = Array.from(grouped.entries())
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([timestamp, rows]) => ({ timestamp, rows }));

    logger.info(
      `[Simulator] Loaded ${this.groups.length} tick groups from CSV ` +
      `(${parsedRows.length} total rows)`
    );
  }

  // ---------------------------------------------------------------------------
  // start
  // ---------------------------------------------------------------------------

  /**
   * Starts the simulation loop.
   *
   * @param {Object} options
   * @param {string} [options.start_date] - ISO 8601 start date (optional)
   * @param {number} [options.tick_interval_seconds] - seconds between ticks (default 1)
   * @throws {Error} if already running or start_date has no matching data
   */
  async start(options = {}) {
    if (this.isRunning) {
      throw new Error('Simulator is already running');
    }

    const startDate = options.start_date ? new Date(options.start_date) : null;
    const tickIntervalSeconds = options.tick_interval_seconds || 1;

    // Load CSV on first run
    if (this.groups.length === 0) {
      this.loadCSV();
    }

    // Find start index
    if (startDate) {
      this.currentIndex = this.groups.findIndex(
        g => new Date(g.timestamp) >= startDate
      );
      if (this.currentIndex === -1) {
        throw new Error(`No data found from ${startDate.toISOString()}`);
      }
    } else {
      this.currentIndex = 0;
    }

    // Update state
    this.isRunning = true;
    this.stats.total_ticks = this.groups.length - this.currentIndex;
    this.stats.ticks_sent = 0;
    this.stats.start_time = new Date().toISOString();
    this.stats.tick_interval_seconds = tickIntervalSeconds;

    logger.info(
      `[Simulator] Started from ${this.groups[this.currentIndex].timestamp} | ` +
      `${this.stats.total_ticks} ticks remaining | interval: ${tickIntervalSeconds}s`
    );

    // Start the recurring tick loop
    this.tickInterval = setInterval(async () => {
      await this.processTick();
    }, tickIntervalSeconds * 1000);

    // Fire first tick immediately
    await this.processTick();
  }

  // processTick

  /**
   * Sends one group (all machines at a given timestamp) to the telemetry
   * ingest endpoint, then advances the index and broadcasts progress.
   */
  async processTick() {
    if (!this.isRunning || this.currentIndex >= this.groups.length) {
      this.stop();
      return;
    }

    const group = this.groups[this.currentIndex];
    this.stats.current_timestamp = group.timestamp;

    // Send all machines in this tick in parallel
    await Promise.all(
      group.rows.map(async (row) => {
        try {
          await axios.post(
            'http://localhost:3000/api/telemetry/ingest',
            {
              machine_id: row.machine_id,
              timestamp:  row.timestamp,
              sensors: {
                temperature:parseFloat(row.temperature),
                vibration: parseFloat(row.vibration),
                pressure: parseFloat(row.pressure),
                rpm: parseInt(row.rpm),
                power_consumption: parseFloat(row.power_consumption),
                noise_level: parseFloat(row.noise_level),
                humidity: parseFloat(row.humidity),
                operating_hours: parseFloat(row.operating_hours),
              },
            },
            { timeout: 10000 }
          );
        } catch (err) {
          logger.warn(
            `[Simulator] Failed to send ${row.machine_id} @ ${row.timestamp}: ${err.message}`
          );
        }
      })
    );

    // Advance
    this.currentIndex++;
    this.stats.ticks_sent++;

    // Broadcast progress to connected simulator panels
    try {
      const io = socketManager.getIO();
      const percentage = Math.round(
        (this.stats.ticks_sent / this.stats.total_ticks) * 100
      );
      io.to('global').emit('simulator:tick', {
        current_timestamp: group.timestamp,
        ticks_sent: this.stats.ticks_sent,
        ticks_total: this.stats.total_ticks,
        percentage,
        machines_in_tick: group.rows.length,
      });
    } catch (_socketErr) {
      // Socket may not be initialized in test/migration mode - silently skip
    }

    // Stop automatically when all ticks are exhausted
    if (this.currentIndex >= this.groups.length) {
      logger.info('[Simulator] ✅ All ticks completed.');
      this.stop();
    }
  }

  /**
   * Stops the simulation loop and resets running state.
   */
  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.isRunning = false;
    logger.info('[Simulator] Stopped.');
  }

  /**
   * Clears all simulated data from databases to provide a clean slate.
   */
  async resetData() {
    try {
      const pgPool = require('../config/postgresClient');
      const timescalePool = require('../config/timescaleClient');
      const redisClient = require('../config/redisClient');

      logger.info('[Simulator] Initiating data reset...');

      // 1. Truncate TimescaleDB tables
      await timescalePool.query('TRUNCATE TABLE sensor_readings CASCADE;');
      await timescalePool.query('TRUNCATE TABLE ml_predictions CASCADE;');
      
      // 2. Truncate PostgreSQL maintenance logs, schedules, and alerts
      await pgPool.query('TRUNCATE TABLE maintenance_logs CASCADE;');
      await pgPool.query('TRUNCATE TABLE maintenance_schedules CASCADE;');
      await pgPool.query('TRUNCATE TABLE alerts CASCADE;');

      // 3. Clear all machine-related Redis keys
      const keys = await redisClient.keys('machine:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }

      // 4. Reset internal state
      this.currentIndex = 0;
      this.stats.total_ticks = 0;
      this.stats.ticks_sent = 0;

      // 5. Notify all connected clients so UI can clear stale live rows
      try {
        const socketManager = require('../websockets/socketManager');
        const io = socketManager.getIO();
        io.emit('simulator:reset', { reset_at: new Date().toISOString() });
        logger.info('[Simulator] Broadcast simulator:reset to all clients.');
      } catch (broadcastErr) {
        logger.warn(`[Simulator] Could not broadcast reset: ${broadcastErr.message}`);
      }
      
      logger.info('[Simulator] ✅ Data reset complete.');
    } catch (err) {
      logger.error(`[Simulator] Reset failed: ${err.message}`);
      throw err;
    }
  }

  // getStatus
  /**
   * Returns a snapshot of the current simulator state.
   *
   * @returns {Object}
   */
  getStatus() {
    return {
      is_running: this.isRunning,
      current_timestamp: this.stats.current_timestamp,
      ticks_sent: this.stats.ticks_sent,
      ticks_total: this.stats.total_ticks,
      ticks_remaining: this.stats.total_ticks - this.stats.ticks_sent,
      percentage: this.stats.total_ticks > 0
        ? Math.round((this.stats.ticks_sent / this.stats.total_ticks) * 100)
        : 0,
      tick_interval_seconds: this.stats.tick_interval_seconds,
      start_time: this.stats.start_time,
      csv_loaded: this.groups.length > 0,
      total_groups_in_csv: this.groups.length,
    };
  }
}

// Export singleton - one instance shared across the entire process
module.exports = new SimulatorService();
