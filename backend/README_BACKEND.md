# Lapis AI — Predictive Maintenance SaaS

Sistem pemantauan dan prediksi kondisi mesin berbasis AI untuk industri 
manufaktur. Mengubah data sensor IoT mentah menjadi wawasan prediktif 
secara real-time.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Runtime | Node.js v24 + Express v5 |
| Real-time | Socket.IO v4 (WebSocket) |
| Cache | Redis 7 |
| Relational DB | PostgreSQL 15 |
| Time-Series DB | TimescaleDB (PostgreSQL extension) |
| Auth | JWT + bcryptjs |
| File Upload | Multer |
| HTTP Client | Axios |
| Logger | Winston |
| Container | Docker + Docker Compose |

---

## Monorepo Structure

```
predictive-maintenance-monorepo/
├── backend/                          ← Backend API (Role C — Reynaldi)
│   ├── src/
│   │   ├── config/                   ← DB connections, migrations, logger
│   │   ├── controllers/              ← Request handlers
│   │   ├── middlewares/              ← Auth guard, NLP router
│   │   ├── routes/                   ← Endpoint definitions
│   │   ├── services/                 ← Business logic
│   │   └── websockets/               ← Socket.IO manager & broadcast
│   ├── uploads/                      ← Temporary document storage
│   ├── HISTORY_LOG.md                ← Phase development log
│   ├── DATABASE_SCHEMA.md            ← Database schema documentation
│   └── ALUR_SIMULASI_DATA.md         ← Data simulation flow
│   └── README.md                     ← README backend
├── frontend/                         ← Next.js Dashboard (Role A — Amir)
├── machine_learning/                 ← ML Engine (Role B — Zikran)
├── nlp/                              ← NLP/RAG Engine (Role D — Aqsa)
├── docker-compose.yml                ← Infrastructure orchestrator
├── .env.example                      ← Environment variables template
```

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | v18.x LTS |
| npm | v9.x |
| Git | v2.x |
| Docker | v24.x |
| Docker Compose | v2.x |

---

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/ZeroZennn/predictive-maintenance-monorepo.git
cd predictive-maintenance-monorepo
```

### 2. Setup Environment Variables

```bash
# Root .env (untuk Docker Compose)
cp .env.example .env

# Backend .env
cp backend/.env.example backend/.env
```

Buka kedua file `.env` dan isi nilai yang kosong:

```bash
# Wajib diisi:
POSTGRES_PASSWORD=         # Password PostgreSQL
REDIS_PASSWORD=            # Password Redis
JWT_SECRET=                # Random string panjang untuk JWT
INTERNAL_API_KEY=          # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Jalankan Infrastructure Services

```bash
docker compose up -d
```

Verifikasi semua container healthy:
```bash
docker compose ps
# Semua harus berstatus (healthy)
```

### 4. Setup Backend

```bash
cd backend
npm install
```

Jalankan database migrations secara berurutan:
```bash
node src/config/migrate.js    # V1: sensor_readings, maintenance_logs
node src/config/migrate2.js   # V2: users, machines, schedules, documents, alerts
node src/config/migrate3.js   # V3: extend ml_predictions
node src/config/migrate4.js   # V4: align documents dengan NLP schema
```

Seed data awal:
```bash
node src/config/seedUsers.js  # Buat akun admin & technician
```

### 5. Jalankan Backend Server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server berjalan di: `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| POST | /api/auth/login | Public | Login → JWT token |
| GET | /api/auth/me | Protected | Get current user |
| POST | /api/auth/logout | Protected | Logout |

### Telemetry (IoT Ingestion)
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| POST | /api/telemetry/ingest | Public | Terima data sensor IoT |

### NLP / AI Copilot
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| POST | /api/nlp/chat | Protected | Query AI Copilot |
| GET | /api/nlp/health | Public | Status NLP Engine |

### Admin Panel
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| GET | /api/admin/users | Admin | List semua user |
| POST | /api/admin/users | Admin | Buat user baru |
| PUT | /api/admin/users/:id | Admin | Update user |
| DELETE | /api/admin/users/:id | Admin | Deactivate user |
| POST | /api/admin/documents/upload | Admin | Upload dokumen SOP |
| GET | /api/admin/documents | Admin | List dokumen |
| GET | /api/admin/documents/:id/status | Admin | Status indexing |
| PATCH | /api/admin/documents/:id/status | Internal | Callback dari NLP Engine |
| DELETE | /api/admin/documents/:id | Admin | Hapus dokumen |

### WebSocket Events

**Client → Server:**
| Event | Payload | Keterangan |
|-------|---------|------------|
| join:machine | machineId | Subscribe ke room mesin |
| leave:machine | machineId | Unsubscribe dari room mesin |
| join:global | - | Subscribe ke global alerts |

**Server → Client:**
| Event | Channel | Keterangan |
|-------|---------|------------|
| sensor:update | machine:{id} | Data sensor real-time |
| alert:new | machine:{id} + global | Alert kritis |
| machine:status_update | global | Perubahan status mesin |

### Telemetry History & Anomaly
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| GET | /api/telemetry/history/:machine_id | Protected | Last N sensor readings untuk chart |
| GET | /api/telemetry/anomaly/:machine_id | Protected | Anomaly timeline (state transition + P90) |

### Maintenance
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| GET | /api/maintenance/kpis/:machine_id | Protected | KPIs dashboard |
| GET | /api/maintenance/schedules | Protected | Kanban board data |
| GET | /api/maintenance/schedules/:machine_id | Protected | Schedule per mesin |
| PATCH | /api/maintenance/schedules/:id/status | Protected | Update status jadwal |

### Simulator
| Method | Endpoint | Access | Keterangan |
|--------|----------|--------|------------|
| POST | /api/simulator/start | Admin | Start IoT simulation |
| POST | /api/simulator/stop | Admin | Stop simulation |
| GET | /api/simulator/status | Protected | Simulation progress |

---

## Default Accounts (Development Only)

| Email | Password | Role |
|-------|----------|------|
| admin@lapis-ai.com | Admin@Lapis123 | admin |
| tech01@lapis-ai.com | Tech@Lapis123 | technician |

> ⚠️ Ganti password sebelum deploy ke production.

---

## Database Architecture

```
PostgreSQL (port 5434) — lapis_ai_db
└── users, machines, maintenance_logs, maintenance_schedules,
    documents, alerts

TimescaleDB (port 5433) — lapis_timeseries_db  
└── sensor_readings (hypertable), ml_predictions (hypertable)

Redis (port 6379)
└── machine:{id}:last_reading (TTL 15 menit)
└── machine:{id}:prediction (TTL 15 menit)
```

Lihat `backend/DATABASE_SCHEMA.md` untuk skema lengkap.

---

## Branch Strategy

```
main                          ← Production ready
└── rey-workspace             ← Backend integration branch (Role C)
    ├── backend-feature/fase-1  ← Snapshot Fase 1
    ├── backend-feature/fase-2  ← Snapshot Fase 2
    ├── backend-feature/fase-3  ← Snapshot Fase 3
    ├── backend-feature/fase-4  ← Snapshot Fase 4
    ├── backend-feature/fase-5  ← Snapshot Fase 5
    ├── backend-feature/fase-6  ← Snapshot Fase 6
    └── backend-feature/fase-7  ← Snapshot Fase 7 (current)
```

---

## Development Progress

| Fase | Status | Keterangan |
|------|--------|------------|
| 0 | ✅ | Environment & Monorepo Bootstrap |
| 1 | ✅ | Core Ingestion & Async Dispatcher |
| 2 | ✅ | Database Schema Completion |
| 3 | ✅ | Authentication System (JWT + RBAC) |
| 4 | ✅ | WebSocket Broadcast Engine |
| 5 | ✅ | ML Orchestration Layer |
| 6 | ✅ | Smart NLP Router & Context Injection |
| 7 | ✅ | Admin Panel APIs |
| 8 | ✅ | Historical Logs, Replay Script & Maintenance Scheduler |
| 9 | ⏳ | Hardening & End-to-End Integration Test |

Lihat `backend/HISTORY_LOG.md` untuk detail setiap fase.