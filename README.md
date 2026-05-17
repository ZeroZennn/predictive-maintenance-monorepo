# 🏭 PRIME
### Predictive Reliability & Intelligence Maintenance Engine

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?style=flat-square&logo=fastapi&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.x-189ABF?style=flat-square&logo=xgboost&logoColor=white)
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
| 🤖 **Health Status Classifier** | Model XGBoost V2 mengklasifikasikan status mesin menjadi `HEALTHY`, `WARNING`, atau `CRITICAL` dari data sensor real-time dengan threshold optimal di 0.60 |
| ⏱️ **RUL Predictor** | Model LSTM V2 memprediksi Remaining Useful Life (sisa umur pakai) dalam satuan **hari** — hanya aktif ketika status mesin `WARNING` atau `CRITICAL` |
| 💬 **AI Copilot (RAG)** | Asisten teknis cerdas yang menjawab pertanyaan berbasis dokumen SOP pabrik menggunakan Retrieval-Augmented Generation, diakses melalui endpoint `/api/nlp/chat` |
| 📅 **Maintenance Scheduler** | Sistem penjadwalan otomatis berbasis aturan yang menghasilkan work order maintenance berdasarkan output prediksi kritis dari ML Engine |

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
  │   Backend API     │  Node.js + Express v5
  │   (Port 3000)     │  ── Auth (JWT + RBAC)
  └──────┬────────────┘  ── WebSocket Broadcast
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
  │  PostgreSQL (users, machines, schedules)     │
  │  TimescaleDB (sensor_readings, predictions)  │
  │  Redis (cache TTL 15 menit)                  │
  └──────────────────────────────────────────────┘
         │  WebSocket push
         ▼
  ┌──────────────────┐
  │  Frontend        │
  │  Dashboard       │  Next.js
  │  (Port 3001)     │  🔄 In Development
  └──────────────────┘
```

**Komponen Utama:**

| Komponen | Peran |
|---|---|
| **Backend API** | Orkestrasi pusat — menerima data sensor, mendispatch ke ML/NLP, menyimpan ke DB, dan menyiarkan update real-time via WebSocket |
| **ML Service** | Microservice FastAPI yang menjalankan model XGBoost (classifier) dan LSTM (RUL predictor) secara cascade |
| **NLP Engine** | Microservice RAG yang mengindeks dokumen SOP dan merespons query teknis dalam bahasa alami |
| **Frontend Dashboard** | Interface Next.js untuk visualisasi telemetri, status mesin, jadwal maintenance, dan akses AI Copilot |

---

## 🧩 Modul & Tech Stack

### 🤖 Machine Learning Engine (Role A — Zikran)

Status: ✅ **Production Ready**

| Layer | Teknologi |
|---|---|
| Runtime | Python 3.10+ |
| Core | pandas, numpy, scikit-learn |
| Classical ML | XGBoost, LightGBM |
| Deep Learning | TensorFlow, Keras (LSTM, GRU) |
| ML Service | FastAPI, Uvicorn, Pydantic |
| Container | Docker (`Dockerfile.ml`) |

**Model yang di-deploy:**

| Artefak | Deskripsi |
|---|---|
| `classifier_final.pkl` | XGBoost V2 — Health Status Classifier (threshold 0.60) |
| `rul_predictor_final.keras` | LSTM V2 — RUL Predictor (SEQ_LEN=24, 69 fitur) |
| `preprocessing_pipeline.pkl` | sklearn Pipeline (FeatureEngineeringTransformer + StandardScaler) |

📖 Detail lengkap → [`machine_learning/README_ML.md`](./machine_learning/README_ML.md)

---

### 🖥️ Backend Service (Role C — Reynaldi)

Status: ✅ **Fase 7 / 9 Completed**

| Layer | Teknologi |
|---|---|
| Runtime | Node.js v24 + Express v5 |
| Real-time | Socket.IO v4 (WebSocket) |
| Cache | Redis 7 |
| Relational DB | PostgreSQL 15 |
| Time-Series DB | TimescaleDB (PostgreSQL extension) |
| Auth | JWT + bcryptjs |
| Container | Docker + Docker Compose |

**Endpoint Utama:**

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/auth/login` | Autentikasi user → JWT token |
| `POST` | `/api/telemetry/ingest` | Ingest data sensor dari IoT |
| `POST` | `/api/nlp/chat` | Query AI Copilot |
| `GET` | `/api/admin/users` | Manajemen user (Admin only) |
| `POST` | `/api/admin/documents/upload` | Upload dokumen SOP untuk RAG |

📖 Detail lengkap → [`backend/README_BACKEND.md`](./backend/README_BACKEND.md)

---

### 💬 NLP / RAG Engine (Role B — Aqsa)

Status: 🔄 **In Development**

| Layer | Teknologi |
|---|---|
| Framework | *[akan diupdate]* |
| Embedding | *[akan diupdate]* |
| Vector Store | *[akan diupdate]* |
| LLM | *[akan diupdate]* |

> Modul ini akan mengimplementasikan Retrieval-Augmented Generation untuk menjawab pertanyaan teknis berbasis dokumen SOP pabrik. Backend sudah menyediakan proxy endpoint `/api/nlp/chat` dan `/api/nlp/health` yang siap dikoneksi.

---

### 📊 Frontend Dashboard (Role D — Amir)

Status: 🔄 **In Development**

| Layer | Teknologi |
|---|---|
| Framework | Next.js (TypeScript) |
| Styling | *[akan diupdate]* |
| State Management | *[akan diupdate]* |
| Charting | *[akan diupdate]* |

> Dashboard akan menyajikan visualisasi telemetri real-time via WebSocket, status kondisi mesin, histori prediksi ML, jadwal maintenance, dan antarmuka AI Copilot.

---

## 📁 Struktur Proyek

```
predictive-maintenance-monorepo/
│
├── backend/                          # Backend API & Orchestration (Role C)
│   ├── src/
│   │   ├── config/                   # DB connections, migrations, logger
│   │   ├── controllers/              # Request handlers
│   │   ├── middlewares/              # Auth guard, NLP router
│   │   ├── routes/                   # Endpoint definitions
│   │   ├── services/                 # Business logic & ML dispatcher
│   │   └── websockets/               # Socket.IO broadcast manager
│   ├── DATABASE_SCHEMA.md            # Skema database lengkap
│   ├── HISTORY_LOG.md                # Log progres per fase
│   └── package.json
│
├── machine_learning/                 # ML Engine (Role A)
│   ├── notebooks/                    # Jupyter Notebooks (fase 1–10)
│   │   ├── fase_1_ingestion/
│   │   ├── fase_4_feature_engineering/
│   │   └── fase_10_export/           # Final model export
│   ├── src/                          # Production-ready Python scripts
│   │   ├── app.py                    # FastAPI ML Service entry point
│   │   ├── inference.py              # Fungsi predict() utama
│   │   └── preprocessing_pipeline.py # FeatureEngineeringTransformer
│   ├── models/
│   │   └── final/                    # Artefak model siap deploy
│   ├── api_contract_final_v1.json    # Kontrak API ML ↔ Backend
│   ├── Dockerfile.ml
│   └── requirements.txt
│
├── frontend/                         # Next.js Dashboard (Role D) 🔄
│   ├── src/
│   └── public/
│
├── docker-compose.yml                # Orkestrasi semua service
├── .env.example                      # Template environment variables
├── requirements.txt                  # Root-level Python dependencies
└── README.md                         # ← Anda di sini
```

> **Catatan:** Folder `nlp/` untuk NLP/RAG Engine (Role B) akan ditambahkan seiring perkembangan modul tersebut.

---

## 🚀 Cara Menjalankan Proyek

### Prerequisites

| Tool | Versi Minimum | Keterangan |
|---|---|---|
| Python | 3.10+ | Untuk ML Service |
| Node.js | v18.x LTS | Untuk Backend & Frontend |
| npm | v9.x | Package manager Node |
| Docker | v24.x | Container runtime |
| Docker Compose | v2.x | Service orchestration |
| Git | v2.x | Version control |

---

### ⚡ Quick Start (Docker — Recommended)

```bash
# 1. Clone repository
git clone https://github.com/ZeroZennn/predictive-maintenance-monorepo.git
cd predictive-maintenance-monorepo

# 2. Setup environment variables
cp .env.example .env
# Edit .env dan isi nilai berikut:
# POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET, INTERNAL_API_KEY

# 3. Jalankan semua service
docker compose up -d

# 4. Verifikasi semua container berjalan
docker compose ps

# 5. Akses aplikasi
# Backend API : http://localhost:3000/api
# ML Service  : http://localhost:8000/docs
# Dashboard   : http://localhost:3001
```

---

### 🔧 Manual Setup per Modul

Untuk pengembangan lokal per modul, ikuti panduan masing-masing:

#### Backend Service

```bash
cd backend
npm install

# Jalankan database migrations
node src/config/migrate.js
node src/config/migrate2.js
node src/config/migrate3.js
node src/config/migrate4.js

# Seed akun default
node src/config/seedUsers.js

# Jalankan server (development)
npm run dev
```

📖 Panduan lengkap → [Backend Setup](./backend/README_BACKEND.md)

#### ML Engine

```bash
cd machine_learning

# Buat virtual environment
python -m venv venv

# Aktivasi (Windows)
venv\Scripts\activate
# Aktivasi (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Jalankan ML Service
uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 1
```

> ⚠️ `--workers 1` wajib — model LSTM tidak thread-safe untuk multi-worker.

📖 Panduan lengkap → [ML Engine Setup](./machine_learning/README_ML.md)

#### NLP Engine
🔄 *Coming Soon — panduan akan ditambahkan setelah modul selesai*

#### Frontend Dashboard
🔄 *Coming Soon — panduan akan ditambahkan setelah modul selesai*

---

### 🔑 Akun Default (Development Only)

| Email | Password | Role |
|---|---|---|
| admin@lapis-ai.com | Admin@Lapis123 | admin |
| tech01@lapis-ai.com | Tech@Lapis123 | technician |

> ⚠️ **Ganti semua password sebelum deploy ke production.**

---

## 📊 Model Performance

Hasil evaluasi model pada test set (data yang tidak digunakan selama training):

### Model 1 — Health Status Classifier (XGBoost V2)

| Metric | Score |
|---|---|
| Threshold (WARNING) | 0.60 *(dikunci, bukan default 0.50)* |
| Prediksi | `HEALTHY` (0) · `WARNING` (1) · `CRITICAL` (2) |

### Model 2 — RUL Predictor (LSTM V2)

| Parameter | Nilai |
|---|---|
| Input Shape | 24 timestep × 69 fitur (`SEQ_LEN = 24`) |
| Output | RUL dalam satuan **hari** |
| Aktivasi | Hanya aktif jika status `WARNING` atau `CRITICAL` |

> Sistem menggunakan **Cascaded Prediction**: Classifier berjalan pertama, RUL Predictor hanya dijalankan jika diperlukan — mengoptimalkan latensi inferensi secara signifikan.

📖 Detail metrik evaluasi lengkap → [`machine_learning/PROJECT_LOG.md`](./machine_learning/PROJECT_LOG.md)

---

## 🤝 Tim Pengembang

| Role | Nama | Modul | Status |
|---|---|---|---|
| 🤖 ML Engineer | **Zikran** | Machine Learning Engine | ✅ Production Ready |
| 🖥️ Backend Engineer | **Reynaldi** | Backend Service & Orchestration | ✅ Fase 7/9 |
| 💬 NLP Engineer | **Aqsa** | RAG & Knowledge Base | 🔄 In Development |
| 📊 Frontend Engineer | **Amir** | Dashboard & UI | 🔄 In Development |

---

## 📄 Lisensi

MIT License — lihat file [LICENSE](./LICENSE) untuk detail.

---

## 📚 Referensi

- **Li, Z. & Li, Y. (2025).** *Intelligent Predictive Maintenance Systems for Industrial IoT: A Survey of Hybrid ML/DL Approaches.* — Referensi utama arsitektur sistem prediktif hibrida yang menjadi landasan desain PRIME.
- **McKinsey Global Institute.** *Manufacturing's next act.* — Statistik dampak downtime terhadap produktivitas industri manufaktur (20–30% productivity loss).
- [FastAPI Documentation](https://fastapi.tiangolo.com/) — Framework ML Service
- [TimescaleDB Documentation](https://docs.timescale.com/) — Time-series database untuk sensor telemetry
- [XGBoost Documentation](https://xgboost.readthedocs.io/) — Gradient Boosted Trees classifier
- [TensorFlow / Keras LSTM Guide](https://www.tensorflow.org/guide/keras/rnn) — Deep learning model untuk RUL prediction
- [Socket.IO Documentation](https://socket.io/docs/) — Real-time WebSocket communication

---

*README ini merupakan **living document** yang akan diperbarui seiring perkembangan setiap modul. Untuk pertanyaan teknis atau laporan bug, silakan buka Issue di GitHub dan mention engineer yang relevan.*
