# Lapis AI — Machine Learning Module

Dokumen ini merupakan panduan utama bagi Engineer (terutama Backend) atau anggota tim lain yang akan mengintegrasikan, menjalankan, atau mengembangkan *machine learning pipeline* dari proyek Lapis AI.

---

## 🛠️ Tech Stack & Persyaratan Sistem

- **Python**: Versi `3.10` atau lebih baru
- **Core Libraries**: `pandas`, `numpy`, `scikit-learn`
- **Machine Learning**: `xgboost`, `lightgbm`
- **Deep Learning**: `tensorflow`, `h5py`

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
├── data/               # Folder HANYA UNTUK LOKAL (di-ignore oleh git)
│   ├── raw/            # Data mentah (sensor_readings.csv, dll)
│   ├── interim/        # Data sementara hasil pemrosesan awal
│   └── processed/      # Data siap training (parquet/csv)
├── models/             # Folder penyimpanan artefak model
│   ├── ml_track/       # Model klasik (Random Forest, XGBoost)
│   ├── dl_track/       # Model Deep Learning (LSTM, GRU)
│   └── final/          # Model final yang TERPILIH untuk deployment
├── notebooks/          # Jupyter Notebooks untuk eksperimen & riset (Fase 1-10)
├── src/                # Script Python modular untuk backend integration
│   ├── utils/          # Fungsi utilitas modular
│   │   └── feature_engineering.py  # Fungsi feature engineering independen
│   ├── config.py       # Single source of truth untuk PATH dan konstanta (GLOBAL_SEED, dll)
│   ├── preprocessing_pipeline.py   # Definisi class FeatureEngineeringTransformer
│   └── inference.py    # Script utama untuk inferensi API
├── api_contract_final_v1.json  # Kontrak API resmi antara ML Service dan Backend
├── requirements.txt    # Daftar library Python
└── PROJECT_LOG.md      # Log lengkap keputusan arsitektur dan hasil evaluasi model
```

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

1. **Model 1 (Classifier - XGBoost):**
   - Mengambil data raw sensor dari Backend.
   - Melakukan prediksi status mesin: `HEALTHY` (0), `WARNING` (1), atau `CRITICAL` (2).
   - **PENTING:** Memiliki ambang batas (*threshold*) peringatan dini sebesar `0.60`.

2. **Model 2 (RUL Predictor - LSTM):**
   - **HANYA BERJALAN** jika output Model 1 adalah `WARNING` atau `CRITICAL`.
   - Menerima format input 3D (Sequence/Timestep) sepanjang 24 jam ke belakang (`SEQ_LEN = 24`).
   - Memprediksi Sisa Umur Pakai (RUL) dalam satuan **hari**.

Silakan merujuk ke file `api_contract_draft_v1.json` di dalam folder ini untuk skema *Request* dan *Response* detail yang harus diikuti oleh layanan Backend.

---

*Jika Anda menghadapi kendala instalasi atau pertanyaan terkait arsitektur model, silakan buka Issue di GitHub dan tag (mention) Machine Learning Engineer / Tim Data.*
