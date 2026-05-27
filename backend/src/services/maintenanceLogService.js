'use strict';

const logger = require('../config/logger');
const pgPool = require('../config/postgresClient');

/**
 * maintenanceLogService — auto-INSERT ke tabel maintenance_logs
 * setelah schedule selesai (status → COMPLETED).
 *
 * Ini menjaga maintenance_logs sebagai single source of truth
 * untuk historical data.
 */
const maintenanceLogService = {

  /**
   * Generate log_id berikutnya dalam format ML-XXXX.
   * Increment dari max existing, atau mulai dari ML-0001.
   */
  async generateLogId(client) {
    const result = await client.query(`
      SELECT log_id FROM maintenance_logs
      WHERE log_id ~ '^ML-[0-9]+'
      ORDER BY CAST(SUBSTRING(log_id FROM 4) AS INTEGER) DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) return 'ML-0001';

    const lastId = result.rows[0].log_id; // e.g. "ML-0042"
    const lastNum = parseInt(lastId.replace('ML-', ''), 10);
    const nextNum = lastNum + 1;
    return `ML-${String(nextNum).padStart(4, '0')}`;
  },

  /**
   * Auto-INSERT ke maintenance_logs saat schedule COMPLETED.
   *
   * @param {Object} scheduleRow  - Full row dari maintenance_schedules
   * @param {Object} completionData - { actual_date, actual_duration_hrs, part_replaced, cost_idr, completion_notes }
   * @param {Object} [client]     - Optional pg client (untuk transaksi). Jika tidak ada, buat koneksi baru.
   */
  async createLogFromSchedule(scheduleRow, completionData, externalClient = null) {
    const client = externalClient ?? await pgPool.connect();
    const ownsClient = !externalClient;

    try {
      const logId = await this.generateLogId(client);

      await client.query(
        `INSERT INTO maintenance_logs
           (log_id, machine_id, date, type, technician_notes,
            part_replaced, downtime_hrs, cost_idr, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (log_id) DO NOTHING`,
        [
          logId,
          scheduleRow.machine_id,
          completionData.actual_date,
          scheduleRow.type || scheduleRow.maintenance_type || 'PREVENTIVE',
          completionData.completion_notes || null,
          completionData.part_replaced || null,
          completionData.actual_duration_hrs || null,
          completionData.cost_idr || null,
        ]
      );

      logger.info(`[MaintenanceLog] Auto-created log ${logId} for schedule ${scheduleRow.id}`);
      return logId;
    } catch (err) {
      logger.error(`[MaintenanceLog] Failed to create log: ${err.message}`);
      throw err;
    } finally {
      if (ownsClient) client.release();
    }
  },
};

module.exports = maintenanceLogService;
