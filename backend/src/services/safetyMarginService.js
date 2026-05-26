'use strict';

const logger = require('../config/logger');
const pgPool = require('../config/postgresClient');
const socketManager = require('../websockets/socketManager');

const safetyMarginService = {
  /**
   * Pure date calculation - no side effects, no DB calls.
   * Applies a 20% safety margin: schedule maintenance 20% before RUL expires.
   *
   * @param {number} rulDays
   * @returns {Object}
   */
  calculateDates(rulDays, currentTimestamp) {
    const SAFETY_MARGIN_PERCENTAGE = 0.20;
    // Minimum 0.5-day buffer per ML Engineer spec
    const safetyMarginDays = Math.max(
      Math.ceil(rulDays * SAFETY_MARGIN_PERCENTAGE),
      0.5
    );

    const today = currentTimestamp ? new Date(currentTimestamp) : new Date();

    const scheduledDate = new Date(today);
    scheduledDate.setDate(today.getDate() + rulDays);

    const safetyMarginDate = new Date(scheduledDate);
    safetyMarginDate.setDate(scheduledDate.getDate() - safetyMarginDays);

    return {
      rul_days: rulDays,
      safety_margin_days: safetyMarginDays,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      safety_margin_date: safetyMarginDate.toISOString().split('T')[0],
    };
  },

  /**
   * Creates or updates a pending maintenance schedule for the machine.
   * Skips entirely for HEALTHY machines.
   *
   * @param {string} machineId
   * @param {number} rulDays
   * @param {string} classification  - 'HEALTHY' | 'WARNING' | 'CRITICAL'
   * @param {string} urgencyLevel - 'MONITOR' | 'WARNING' | 'CRITICAL' | 'IMMEDIATE'
   * @returns {Object|null}
   */
  async createOrUpdateSchedule(machineId, rulDays, classification, urgencyLevel, mlConfidence = null, currentTimestamp = null) {
    try {
      // No maintenance needed for healthy state
      if (classification === 'HEALTHY') {
        logger.debug(`[Safety] ${machineId} is HEALTHY — no schedule needed`);
        return null;
      }

      const dates = this.calculateDates(rulDays, currentTimestamp);

      // Determine scheduling priority
      let priority;
      if (classification === 'CRITICAL') {
        priority = 'critical';
      } else if (classification === 'WARNING' && rulDays <= 14) {
        priority = 'high';
      } else {
        priority = 'normal';
      }

      // Determine maintenance type from urgency level
      let maintenanceType = 'PREVENTIVE';
      if (urgencyLevel === 'IMMEDIATE' || urgencyLevel === 'CRITICAL') {
        maintenanceType = 'EMERGENCY';
      } else if (urgencyLevel === 'WARNING' && classification !== 'HEALTHY') {
        maintenanceType = 'CORRECTIVE';
      }

      // ── Dedup check: cek status UPPER_CASE sesuai schema baru ──────────────
      const existing = await pgPool.query(
        `SELECT id FROM maintenance_schedules
         WHERE machine_id = $1
           AND status IN ('PENDING_CONFIRMATION', 'SCHEDULED')
         ORDER BY created_at DESC LIMIT 1`,
        [machineId]
      );

      const existed = existing.rows.length > 0;
      let scheduleId;

      if (existed) {
        scheduleId = existing.rows[0].id;
        // Update existing pending schedule
        await pgPool.query(
          `UPDATE maintenance_schedules
           SET rul_days         = $1,
               rul_at_creation  = $2,
               scheduled_date   = $3,
               urgency_level    = $4,
               ml_confidence    = $5,
               priority         = $6,
               maintenance_type = $7,
               type             = $8,
               updated_at       = NOW()
           WHERE id = $9`,
          [
            dates.rul_days,
            dates.rul_days,
            dates.scheduled_date,
            urgencyLevel,
            mlConfidence,
            priority,
            maintenanceType,
            maintenanceType,   // type mirrors maintenance_type
            scheduleId,
          ]
        );
      } else {
        // Insert new schedule with all new columns
        const insertResult = await pgPool.query(
          `INSERT INTO maintenance_schedules
             (machine_id, rul_days, rul_at_creation, scheduled_date, safety_margin_date,
              priority, maintenance_type, type, source, status,
              urgency_level, ml_confidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [
            machineId,
            dates.rul_days,             // rul_days is now FLOAT in schema
            dates.rul_days,             // rul_at_creation is float
            dates.scheduled_date,
            dates.safety_margin_date,
            priority,
            maintenanceType,
            maintenanceType,   // type
            'PREDICTIVE',      // source
            'PENDING_CONFIRMATION', // status (new UPPER_CASE default)
            urgencyLevel,
            mlConfidence,
          ]
        );
        scheduleId = insertResult.rows[0].id;
      }

      logger.info(
        `[Safety] Schedule ${existed ? 'updated' : 'created'} for ${machineId}: ` +
        `service by ${dates.safety_margin_date} ` +
        `(RUL: ${rulDays}d | priority: ${priority} | type: ${maintenanceType})`
      );

      // ── Broadcast via new event name: maintenance:new_suggestion ───────────
      try {
        const io = socketManager.getIO();
        io.to('global').emit('maintenance:new_suggestion', {
          schedule_id:      scheduleId,
          machine_id:       machineId,
          rul_at_creation:  rulDays,
          scheduled_date:   dates.scheduled_date,
          safety_margin_date: dates.safety_margin_date,
          urgency_level:    urgencyLevel,
          ml_confidence:    mlConfidence,
          type:             maintenanceType,
          priority,
          classification,
          is_update:        existed,
        });
        logger.debug(`[Safety] Broadcast maintenance:new_suggestion for ${machineId}`);
      } catch (socketErr) {
        logger.warn(`[Safety] Socket broadcast failed: ${socketErr.message}`);
      }

      return { ...dates, priority, maintenance_type: maintenanceType, machine_id: machineId, id: scheduleId };
    } catch (err) {
      logger.error(`[Safety] Schedule error for ${machineId}: ${err.message}`);
      return null;
    }
  },

};

module.exports = safetyMarginService;
