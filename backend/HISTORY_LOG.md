# 📋 HISTORY LOG — Lapis AI Backend Development
**Project:** Predictive Maintenance SaaS — Lapis AI  
**Role:** Backend Engineer (Role C)  
**Architect:** Lead Backend Architect (AI)  
**Stack:** Node.js · Express · PostgreSQL · TimescaleDB · Redis · Docker  
**Monorepo:** `predictive-maintenance-monorepo/`

---

## 🗂️ LEGEND STATUS
| Symbol | Meaning |
|--------|---------|
| ✅ | Selesai & diaudit — aman |
| ⚠️ | Warning / Peringatan |
| ❌ | Gagal / perlu rework |

---

## FASE 0 — Environment & Monorepo Bootstrap ✅
**Tujuan:** Mendirikan fondasi ekosistem, struktur folder, version control, dan infrastruktur container.

### Langkah 0.A — Verifikasi Prerequisites ✅
- **Tanggal:** 2026-04-29
- **Output Kunci:**
  - Node.js: v24.15.0
  - npm: v11.12.1
  - Git: v2.54.0.windows.1
  - Docker: v29.4.0
  - Docker Compose: v5.1.2
- **Audit Result:** Semua versi melampaui requirement minimum. PASS.

### Langkah 0.B — Inisialisasi Struktur Monorepo ✅
- **Tanggal:** 2026-04-29
- **Files Created (via Copilot):**
  - `.gitignore`
  - `.env.example`
  - `docker-compose.yml`
  - `README.md`
  - `backend/.env.example`
  - `backend/src/controllers/.gitkeep`
  - `backend/src/services/.gitkeep`
  - `backend/src/routes/.gitkeep`
  - `backend/src/middlewares/.gitkeep`
  - `backend/src/config/.gitkeep`
  - `backend/src/utils/.gitkeep`
  - `backend/src/websockets/.gitkeep`
  - `frontend/.gitkeep`
  - `machine_learning/.gitkeep`
  - `nlp/.gitkeep`
- **Audit Result:**
  - ⚠️ Bug Fatal diperbaiki: placeholder services akan crash tanpa `profiles`
  - ⚠️ Bug Medium diperbaiki: tambah `healthcheck` pada semua infrastructure services
  - ⚠️ Perbaikan: TimescaleDB diberi database terpisah `lapis_timeseries_db`
  - ✅ `docker compose config` — PASS setelah perbaikan

### Langkah 0.C — Git Init & First Commit ✅
- **Tanggal:** 2026-04-29
- **Branch:** `rey-workspace`
- **Commit Hash:** `994c284`
- **Commit Message:** `chore: initial monorepo scaffold for Lapis AI`
- **Files Committed:** 15 files, 410 insertions
- **Audit Result:** Tidak ada file `.env` sensitif masuk commit. PASS.

### Langkah 0.D — Menghidupkan Infrastructure Containers ✅
- **Tanggal:** 2026-04-29
- **Containers Running:**
  | Container | Image | Status | Port |
  |-----------|-------|--------|------|
  | `lapis_postgres` | `postgres:15-alpine` | 🟢 healthy | 5432 |
  | `lapis_timescaledb` | `timescale/timescaledb:latest-pg15` | 🟢 healthy | 5433 |
  | `lapis_redis` | `redis:7-alpine` | 🟢 healthy | 6379 |
- **Audit Result:** Semua 3 infrastructure containers healthy. PASS.

---

## FASE 1 — Core Ingestion & Dispatcher Layer 🔄
**Tujuan:** Membangun Express.js server, endpoint `POST /api/telemetry/ingest`,
dan mekanisme Dispatcher asinkron untuk Data Demultiplexing.

### Langkah 1.A — Inisialisasi Backend Node.js ✅
- **Tanggal:** 2026-04-29
- **Dependencies Installed (production):** express, socket.io, ioredis, pg,
  dotenv, cors, helmet, morgan, express-validator, axios, winston
- **Dependencies Installed (dev):** nodemon, jest, supertest
- **Audit Result:**
  - ⚠️ Bug diperbaiki: jest/nodemon/supertest masuk production deps → dipindah ke devDependencies
  - ✅ package.json scripts dikonfigurasi: start, dev, test
  - ✅ main entry point diset ke src/app.js

### Langkah 1.B — Setup .env, Winston Logger & Entry Point app.js ✅
- **Tanggal:** 2026-04-29
- **Files Created:**
  - `backend/.env` (environment variables development)
  - `backend/src/config/logger.js` (Winston logger, dev+prod format)
  - `backend/src/app.js` (Express server, middleware stack, graceful shutdown)
- **Audit Result:**
  - ✅ Semua middleware terpasang urutan benar: helmet→cors→json→morgan
  - ✅ Graceful shutdown SIGTERM+SIGINT terpasang
  - ✅ Health check GET /health → 200 OK terverifikasi via curl
  - ✅ Helmet security headers aktif terkonfirmasi di response

### Langkah 1.C — Konfigurasi Koneksi Redis & PostgreSQL/TimescaleDB ✅
- **Tanggal:** 2026-04-29
- **Files Created:**
  - `backend/src/config/redisClient.js`
  - `backend/src/config/postgresClient.js`
  - `backend/src/config/timescaleClient.js`
- **Issue & Fix:**
  - ❌ PostgreSQL auth failed — root cause: port 5432 conflict dengan
    instalasi PostgreSQL lokal Windows
  - ✅ Fix: Docker PostgreSQL dipindah ke port 5434 di root .env & backend/.env
- **Final Connection Status:**
  | Service | Port | Status |
  |---------|------|--------|
  | Redis | 6379 | ✅ healthy |
  | PostgreSQL | 5434 | ✅ healthy |
  | TimescaleDB | 5433 | ✅ healthy |

### Langkah 1.D — Ingestion Controller & Async Dispatcher ✅
- **Tanggal:** 2026-04-29
- **Files Created:** dispatcherService.js, telemetryController.js, telemetryRoutes.js
- **Pattern:** Receive-Fast (202 ACK) → setImmediate → Promise.all dispatch
- **Verified:** Response 202 terkirim SEBELUM DB operations (non-blocking confirmed)

### Langkah 1.E — Database Schema Migration ✅
- **Tanggal:** 2026-04-29
- **Files Created:** migrate.js, initDb.js
- **Tables Created:**
  - PostgreSQL: maintenance_logs (relasional + 2 indexes)
  - TimescaleDB: sensor_readings (hypertable + index machine_id+timestamp)
- **Verified:** Full pipeline M-01 → Redis ✅ + TimescaleDB ✅ tanpa error
---

## FASE 2 — Database Schema Completion ✅
**Tujuan:** Melengkapi skema database sesuai Blueprint V3.0.

### Langkah 2.A — Migration V2 & Seed Data ✅
- **Tanggal:** 2026-05-03
- **Files Created/Modified:**
  - `backend/src/config/migrate2.js` (migration V2)
  - `backend/src/config/initDb.js` (upgraded V2 verify)
- **Tables Created (PostgreSQL):**
  | Tabel | Fungsi |
  |-------|--------|
  | users | Akun teknisi & admin (role-based) |
  | machines | Master data 20 mesin M-01 s/d M-20 |
  | maintenance_schedules | Output Safety Margin Calculator |
  | documents | Metadata SOP/Manual yang diupload admin |
  | alerts | Riwayat alert kritis sistem |
- **Tables Created (TimescaleDB):**
  | Tabel | Fungsi |
  |-------|--------|
  | ml_predictions | Hasil prediksi ML (hypertable) |
- **Seed Data:** 20 machines inserted (idempotent — skip if exists)
- **Verified:** DB Verify startup → "All tables confirmed. 20 machines seeded."

---

## FASE 3 — Authentication System ✅
**Tujuan:** JWT middleware, login endpoint, role-based access control.

### Langkah 3.A — JWT Auth System ✅
- **Tanggal:** 2026-05-03
- **Packages Added:** bcryptjs, jsonwebtoken
- **Files Created:**
  - `src/services/authService.js` — bcrypt + JWT logic
  - `src/middlewares/authMiddleware.js` — authenticate + requireRole
  - `src/controllers/authController.js` — login, logout, getMe
  - `src/routes/authRoutes.js` — auth endpoints
  - `src/config/seedUsers.js` — seed 2 users
- **Endpoints:**
  | Method | Endpoint | Access | Fungsi |
  |--------|----------|--------|--------|
  | POST | /api/auth/login | Public | Login → JWT token |
  | GET | /api/auth/me | Protected | Get current user |
  | POST | /api/auth/logout | Protected | Logout (stateless) |
- **Seed Accounts:**
  | Email | Role |
  |-------|------|
  | admin@lapis-ai.com | admin |
  | tech01@lapis-ai.com | technician |
- **Verified:** JWT valid 229 chars, 7d expiry, role RBAC confirmed

---

## FASE 4 — WebSocket Broadcast Engine ✅
**Tujuan:** Socket.IO server, channel per machine_id, global alert broadcast.

### Langkah 4.A — Socket.IO Implementation ✅
- **Tanggal:** 2026-05-07
- **Files Created/Modified:**
  - `src/websockets/socketManager.js` — Socket.IO singleton
  - `src/websockets/broadcastService.js` — broadcast methods
  - `src/app.js` — socketManager.initialize() on startup
  - `src/services/dispatcherService.js` — broadcast after dispatch
- **WebSocket Events:**
  | Event (Server → Client) | Channel | Trigger |
  |--------------------------|---------|---------|
  | sensor:update | machine:{id} | Setiap data IoT masuk |
  | alert:new | machine:{id} + global | Status kritis terdeteksi |
  | machine:status_update | global | Status mesin berubah |
- **Client Events (Client → Server):**
  | Event | Fungsi |
  |-------|--------|
  | join:machine | Subscribe ke room mesin tertentu |
  | leave:machine | Unsubscribe dari room mesin |
  | join:global | Subscribe ke channel alert global |
- **Verified:** Socket.IO polling handshake OK
  → sid generated, upgrades: websocket confirmed

---

## FASE 5 — ML Orchestration Layer ✅
**Tujuan:** Async ML prediction, cache hasil, Safety Margin Calculator,
Alert trigger otomatis.

### Langkah 5.A — ML Service, Safety Margin & Alert ✅
- **Tanggal:** 2026-05-08
- **Files Created:**
  - `src/config/migrate3.js` — extend ml_predictions table (4 kolom baru)
  - `src/services/mlService.js` — ML Engine caller + response parser
  - `src/services/safetyMarginService.js` — RUL → tanggal kalender
  - `src/services/alertService.js` — threshold check + broadcast + DB
- **Files Modified:**
  - `src/services/dispatcherService.js` — full 5-step pipeline
- **ML API Contract Applied:**
  - Endpoint: POST /api/ml/predict
  - Request field: sensor_readings (bukan features)
  - Response parsing: model_1_classifier + model_2_rul + metadata
  - health_score = probabilities.HEALTHY x 100
  - rul_days = Math.ceil(model_2_rul.rul_days)
- **Safety Margin Logic:**
  - Buffer = 20% dari RUL
  - safety_margin_date = scheduled_date - buffer
  - Priority: critical/high/normal berdasarkan classification + RUL
- **Alert Thresholds:**
  | Kondisi | Type | Severity |
  |---------|------|---------|
  | health <= 30 atau CRITICAL | health_critical | critical |
  | health <= 60 atau WARNING | health_warning | warning |
  | rul_days <= 7 | rul_critical | critical |
- **Circuit Breaker:** ML unavailable → warn log → skip → pipeline lanjut
- **Verified:** warn: ML Engine unavailable — skipping prediction ✅
- **Verified:** Pipeline complete tanpa crash saat ML tidak aktif ✅

---

## FASE 6 — Smart NLP Router & Live Context Injection ✅
**Tujuan:** Intent classifier middleware, context injection dari Redis
ke NLP payload, POST /api/nlp/chat endpoint.

### Langkah 6.A — NLP Router & Context Service ✅
- **Tanggal:** 2026-05-13
- **Files Created:**
  - `src/services/nlpContextService.js`
    — Redis context fetcher + regex machine ID extractor
  - `src/middlewares/nlpRouterMiddleware.js`
    — 3-layer rule-based intent classifier
  - `src/controllers/nlpController.js`
    — NLP Engine proxy, timeout 30s, fallback 503
  - `src/routes/nlpRoutes.js`
    — POST /api/nlp/chat + GET /api/nlp/health
- **Classification Rules:**
  | Layer | Trigger | Result |
  |-------|---------|--------|
  | 1 | explicit machine_id di body | machine_specific |
  | 2 | regex M-XX ditemukan di query | machine_specific |
  | 3 | keyword kontekstual + machine_id | machine_specific |
  | default | tidak ada sinyal | general |
- **NLP Request Payload:**
  - mode: "general" atau "machine_specific"
  - machine_ids: array mesin terdeteksi
  - live_context: snapshot Redis (null jika general)
- **Verified:**
  - general query → mode:general, context:none ✅
  - explicit machine_id → mode:machine_specific ✅
  - keyword "RUL" + "M-07" → mode:machine_specific ✅
  - NLP Engine down → 503 fallback tanpa crash ✅
- **Note:** context:none saat test normal — Redis kosong
  karena IoT data belum dijalankan via Replay Script.
  Saat Replay Script aktif, context injection otomatis bekerja.

---

## FASE 7 — Hardening, Auth & Integration Test ⏳
**Tujuan:** JWT auth, rate limiting, validasi payload, end-to-end test.

---

*Log ini diupdate setiap akhir fase oleh Backend Engineer.*