const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://lapis_user:lapis_secret@127.0.0.1:5433/lapis_timeseries_db' });

pool.query(`
  SELECT DISTINCT ON (timestamp) timestamp, temperature, vibration, pressure, rpm
  FROM sensor_readings
  WHERE machine_id = 'M-06' AND timestamp < '2025-07-01 04:00'
  ORDER BY timestamp DESC
  LIMIT 5;
`).then(res => {
  console.log('DISTINCT ON results:', res.rows);
  pool.end();
}).catch(console.error);
