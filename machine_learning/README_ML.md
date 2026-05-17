# Lapis AI — Machine Learning Module

Dokumen ini merupakan panduan utama bagi Engineer (terutama Backend) atau anggota tim lain yang akan mengintegrasikan, menjalankan, atau mengembangkan *machine learning pipeline* dari proyek Lapis AI.

---

## 🛠️ Tech Stack & Persyaratan Sistem

- **Python**: Versi `3.10` atau lebih baru
- **Core Libraries**: `pandas`, `numpy`, `scikit-learn`
- **Machine Learning**: `xgboost`, `lightgbm`
- **Deep Learning**: `tensorflow`, `h5py`
- **ML Service (HTTP)**: `fastapi`, `uvicorn`, `pydantic`

---

## 🚀 Panduan Setup & Instalasi (Local Development)

Jika Anda baru melakukan `git pull`, ikuti langkah ini untuk mengatur *environment* ML di mesin lokal Anda:

### 1. Masuk ke direktori Machine Learning
```bash
cd machine_learning
```

### 2. Buat Virtual Environment
Disarankan untuk selalu menggunakan virtual environment agar *dependencies* tidak konflik dengan sistem OS Anda.
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 📂 Struktur Direktori

Berikut adalah penjelasan fungsi setiap folder agar Anda tidak tersesat:

```text
machine_learning/
├── data/                        # Folder HANYA UNTUK LOKAL (di-ignore oleh git)
│   ├── raw/                     # Data mentah (sensor_readings.csv, dll)
│   ├── interim/                 # Data sementara hasil pemrosesan awal
│   └── processed/               # Data siap training (parquet/csv)
│
├── models/                      # Folder penyimpanan artefak model
│   ├── ml_track/                # Model klasik (Random Forest, XGBoost, scaler)
│   ├── dl_track/                # Model Deep Learning (LSTM, GRU)
│   └── final/                   # Artifacts FINAL untuk deployment
│       ├── preprocessing_pipeline.pkl     # sklearn Pipeline (transformer + scaler)
│       ├── classifier_final.pkl           # XGBoost V2 + threshold 0.60
│       ├── rul_predictor_final.keras      # LSTM V2 RUL predictor
│       ├── scaler_final.pkl               # StandardScaler (standalone)
│       ├── classifier_model_card.json     # Metadata & constraints Model 1
│       ├── rul_predictor_model_card.json  # Metadata & constraints Model 2
│       └── MANIFEST.json                  # Daftar semua file + ukuran
│
├── notebooks/                   # Jupyter Notebooks eksperimen & riset
│   ├── 00_environment_check.ipynb
│   ├── fase_1_ingestion/
│   ├── fase_2_eda/
│   ├── fase_3_label_engineering/
│   ├── fase_4_feature_engineering/
│   ├── fase_5_preprocessing/
│   ├── fase_6_imbalance/
│   ├── fase_7_splitting/
│   ├── fase_8_modeling/
│   ├── fase_9_evaluation/
│   └── fase_10_export/
│
├── src/                         # Script Python production-ready
│   ├── utils/
│   │   └── feature_engineering.py       # Pure functions, importable independen
│   ├── config.py                        # PATH & konstanta global (GLOBAL_SEED, dll)
│   ├── preprocessing_pipeline.py        # FeatureEngineeringTransformer (portable pkl)
│   ├── inference.py                     # Entry point prediksi — fungsi predict()
│   └── app.py                           # FastAPI HTTP wrapper — ML Service
│
├── api_contract_final_v1.json           # Kontrak API resmi ML ↔ Backend (v1.0-final)
├── gauge_thresholds.json                # P90/P95 threshold per sensor untuk Frontend
├── gauge_thresholds_validated.json      # Threshold tervalidasi + overlap analysis
├── Dockerfile.ml                        # Container definition ML Service
├── docker-compose.ml-snippet.yml        # Snippet docker-compose untuk Backend Engineer
├── requirements.txt                     # Daftar library Python
├── PROJECT_LOG.md                       # Log keputusan arsitektur & evaluasi model
└── TASK_CHECKLIST_ROLE_A.md            # Checklist progres ML Engineer
```

---

## 🐳 Menjalankan ML Service (HTTP)

ML Service dapat dijalankan sebagai HTTP server yang menerima request dari Backend:

### Local (tanpa Docker)
```bash
# Dari dalam folder machine_learning/
uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 1
```

### Dengan Docker
```bash
# Build image
docker build -f Dockerfile.ml -t lapis-ml-service .

# Run container
docker run -p 8000:8000 lapis-ml-service
```

### Endpoint yang tersedia
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Health check — returns `{"status": "healthy"}` |
| `POST` | `/api/ml/predict` | Prediksi utama (lihat API Contract) |

> ⚠️ **workers=1 wajib** — LSTM tidak thread-safe untuk multi-worker.

---

## ⛔ ATURAN GIT (PENTING!)

Repositori ini telah dikonfigurasi melalui `.gitignore` di tingkat *root* monorepo. HARAP PATUHI ATURAN BERIKUT:

1. **JANGAN PERNAH MENG-COMMIT FOLDER `data/`**
   - Data mentah bisa berukuran ratusan MB atau GB.
   - Meng-commit data akan membuat *repository bloat* dan berpotensi melanggar *data privacy*.
   - Minta file CSV mentah secara langsung kepada Lead ML / Data Engineer jika Anda perlu melakukan *testing* lokal.

2. **JANGAN MENG-COMMIT ARTEFAK MODEL (`*.pkl`, `*.h5`, `*.keras`)**
   - Kecuali disepakati bersama (misal: hanya model di folder `models/final/` yang ukurannya masuk akal).
   - Pengiriman model dari lingkungan ML ke Backend Production disarankan menggunakan Cloud Storage (S3/GCS) atau Git LFS.

3. **JANGAN MENG-COMMIT `.env`**
   - Semua variabel lingkungan atau API Keys lokal tidak boleh didorong ke GitHub.

---

## 🧠 Integrasi Backend (API Contract)

Sistem Lapis AI menggunakan **Cascaded Prediction System** (Dua lapis model):

1. **Model 1 (Classifier — XGBoost V2):**
   - Mengambil data raw sensor dari Backend.
   - Memprediksi status mesin: `HEALTHY` (0), `WARNING` (1), atau `CRITICAL` (2).
   - **PENTING:** WARNING threshold dikunci di `0.60` (bukan default 0.50).
   - Backend **tidak perlu** menerapkan threshold — sudah diterapkan di ML Service.

2. **Model 2 (RUL Predictor — LSTM V2):**
   - **HANYA BERJALAN** jika output Model 1 adalah `WARNING` atau `CRITICAL`.
   - Input sequence 24 timestep × 69 fitur (`SEQ_LEN = 24`).
   - Memprediksi Sisa Umur Pakai (RUL) dalam satuan **hari**.
   - Jika `is_active = false`, semua field RUL bernilai `null`.

Silakan merujuk ke file **`api_contract_final_v1.json`** di dalam folder ini untuk skema *Request* dan *Response* lengkap.

---

## 📊 Gauge Threshold (untuk Frontend)

File `gauge_thresholds_validated.json` berisi threshold P90/P95 per sensor yang telah divalidasi untuk visualisasi gauge di Frontend:

```json
{
  "sensors": {
    "temperature": {
      "warning_p90": 76.30,
      "critical_recommended": 81.20,
      "zone_healthy": "< 76.3",
      "zone_warning": "76.3 – 81.2",
      "zone_critical": ">= 81.2"
    }
  }
}
```

Threshold dihitung dari distribusi **HEALTHY rows only** (P90) dan divalidasi terhadap **P10 CRITICAL** untuk memastikan tidak ada overlap antar zona.

---

*Jika Anda menghadapi kendala instalasi atau pertanyaan terkait arsitektur model, silakan buka Issue di GitHub dan tag (mention) Machine Learning Engineer / Tim Data.*
