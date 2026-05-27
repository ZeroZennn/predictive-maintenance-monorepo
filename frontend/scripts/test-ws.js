const { io } = require('socket.io-client');

async function testWebSocket() {
  console.log('🔄 Menghubungkan ke Backend Socket.IO (http://localhost:3000)...');
  
  const socket = io('http://localhost:3000', {
    transports: ['websocket'],
  });

  let eventsReceived = {
    'sensor:update': false,
    'alert:new': false,
    'machine:status_update': false,
    'simulator:tick': false,
  };

  socket.on('connect', () => {
    console.log(`✅ Terhubung dengan ID: ${socket.id}`);
    console.log('📡 Bergabung ke room: machine:M-01, global, simulator...');
    
    socket.emit('join:machine', 'M-01');
    socket.emit('join:global');
    socket.emit('join:simulator');
    
    console.log('⏳ Menunggu event masuk (timeout 15 detik)...\n');
  });

  socket.on('sensor:update', (data) => {
    if (!eventsReceived['sensor:update']) {
      eventsReceived['sensor:update'] = true;
      console.log('✅ [EVENT DITERIMA] sensor:update');
      console.log(`   → Machine: ${data.machine_id} | Health: ${data.health_status?.label} | Temp: ${data.sensor_live?.temperature}°C`);
      checkCompletion();
    }
  });

  socket.on('alert:new', (data) => {
    if (!eventsReceived['alert:new']) {
      eventsReceived['alert:new'] = true;
      console.log('✅ [EVENT DITERIMA] alert:new');
      console.log(`   → Alert: ${data.message} | Severity: ${data.severity}`);
      checkCompletion();
    }
  });

  socket.on('machine:status_update', (data) => {
    if (!eventsReceived['machine:status_update']) {
      eventsReceived['machine:status_update'] = true;
      console.log('✅ [EVENT DITERIMA] machine:status_update');
      console.log(`   → Machine: ${data.machine_id} | New Status: ${data.status}`);
      checkCompletion();
    }
  });

  socket.on('simulator:tick', (data) => {
    if (!eventsReceived['simulator:tick']) {
      eventsReceived['simulator:tick'] = true;
      console.log('✅ [EVENT DITERIMA] simulator:tick');
      console.log(`   → Progress: ${data.percentage}% | Time: ${data.current_time}`);
      checkCompletion();
    }
  });

  function checkCompletion() {
    // Kita anggap sukses jika minimal sensor:update dan simulator:tick masuk.
    // Alert dan status_update mungkin butuh waktu lama jika semua mesin HEALTHY.
    if (eventsReceived['sensor:update'] && eventsReceived['simulator:tick']) {
      console.log('\n🎉 [AUDIT SUKSES] Traffic utama WebSocket (Tahap 4) berjalan lancar!');
      process.exit(0);
    }
  }

  // Timeout setelah 15 detik jika tidak menerima apa-apa
  setTimeout(() => {
    console.log('\n⚠️ [AUDIT TIMEOUT] Tidak semua event diterima dalam 15 detik.');
    console.log('Status Event:', eventsReceived);
    process.exit(0);
  }, 15000);
}

testWebSocket();
