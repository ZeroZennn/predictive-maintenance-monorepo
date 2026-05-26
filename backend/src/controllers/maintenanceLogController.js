'use strict';

const pgPool = require('../config/postgresClient');
const logger = require('../config/logger');

const maintenanceLogController = {

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/admin/maintenance-logs
  // Paginated, filterable by machine_id and type
  // ─────────────────────────────────────────────────────────────────────────
  async getLogs(req, res, next) {
    try {
      const { machine_id, type, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const conditions = [];
      const params     = [];

      if (machine_id) { params.push(machine_id); conditions.push(`machine_id = $${params.length}`); }
      if (type)       { params.push(type);        conditions.push(`type = $${params.length}`); }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(parseInt(limit));
      params.push(offset);

      const [dataResult, countResult] = await Promise.all([
        pgPool.query(
          `SELECT * FROM maintenance_logs
           ${where}
           ORDER BY date DESC
           LIMIT $${params.length - 1} OFFSET $${params.length}`,
          params
        ),
        pgPool.query(
          `SELECT COUNT(*) as total FROM maintenance_logs ${where}`,
          params.slice(0, params.length - 2)
        ),
      ]);

      return res.status(200).json({
        status: 'success',
        data: {
          logs:  dataResult.rows,
          total: parseInt(countResult.rows[0].total),
          page:  parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/admin/maintenance-logs/:log_id
  // ─────────────────────────────────────────────────────────────────────────
  async getLogById(req, res, next) {
    try {
      const { log_id } = req.params;
      const result = await pgPool.query(
        `SELECT * FROM maintenance_logs WHERE log_id = $1`, [log_id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Log not found' });
      }
      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/admin/maintenance-logs
  // Admin tambah log historis manual, auto-generate ML-XXXX log_id
  // ─────────────────────────────────────────────────────────────────────────
  async createLog(req, res, next) {
    try {
      const {
        date, machine_id, type,
        technician_notes, part_replaced,
        downtime_hrs, cost_idr,
      } = req.body;

      if (!date || !machine_id || !type) {
        return res.status(400).json({
          status: 'error', message: 'date, machine_id, and type are required',
        });
      }

      // Generate ML-XXXX id
      const maxResult = await pgPool.query(
        `SELECT log_id FROM maintenance_logs
         WHERE log_id ~ '^ML-[0-9]+'
         ORDER BY CAST(SUBSTRING(log_id FROM 4) AS INTEGER) DESC
         LIMIT 1`
      );

      let logId = 'ML-0001';
      if (maxResult.rows.length > 0) {
        const lastNum = parseInt(maxResult.rows[0].log_id.replace('ML-', ''), 10);
        logId = `ML-${String(lastNum + 1).padStart(4, '0')}`;
      }

      const result = await pgPool.query(
        `INSERT INTO maintenance_logs
           (log_id, machine_id, date, type, technician_notes,
            part_replaced, downtime_hrs, cost_idr, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [logId, machine_id, date, type,
         technician_notes || null, part_replaced || null,
         downtime_hrs || null, cost_idr || null]
      );

      logger.info(`[AdminLog] Created maintenance log ${logId} for ${machine_id}`);
      return res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/admin/maintenance-logs/:log_id
  // Admin edit log yang sudah ada
  // ─────────────────────────────────────────────────────────────────────────
  async updateLog(req, res, next) {
    try {
      const { log_id } = req.params;
      const {
        date, type, technician_notes,
        part_replaced, downtime_hrs, cost_idr,
      } = req.body;

      const result = await pgPool.query(
        `UPDATE maintenance_logs
         SET date              = COALESCE($1, date),
             type              = COALESCE($2, type),
             technician_notes  = COALESCE($3, technician_notes),
             part_replaced     = COALESCE($4, part_replaced),
             downtime_hrs      = COALESCE($5, downtime_hrs),
             cost_idr          = COALESCE($6, cost_idr),
             updated_at        = NOW()
         WHERE log_id = $7
         RETURNING *`,
        [date || null, type || null,
         technician_notes || null, part_replaced || null,
         downtime_hrs || null, cost_idr || null,
         log_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Log not found' });
      }

      logger.info(`[AdminLog] Updated log ${log_id}`);
      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/admin/maintenance-logs/:log_id
  // Hard delete (admin only)
  // ─────────────────────────────────────────────────────────────────────────
  async deleteLog(req, res, next) {
    try {
      const { log_id } = req.params;

      const result = await pgPool.query(
        `DELETE FROM maintenance_logs WHERE log_id = $1 RETURNING log_id`,
        [log_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Log not found' });
      }

      logger.info(`[AdminLog] Hard-deleted log ${log_id}`);
      return res.status(200).json({
        status: 'success', message: `Log ${log_id} deleted successfully`,
      });
    } catch (err) { next(err); }
  },
};

module.exports = maintenanceLogController;
