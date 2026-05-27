const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function startSim() {
  try {
    console.log("Logging in...");
    const loginRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: "admin@lapis-ai.com", password: "Admin@Lapis123" });

    const token = loginRes.data?.token || loginRes.token || loginRes.accessToken;
    if (!token) {
      console.log("Failed to get token:", loginRes);
      return;
    }

    // Generate a random day between 1 and 30 to start the simulation from
    const randomDay = Math.floor(Math.random() * 30) + 1;
    const start_date = `2025-07-${randomDay.toString().padStart(2, '0')}T00:00:00Z`;

    console.log(`Got token. Starting simulator from random date: ${start_date}...`);
    const startRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/simulator/start',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { 
      tick_interval_seconds: 10,
      start_date: start_date
    });

    console.log("Simulator Start Response:", startRes);
  } catch (err) {
    console.error("Error:", err);
  }
}

startSim();
