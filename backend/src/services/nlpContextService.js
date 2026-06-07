const redisClient = require("../config/redisClient");
const mlService = require("./mlService");
const logger = require("../config/logger");
const pgPool = require("../config/postgresClient");
const timescalePool = require("../config/timescaleClient");

const nlpContextService = {
  /**
   * Assembles a complete live context snapshot for a single machine.
   * Combines the latest sensor reading (from Redis) and the latest ML prediction (via mlService cache → TimescaleDB fallback).
   * Returns null if neither source has data yet.
   * Never throws errors are contained.
   *
   * @param {string} machineId - e.g. 'M-01'
   * @returns {Object|null} live context object, or null
   */
  async buildContext(machineId) {
    try {
      // Fetch latest sensor snapshot from Redis
      const sensorRaw = await redisClient.get(
        `machine:${machineId}:last_reading`,
      );
      const sensorData = sensorRaw ? JSON.parse(sensorRaw) : null;

      // Fetch latest ML prediction (Redis → TimescaleDB fallback)
      const prediction = await mlService.getLatestPrediction(machineId);

      // Nothing available yet
      if (!sensorData && !prediction) {
        logger.warn(`[NLPContext] No context available for ${machineId}`);
        return null;
      }

      // Assemble and return context
      return {
        machine_id: machineId,
        timestamp: sensorData?.timestamp || new Date().toISOString(),
        sensors: sensorData?.sensors || null,
        prediction: prediction
          ? {
              classification: prediction.classification,
              health_score: prediction.health_score,
              rul_days: prediction.rul_days,
              urgency_level: prediction.urgency_level || null,
              confidence_score: prediction.confidence_score || null,
              cached_at: prediction.cached_at || null,
            }
          : null,
      };
    } catch (err) {
      logger.error(
        `[NLPContext] buildContext failed for ${machineId}: ${err.message}`,
      );
      return null;
    }
  },

  /**
   * Extracts all machine IDs that appear in a natural-language query string.
   * Pattern: M-XX where XX is exactly two digits.
   *
   * @param {string} query - user's chat message
   * @returns {string[]} unique array of machine IDs found, e.g. ['M-01', 'M-07']
   *
   * @example
   * detectMachineId('Kenapa M-01 dan M-07 sering panas?')
   */
  detectMachineId(query) {
    const patterns = [
      /\bM-(\d{2})\b/gi, // M-01, M-07
      /\bM(\d{2})\b/gi, // M01, M07
      /\bmesin\s*(\d{1,2})\b/gi, // mesin 7, mesin 07
      /\bmachine\s*(\d{1,2})\b/gi, // machine 7, machine 07
    ];

    const found = new Set();

    for (const pattern of patterns) {
      const matches = [...query.matchAll(pattern)];
      for (const match of matches) {
        const num = match[1].padStart(2, "0");
        if (parseInt(num) >= 1 && parseInt(num) <= 20) {
          found.add(`M-${num}`);
        }
      }
    }

    return [...found];
  },

  /**
   * Retrieves recent alerts, maintenance logs, and sensor aggregations
   * to build historical context.
   * This provides the NLP engine with recent events and timeseries data.
   *
   * @param {string} machineId
   * @returns {Promise<string|null>} Formatted historical context string
   */
  async getHistoricalContext(machineId) {
    if (!machineId) return null;

    try {
      // Run all 4 queries in parallel for performance
      const [
        alertsResult,
        maintenanceResult,
        sensorsResult,
        predictionsResult,
      ] = await Promise.all([
        // 1. Recent alerts (last 5)
        pgPool.query(
          `SELECT type, message, severity, created_at 
           FROM alerts 
           WHERE machine_id = $1 
           ORDER BY created_at DESC 
           LIMIT 5`,
          [machineId],
        ),
        // 2. Recent maintenance logs (last 3)
        pgPool.query(
          `SELECT type, downtime_hrs, cost_idr, 
                  technician_notes, part_replaced, date
           FROM maintenance_logs 
           WHERE machine_id = $1 
           ORDER BY date DESC 
           LIMIT 3`,
          [machineId],
        ),
        // 3. Sensor readings aggregation (6-hour buckets, last 48h of dataset)
        // Uses MAX(timestamp) as anchor — works correctly for replay datasets
        timescalePool.query(
          `WITH latest AS (
             SELECT MAX(timestamp) as max_ts FROM sensor_readings WHERE machine_id = $1
           )
           SELECT 
             time_bucket('6 hours', timestamp) as bucket,
             ROUND(AVG(temperature), 2) as avg_temp,
             ROUND(AVG(vibration), 4) as avg_vib,
             ROUND(AVG(pressure), 2) as avg_press,
             ROUND(AVG(rpm), 0) as avg_rpm
           FROM sensor_readings, latest
           WHERE machine_id = $1
             AND timestamp >= latest.max_ts - INTERVAL '48 hours'
           GROUP BY bucket 
           ORDER BY bucket DESC
           LIMIT 8`,
          [machineId],
        ),
        // 4. ML prediction history (6-hour buckets, last 48h of dataset)
        // Uses MAX(timestamp) as anchor — works correctly for replay datasets
        timescalePool
          .query(
            `WITH latest AS (
               SELECT MAX(timestamp) as max_ts FROM ml_predictions WHERE machine_id = $1
             )
             SELECT 
               time_bucket('6 hours', timestamp) as bucket,
               MODE() WITHIN GROUP (ORDER BY classification) as dominant_status,
               ROUND(AVG(health_score)::numeric, 1) as avg_health,
               ROUND(MIN(rul_days)::numeric, 2) as min_rul,
               COUNT(*) as prediction_count
             FROM ml_predictions, latest
             WHERE machine_id = $1 
               AND timestamp >= latest.max_ts - INTERVAL '48 hours'
             GROUP BY bucket
             ORDER BY bucket DESC
             LIMIT 8`,
            [machineId],
          )
          .catch((err) => {
            logger.warn(
              `[NLPContext] ml_predictions query failed for ${machineId}: ${err.message}`,
            );
            return { rows: [] };
          }),
      ]);

      let contextStr = "";

      // Format ML prediction history (most important for "status X jam lalu" queries)
      let predictionsStr = "";
      if (predictionsResult.rows.length > 0) {
        predictionsStr += `[RIWAYAT STATUS KESEHATAN ${machineId} - 48 JAM TERAKHIR]\n`;
        predictionsResult.rows.forEach((row) => {
          const time = new Date(row.bucket).toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          const rul = row.min_rul
            ? `RUL=${row.min_rul} hari`
            : "RUL=N/A (HEALTHY)";
          predictionsStr +=
            `- ${time}: Status=${row.dominant_status?.toUpperCase()}, ` +
            `Health=${row.avg_health}%, ${rul}, ` +
            `Prediksi=${row.prediction_count}x\n`;
        });
        predictionsStr += "\n";
      }

      if (alertsResult.rows.length > 0) {
        contextStr += `[ALERT 48 JAM TERAKHIR]\n`;
        alertsResult.rows.forEach((r) => {
          const dateStr = new Date(r.created_at)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16);
          contextStr += `- ${dateStr}: [${r.severity.toUpperCase()}] ${r.message}\n`;
        });
      }

      if (maintenanceResult.rows.length > 0) {
        contextStr += `\n[PEMELIHARAAN TERAKHIR]\n`;
        maintenanceResult.rows.forEach((r) => {
          contextStr +=
            `- ${r.date}: ${r.type} ` +
            `(Downtime: ${r.downtime_hrs}jam, ` +
            `Cost: Rp${r.cost_idr?.toLocaleString("id-ID")})\n` +
            `  Catatan: ${r.technician_notes || "-"}\n` +
            `  Part diganti: ${r.part_replaced || "-"}\n`;
        });
      }

      if (sensorsResult.rows.length > 0) {
        contextStr += `\n[RIWAYAT SENSOR 48 JAM TERAKHIR (Rata-rata per 6 jam)]\n`;
        sensorsResult.rows.forEach((r) => {
          const dateStr = new Date(r.bucket)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16);
          contextStr += `- Waktu: ${dateStr} | Temp: ${r.avg_temp}°C | Vib: ${r.avg_vib} mm/s | Press: ${r.avg_press} PSI | RPM: ${r.avg_rpm}\n`;
        });
      }

      const finalStr = (predictionsStr + contextStr).trim();
      return finalStr || null;
    } catch (err) {
      logger.error(
        `[NLPContext] getHistoricalContext failed for ${machineId}: ${err.message}`,
      );
      return null;
    }
  },
};

module.exports = nlpContextService;
