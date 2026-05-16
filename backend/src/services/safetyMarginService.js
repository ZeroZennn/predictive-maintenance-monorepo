'use strict';

const logger = require('../config/logger');
const pgPool = require('../config/postgresClient');

const safetyMarginService = {
  /**
   * Pure date calculation - no side effects, no DB calls.
   * Applies a 20% safety margin: schedule maintenance 20% before RUL expires.
   *
   * @param {number} rulDays - Remaining Useful Life in days
   * @returns {Object} date plan with ISO date strings
   */
  calculateDates(rulDays) {
    const SAFETY_MARGIN_PERCENTAGE = 0.20;
    const safetyMarginDays = Math.ceil(rulDays * SAFETY_MARGIN_PERCENTAGE);

    const today = new Date();

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + rulDays);

    const safetyMarginDate = new Date(scheduledDate);
    safetyMarginDate.setDate(scheduledDate.getDate() - safetyMarginDays);

    return {
      rul_days:           rulDays,
      safety_margin_days: safetyMarginDays,
      scheduled_date:     scheduledDate.toISOString().split('T')[0],
      safety_margin_date: safetyMarginDate.toISOString().split('T')[0],
    };
  },

  /**
   * Creates or updates a pending maintenance schedule for the machine.
   * Skips entirely for HEALTHY machines.
   * Priority logic:
   *   CRITICAL classification               → 'critical'
   *   WARNING  + RUL ≤ 14 days             → 'high'
   *   WARNING  + RUL > 14 days             → 'normal'
   *
   * @param {string} machineId
   * @param {number} rulDays
   * @param {string} classification - 'HEALTHY' | 'WARNING' | 'CRITICAL'
   * @returns {Object|null} schedule data, or null if skipped / error
   */
  async createOrUpdateSchedule(machineId, rulDays, classification) {
    try {
      // No maintenance needed for healthy state
      if (classification === 'HEALTHY') {
        logger.debug(`[Safety] ${machineId} is HEALTHY - no schedule needed`);
        return null;
      }

      const dates = this.calculateDates(rulDays);

      // maintanance state priority
      let priority;
      if (classification === 'CRITICAL') {
        priority = 'critical';
      } else if (classification === 'WARNING' && rulDays <= 14) {
        priority = 'high';
      } else {
        priority = 'normal';
      }

      // Check for an existing pending schedule
      const existing = await pgPool.query(
        `SELECT id FROM maintenance_schedules
         WHERE machine_id = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 1`,
        [machineId]
      );

      const existed = existing.rows.length > 0;

      if (existed) {
        // Update existing pending schedule
        await pgPool.query(
          `UPDATE maintenance_schedules
           SET rul_days = $1, scheduled_date = $2,
               safety_margin_date = $3, priority = $4, updated_at = NOW()
           WHERE id = $5`,
          [
            dates.rul_days,
            dates.scheduled_date,
            dates.safety_margin_date,
            priority,
            existing.rows[0].id,
          ]
        );
      } else {
        // Insert new schedule
        await pgPool.query(
          `INSERT INTO maintenance_schedules
           (machine_id, rul_days, scheduled_date, safety_margin_date, priority)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            machineId,
            dates.rul_days,
            dates.scheduled_date,
            dates.safety_margin_date,
            priority,
          ]
        );
      }

      logger.info(
        `[Safety] Schedule ${existed ? 'updated' : 'created'} for ${machineId}: ` +
        `service by ${dates.safety_margin_date} (RUL: ${rulDays}d | priority: ${priority})`
      );

      return { ...dates, priority, machine_id: machineId };
    } catch (err) {
      logger.error(`[Safety] Schedule error for ${machineId}: ${err.message}`);
      return null;
    }
  },
};

module.exports = safetyMarginService;
