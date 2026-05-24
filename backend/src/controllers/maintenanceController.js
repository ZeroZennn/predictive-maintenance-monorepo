'use strict';

const pgPool = require('../config/postgresClient');
const timescalePool = require('../config/timescaleClient');
const redisClient = require('../config/redisClient');
const logger = require('../config/logger');

const maintenanceController = {

  /**
   * GET /api/maintenance/kpis/:machine_id
   *
   * REST endpoint for KPI dashboard panel - initial load or manual refresh.
   * Serves from Redis cache (5 min TTL) on subsequent calls.
   */
  async getKPIs(req, res, next) {
    try {
      const { machine_id } = req.params;
      const cacheKey = `machine:${machine_id}:kpis`;

      // Fast path - Redis cache
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json({
          status: 'success',
          data:   JSON.parse(cached),
        });
      }

      // Slow path - 4 parallel DB queries
      const r = await Promise.all([

        // Non-HEALTHY predictions in the last 7 days from TimescaleDB
        timescalePool.query(
          `SELECT COUNT(*) as count
           FROM ml_predictions
           WHERE machine_id = $1
             AND classification != 'HEALTHY'
             AND timestamp > NOW() - INTERVAL '7 days'`,
          [machine_id]
        ),

        // Date of most recent maintenance log entry
        pgPool.query(
          `SELECT MAX(date) as last_date
           FROM maintenance_logs
           WHERE machine_id = $1`,
          [machine_id]
        ),

        // Total downtime hours in current calendar month
        pgPool.query(
          `SELECT COALESCE(SUM(downtime_hrs), 0) as total
           FROM maintenance_logs
           WHERE machine_id = $1
             AND date >= DATE_TRUNC('month', CURRENT_DATE)`,
          [machine_id]
        ),

        // MTBF - average gap between corrective failures in days
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
          ? Math.floor(
              (Date.now() - new Date(r[1].rows[0].last_date)) /
              (1000 * 60 * 60 * 24)
            )
          : null,
        total_downtime_hours: parseFloat(r[2].rows[0].total) || 0,
        mtbf_days: r[3].rows[0].mtbf
          ? Math.round(parseFloat(r[3].rows[0].mtbf))
          : null,
        calculated_at: new Date().toISOString(),
      };

      // Cache for 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(kpis), 'EX', 300);

      return res.status(200).json({ status: 'success', data: kpis });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/maintenance/schedules
   *
   * Returns all pending/in-progress schedules enriched with Kanban column
   * classification (URGENT < 3 days, SOON ≤ 7 days, SCHEDULED otherwise).
   */
  async getSchedules(req, res, next) {
    try {
      const result = await pgPool.query(
        `SELECT ms.*, m.name as machine_name, m.location
         FROM maintenance_schedules ms
         JOIN machines m ON ms.machine_id = m.machine_id
         WHERE ms.status IN ('pending', 'in_progress')
         ORDER BY ms.scheduled_date ASC`
      );

      const today = new Date();

      const schedules = result.rows.map(row => {
        const daysUntil = Math.ceil(
          (new Date(row.safety_margin_date) - today) / (1000 * 60 * 60 * 24)
        );
        let kanban_column = 'SCHEDULED';
        if (daysUntil < 3) kanban_column = 'URGENT';
        else if (daysUntil <= 7) kanban_column = 'SOON';

        return { ...row, days_until_service: daysUntil, kanban_column };
      });

      return res.status(200).json({
        status: 'success',
        data: {
          schedules,
          total: schedules.length,
          summary: {
            urgent: schedules.filter(s => s.kanban_column === 'URGENT').length,
            soon: schedules.filter(s => s.kanban_column === 'SOON').length,
            scheduled: schedules.filter(s => s.kanban_column === 'SCHEDULED').length,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/maintenance/schedules/:machine_id
   * Returns the 10 most recent schedules for a specific machine.
   */
  async getMachineSchedule(req, res, next) {
    try {
      const { machine_id } = req.params;

      const result = await pgPool.query(
        `SELECT * FROM maintenance_schedules
         WHERE machine_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [machine_id]
      );

      return res.status(200).json({
        status: 'success',
        data: {
          machine_id,
          schedules: result.rows,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/maintenance/schedules/:id/status
   *
   * Technician updates a schedule status (in_progress → completed/cancelled).
   * Optional notes field is preserved if not provided (COALESCE).
   */
  async updateScheduleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Guard - only allow valid terminal/transition statuses
      const VALID_STATUSES = ['in_progress', 'completed', 'cancelled'];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          status:  'error',
          message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }

      const result = await pgPool.query(
        `UPDATE maintenance_schedules
         SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [status, notes || null, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status:  'error',
          message: 'Schedule not found',
        });
      }

      logger.info(`[Maintenance] Schedule ${id} → ${status}`);

      return res.status(200).json({
        status: 'success',
        data: { schedule: result.rows[0] },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = maintenanceController;
