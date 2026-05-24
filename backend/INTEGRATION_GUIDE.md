# 🔗 Backend Integration Guide — Lapis AI
**Untuk:** ML Engineer (Zikran)  
**Dari:** Backend Engineer (Reynaldi)  
**Tanggal:** 2026-05-24

---

## 1. Struktur Folder Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── logger.js          ← Winston logger
│   │   ├── postgresClient.js  ← PostgreSQL pool (port 5434)
│   │   ├── timescaleClient.js ← TimescaleDB pool (port 5433)
│   │   ├── redisClient.js     ← Redis client (port 6379)
│   │   ├── migrate.js         ← Migration V1
│   │   ├── migrate2.js        ← Migration V2
│   │   ├── migrate3.js        ← Migration V3
│   │   ├── migrate4.js        ← Migration V4
│   │   ├── migrate5.js        ← Migration V5
│   │   ├── initDb.js          ← Startup DB verify
│   │   └── seedUsers.js       ← Seed admin & technician
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── telemetryHistoryController.js
│   │   ├── maintenanceController.js
│   │   └── simulatorController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js      ← JWT guard + RBAC
│   │   └── nlpRouterMiddleware.js ← Intent classifier
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── telemetryRoutes.js
│   │   ├── nlpRoutes.js
│   │   ├── adminRoutes.js
│   │   └── apiRoutes.js          ← history, maintenance, simulator
│   ├── services/
│   │   ├── authService.js
│   │   ├── dispatcherService.js  ← Core pipeline orchestrator
│   │   ├── mlService.js          ← ML Engine caller
│   │   ├── nlpContextService.js  ← Redis context fetcher
│   │   ├── safetyMarginService.js
│   │   ├── alertService.js
│   │   └── simulatorService.js   ← Replay Script logic
│   ├── websockets/
│   │   ├── socketManager.js      ← Socket.IO singleton
│   │   └── broadcastService.js   ← Broadcast methods
│   └── app.js                    ← Express entry point
├── uploads/                      ← Temp document storage
├── .env.example
├── package.json
└── INTEGRATION_GUIDE.md
```

---

## 2. Setup & Installation Guide

### Prerequisites
| Tool | Minimum Version |
|------|----------------|
| Node.js | v18.x LTS |
| Docker | v24.x |
| Docker Compose | v2.x |

### Initial Setup

```bash
# 1. Clone repo
git clone https://github.com/ZeroZennn/predictive-maintenance-monorepo.git
cd predictive-maintenance-monorepo

# 2. Setup environment variables
cp .env.example .env
cp backend/.env.example backend/.env
# Edit kedua .env — isi nilai yang kosong

# 3. Install backend dependencies
cd backend
npm install
```

### Service Execution — Urutan WAJIB

```bash
# Step 1 — Jalankan infrastructure dulu
docker compose up postgres timescaledb redis -d

# Tunggu sampai semua healthy (30 detik):
docker compose ps

# Step 2 — Jalankan ML Service
docker compose up ml-service -d

# Tunggu sampai healthy (60-90 detik — load LSTM + XGBoost):
docker compose ps

# Step 3 — Jalankan database migrations
cd backend
node src/config/migrate.js
node src/config/migrate2.js
node src/config/migrate3.js
node src/config/migrate4.js
node src/config/migrate5.js

# Step 4 — Seed initial data
node src/config/seedUsers.js

# Step 5 — Jalankan Backend server
npm run dev
```

### Health Check

```bash
# Infrastructure
docker compose ps
# Semua harus: (healthy)

# Backend API
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"lapis-backend"}

# ML Service
curl http://localhost:8000/health
# Expected: {"status":"healthy","models":{...}}

# ML Service Swagger (interactive docs)
# Buka browser: http://localhost:8000/docs
```

---

## 3. Replay Script

### Lokasi
```
backend/src/services/simulatorService.js  ← Core logic
backend/src/controllers/simulatorController.js
```

CSV yang dibaca:
```
machine_learning/data/raw/sensor_readings.csv
```

### Cara Menjalankan via REST API

```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}'

# Simpan token dari response
TOKEN="eyJ..."

# Start simulator (dari awal CSV, 1 tick per detik)
curl -X POST http://localhost:3000/api/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tick_interval_seconds": 1}'

# Start dari tanggal tertentu dengan kecepatan custom
curl -X POST http://localhost:3000/api/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-08-15T00:00:00",
    "tick_interval_seconds": 0.5
  }'

# Cek status
curl http://localhost:3000/api/simulator/status \
  -H "Authorization: Bearer $TOKEN"

# Stop simulator
curl -X POST http://localhost:3000/api/simulator/stop \
  -H "Authorization: Bearer $TOKEN"
```

### Parameter Simulator
| Parameter | Default | Range | Keterangan |
|-----------|---------|-------|------------|
| `start_date` | Awal CSV (2025-07-01) | Any valid date in CSV | Mulai dari timestamp tertentu |
| `tick_interval_seconds` | 1 | 0.1 – 60 | Jeda antar tick (1 tick = 1 jam simulasi) |

### Setiap Tick Mengirim
- 20 mesin sekaligus secara paralel (Promise.all)
- Masing-masing via `POST /api/telemetry/ingest`
- WebSocket broadcast `simulator:tick` ke channel `simulator`

### Reset Simulator
Stop lalu start ulang dari awal:
```bash
curl -X POST http://localhost:3000/api/simulator/stop \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3000/api/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"tick_interval_seconds": 1}'
```

> **Catatan:** Simulator saat ini tidak support filter per machine_id — 
> selalu kirim semua 20 mesin per tick. Jika butuh filter, 
> bisa request sebagai enhancement.

---

## 4. WebSocket Event Contract

### Connection
```javascript
// Frontend connect:
const socket = io('http://localhost:3000')

// Subscribe ke mesin tertentu:
socket.emit('join:machine', 'M-01')

// Subscribe ke global alerts:
socket.emit('join:global')

// Subscribe ke simulator progress:
socket.emit('join:simulator')
```

### Event 1: `sensor:update` — Data Sensor + Prediksi ML
**Channel:** `machine:{machine_id}` (contoh: `machine:M-01`)

```json
{
  "machine_id": "M-01",
  "timestamp": "2026-05-24T12:00:00Z",
  "sensor_live": {
    "temperature": 89.7,
    "vibration": 1.23,
    "pressure": 110.8,
    "rpm": 2754,
    "power_consumption": 88.3,
    "noise_level": 81.2,
    "humidity": 50.9,
    "operating_hours": 1761.4
  },
  "health_status": {
    "label": "CRITICAL",
    "health_score": 0,
    "confidence": 0.8357,
    "probabilities": {
      "HEALTHY": 0.10,
      "WARNING": 0.25,
      "CRITICAL": 0.65
    }
  },
  "rul": {
    "is_active": true,
    "rul_days": 2,
    "urgency_level": "CRITICAL"
  },
  "maintenance_kpis": {
    "issues_this_week": 8,
    "days_since_last_maintenance": 45,
    "total_downtime_hours": 12,
    "mtbf_days": 120
  },
  "broadcast_at": "2026-05-24T12:00:00.123Z"
}
```

> Jika mesin HEALTHY (is_active=false):
> ```json
> "rul": {
>   "is_active": false,
>   "rul_days": null,
>   "urgency_level": "MONITOR"
> }
> ```

### Event 2: `alert:new` — Alert Kritis
**Channel:** `machine:{machine_id}` + `global` (keduanya)

```json
{
  "machine_id": "M-01",
  "type": "rul_critical",
  "message": "CRITICAL: Machine M-01 requires service within 48 hours. RUL: 2 days.",
  "severity": "critical",
  "timestamp": "2026-05-24T12:00:00.123Z"
}
```

**Alert types:**
| type | severity | Trigger |
|------|----------|---------|
| `rul_critical` | critical | urgency_level = IMMEDIATE atau CRITICAL |
| `health_warning` | warning | classification WARNING atau health_score ≤ 60 |
| `health_critical` | critical | classification CRITICAL atau health_score ≤ 30 |

### Event 3: `machine:status_update` — Status Mesin Berubah
**Channel:** `global`

```json
{
  "machine_id": "M-01",
  "status": "critical",
  "updated_at": "2026-05-24T12:00:00.123Z"
}
```

**Status values:** `healthy` | `warning` | `critical` | `offline`

### Event 4: `new_maintenance_task` — Jadwal Servis Dibuat
**Channel:** `global`

```json
{
  "machine_id": "M-01",
  "rul_days": 2,
  "scheduled_date": "2026-05-22",
  "safety_margin_date": "2026-05-21",
  "priority": "critical",
  "maintenance_type": "EMERGENCY",
  "classification": "CRITICAL"
}
```

### Event 5: `simulator:tick` — Progress Replay Script
**Channel:** `simulator`

```json
{
  "current_timestamp": "2025-07-01 00:00",
  "ticks_sent": 1,
  "ticks_total": 5000,
  "percentage": 0,
  "machines_in_tick": 20
}
```

### Channel / Room Naming Convention
| Channel | Subscriber | Events diterima |
|---------|-----------|-----------------|
| `machine:M-01` | Dashboard M-01 | sensor:update, alert:new |
| `machine:M-07` | Dashboard M-07 | sensor:update, alert:new |
| `global` | Semua client login | alert:new, machine:status_update, new_maintenance_task |
| `simulator` | Admin simulator panel | simulator:tick |

---

## 5. Monitoring & Debug

### Lihat Log ML Service
```bash
# Real-time log
docker compose logs ml-service -f

# Last 50 lines
docker compose logs ml-service --tail=50

# Container name: lapis-ml-service
docker logs lapis-ml-service --tail=50 -f
```

### Verifikasi Prediksi ML di Redis
```bash
# Masuk Redis CLI
docker exec -it lapis_redis redis-cli -a lapis_redis_secret

# Cek prediction M-01
GET machine:M-01:prediction

# Cek semua keys
KEYS machine:*

# Keluar
exit
```

### Verifikasi Data di TimescaleDB
```bash
# Masuk TimescaleDB
docker exec -it lapis_timescaledb psql -U lapis_user -d lapis_timeseries_db

# Cek prediksi terbaru
SELECT machine_id, timestamp, health_score, rul_days, 
       classification, confidence_score, urgency_level
FROM ml_predictions
ORDER BY timestamp DESC
LIMIT 20;

# Cek sensor readings
SELECT machine_id, timestamp, temperature, vibration
FROM sensor_readings
ORDER BY timestamp DESC
LIMIT 20;

# Keluar
\q
```

### Verifikasi Schedule di PostgreSQL
```bash
docker exec -it lapis_postgres psql -U lapis_user -d lapis_ai_db

SELECT machine_id, rul_days, scheduled_date, 
       safety_margin_date, priority, maintenance_type, status
FROM maintenance_schedules
ORDER BY created_at DESC;

\q
```

### REST Endpoint untuk Debug
```bash
# Health check backend
GET http://localhost:3000/health

# ML Service health (via backend)
GET http://localhost:3000/api/nlp/health

# Telemetry history M-01
GET http://localhost:3000/api/telemetry/history/M-01?limit=10
Authorization: Bearer {token}

# Maintenance schedules (Kanban data)
GET http://localhost:3000/api/maintenance/schedules
Authorization: Bearer {token}

# Simulator status
GET http://localhost:3000/api/simulator/status
Authorization: Bearer {token}
```

---

## 6. Environment Variables

### `backend/.env`
```bash
# BACKEND
BACKEND_PORT=3000
NODE_ENV=development

# POSTGRESQL (Relational) — port 5434 (avoid conflict with local PG)
POSTGRES_HOST=localhost
POSTGRES_PORT=5434
POSTGRES_USER=lapis_user
POSTGRES_PASSWORD=lapis_secret
POSTGRES_DB=lapis_ai_db

# TIMESCALEDB (Time-Series) — port 5433
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5433
TIMESCALE_USER=lapis_user
TIMESCALE_PASSWORD=lapis_secret
TIMESCALE_DB=lapis_timeseries_db

# REDIS
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=lapis_redis_secret

# ML ENGINE — localhost saat npm run dev, ml-service saat Docker
ML_ENGINE_URL=http://localhost:8000

# NLP ENGINE
NLP_ENGINE_URL=http://localhost:8001

# JWT
JWT_SECRET=lapis_dev_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d

# INTERNAL (callback dari NLP Engine)
INTERNAL_API_KEY=your_generated_key_here

# STORAGE
STORAGE_PATH=/app/uploads
```

### Default Test Credentials
```
Admin:      admin@lapis-ai.com / Admin@Lapis123
Technician: tech01@lapis-ai.com / Tech@Lapis123
```

### Quick Login untuk Testing
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}'
```