---
# PRIME — Integration Verification Checklist
**Fase:** E2E System Integration — Dashboard Monitoring
**Tim:** ML (Zikran) × Backend (Reynaldi) × Frontend (Amir/Antigravity)
**Terakhir diupdate:** 2026-05-26
**Status Keseluruhan:** 🔄 In Progress — Audit 3, Tahap 6 & 7 tersisa

---

## CARA MENGGUNAKAN DOKUMEN INI (Panduan Mandiri)
Saat Lead Architect tidak tersedia, ikuti urutan ini:
1. Cek status item di bawah — ✅ skip, ⏳ kerjakan berikutnya
2. Setiap item punya kriteria PASS/FAIL yang jelas
3. Jika menemukan bug baru → catat di ISSUES LOG
4. Jangan tandai ✅ sebelum kriteria benar-benar terpenuhi
5. Untuk TAHAP 6-7, gunakan panduan langkah di masing-masing section

---

## LEGENDA
| Simbol | Makna |
|---|---|
| ✅ | Verified & Passed — jangan diulangi |
| 🔄 | Sedang Dikerjakan |
| ⏳ | Belum Dimulai — kerjakan selanjutnya |
| ❌ | Failed — perlu fix sebelum lanjut |
| 🔴 | Blocked — tunggu dependency selesai |
| ⚠️ | Selesai dengan catatan |

---

## PRE-INTEGRATION FIXES ✅ COMPLETE
- [x] ✅ Fix Math.ceil() → toFixed(2) pada rul_days
      File: backend/src/services/mlService.js baris 106
      Hasil: 1.585 → 1.59, null safety confirmed (ISS-001)
- [x] ✅ Fix Health Score collapse saat WARNING/CRITICAL
      Logika substraksi → Weighted Average (ISS-002)
- [x] ✅ Fix Alert bocor ke mesin tidak dipantau
      WebSocket filtered by activeMachineIds (ISS-003)
- [x] ✅ Fix WebSocket race condition / stuck loading
      State Caching & Dependency Fix di useWebSocketInit (ISS-004)
- [x] ✅ Fix Auth middleware Backend untuk dev-bypass
      Tambah SKIP_AUTH support di level middleware (ISS-005)
- [x] ✅ Fix Alert type menggunakan urgency bukan classification
      alertService.js: severity ikuti classification Model 1 (ISS-006)
- [x] ✅ Fix new_maintenance_task tidak punya listener di Scheduler
      Implement useMaintenanceSocket hook + lifted state (ISS-007)
- [x] ✅ Fix TimescaleDB schema: rul_days INTEGER → NUMERIC(10,2) NULL
      Migration migrate6.js (ISS-008)
- [x] ✅ Fix WebSocket protocol mismatch: native WS → Socket.IO client
      ws-manager.ts, ws-events.ts, .env.local, port 3001 (ISS-009)
- [x] ✅ Fix Redis key format mismatch
      Confirmed key: machine:{id}:prediction (ISS-010)
- [x] ✅ Fix Docker Desktop WSL2 IO error
      wsl --shutdown + Docker Desktop restart (ISS-011)
- [x] ✅ Fix TF/Keras version mismatch di container
      Pin TF==2.15.0, ENV TF_USE_LEGACY_KERAS=1 (ISS-012)
- [x] ✅ Fix LSTM weights corrupt saat load (.keras → .h5)
      Re-export model ke HDF5, inference.py updated (ISS-013)
- [x] ✅ Fix TypeError sort_values pada timestamp dari JSON
      Type Safety Guard di preprocessing_pipeline.py (ISS-014)

---

## TAHAP 1 — Infrastructure & Service Health ✅ COMPLETE
- [x] ✅ docker compose up postgres timescaledb redis ml-service -d
- [x] ✅ Semua infrastructure healthy (docker compose ps)
- [x] ✅ LSTM + XGBoost loaded (logs: "models ready ✅")
- [x] ✅ node src/config/migrate.js s/d migrate6.js (6 file)
- [x] ✅ node src/config/seedUsers.js
- [x] ✅ npm run dev (Backend port 3000)
- [x] ✅ npm run dev (Frontend port 3001)
- [x] ✅ GET /health → {"status":"ok","service":"lapis-backend"}
- [x] ✅ GET http://localhost:8000/health → {"status":"healthy","models":{...}}

### 🔁 Cara Menjalankan Ulang (Jika Service Mati)

```bash
# LANGKAH 1 — Pastikan Docker Desktop berjalan
# (Buka Docker Desktop, tunggu ikon whale di taskbar stabil)

# LANGKAH 2 — Start infrastructure + ML Service
docker compose up postgres timescaledb redis ml-service -d

# LANGKAH 3 — Verifikasi semua container healthy
docker compose ps
# Pastikan STATUS semua container: running / healthy
# Container names: lapis_postgres, lapis_timescaledb, lapis_redis, lapis-ml-service

# LANGKAH 4 — Tunggu ML Service siap (90 detik)
# Cek log sampai muncul "models ready" atau "Model loaded":
docker logs lapis-ml-service --tail 20

# LANGKAH 5 — Start Backend (terminal baru)
cd backend
npm run dev
# Tunggu sampai: "Server running on port 3000"

# LANGKAH 6 — Start Frontend (terminal baru)
cd frontend
npm run dev
# Tunggu sampai: "Ready on http://localhost:3001"

# LANGKAH 7 — Verifikasi health check
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"lapis-backend"}
curl http://localhost:8000/health
# Expected: {"status":"healthy","models":{...}}
```

> ⚠️ **Catatan Port Penting:**
> - Backend (Node.js): `localhost:3000`
> - ML Service (FastAPI): `localhost:8000`
> - Frontend (Next.js): `localhost:3001`
> - PostgreSQL: `localhost:5432` (via Docker, mapped ke host)
> - TimescaleDB: `localhost:5433`
> - Redis: `localhost:6379`

---

## TAHAP 2 — Auth & Simulator ✅ COMPLETE
- [x] ✅ Login admin@lapis-ai.com → JWT token valid
- [x] ✅ POST /api/simulator/start → running
- [x] ✅ ML Service menerima 20 POST /api/ml/predict per tick
- [x] ✅ GET /api/simulator/status → is_running: true

### ▶️ Cara Start Simulator

```bash
# Step 1 — Login dan simpan token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# Step 2 — Start simulator (tick setiap 2 detik, mulai Juli 2025)
curl -X POST http://localhost:3000/api/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-07-23T18:00:00","tick_interval_seconds":2}'

# Step 3 — Verifikasi berjalan
curl http://localhost:3000/api/simulator/status \
  -H "Authorization: Bearer $TOKEN"
```

### ⏹️ Cara Stop Simulator

```bash
curl -X POST http://localhost:3000/api/simulator/stop \
  -H "Authorization: Bearer $TOKEN"
```

---

## TAHAP 3 — ML Pipeline Verification ✅ COMPLETE
- [x] ✅ Log backend: "Prediction cached for M-XX" per tick
- [x] ✅ Redis: GET machine:M-01:prediction → JSON ada
- [x] ✅ TimescaleDB: SELECT * FROM ml_predictions → data ada
- [x] ✅ sensor_history 23 rows: "History fetched for M-XX: 23 rows"
- [x] ✅ rul_days = float (misal 1.59, bukan integer 2)
- [x] ✅ health_score HEALTHY ≈ 80–100, CRITICAL ≈ 0–20

### 🔍 Query Verifikasi Cepat

```sql
-- Masuk ke TimescaleDB:
docker exec -it lapis_timescaledb psql -U lapis_user -d lapis_timeseries_db

-- Cek 5 prediksi terbaru:
SELECT machine_id, classification, rul_days, health_score, timestamp
FROM ml_predictions
ORDER BY timestamp DESC LIMIT 5;

-- Cek Redis (dari terminal host):
docker exec -it lapis_redis redis-cli -a lapis_redis_secret
GET machine:M-01:prediction
```

---

## TAHAP 4 — WebSocket Event Verification ✅ COMPLETE
- [x] ✅ sensor:update diterima setiap tick (sensor_live berubah)
- [x] ✅ health_status.label ada (HEALTHY / WARNING / CRITICAL)
- [x] ✅ rul.is_active = false + rul_days = null saat HEALTHY
- [x] ✅ rul.is_active = true + rul_days = float saat WARNING/CRITICAL
- [x] ✅ alert:new severity = critical saat CRITICAL
- [x] ✅ alert:new severity = warning saat WARNING (bukan critical)
- [x] ✅ machine:status_update diterima saat status berubah
- [x] ✅ new_maintenance_task diterima di global channel
- [x] ✅ simulator:tick diterima di channel simulator

---

## TAHAP 5 — Dashboard Display Verification ✅ COMPLETE
- [x] ✅ Gauge 8 sensor berubah sesuai sensor_live
- [x] ✅ Health badge + health score sesuai kalkulasi
- [x] ✅ RUL banner muncul saat WARNING/CRITICAL
- [x] ✅ RUL banner null/hidden saat HEALTHY
- [x] ✅ Sidebar machine card berubah warna real-time
- [x] ✅ Global Toast Alert muncul saat CRITICAL
- [x] ✅ Anomaly Timeline terhubung ke TimescaleDB
- [x] ✅ Maintenance Scheduler: kartu PENDING_CONFIRMATION muncul otomatis
      via useMaintenanceSocket hook + lifted state di SchedulerPage

---

## AUDIT 1 — ML Quality ✅ COMPLETE
- [x] ✅ M-06: WARNING T-47h sebelum failure (target W_WARNING=48h)
- [x] ✅ M-06: CRITICAL T-34h sebelum failure
- [x] ✅ RUL error saat CRITICAL: 0.05 hari (sangat akurat)
- [x] ✅ Eskalasi HEALTHY → WARNING → CRITICAL confirmed sempurna

## AUDIT 2 — Scheduler WS Integration ✅ COMPLETE
- [x] ✅ useMaintenanceSocket hook implemented
- [x] ✅ State lifted ke SchedulerPage (tidak lagi di CalendarView)
- [x] ✅ Triage Center reaktif terhadap WS events (bukan MOCK statis)
- [x] ✅ Dedup logic: machine_id + status active check

---

## AUDIT 3 — Idle/Offline Dashboard State ✅ (Selesai)
**PIC:** Amir/Antigravity | **Estimasi:** 3 jam

- [x] ✅ Hapus *mock data* dummy dari `machineStore` agar dashboard menggunakan nilai `0` secara *default*.
- [x] ✅ Ubah *banner* pada `VitalSignBanner` untuk menampilkan status "ENGINE OFFLINE" saat nilai suhu `0`.
- [x] ✅ Hapus komponen *skeleton* yang merusak aturan rendering React (*Hooks*).
- [x] ✅ Pastikan tidak ada *crash* (*TypeError*) pada grafik (*chart*) dan kartu sensor saat mesin belum diinisialisasi.

### 📐 Panduan Implementasi Mandiri

```tsx
// 1. Buat SkeletonCard di components/ui/Skeleton.tsx
export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-[#1E3D40] rounded-xl h-[120px] w-full" />
  );
}

// 2. Di setiap komponen data, tambahkan guard:
if (!machine || !machine.sensors) return <SkeletonCard />;

// 3. Di SensorCard/TelemetryChart, gunakan isLoading dari connectionState:
const { connectionState } = useWebSocketInit();
const isLoading = connectionState !== "CONNECTED" || !machine?.sensors;
if (isLoading) return <SkeletonChart />;
```

---

## TAHAP 6 — Edge Case & Stress Test ✅ (Selesai)
**Prerequisite:** Audit 3 (Skeleton Loading) harus ✅ selesai dulu

- [x] ✅ Stop simulator → restart dengan start_date berbeda
      Kriteria PASS: data di UI berubah mengikuti periode baru
- [x] ✅ Mesin CRITICAL → kembali HEALTHY saat data normal
      Kriteria PASS: badge berubah hijau, RUL banner hilang
- [x] ✅ Duplikasi maintenance schedule tidak terjadi
      Kriteria PASS: 1 mesin tidak punya 2 record PENDING_CONFIRMATION
      Query cek:
      ```sql
      SELECT machine_id, COUNT(*) FROM maintenance_schedules
      WHERE status = 'pending' GROUP BY machine_id HAVING COUNT(*) > 1;
      ```
- [x] ✅ Stress test: tick_interval = 0.5 detik
      Cara:
      ```bash
      curl -X POST http://localhost:3000/api/simulator/start \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"start_date":"2025-07-23T18:00:00","tick_interval_seconds":0.5}'
      ```
      Monitor: `docker logs lapis-ml-service -f`
      Kriteria PASS: tidak ada "timeout" atau error 500 di log
- [x] ✅ Semua 20 mesin terprediksi per tick
      Kriteria PASS: 20 keys di Redis
      ```bash
      docker exec -it lapis_redis redis-cli -a lapis_redis_secret KEYS "machine:*:prediction"
      ```

---

## TAHAP 7 — Historical Logs & Reports ✅ (Selesai)
- [x] ✅ GET /api/telemetry/history/M-01?limit=10 → ada data
- [x] ✅ GET /api/maintenance/schedules → ada data
- [x] ✅ Halaman Historical Logs tampil data dari TimescaleDB
- [x] ✅ Export PDF berfungsi
- [x] ✅ Export Excel berfungsi

---

## ISSUES LOG
| ID | Tanggal | Deskripsi | Status | PIC |
|---|---|---|---|---|
| ISS-001 | 2026-05-24 | Math.ceil() rul_days → integer | ✅ Fixed | Zikran |
| ISS-002 | 2026-05-25 | Health Score collapse ke 0 | ✅ Fixed | Antigravity |
| ISS-003 | 2026-05-25 | Alert bocor ke mesin tidak dipantau | ✅ Fixed | Antigravity |
| ISS-004 | 2026-05-25 | WebSocket race condition / stuck | ✅ Fixed | Antigravity |
| ISS-005 | 2026-05-26 | API Anomaly Timeline ter-block auth (401) | ✅ Fixed | Antigravity |
| ISS-006 | 2026-05-26 | Alert type ikut urgency RUL bukan classification | ✅ Fixed | Zikran |
| ISS-007 | 2026-05-26 | new_maintenance_task tidak ada listener di Scheduler | ✅ Fixed | Antigravity |
| ISS-008 | 2026-05-25 | TimescaleDB rul_days INTEGER NOT NULL | ✅ Fixed (migrate6.js) | Zikran |
| ISS-009 | 2026-05-25 | WS Protocol mismatch native vs Socket.IO | ✅ Fixed | Zikran |
| ISS-010 | 2026-05-25 | Redis key format mismatch | ✅ Clarified | Zikran |
| ISS-011 | 2026-05-25 | Docker Desktop WSL2 IO error | ✅ Fixed | Zikran |
| ISS-012 | 2026-05-24 | TF 2.15.0 version mismatch di container | ✅ Fixed | Zikran |
| ISS-013 | 2026-05-24 | LSTM weights corrupt: .keras → .h5 | ✅ Fixed | Zikran |
| ISS-014 | 2026-05-25 | TypeError sort_values timestamp JSON | ✅ Fixed | Zikran |
| ISS-015 | 2026-05-26 | Jadwal prediktif ditolak constraint DB (UPPER_CASE) | ✅ Fixed (migrate7.js) | Antigravity |
| ISS-016 | 2026-05-26 | Jadwal prediktif ditolak NOT NULL rul_days integer | ✅ Fixed (migrate7.js) | Antigravity |
| ISS-017 | 2026-05-26 | Tampilan mobile UI rusak/terlalu besar di bbrp halaman | ✅ Fixed (Responsive) | Antigravity |
| ISS-018 | 2026-05-26 | Admin Dashboard /dashboard bentrok dgn teknisi | ✅ Fixed (Middleware) | Antigravity |
| ISS-019 | 2026-05-26 | Error AdminDashboardTab `filter is not a function` | ✅ Fixed (API Parse) | Antigravity |

---

## DEFINISI DONE — INTEGRATION COMPLETE
| # | Kriteria | Status |
|---|---|---|
| 1 | Tahap 1–5 semua passed | ✅ |
| 2 | Audit 1 ML Quality passed | ✅ |
| 3 | Audit 2 Scheduler WS passed | ✅ |
| 4 | Audit 3 Idle/Offline Dashboard State | ✅ |
| 5 | Tahap 6 Edge Case & Stress Test passed | ✅ |
| 6 | Tahap 7 Historical Logs passed | ✅ |
| 7 | INT-022 Full Scheduler Revision dijadwalkan | ✅ Done |

---
