# LAPIS AI — PROJECT LOG & DECISION REGISTER
*Dokumen hidup ini diupdate setiap akhir fase.*

---

## FASE 0 — Environment Setup ✅
**Status:** Complete
**Tanggal:** [isi tanggal Anda]

### Keputusan:
- Python: 3.10.6
- Virtual environment: `venv` (fresh install)
- Kernel Jupyter: `Lapis AI (Python 3.10)`
- Seed global: `GLOBAL_SEED = 42`
- Single source of truth: `src/config.py`

### Struktur Direktori Final:

---

## FASE 1 — Data Ingestion & Sanity Check ✅
**Status:** Complete
**File:** `notebooks/fase_1_ingestion/01_data_ingestion.ipynb`

### Profil Data:
| Dataset | Rows | Columns |
|---|---|---|
| sensor_readings.csv | 100,000 | 11 |
| maintenance_logs.csv | 500 | 8 |

### Konfirmasi Tipe Data Kritis:
- `df_sensor['timestamp']` → `datetime64[ns]` ✅
- `df_maintenance['date']` → `datetime64[ns]` ✅
- `df_sensor['failure']` → `int64` ✅

### Distribusi Label:
- `failure = 0` (HEALTHY) : 99,944 baris (99.944%)
- `failure = 1` (FAILURE)  : 56 baris (0.056%)
- Semua 20 mesin pernah failure
- Rata-rata 2.80x failure per mesin

### Temporal Integrity:
- Rentang waktu: 1 Jul 2025 – 25 Jan 2026 (208 hari)
- Duplikat timestamp: 0 ✅
- Baris per mesin: 5,000 (semua sama) ✅
- Gap > 1 jam: 0 ✅



---

## FASE 2 — EDA Forensik ✅
**Status:** Complete
**File:** `notebooks/fase_2_eda/02_eda_forensik.ipynb`

### Failure Autopsy — Mesin yang Dianalisis:
- M-01 (4x failure), M-09 (2x failure), M-05 (1x failure)
- Metode: Look-back 72 jam per kejadian failure

### Temuan Visual:
- Sinyal awal degradasi mulai terdeteksi: **T-48 jam**
- Eskalasi dramatis terjadi: **T-24 jam**
- Pola konsisten di ketiga mesin → bersifat **universal**

### Keputusan Window Parameter (dikunci empiris):
```python
W_WARNING_HRS  = 48   # jam sebelum failure → label WARNING
W_CRITICAL_HRS = 24   # jam sebelum failure → label CRITICAL
```
> ⚠️ Direvisi dari hipotesis awal Blueprint (W_WARNING=72)
> berdasarkan data empiris Failure Autopsy.

### Cohen's D — Sensor Informativeness:
| Sensor | Cohen's d | Kategori | Prioritas |
|---|---|---|---|
| vibration | 3.37 | Besar | 🔴 Tinggi |
| pressure | 3.06 | Besar | 🔴 Tinggi |
| rpm | 2.91 | Besar | 🔴 Tinggi |
| noise_level | 2.89 | Besar | 🔴 Tinggi |
| temperature | 2.71 | Besar | 🔴 Tinggi |
| power_consumption | 2.61 | Besar | 🔴 Tinggi |
| operating_hours | 0.29 | Sedang | 🟡 Rendah |
| humidity | 0.21 | Sedang | 🟡 Rendah |

### Keputusan Fitur:
- ✅ **KEEP Prioritas Tinggi:** `temperature`, `vibration`, 
  `pressure`, `rpm`, `noise_level`, `power_consumption`
- 🟡 **KEEP Prioritas Rendah:** `humidity`, `operating_hours`
- 🔴 **DROP:** Tidak ada — semua dipertahankan,
  keputusan akhir diserahkan ke feature importance Fase 8

### Catatan Anomali:
- `operating_hours` pada FAILURE justru lebih rendah dari HEALTHY
  → Kemungkinan bias sampling atau mesin baru belum terkalibrasi
  → Diinvestigasi lebih dalam di Fase 4

---

## PARAMETER GLOBAL TERKUNCI (config.py)
```python
GLOBAL_SEED    = 42
W_CRITICAL_HRS = 24   # dikunci Fase 2
W_WARNING_HRS  = 48   # dikunci Fase 2 (revisi dari 72)
LABEL_MAP = {"HEALTHY": 0, "WARNING": 1, "CRITICAL": 2}
```

---

## FASE 3 — Temporal Label Engineering ✅
**Status:** Complete
**File:** `notebooks/fase_3_label_engineering/03_label_engineering.ipynb`
**Output:** `data/interim/df_sensor_labeled.parquet`

### Metode: Temporal Backward-Labeling + Sensor Confirmation Layer

### Parameter Window (dikunci dari Fase 2):
- W_WARNING_HRS  = 48 jam
- W_CRITICAL_HRS = 24 jam

### Distribusi Label Final:
| Kelas | Baris | Persentase |
|---|---|---|
| HEALTHY (0) | 97,364 | 97.364% |
| WARNING (1) | 1,247 | 1.247% |
| CRITICAL (2) | 1,389 | 1.389% |

### Sensor Confirmation Layer:
- Baseline: P90 dari distribusi HEALTHY
- Min sensor terpicu: 2 dari 6 sensor prioritas tinggi
- Total downgrade: 49 baris WARNING → HEALTHY (1.82%)
- CRITICAL: 0 downgrade (semua dipertahankan)

### Threshold P90 yang Terkunci:
| Sensor | Threshold P90 |
|---|---|
| temperature | 76.30 |
| vibration | 0.59 |
| pressure | 103.80 |
| rpm | 2,540.00 |
| power_consumption | 82.10 |
| noise_level | 74.30 |

---

## FASE 4 — Feature Engineering & Enrichment ✅
**Status:** Complete
**File:** `notebooks/fase_4_feature_engineering/04_feature_engineering.ipynb`
**Output:** 
- `data/interim/df_sensor_featured.parquet` (pipeline resmi — 18.79 MB)
- `data/interim/df_sensor_featured_preview.csv` (preview Excel — 72.92 MB)

### Feature Inventory Final (75 kolom):
| Grup | Jumlah | Keterangan |
|---|---|---|
| Original | 11 | Sensor mentah + label biner |
| Label | 3 | health_label, confirmed, encoded |
| Rolling | 36 | 6 sensor × 2 window × 3 statistik |
| Lag | 18 | 6 sensor × 3 lag size |
| Ratio | 4 | Cross-sensor interaction |
| Degradation | 1 | hours_since_last_maint |
| NLP | 2 | damage_category, severity_score |

### Defect Log Aktif (dibawa ke Fase 5):
| ID | Kolom | Temuan | Penanganan |
|---|---|---|---|
| DFT-01 | parts_replaced | 11.8% NaN di maintenance | fill → 'Unknown' |
| DFT-02 | vibration | Min = -0.09, merambat ke ratio | clip ke 0 |
| DFT-03 | severity_score | Score 2 tidak exist (bimodal) | re-encode Fase 8 jika perlu |
| DFT-04 | damage_category | M-09 mismatch minor | Acceptable |

---

## FASE 5 — Data Preprocessing & Cleansing ✅
**Status:** Complete
**File:** `notebooks/fase_5_preprocessing/05_preprocessing.ipynb`
**Output:**
- `data/processed/df_model_ready.parquet` (pipeline resmi — 19.27 MB)
- `data/processed/df_model_ready_preview.csv` (preview — 137.28 MB)
- `models/ml_track/scaler.pkl` (StandardScaler — 4.28 KB)

### Defect Resolution:
| ID | Status | Resolusi |
|---|---|---|
| DFT-01 | ✅ CLOSED | parts_replaced tidak di-merge ke df sensor |
| DFT-02 | ✅ CLOSED | vibration negatif di-clip ke 0 |
| DFT-03 | 🟡 DEFERRED | severity_score bimodal — re-encode Fase 8 |
| DFT-04 | ✅ CLOSED | damage_category mismatch minor — acceptable |

### Kolom Final (76 kolom):
| Grup | Jumlah |
|---|---|
| Identifier | 2 |
| Label | 4 |
| Categorical | 2 |
| Numeric (scaled) | 68 |

### Keputusan Scaling:
- Method: StandardScaler (bukan MinMaxScaler)
- Alasan: outlier informatif pada periode pre-failure
  harus dipertahankan jarak relatifnya
- Kolom yang di-scale: 69 kolom numerik
- Kolom yang tidak di-scale: identifier, label, categorical asli

---

## FASE 6 — Imbalance Handling: SSBS ✅
**Status:** Complete (Refactored — SMOTE dipindah ke Fase 7)
**File:** `notebooks/fase_6_imbalance/06_imbalance_handling.ipynb`
**Output:**
- `data/processed/df_ssbs.parquet` (pipeline resmi — 4.47 MB)
- `data/processed/df_ssbs_preview.csv` (preview — 27.93 MB)

### Metode: Stratified Sequential Block Sampling (SSBS)
**Parameter:**
- Quota per mesin : 1,000 baris (20,000 / 20 mesin)
- Block size      : 500 baris per blok
- Safety buffer   : 24 jam sebelum zona WARNING
- Blok A          : 500 baris pertama (kondisi prima)
- Blok B          : 500 baris terakhir (pre-warning boundary)

### Distribusi Final df_ssbs (20,423 baris):
| Kelas | Baris | Persentase |
|---|---|---|
| HEALTHY (0) | 17,787 | 87.09% |
| WARNING (1) | 1,247 | 6.11% |
| CRITICAL (2) | 1,389 | 6.80% |

### Keputusan Arsitektur Kritis:
> SMOTE TIDAK dijalankan di Fase 6.
> Dipindah ke Fase 7 — diaplikasikan HANYA pada X_train
> setelah time-aware split selesai.
> Alasan: mencegah Data Leakage temporal.
> Test set dan Validation set = 100% data natural.

### Mesin dengan HEALTHY < Quota (shortfall karena failure awal):
| Mesin | Available | Final |
|---|---|---|
| M-06 | 523 | 523 |
| M-10 | 534 | 534 |
| M-08 | 776 | 776 |
| M-18 | 673 | 673 |
| M-14 | 719 | 719 |
| M-20 | 655 | 655 |
| M-04 | 952 | 952 |
| M-19 | 955 | 955 |
> Shortfall adalah konsekuensi integritas temporal — bukan bug.

---

## FASE 6.5 — RUL Target Engineering ✅
**Status:** Complete
**File:** `notebooks/fase_6_imbalance/06b_rul_engineering.ipynb`
**Output:**
- `data/processed/df_ssbs_rul.parquet` (pipeline resmi — 4.50 MB)
- `data/processed/df_ssbs_rul_preview.csv` (preview — 28.05 MB)

### Kolom Baru: `rul_days`
- Tipe   : float64
- Satuan : hari (sesuai RUL_UNIT di config.py)
- Min    : 0.04 hari
- Max    : 146.92 hari
- Mean   : 29.38 hari
- Median : 18.88 hari

### Catatan Karakteristik Data:
- WARNING median ~2 hari (sesuai W_WARNING_HRS=48)
- CRITICAL median ~1 hari (sesuai W_CRITICAL_HRS=24)
- Outlier di CRITICAL (max=146.92) → CRITICAL rows dari
  failure terakhir mesin yang tidak punya next failure
  → Acceptable, bukan bug

### Keputusan Arsitektur:
- rul_days TIDAK ada di data mentah (sensor_readings.csv)
- rul_days adalah target variabel yang direkayasa
  dari data historis — bukan fitur input
- Di deployment nyata, nilai ini yang diprediksi model

### Target Variabel Final Pipeline:
| Model | Target | Tipe |
|---|---|---|
| Model 1 | health_label_encoded (0/1/2) | Klasifikasi |
| Model 2 | rul_days (float) | Regresi |

---

## FASE 7 — Dataset Splitting & SMOTE on Train Only ✅
**Status:** Complete
**File:** `notebooks/fase_7_splitting/07_dataset_splitting.ipynb`
**Output:** 13 files di `data/processed/`

### Split Strategy: Machine-Based Split
| Split | Mesin | Baris | % Total |
|---|---|---|---|
| Train | M-01 s/d M-14 (14 mesin) | 14,419 | 70.60% |
| Val | M-15, M-16, M-17 (3 mesin) | 3,288 | 16.10% |
| Test | M-18, M-19, M-20 (3 mesin) | 2,716 | 13.30% |

### Alasan Machine-Based Split (bukan Global Temporal):
- Data run-to-failure: WARNING/CRITICAL di ujung timeline
- Global temporal split akan mengkonsentrasi minority class
  ke Test set — Train set tidak belajar pola degradasi
- Machine-based split: setiap split punya full run-to-failure
- Model belajar generalisasi antar mesin (lebih realistis)

### SMOTE — Hanya pada X_train_clf:
| Kelas | Sebelum | Sesudah |
|---|---|---|
| HEALTHY | 12,504 | 12,504 (tidak berubah) |
| WARNING | 901 | 4,000 (+3,099 sintetis) |
| CRITICAL | 1,014 | 4,000 (+2,986 sintetis) |
| Total | 14,419 | 20,504 |

### Keputusan Kritis:
- X_train_rul TIDAK melalui SMOTE (regression = natural)
- Val & Test = 100% natural, tanpa data sintetis
- Zero Data Leakage ✅ terkonfirmasi

### Artifacts Final:
| Model | Train X | Train y | Val X | Test X |
|---|---|---|---|---|
| CLF (M1) | 20,504×69 | 20,504 | 3,288×69 | 2,716×69 |
| RUL (M2) | 14,419×69 | 14,419 | 3,288×69 | 2,716×69 |

---



## TARGET MODEL FINAL
| Model | Tipe | Output |
|---|---|---|
| Model 1 | Klasifikasi Multi-kelas | HEALTHY / WARNING / CRITICAL |
| Model 2 | Regresi | Sisa umur mesin (RUL) dalam **hari** |

---