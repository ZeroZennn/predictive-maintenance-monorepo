# 🏭 PRIME
### Predictive Reliability & Intelligence Maintenance Engine

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?style=flat-square&logo=next.js&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)

> Platform pemantauan kondisi mesin berbasis AI yang mengintegrasikan prediksi hibrida ML/DL, asisten teknis RAG, dan penjadwalan maintenance otomatis dalam satu ekosistem industri terpadu.

---

## 📋 Daftar Isi

- [🔍 Tentang Proyek](#-tentang-proyek)
- [✨ Fitur Utama](#-fitur-utama)
- [🏗️ Arsitektur Sistem](#️-arsitektur-sistem)
- [🧩 Modul & Tech Stack](#-modul--tech-stack)
- [📁 Struktur Proyek](#-struktur-proyek)
- [🚀 Cara Menjalankan Proyek](#-cara-menjalankan-proyek)
- [📊 Model Performance](#-model-performance)
- [🤝 Tim Pengembang](#-tim-pengembang)
- [📄 Lisensi](#-lisensi)
- [📚 Referensi](#-referensi)

---

## 🔍 Tentang Proyek

### Latar Belakang

Era Industri 4.0 mendorong adopsi IoT sensor secara masif di lantai produksi — setiap mesin kini menghasilkan ribuan titik data per menit. Namun, volume data yang besar ini belum dimanfaatkan secara optimal: sebagian besar fasilitas manufaktur masih mengandalkan pendekatan *corrective maintenance* (perbaikan setelah kerusakan) atau *time-based maintenance* (jadwal tetap tanpa mempertimbangkan kondisi aktual mesin). Akibatnya, downtime mendadak dapat menekan produktivitas hingga **20–30%** dan memicu biaya perbaikan reaktif yang jauh lebih tinggi dibandingkan intervensi dini.

Penelitian terkini menunjukkan bahwa sistem prediktif yang ada umumnya bersifat *isolated* — model ML berjalan terpisah dari sistem operasional, tidak terhubung ke knowledge base SOP pabrik, dan tidak mampu menghasilkan rekomendasi tindakan secara otomatis. Gap ini menciptakan beban kognitif bagi teknisi lapangan yang harus menginterpretasikan angka prediksi secara manual dan menentukan langkah perbaikan sendiri.

PRIME hadir sebagai jawaban atas gap tersebut. Dibangun di atas arsitektur monorepo, PRIME mengintegrasikan **pipeline ML/DL hibrida** untuk prediksi kondisi mesin, **Retrieval-Augmented Generation (RAG)** sebagai asisten teknis berbasis SOP, dan **rule-based scheduler** untuk mengotomasi perencanaan maintenance — semuanya terhubung melalui satu backend terpusat dan visualisasi dashboard real-time.

### Tujuan Penelitian

- 🎯 Membangun sistem prediksi hibrida (ML + DL) untuk mengklasifikasikan status kesehatan mesin dan memprediksi Remaining Useful Life (RUL)
- 💬 Mengembangkan AI Copilot berbasis RAG yang mampu menjawab pertanyaan teknis berdasarkan dokumen SOP pabrik
- 📅 Merancang Rule-Based Maintenance Scheduler yang secara otomatis membuat jadwal kerja dari hasil prediksi kritis
- 📊 Membangun dashboard web real-time yang menyajikan telemetri sensor, status mesin, dan histori maintenance dalam satu tampilan terintegrasi

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🤖 **Health Status Classifier** | Model XGBoost mengklasifikasikan status mesin menjadi `HEALTHY`, `WARNING`, atau `CRITICAL` dari data sensor real-time (threshold optimal 0.60) |
| ⏱️ **RUL Predictor** | Model LSTM memprediksi Remaining Useful Life (sisa umur pakai) dalam satuan **hari** — hanya aktif ketika status `WARNING` atau `CRITICAL` |
| 📡 **Real-time Dashboard** | Dashboard Next.js dengan Socket.IO: 8 sensor gauge, health badge, RUL banner, anomaly timeline, dan maintenance scheduler update real-time |
| 🔔 **Smart Alert System** | Alert otomatis berdasarkan klasifikasi ML — severity `critical` hanya saat CRITICAL, `warning` saat WARNING (tidak tumpang-tindih) |
| 📅 **Maintenance Scheduler** | Auto-generate jadwal perawatan berdasarkan prediksi kritis — tampil di Triage Center Scheduler secara real-time via WebSocket |
| 💬 **AI Copilot (RAG)** | Asisten teknis cerdas berbasis dokumen SOP pabrik menggunakan Retrieval-Augmented Generation *(🔄 In Development)* |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRIME — System Architecture              │
└─────────────────────────────────────────────────────────────────┘

  [IoT Simulator / Sensor]
          │  POST /api/telemetry/ingest
          ▼
  ┌───────────────────┐
  │   Backend API     │  Node.js v24 + Express v5
  │   (Port 3000)     │  ── Auth (JWT + RBAC)
  └──────┬────────────┘  ── Socket.IO WebSocket Broadcast
         │                  ── Async ML Dispatcher
         │
         ├──────────────────────────────────────────┐
         │  POST /api/ml/predict                    │  POST /api/nlp/chat
         ▼                                          ▼
  ┌──────────────────┐                   ┌──────────────────────┐
  │   ML Service     │                   │   NLP / RAG Engine   │
  │   (Port 8000)    │                   │   (Port 8001)        │
  │  XGBoost V2      │                   │  🔄 In Development   │
  │  LSTM V2 (RUL)   │                   └──────────────────────┘
  └──────────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │         Data Layer                           │
  │  PostgreSQL  (port 5432) — users, machines   │
  │  TimescaleDB (port 5433) — sensor_readings,  │
  │               ml_predictions, alerts         │
  │  Redis       (port 6379) — prediction cache  │
  └──────────────────────────────────────────────┘
         │  Socket.IO push (sensor:update, alert:new, etc.)
         ▼
  ┌──────────────────┐
  │  Frontend        │  Next.js 15 + TypeScript
  │  Dashboard       │  Zustand + Socket.IO Client
  │  (Port 3001)     │  Recharts, Tailwind CSS
  └──────────────────┘
```

**Komponen Utama:**

| Komponen | Peran |
|---|---|
| **Backend API** | Orkestrasi pusat — menerima data sensor, mendispatch ke ML/NLP, menyimpan ke DB, dan menyiarkan update real-time via Socket.IO |
| **ML Service** | Microservice FastAPI (Python) yang menjalankan XGBoost (classifier) dan LSTM (RUL predictor) secara cascade |
| **NLP Engine** | Microservice RAG yang mengindeks dokumen SOP dan merespons query teknis *(In Development)* |
| **Frontend Dashboard** | Interface Next.js untuk visualisasi telemetri, status mesin, jadwal maintenance, dan akses AI Copilot |

---

## 🧩 Modul & Tech Stack

### 🤖 Machine Learning Engine (Zikran)

Status: ✅ **Production Ready**

| Layer | Teknologi |
|---|---|
| Runtime | Python 3.10+ |
| Core | pandas, numpy, scikit-learn |
| Classical ML | XGBoost V2 |
| Deep Learning | TensorFlow 2.15.0, Keras (LSTM) |
| ML Service | FastAPI, Uvicorn, Pydantic |
| Container | Docker (`Dockerfile.ml`), `lapis-ml-service` |

**Model yang di-deploy:**

| Artefak | Deskripsi |
|---|---|
| `classifier_final.pkl` | XGBoost V2 — Health Status Classifier (threshold 0.60) |
| `rul_predictor_final.h5` | LSTM V2 — RUL Predictor (SEQ_LEN=24, 69 fitur) |
| `preprocessing_pipeline.pkl` | sklearn Pipeline (FeatureEngineeringTransformer + StandardScaler) |

📖 Detail lengkap → [`machine_learning/README_ML.md`](./machine_learning/README_ML.md)

---

### 🖥️ Backend Service (Reynaldi)

Status: ✅ **Active — Fase 7/9**

| Layer | Teknologi |
|---|---|
| Runtime | Node.js v24 + Express v5 |
| Real-time | Socket.IO v4 |
| Cache | Redis 7 (TTL 15 menit, key: `machine:{id}:prediction`) |
| Relational DB | PostgreSQL 15 (users, machines, schedules, alerts) |
| Time-Series DB | TimescaleDB on PostgreSQL 15 (sensor_readings, ml_predictions) |
| Auth | JWT + bcryptjs + RBAC (ADMIN / TECHNICIAN) |
| Container | Docker + Docker Compose |

**Endpoint Utama:**

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/auth/login` | Autentikasi user → JWT token |
| `GET` | `/health` | Health check Backend |
| `POST` | `/api/telemetry/ingest` | Ingest data sensor dari IoT/Simulator |
| `POST` | `/api/simulator/start` | Mulai simulasi data historis |
| `POST` | `/api/simulator/stop` | Hentikan simulasi |
| `GET` | `/api/simulator/status` | Cek status simulator |
| `GET` | `/api/telemetry/history/:machine_id` | Riwayat sensor (chart) |
| `GET` | `/api/telemetry/anomaly/:machine_id` | Anomaly timeline dari DB |
| `GET` | `/api/maintenance/schedules` | Daftar jadwal maintenance |
| `GET` | `/api/maintenance/kpis/:machine_id` | KPI maintenance per mesin |
| `POST` | `/api/nlp/chat` | Query AI Copilot |
| `GET` | `/api/admin/users` | Manajemen user (Admin only) |

**WebSocket Events (Socket.IO):**

| Event | Arah | Channel | Keterangan |
|---|---|---|---|
| `sensor:update` | Server → Client | `machine:{id}` | Data sensor + prediksi ML per tick |
| `alert:new` | Server → Client | `global` + `machine:{id}` | Alert WARNING/CRITICAL |
| `machine:status_update` | Server → Client | `global` | Status change mesin |
| `new_maintenance_task` | Server → Client | `global` | Jadwal baru dari prediksi kritis |
| `simulator:tick` | Server → Client | `simulator` | Progress replay simulator |

📖 Detail lengkap → [`backend/README_BACKEND.md`](./backend/README_BACKEND.md)

---

### 💬 NLP / RAG Engine (Aqsa)

Status: 🔄 **In Development**

> Modul ini akan mengimplementasikan Retrieval-Augmented Generation untuk menjawab pertanyaan teknis berbasis dokumen SOP pabrik. Backend sudah menyediakan proxy endpoint `/api/nlp/chat` dan `/api/nlp/health` yang siap dikoneksi.

---

### 📊 Frontend Dashboard (Amir)

Status: ✅ **Active — System Integrated**

| Layer | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + Custom Design System |
| State Management | Zustand (machineStore, maintenanceStore, toastStore) |
| Real-time | Socket.IO Client via ws-manager.ts |
| Charting | Recharts (LineChart telemetry, gauge sensor) |
| Animation | CSS animate-pulse + custom keyframes |
| UI Features | Custom modals, global toast alerts, reactive scheduler |

---

## 📁 Struktur Proyek

```
predictive-maintenance-monorepo/
│
├── backend/                          # Backend API & Orchestration (Reynaldi)
│   ├── src/
│   │   ├── config/                   # DB connections (postgres, timescale, redis)
│   │   │   ├── migrate.js            # Migration 1: tables dasar
│   │   │   ├── migrate2.js           # Migration 2: maintenance_schedules, alerts
│   │   │   ├── migrate3.js           # Migration 3: documents, logs
│   │   │   ├── migrate4.js           # Migration 4: indexes & constraints
│   │   │   ├── migrate5.js           # Migration 5: enhancements
│   │   │   ├── migrate6.js           # Migration 6: rul_days NUMERIC fix
│   │   │   ├── migrate7.js           # Migration 7: enum uppercase & rul_days NULL fix
│   │   │   └── seedUsers.js          # Seed admin & technician accounts
│   │   ├── controllers/              # Request handlers (telemetry, maintenance, etc.)
│   │   ├── middlewares/              # authMiddleware.js (JWT + RBAC + SKIP_AUTH)
│   │   ├── routes/                   # apiRoutes.js, authRoutes.js
│   │   ├── services/                 # mlService, alertService, safetyMarginService, etc.
│   │   └── websockets/               # socketManager.js, broadcastService.js
│   ├── .env                          # Environment variables Backend
│   ├── DATABASE_SCHEMA.md            # Skema database lengkap
│   └── package.json
│
├── machine_learning/                 # ML Engine (Zikran)
│   ├── notebooks/                    # Jupyter Notebooks (fase 1–10)
│   ├── src/                          # Production Python scripts
│   │   ├── app.py                    # FastAPI ML Service entry point
│   │   ├── inference.py              # Fungsi predict() utama
│   │   └── preprocessing_pipeline.py # FeatureEngineeringTransformer
│   ├── models/
│   │   └── final/                    # Artefak model siap deploy
│   │       ├── classifier_final.pkl
│   │       ├── rul_predictor_final.h5
│   │       └── preprocessing_pipeline.pkl
│   ├── Dockerfile.ml
│   └── requirements.txt
│
├── frontend/                         # Next.js Dashboard (Amir)
│   ├── src/
│   │   ├── app/                      # Next.js App Router pages
│   │   │   └── (app)/
│   │   │       ├── dashboard/        # Halaman monitoring utama
│   │   │       ├── scheduler/        # Maintenance scheduler & calendar
│   │   │       ├── debug/            # WebSocket stream debugger / Logs
│   │   │       ├── copilot-hub/      # AI Copilot interface
│   │   │       └── admin/            # Admin Panel & Role-based routes
│   │   ├── components/               # UI components per fitur
│   │   │   ├── dashboard/            # SensorCard, TelemetryChart, AnomalyTimeline, etc.
│   │   │   ├── scheduler/            # CalendarView, TaskDetailCard, SchedulerModals
│   │   │   ├── layout/               # IconNavBar, sidebar
│   │   │   └── providers/            # WebSocketInitializer (global WS lifecycle)
│   │   ├── hooks/                    # useWebSocketInit, useMaintenanceSocket, etc.
│   │   ├── stores/                   # Zustand stores (machine, maintenance, toast, etc.)
│   │   ├── lib/
│   │   │   ├── api/                  # Axios API clients (telemetry, maintenance, admin, dll)
│   │   │   └── websocket/            # ws-manager.ts, ws-events.ts
│   │   ├── types/                    # TypeScript types (machine, maintenance, sensors)
│   │   └── config/                   # MACHINE_IDS, SENSOR_CONFIG, ROUTES
│   ├── .env.local                    # Frontend env (BACKEND_URL, SKIP_AUTH, MOCK_ROLE)
│   └── package.json
│
├── history_docs/                     # Arsip laporan & dokumentasi progres proyek
├── docker-compose.yml                # Orkestrasi infrastructure services
├── .env.example                      # Template environment variables
├── INTEGRATION_DASHBOARD_CHECKLIST.md  # Checklist integrasi E2E
├── INTEGRATION_DASHBOARD_BACKLOG.md    # Backlog & progress tracker
└── README.md                         # ← Anda di sini
```

> **Catatan:** Folder `nlp/` untuk NLP/RAG Engine akan ditambahkan seiring perkembangan modul tersebut.

---

## 🚀 Cara Menjalankan Proyek

### Prerequisites

| Tool | Versi Minimum | Keterangan |
|---|---|---|
| Python | 3.10+ | Untuk ML Service |
| Node.js | v18.x LTS | Untuk Backend & Frontend |
| npm | v9.x | Package manager Node |
| Docker Desktop | v24.x | Wajib aktif untuk infrastructure |
| Docker Compose | v2.x | Sudah include di Docker Desktop |
| Git | v2.x | Version control |

---

### ⚡ Menjalankan untuk Development (Recommended)

> Catatan: Mode development menjalankan infrastructure di Docker, lalu Backend & Frontend secara lokal (bukan di Docker) agar *hot reload* berjalan.

#### Langkah 1 — Clone & Setup Environment

```bash
git clone https://github.com/ZeroZennn/predictive-maintenance-monorepo.git
cd predictive-maintenance-monorepo

# Copy dan isi environment variables
cp .env.example backend/.env
# Edit backend/.env dan sesuaikan kredensial jika perlu
```

#### Langkah 2 — Start Infrastructure (Docker)

```bash
# Start PostgreSQL, TimescaleDB, Redis, dan ML Service
docker compose up postgres timescaledb redis ml-service -d

# Verifikasi semua container healthy
docker compose ps
# Expected: lapis_postgres, lapis_timescaledb, lapis_redis, lapis-ml-service → running/healthy

# Tunggu ML Service selesai load model (~90 detik)
docker logs lapis-ml-service --tail 20
# Expected: "models ready" atau "Model loaded successfully"
```

#### Langkah 3 — Jalankan Database Migrations

```bash
cd backend
npm install

# Jalankan semua 7 migration files secara berurutan
node src/config/migrate.js
node src/config/migrate2.js
node src/config/migrate3.js
node src/config/migrate4.js
node src/config/migrate5.js
node src/config/migrate6.js
node src/config/migrate7.js

# Seed akun default
node src/config/seedUsers.js
```

#### Langkah 4 — Start Backend

```bash
# Masih di folder backend/
npm run dev

# Expected output: "Server running on port 3000"
# Verifikasi: curl http://localhost:3000/health
```

#### Langkah 5 — Start Frontend

```bash
cd ../frontend
npm install
npm run dev

# Expected output: "Ready on http://localhost:3001"
# Buka: http://localhost:3001
```

#### Langkah 6 — Verifikasi Sistem

```bash
# Backend health
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"lapis-backend"}

# ML Service health
curl http://localhost:8000/health
# Expected: {"status":"healthy","models":{...}}
```

---

### 🔄 Menjalankan Ulang (Setelah Restart Komputer)

```bash
# 1. Pastikan Docker Desktop sudah jalan (tunggu ikon stabil)

# 2. Start infrastructure
docker compose up postgres timescaledb redis ml-service -d

# 3. Verifikasi semua healthy
docker compose ps

# 4. Tunggu ML Service siap (~90 detik), cek log:
docker logs lapis-ml-service --tail 10

# 5. Terminal 1 — Backend
cd backend && npm run dev

# 6. Terminal 2 — Frontend
cd frontend && npm run dev

# 7. Buka browser: http://localhost:3001
```

---

### ▶️ Menjalankan Simulator Data

Simulator memutar ulang data historis (Juli 2025) seolah-olah data tersebut baru masuk secara real-time.

```bash
# Login dan simpan token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Start simulator (tick setiap 2 detik)
curl -X POST http://localhost:3000/api/simulator/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-07-23T18:00:00","tick_interval_seconds":2}'

# Cek status
curl http://localhost:3000/api/simulator/status \
  -H "Authorization: Bearer $TOKEN"

# Stop simulator
curl -X POST http://localhost:3000/api/simulator/stop \
  -H "Authorization: Bearer $TOKEN"
```

---

### 🔑 Akun Default (Development Only)

| Email | Password | Role |
|---|---|---|
| admin@lapis-ai.com | Admin@Lapis123 | ADMIN |
| tech01@lapis-ai.com | Tech@Lapis123 | TECHNICIAN |

> ⚠️ **Dev Mode:** Frontend dikonfigurasi dengan `NEXT_PUBLIC_SKIP_AUTH=true` dan `NEXT_PUBLIC_MOCK_ROLE=TECHNICIAN` di `.env.local` sehingga halaman bisa diakses tanpa login. Backend juga memiliki `SKIP_AUTH=true` di `backend/.env` agar API tidak terblokir auth saat development. **Nonaktifkan kedua flag ini sebelum production.**

---

### 🐳 Port Reference

| Service | Port Host | Container |
|---|---|---|
| Backend API (Node.js) | 3000 | — |
| ML Service (FastAPI) | 8000 | lapis-ml-service |
| Frontend (Next.js) | 3001 | — |
| PostgreSQL | 5432 | lapis_postgres |
| TimescaleDB | 5433 | lapis_timescaledb |
| Redis | 6379 | lapis_redis |

---

## 📊 Model Performance

Hasil evaluasi model pada test set (data tidak digunakan selama training):

### Model 1 — Health Status Classifier (XGBoost V2)

| Metric | Score |
|---|---|
| Threshold (WARNING) | 0.60 *(dikunci, bukan default 0.50)* |
| Prediksi | `HEALTHY` (0) · `WARNING` (1) · `CRITICAL` (2) |
| Akurasi Eskalasi | HEALTHY→WARNING T-47h, WARNING→CRITICAL T-34h (verified M-06) |

### Model 2 — RUL Predictor (LSTM V2)

| Parameter | Nilai |
|---|---|
| Input Shape | 24 timestep × 69 fitur (`SEQ_LEN = 24`) |
| Output | RUL dalam satuan **hari** (float, contoh: 1.59) |
| Aktivasi | Hanya aktif jika status `WARNING` atau `CRITICAL` |
| Error saat CRITICAL | ≤ 0.05 hari (verified) |

> Sistem menggunakan **Cascaded Prediction**: Classifier berjalan pertama, RUL Predictor hanya dijalankan jika diperlukan — mengoptimalkan latensi inferensi.

📖 Detail metrik evaluasi lengkap → [`machine_learning/PROJECT_LOG.md`](./machine_learning/PROJECT_LOG.md)

---

## 🤝 Tim Pengembang

| Role | Nama | Modul | Status |
|---|---|---|---|
| 🤖 ML Engineer | **Zikran** | Machine Learning Engine | ✅ Production Ready |
| 🖥️ Backend Engineer | **Reynaldi** | Backend Service & Orchestration | ✅ Active |
| 💬 NLP Engineer | **Aqsa** | RAG & Knowledge Base | 🔄 In Development |
| 📊 Frontend Engineer | **Amir** | Dashboard & UI | ✅ System Integrated |

---

## 📄 Lisensi

MIT License — lihat file [LICENSE](./LICENSE) untuk detail.

---

## 📚 Referensi

- **Li, Z. & Li, Y. (2025).** *Intelligent Predictive Maintenance Systems for Industrial IoT: A Survey of Hybrid ML/DL Approaches.* — Referensi utama arsitektur sistem prediktif hibrida.
- **McKinsey Global Institute.** *Manufacturing's next act.* — Statistik dampak downtime (20–30% productivity loss).
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [TensorFlow / Keras LSTM Guide](https://www.tensorflow.org/guide/keras/rnn)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

*README ini merupakan **living document** yang diperbarui seiring perkembangan setiap modul. Untuk status integrasi terkini, lihat [`INTEGRATION_DASHBOARD_CHECKLIST.md`](./INTEGRATION_DASHBOARD_CHECKLIST.md) dan [`INTEGRATION_DASHBOARD_BACKLOG.md`](./INTEGRATION_DASHBOARD_BACKLOG.md).*
