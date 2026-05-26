'use strict';

const pgPool     = require('../config/postgresClient');
const timescalePool = require('../config/timescaleClient');
const redisClient   = require('../config/redisClient');
const logger        = require('../config/logger');
const broadcastService   = require('../websockets/broadcastService');
const maintenanceLogService = require('../services/maintenanceLogService');

const maintenanceController = {

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/maintenance/kpis/:machine_id
  // KPI panel (Redis-cached, 5 min TTL)
  // ─────────────────────────────────────────────────────────────────────────
  async getKPIs(req, res, next) {
    try {
      const { machine_id } = req.params;
      const cacheKey = `machine:${machine_id}:kpis`;

      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json({ status: 'success', data: JSON.parse(cached) });
      }

      const r = await Promise.all([
        timescalePool.query(
          `SELECT COUNT(*) as count FROM ml_predictions
           WHERE machine_id = $1 AND classification != 'HEALTHY'
             AND timestamp > NOW() - INTERVAL '7 days'`,
          [machine_id]
        ),
        pgPool.query(
          `SELECT MAX(date) as last_date FROM maintenance_logs WHERE machine_id = $1`,
          [machine_id]
        ),
        pgPool.query(
          `SELECT COALESCE(SUM(downtime_hrs), 0) as total FROM maintenance_logs
           WHERE machine_id = $1 AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
          [machine_id]
        ),
        pgPool.query(
          `SELECT AVG(gap_days)::numeric as mtbf FROM (
             SELECT (date - LAG(date) OVER (
               PARTITION BY machine_id ORDER BY date
             ))::numeric as gap_days
             FROM maintenance_logs
             WHERE machine_id = $1 AND type = 'Corrective'
           ) gaps WHERE gap_days IS NOT NULL`,
          [machine_id]
        ),
      ]);

      const kpis = {
        machine_id,
        issues_this_week: parseInt(r[0].rows[0].count) || 0,
        days_since_last_maintenance: r[1].rows[0].last_date
          ? Math.floor((Date.now() - new Date(r[1].rows[0].last_date)) / (1000 * 60 * 60 * 24))
          : null,
        total_downtime_hours: parseFloat(r[2].rows[0].total) || 0,
        mtbf_days: r[3].rows[0].mtbf ? Math.round(parseFloat(r[3].rows[0].mtbf)) : null,
        calculated_at: new Date().toISOString(),
      };

      await redisClient.set(cacheKey, JSON.stringify(kpis), 'EX', 300);
      return res.status(200).json({ status: 'success', data: kpis });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/maintenance/schedules
  // Query params: ?month, ?week, ?machine_id, ?source, ?status
  // Default: exclude CANCELLED
  // ─────────────────────────────────────────────────────────────────────────
  async getSchedules(req, res, next) {
    try {
      const { month, week, machine_id, source, status } = req.query;

      let conditions = [`ms.status != 'CANCELLED'`];
      const params   = [];

      if (status)     { params.push(status);     conditions.push(`ms.status = $${params.length}`); }
      if (machine_id) { params.push(machine_id); conditions.push(`ms.machine_id = $${params.length}`); }
      if (source)     { params.push(source);     conditions.push(`ms.source = $${params.length}`); }

      if (month) {
        // month format: YYYY-MM
        params.push(month + '-01');
        conditions.push(`DATE_TRUNC('month', ms.scheduled_date) = DATE_TRUNC('month', $${params.length}::DATE)`);
      }

      if (week) {
        // week format: YYYY-Www (ISO week)
        const [year, weekNum] = week.split('-W').map(Number);
        params.push(year);
        params.push(weekNum);
        conditions.push(
          `EXTRACT(ISOYEAR FROM ms.scheduled_date) = $${params.length - 1}
           AND EXTRACT(WEEK FROM ms.scheduled_date) = $${params.length}`
        );
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await pgPool.query(
        `SELECT ms.*, m.name as machine_name, m.location
         FROM maintenance_schedules ms
         LEFT JOIN machines m ON ms.machine_id = m.machine_id
         ${where}
         ORDER BY ms.scheduled_date ASC`,
        params
      );

      return res.status(200).json({
        status: 'success',
        data: { schedules: result.rows, total: result.rows.length },
      });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/maintenance/schedules/pending
  // Khusus Triage Center — sorted urgency + date
  // ─────────────────────────────────────────────────────────────────────────
  async getPendingSchedules(req, res, next) {
    try {
      const result = await pgPool.query(
        `SELECT ms.*, m.name as machine_name, m.location
         FROM maintenance_schedules ms
         LEFT JOIN machines m ON ms.machine_id = m.machine_id
         WHERE ms.status = 'PENDING_CONFIRMATION'
         ORDER BY
           CASE ms.urgency_level
             WHEN 'IMMEDIATE' THEN 1
             WHEN 'CRITICAL'  THEN 2
             WHEN 'WARNING'   THEN 3
             ELSE 4
           END ASC,
           ms.scheduled_date ASC`
      );

      return res.status(200).json({
        status: 'success',
        data: { schedules: result.rows, total: result.rows.length },
      });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/maintenance/schedules/:id
  // Detail satu schedule
  // ─────────────────────────────────────────────────────────────────────────
  async getScheduleById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await pgPool.query(
        `SELECT ms.*, m.name as machine_name, m.location
         FROM maintenance_schedules ms
         LEFT JOIN machines m ON ms.machine_id = m.machine_id
         WHERE ms.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Schedule not found' });
      }
      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/maintenance/schedules
  // Tambah jadwal PREVENTIVE manual oleh admin/teknisi
  // ─────────────────────────────────────────────────────────────────────────
  async createManualSchedule(req, res, next) {
    try {
      const { machine_id, scheduled_date, estimated_duration_hrs, notes } = req.body;

      if (!machine_id || !scheduled_date) {
        return res.status(400).json({
          status: 'error', message: 'machine_id and scheduled_date are required',
        });
      }

      const result = await pgPool.query(
        `INSERT INTO maintenance_schedules
           (machine_id, scheduled_date, estimated_duration_hrs, notes,
            type, source, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'PREVENTIVE', 'MANUAL', 'SCHEDULED', NOW(), NOW())
         RETURNING *`,
        [machine_id, scheduled_date, estimated_duration_hrs || null, notes || null]
      );

      logger.info(`[Maintenance] Manual PREVENTIVE schedule created for ${machine_id}`);
      return res.status(201).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/maintenance/schedules/:id/confirm
  // Teknisi konfirmasi jadwal dari Triage Center
  // PENDING_CONFIRMATION → SCHEDULED
  // ─────────────────────────────────────────────────────────────────────────
  async confirmSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduled_date } = req.body; // opsional reschedule

      // Cek status valid
      const check = await pgPool.query(
        `SELECT * FROM maintenance_schedules WHERE id = $1`, [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Schedule not found' });
      }
      if (check.rows[0].status !== 'PENDING_CONFIRMATION') {
        return res.status(400).json({
          status: 'error',
          message: `Cannot confirm schedule with status '${check.rows[0].status}'. Must be PENDING_CONFIRMATION.`,
        });
      }

      const newDate = scheduled_date || check.rows[0].scheduled_date;

      const result = await pgPool.query(
        `UPDATE maintenance_schedules
         SET status = 'SCHEDULED', scheduled_date = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [newDate, id]
      );

      const updated = result.rows[0];

      // Broadcast WS
      try {
        const io = require('../websockets/socketManager').getIO();
        io.to('global').emit('maintenance:confirmed', {
          schedule_id:    updated.id,
          machine_id:     updated.machine_id,
          scheduled_date: updated.scheduled_date,
        });
      } catch (_) { /* non-critical */ }

      logger.info(`[Maintenance] Schedule ${id} confirmed → SCHEDULED`);
      return res.status(200).json({ status: 'success', data: updated });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/maintenance/schedules/:id/complete
  // Teknisi submit Completion Form → COMPLETED
  // Auto-INSERT ke maintenance_logs
  // ─────────────────────────────────────────────────────────────────────────
  async completeSchedule(req, res, next) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const {
        actual_date, actual_duration_hrs,
        part_replaced, cost_idr, completion_notes,
      } = req.body;

      if (!actual_date) {
        return res.status(400).json({ status: 'error', message: 'actual_date is required' });
      }

      // Fetch schedule
      const check = await client.query(
        `SELECT * FROM maintenance_schedules WHERE id = $1`, [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Schedule not found' });
      }
      const schedule = check.rows[0];
      if (!['SCHEDULED', 'IN_PROGRESS'].includes(schedule.status)) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot complete schedule with status '${schedule.status}'.`,
        });
      }

      // Update schedule → COMPLETED
      const result = await client.query(
        `UPDATE maintenance_schedules
         SET status = 'COMPLETED',
             actual_date         = $1,
             actual_duration_hrs = $2,
             part_replaced       = $3,
             cost_idr            = $4,
             completion_notes    = $5,
             updated_at          = NOW()
         WHERE id = $6
         RETURNING *`,
        [actual_date, actual_duration_hrs || null, part_replaced || null,
         cost_idr || null, completion_notes || null, id]
      );

      const completed = result.rows[0];

      // Auto-INSERT ke maintenance_logs (same transaction)
      await maintenanceLogService.createLogFromSchedule(
        completed,
        { actual_date, actual_duration_hrs, part_replaced, cost_idr, completion_notes },
        client
      );

      await client.query('COMMIT');

      logger.info(`[Maintenance] Schedule ${id} completed + log auto-created`);
      return res.status(200).json({ status: 'success', data: completed });
    } catch (err) {
      await client.query('ROLLBACK');
      next(err);
    } finally {
      client.release();
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PATCH /api/maintenance/schedules/:id
  // Edit jadwal MANUAL oleh admin
  // ─────────────────────────────────────────────────────────────────────────
  async updateManualSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduled_date, estimated_duration_hrs, notes } = req.body;

      const check = await pgPool.query(
        `SELECT * FROM maintenance_schedules WHERE id = $1`, [id]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Schedule not found' });
      }
      if (check.rows[0].source !== 'MANUAL') {
        return res.status(403).json({
          status: 'error', message: 'Only MANUAL schedules can be edited this way.',
        });
      }
      if (check.rows[0].status === 'COMPLETED') {
        return res.status(400).json({
          status: 'error', message: 'Cannot edit a COMPLETED schedule.',
        });
      }

      const result = await pgPool.query(
        `UPDATE maintenance_schedules
         SET scheduled_date        = COALESCE($1, scheduled_date),
             estimated_duration_hrs = COALESCE($2, estimated_duration_hrs),
             notes                 = COALESCE($3, notes),
             updated_at            = NOW()
         WHERE id = $4
         RETURNING *`,
        [scheduled_date || null, estimated_duration_hrs || null, notes || null, id]
      );

      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE /api/maintenance/schedules/:id
  // Soft delete — status → CANCELLED (admin only)
  // ─────────────────────────────────────────────────────────────────────────
  async cancelSchedule(req, res, next) {
    try {
      const { id } = req.params;

      const result = await pgPool.query(
        `UPDATE maintenance_schedules
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1
         RETURNING id, machine_id, status`,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Schedule not found' });
      }

      logger.info(`[Maintenance] Schedule ${id} cancelled (soft delete)`);
      return res.status(200).json({ status: 'success', data: result.rows[0] });
    } catch (err) { next(err); }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Legacy: GET /api/maintenance/schedules/:machine_id
  // Retained for backwards compatibility
  // ─────────────────────────────────────────────────────────────────────────
  async getMachineSchedule(req, res, next) {
    try {
      const { machine_id } = req.params;
      const result = await pgPool.query(
        `SELECT * FROM maintenance_schedules
         WHERE machine_id = $1
         ORDER BY created_at DESC LIMIT 10`,
        [machine_id]
      );
      return res.status(200).json({ status: 'success', data: { machine_id, schedules: result.rows } });
    } catch (err) { next(err); }
  },
};

module.exports = maintenanceController;
