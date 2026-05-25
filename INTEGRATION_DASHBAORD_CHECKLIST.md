---
# PRIME — Integration Verification Checklist
**Fase:** E2E System Integration
**Tim:** ML Engineer (Zikran) × Backend Engineer (Reynaldi) × Frontend Engineer (Amir)
**Terakhir diupdate:** 2026-05-25

## LEGENDA
| Simbol | Makna |
| ✅ | Verified & Passed |
| 🔄 | Sedang Diverifikasi |
| ❌ | Failed — perlu fix |
| ⏳ | Belum Dimulai |
| 🔴 | Blocked |

---

## TAHAP 0 — Pre-Integration Fix
- [x] ✅ Reynaldi/Zikran: fix Math.ceil() → toFixed(2) 
      di mlService.js baris 106
      Hasil: 1.585 → 1.59, null safety terkonfirmasi
- [x] ✅ Verifikasi rul_days = 1.59 (float) di WS payload
      (akan diverifikasi saat Tahap 4)
      
## TAHAP 1 — Infrastructure & Service Health
- [x] ✅ docker compose up postgres timescaledb redis -d
- [x] ✅ Tunggu semua infrastructure healthy (30 detik)
- [x] ✅ docker compose up ml-service -d
- [x] ✅ Tunggu ML Service healthy (60-90 detik)
- [x] ✅ Run semua migrations: migrate.js s/d migrate5.js
- [x] ✅ Run seedUsers.js
- [x] ✅ npm run dev (backend)
- [x] ✅ GET http://localhost:3000/health → {"status":"ok"}
- [x] ✅ GET http://localhost:8000/health → {"status":"healthy"}
- [x] ✅ GET http://localhost:8000/docs → Swagger UI terbuka
- [x] ✅ docker compose ps → semua service status (healthy)

## TAHAP 2 — Authentication & Simulator
- [x] ✅ POST /api/auth/login dengan admin@lapis-ai.com
      → Response: JWT token valid
- [x] ✅ POST /api/auth/login dengan tech01@lapis-ai.com
      → Response: JWT token valid
- [x] ✅ POST /api/simulator/start (tick_interval=2)
      → Response: simulator started
- [x] ✅ GET /api/simulator/status → running=true
- [x] ✅ Monitor log: docker compose logs ml-service -f
      → Pastikan ML calls masuk (20 calls per tick)

## TAHAP 3 — ML Pipeline Verification
- [x] ✅ Setelah 3 tick: cek log backend
      → "ML prediction received for M-01" (di log ada "Prediction cached for M-01")
- [x] ✅ Cek Redis via redis-cli:
      GET machine:M-01:prediction → ada data JSON
- [x] ✅ Cek TimescaleDB:
      SELECT * FROM ml_predictions
      ORDER BY timestamp DESC LIMIT 5;
      → Ada data dengan classification, rul_days, confidence
- [x] ✅ Verifikasi sensor_history dikirim:
      Log backend: "History fetched for M-01: 23 rows"
- [x] ✅ Verifikasi rul_days presisi:
      rul_days di ml_predictions = float (bukan integer)
- [x] ✅ Verifikasi health_score formula:
      Mesin HEALTHY → health_score mendekati 80-100
      Mesin CRITICAL → health_score mendekati 0-40 (Formula diperbaiki)

## TAHAP 4 — WebSocket Event Verification
- [x] ✅ Buka browser console di halaman Dashboard
- [x] ✅ Pastikan socket.emit('join:machine', 'M-01') berhasil
- [x] ✅ Event sensor:update diterima setiap tick
      → Cek: sensor_live.temperature ada dan berubah
- [x] ✅ Event sensor:update: health_status.label ada
      (HEALTHY/WARNING/CRITICAL)
- [x] ✅ Event sensor:update: rul.is_active = false saat HEALTHY
      → rul.rul_days = null ✅
- [x] ✅ Tunggu hingga ada mesin WARNING/CRITICAL:
      Event sensor:update: rul.is_active = true
      → rul.rul_days = float (bukan null) ✅
- [x] ✅ Event alert:new diterima di channel global
      saat ada mesin CRITICAL
- [x] ✅ Event machine:status_update diterima di global
      saat status mesin berubah
- [x] ✅ Event new_maintenance_task diterima
      → Cek: scheduled_date dan safety_margin_date ada
- [x] ✅ Event simulator:tick diterima di channel simulator
      → Cek: percentage bertambah setiap tick

## TAHAP 5 — Dashboard Display Verification
(Butuh struktur Frontend dari Amir — akan diupdate)
- [x] ✅ Gauge 8 sensor berubah sesuai data sensor_live
- [x] ✅ Health badge berubah warna (hijau/kuning/merah)
- [x] ✅ Health score angka sesuai dengan kalkulasi
- [x] ✅ RUL banner muncul saat WARNING/CRITICAL
- [x] ✅ RUL banner TIDAK muncul / null saat HEALTHY
- [x] ✅ Sidebar machine card berubah warna sesuai status
- [x] ✅ Global Toast Alert muncul saat mesin CRITICAL
- [ ] Maintenance Scheduler: kartu baru muncul otomatis
      saat ada new_maintenance_task event (Ditunda sesuai instruksi)

## TAHAP 6 — Edge Case & Stress Test
- [ ] Stop simulator → restart dari start_date berbeda
- [ ] Verifikasi: mesin yang sebelumnya CRITICAL
      kembali ke HEALTHY saat data normal
- [ ] Verifikasi: duplikasi maintenance schedule
      tidak terjadi untuk mesin yang sama
- [ ] Test: tick_interval = 0.5 (stress test kecepatan)
      → ML Service tidak timeout atau error 500
- [ ] Test: 20 mesin paralel semua terprediksi
      → Tidak ada machine_id yang terlewat di Redis

## TAHAP 7 — Historical Logs & Reports
- [ ] GET /api/telemetry/history/M-01?limit=10 → ada data
- [ ] GET /api/maintenance/schedules → ada data
- [ ] Halaman Historical Logs tampil data dari TimescaleDB
- [ ] Export PDF/Excel berfungsi

---

## ISSUES LOG
| ID | Tanggal | Deskripsi | Status | PIC |
|---|---|---|---|---|
| ISS-001 | 2026-05-24 | Math.ceil() pada rul_days | ✅ Fix Reynaldi | Reynaldi |
| ISS-002 | 2026-05-25 | Health Score collapse ke 0 saat WARNING/CRITICAL akibat logika pengurangan (substraksi) bobot negatif | ✅ Fixed (Weighted Average) | Antigravity |
| ISS-003 | 2026-05-25 | Alert & notifikasi bocor untuk mesin yang tidak sedang dipantau di filter | ✅ Fixed (WebSocket Filtered by activeMachineIds) | Antigravity |
| ISS-004 | 2026-05-25 | WebSocket race condition / stuck loading data akibat array re-render loop di useWebSocketInit | ✅ Fixed (State Caching & Dependency Fix) | Antigravity |

---
