'use strict';

const timescalePool = require('../config/timescaleClient');
const pgPool = require('../config/postgresClient');
const logger = require('../config/logger');

// P90 thresholds - from classifier_model_card.json (confirmed by ML Engineer)
const P90_THRESHOLDS = {
  temperature: 76.30,
  vibration: 0.59,
  pressure: 103.80,
  rpm: 2540,
  power_consumption: 82.10,
  noise_level: 74.30,
};

const telemetryHistoryController = {

  /**
   * GET /api/telemetry/history/:machine_id
   * Returns last N sensor readings ordered oldest-first for chart rendering.
   *
   * @query {number} limit - 1-100, default 24
   */
  async getHistory(req, res, next) {
    try {
      const { machine_id } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 24, 100);

      const result = await timescalePool.query(
        `SELECT timestamp, machine_id, temperature, vibration,
                pressure, rpm, power_consumption, noise_level,
                humidity, operating_hours
         FROM sensor_readings
         WHERE machine_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [machine_id, limit]
      );

      // Reverse DESC result to ascending (oldest-first) for chart axis
      const rows = result.rows.reverse();

      return res.status(200).json({
        status: 'success',
        data: {
          machine_id,
          count: rows.length,
          readings: rows,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/telemetry/anomaly/:machine_id
   * Returns anomaly events merged from two sources:
   *   A) ML state transitions (classification changes)
   *   B) P90 threshold crossings in raw sensor readings
   *
   * @query {number} limit - default 20
   */
  async getAnomalyTimeline(req, res, next) {
    try {
      const { machine_id } = req.params;
      const limit = parseInt(req.query.limit) || 20;

      // Run both queries in parallel - neither depends on the other
      const [queryAResult, queryBResult] = await Promise.all([

        // State transitions rows where classification changed from previous
        timescalePool.query(
          `SELECT * FROM (
             SELECT
               timestamp,
               machine_id,
               classification,
               confidence_score,
               LAG(classification) OVER (
                 PARTITION BY machine_id ORDER BY timestamp
               ) AS prev_label
             FROM ml_predictions
             WHERE machine_id = $1
           ) sub
           WHERE classification != prev_label OR prev_label IS NULL
           ORDER BY timestamp DESC
           LIMIT $2`,
          [machine_id, limit]
        ),

        // P90 threshold crossings in raw sensor readings
        timescalePool.query(
          `SELECT
             timestamp,
             machine_id,
             CASE
               WHEN temperature > ${P90_THRESHOLDS.temperature} THEN 'temperature'
               WHEN vibration > ${P90_THRESHOLDS.vibration} THEN 'vibration'
               WHEN pressure > ${P90_THRESHOLDS.pressure} THEN 'pressure'
               WHEN rpm > ${P90_THRESHOLDS.rpm} THEN 'rpm'
               WHEN power_consumption > ${P90_THRESHOLDS.power_consumption} THEN 'power_consumption'
               WHEN noise_level > ${P90_THRESHOLDS.noise_level} THEN 'noise_level'
               ELSE 'multiple'
             END AS sensor_triggered,
             'threshold_crossing' AS anomaly_type,
             'Sensor exceeded P90 threshold' AS description
           FROM sensor_readings
           WHERE machine_id = $1
             AND (
               temperature > ${P90_THRESHOLDS.temperature} OR
               vibration > ${P90_THRESHOLDS.vibration} OR
               pressure > ${P90_THRESHOLDS.pressure} OR
               rpm > ${P90_THRESHOLDS.rpm} OR
               power_consumption > ${P90_THRESHOLDS.power_consumption} OR
               noise_level > ${P90_THRESHOLDS.noise_level}
             )
           ORDER BY timestamp DESC
           LIMIT $2`,
          [machine_id, limit]
        ),
      ]);

      // Normalise state transition rows to common shape
      const stateTransitions = queryAResult.rows.map(r => ({
        timestamp: r.timestamp,
        machine_id: r.machine_id,
        predicted_label: r.classification,
        confidence: r.confidence_score,
        anomaly_type: 'state_transition',
        description: `Status changed to ${r.classification}`,
        source: 'ml_prediction',
      }));

      // Normalise threshold crossing rows to common shape
      const thresholdCrossings = queryBResult.rows.map(r => ({
        ...r,
        source: 'sensor_reading',
      }));

      // Merge, sort DESC, cap at limit
      const combined = [...stateTransitions, ...thresholdCrossings];
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const anomalies = combined.slice(0, limit);

      return res.status(200).json({
        status: 'success',
        data: {
          machine_id,
          count: anomalies.length,
          anomalies,
          thresholds_used: P90_THRESHOLDS,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = telemetryHistoryController;
