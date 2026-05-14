# TASK CHECKLIST — ROLE A: MACHINE LEARNING ENGINEER
### Lapis AI Predictive Maintenance System
**Last Updated:** 2026-05-09
**Status Keseluruhan:** In Progress

---

## LEGENDA STATUS
| Simbol | Makna |
|---|---|
| ✅ | Selesai & Diaudit |
| 🔄 | Sedang Dikerjakan |
| ⏳ | Belum Dimulai |
| ⚠️ | Perlu Perhatian / Ada Issue |
| 🔴 | Blocked / Perlu Fix |

---

## KEPUTUSAN ARSITEKTUR YANG SUDAH DIKUNCI
(Referensi cepat — jangan diubah tanpa diskusi arsitek)

| Parameter | Nilai | Dikunci di |
|---|---|---|
| W_WARNING_HRS | 48 jam | Fase 2 EDA Forensik |
| W_CRITICAL_HRS | 24 jam | Fase 2 EDA Forensik |
| GLOBAL_SEED | 42 | Fase 0 |
| RUL_UNIT | days | Config |
| Split Strategy | Machine-Based | Fase 7 |
| Train Machines | M-01 s/d M-14 | Fase 7 |
| Val Machines | M-15, M-16, M-17 | Fase 7 |
| Test Machines | M-18, M-19, M-20 | Fase 7 |
| SMOTE Target WARNING | 4,000 | Fase 7 |
| SMOTE Target CRITICAL | 4,000 | Fase 7 |
| XGBoost WARNING Threshold | 0.60 | Fase 8B |
| Feature Engineering | ML Service (bukan Backend) | Arsitektur |

---

## TARGET DELIVERABLES FINAL
(Sesuai Knowledge Base Role A V2.0 & Master Blueprint V3.0)

| No | Deliverable | Status |
|---|---|---|
| 1 | Script preprocessing Python (.py) dalam Pipeline object | ⏳ Fase 10 |
| 2 | Model 1: XGBoost Classifier (.pkl) | ✅ DONE |
| 3 | Model 2: LSTM RUL Predictor (.keras) | ✅ DONE |
| 4 | API Contract JSON final untuk Backend | 🔄 Draft v1 ada |

---

## FASE 0 — Environment & Reproducibility Setup ✅
**Notebook:** `00_environment_check.ipynb`
**Status:** SELESAI

- [x] Struktur direktori standar enterprise
- [x] requirements.txt (algorithm-agnostic)
- [x] src/config.py sebagai single source of truth
- [x] venv baru & bersih
- [x] Kernel Jupyter: Lapis AI (Python 3.10)
- [x] Environment check 100% hijau

---

## FASE 1 — Data Ingestion & Sanity Check ✅
**Notebook:** `notebooks/fase_1_ingestion/01_data_ingestion.ipynb`
**Status:** SELESAI

- [x] Load sensor_readings.csv → df_sensor (100,000 × 11)
- [x] Load maintenance_logs.csv → df_maintenance (500 × 8)
- [x] Validasi tipe data (timestamp = datetime64)
- [x] Audit missing values
- [x] Audit distribusi label failure (56 baris, 0.056%)
- [x] Audit temporal integrity (0 gap, 0 duplikat)
- [x] Defect Log terbentuk (DFT-01, DFT-02)

**Output:** Tidak ada file output (data mentah tetap di data/raw/)

---

## FASE 2 — EDA Forensik ✅
**Notebook:** `notebooks/fase_2_eda/02_eda_forensik.ipynb`
**Status:** SELESAI

- [x] Setup & Failure Isolation (56 events, 20 mesin)
- [x] Failure Autopsy — look-back 72 jam (M-01, M-05, M-09)
- [x] Identifikasi sensor paling informatif
- [x] Cohen's D Effect Size — semua sensor
- [x] Kunci W_WARNING_HRS = 48 jam (empiris)
- [x] Kunci W_CRITICAL_HRS = 24 jam (empiris)

**Keputusan Kritis:**
- W_WARNING direvisi dari hipotesis 72 → 48 jam
- humidity & operating_hours: Cohen's d rendah tapi dipertahankan

---

## FASE 3 — Temporal Label Engineering ✅
**Notebook:** `notebooks/fase_3_label_engineering/03_label_engineering.ipynb`
**Status:** SELESAI

- [x] Temporal Backward-Labeling (W=48h Warning, W=24h Critical)
- [x] Sensor Confirmation Layer (P90, min 2 sensor)
- [x] Encoding HEALTHY=0, WARNING=1, CRITICAL=2
- [x] Validasi: semua failure=1 berlabel CRITICAL
- [x] Export df_sensor_labeled.parquet

**Output:** `data/interim/df_sensor_labeled.parquet`
**Distribusi:** HEALTHY=97,364 | WARNING=1,247 | CRITICAL=1,389

---

## FASE 4 — Feature Engineering & Enrichment ✅
**Notebook:** `notebooks/fase_4_feature_engineering/04_feature_engineering.ipynb`
**Status:** SELESAI

- [x] Rolling Statistics (6 sensor × 2 window × 3 stats = 36 fitur)
- [x] Fix NaN rolling STD (fill dengan 0)
- [x] Lag Features (6 sensor × 3 lag = 18 fitur)
- [x] Cross-Sensor Ratios (4 fitur)
- [x] Degradation Proxy — hours_since_last_maint (1 fitur)
- [x] NLP Text Mining — damage_category & severity_score (2 fitur)
- [x] Export df_sensor_featured.parquet (100,000 × 75)

**Output:** `data/interim/df_sensor_featured.parquet`
**Total fitur:** 75 kolom

---

## FASE 5 — Data Preprocessing & Cleansing ✅
**Notebook:** `notebooks/fase_5_preprocessing/05_preprocessing.ipynb`
**Status:** SELESAI (Refactored — Scaler Leakage Fix)

- [x] Fix DFT-02: vibration negatif di-clip ke 0
- [x] DFT-01 closed: parts_replaced tidak berdampak
- [x] LabelEncoder untuk damage_category
- [x] StandardScaler — FIT HANYA pada M-01–M-14 (anti-leakage)
- [x] Transform seluruh df (20 mesin)
- [x] Export scaler.pkl ke models/ml_track/
- [x] Export df_model_ready.parquet (100,000 × 76)

**Output:**
- `data/processed/df_model_ready.parquet`
- `models/ml_track/scaler.pkl`

**Catatan Penting:** Scaler di-fit HANYA pada training machines.
Val/Test mean/std ≠ 0/1 adalah EXPECTED dan CORRECT.

---

## FASE 6 — Imbalance Handling: SSBS ✅
**Notebook:** `notebooks/fase_6_imbalance/06_imbalance_handling.ipynb`
**Status:** SELESAI (Refactored — SMOTE dipindah ke Fase 7)

- [x] Analisis distribusi pre-sampling (HEALTHY:WARNING = 78:1)
- [x] SSBS — 2 blok per mesin (prima + pre-warning boundary)
- [x] Safety buffer 24 jam sebelum zona WARNING
- [x] Export df_ssbs.parquet (20,423 × 76)

**Output:** `data/processed/df_ssbs.parquet`
**Distribusi SSBS:** HEALTHY=17,787 | WARNING=1,247 | CRITICAL=1,389

**Catatan Arsitektur:**
SMOTE TIDAK dijalankan di sini — dipindah ke Fase 7
untuk mencegah Data Leakage temporal.

---

## FASE 6.5 — RUL Target Engineering ✅
**Notebook:** `notebooks/fase_6_imbalance/06b_rul_engineering.ipynb`
**Status:** SELESAI

- [x] Hitung rul_days per baris per mesin
- [x] Forward-looking: cari T_failure_berikutnya
- [x] Fill -1 dengan max_rul_days per mesin
- [x] Validasi logika: WARNING median ~2 hari, CRITICAL ~1 hari
- [x] Export df_ssbs_rul.parquet (20,423 × 77)

**Output:** `data/processed/df_ssbs_rul.parquet`
**Catatan:** rul_days adalah TARGET Model 2, bukan fitur input.
Di deployment, nilai ini yang diprediksi model.

---

## FASE 7 — Dataset Splitting & SMOTE on Train Only ✅
**Notebook:** `notebooks/fase_7_splitting/07_dataset_splitting.ipynb`
**Status:** SELESAI

- [x] Machine-Based Split (bukan Global Temporal)
- [x] Train: M-01–M-14 (14,419 baris)
- [x] Val: M-15–M-17 (3,288 baris)
- [x] Test: M-18–M-20 (2,716 baris)
- [x] Validasi zero overlap antar split
- [x] SMOTE HANYA pada X_train_clf
  - WARNING: 901 → 4,000
  - CRITICAL: 1,014 → 4,000
- [x] X_train_rul TIDAK di-SMOTE (regression = natural)
- [x] Export 12 parquet artifacts + split_metadata.json

**Output:** 13 files di `data/processed/`

---

## FASE 8 — Modeling Experimentation 🔄
**Status:** ✅ COMPLETE
Track A (Classifier): ✅ DONE — XGBoost V2+Threshold
Track B (RUL): ✅ DONE — LSTM V2

### TRACK A — Health Status Classifier (Model 1)

#### 08A — Random Forest Classifier ✅
**Notebook:** `notebooks/fase_8_modeling/08a_clf_random_forest.ipynb`
**Model:** `models/ml_track/rf_classifier.pkl` (3.15 MB)

- [x] Training (n_estimators=300, max_depth=20)
- [x] Evaluasi Val & Test
- [x] Confusion Matrix
- [x] Feature Importance
- [x] Forensic Investigation (4 diagnostik)
- [x] Generalization Assessment Report

**Hasil:**
| Metrik | Val | Test |
|---|---|---|
| F1 Macro | 0.9292 | 0.9914 |
| Accuracy | 0.9808 | 0.9978 |
| WARNING F1 | 0.811 | 0.9856 |
| CRITICAL→HEALTHY | 0 errors | 0 errors |

---

#### 08B — XGBoost Classifier ✅
**Notebook:** `notebooks/fase_8_modeling/08b_clf_xgboost.ipynb`
**Model:** `models/ml_track/xgb_classifier.pkl` (1.68 MB)

- [x] Training V1 (gagal — early stopping terlalu agresif)
- [x] Training V2 (parameter adjusted)
- [x] Threshold Optimization (WARNING threshold = 0.60)
- [x] Evaluasi 3 skenario (V1, V2, V2+Tuning)
- [x] Comparison table vs Random Forest

**Hasil (V2 + Threshold):**
| Metrik | Val | Test |
|---|---|---|
| F1 Macro | 0.9894 | 0.9906 |
| Accuracy | 0.9982 | 0.9974 |
| WARNING F1 | 0.9818 | 0.9832 |
| Best Iteration | 499 | — |

**Catatan Deployment:** WARNING threshold = 0.60 wajib digunakan.

---

#### 08C — LightGBM Classifier ✅
**Notebook:** `notebooks/fase_8_modeling/08c_clf_lightgbm.ipynb`
**Model:** `models/ml_track/lgbm_classifier.pkl`

- [x] Setup & load data
- [x] Training dengan hyperparameter awal
- [x] Evaluasi Val & Test
- [x] Threshold optimization (threshold WARNING = 0.65)
- [x] Comparison table vs RF & XGBoost
- [x] Simpan model

**Hasil (dengan Threshold 0.65):**

| Metrik | Val | Test |
|---|---|---|
| F1 Macro | 0.9845 | 0.9908 |
| WARNING F1 Test | — | 0.9857 |
**Temuan:** Early stopping agresif (iter 27).

Threshold tuning menyelamatkan dari F1 Val 0.6663 → 0.9845.

Catatan: jika terpilih, re-run dengan lr=0.01 di Fase 9.

---

### TRACK B — RUL Predictor (Model 2)

#### 08D — XGBoost Regressor ✅
**Notebook:** `notebooks/fase_8_modeling/08d_rul_xgboost_regressor.ipynb`
**Model:** `models/ml_track/xgb_regressor.pkl`

- [x] Setup & load data (WARNING+CRITICAL only filter)
- [x] Training XGBoost Regressor (best_iter=497)
- [x] Evaluasi: MAE Val=1.72 hari, MAE Test=1.10 hari
- [x] Error analysis per kelas
  (WARNING MAE=0.10 hari, CRITICAL MAE=2.03 hari)
- [x] Visualisasi 4-panel
- [x] Export model (Cell terakhir)

**Scope:** WARNING+CRITICAL only
**Deployment note:** Hanya aktif saat Model 1
  mendeteksi WARNING atau CRITICAL.

---

#### 08E — LSTM RUL Predictor ✅
**Notebook:** `notebooks/fase_8_modeling/08e_rul_lstm.ipynb`
**Model:** `models/dl_track/lstm_rul_best_v2.keras`

- [x] Setup & sequence preparation (SEQ_LEN=24)
- [x] Training V1 (val_mae=1.7516, belum konvergen)
- [x] Training V2 (+L2 reg, dropout 0.3, max=200)
  val_mae terbaik = 0.8160 hari di epoch 184
- [x] Training V3 (extended dari V2 — gagal, optimizer reset)
- [x] Hapus Cell V3 (notebook cleanup)
- [x] Evaluasi Cell 4 dengan model_v2
- [x] Hasil Cell 4: MAE Test=0.7985 hari, Error≤1hari=98.04%
- [x] Export model (Cell 5 — lstm_rul_best_v2.keras)
- [x] Analisis overfitting: gap=0.60 hari (acceptable)

**Hasil V2:** Val MAE=0.8160 hari
**Catatan:** Val MAE noisy karena Val set hanya 264 samples

---

#### 08F — GRU RUL Predictor ✅
**Notebook:** `notebooks/fase_8_modeling/08f_rul_gru.ipynb`
**Model:** `models/dl_track/gru_rul_final.keras`

- [x] Setup & sequence preparation (identik 08E)
- [x] Bangun arsitektur GRU (48/24 units, ~27K params)
- [x] Training: early stopping epoch 151
  best val_mae = 1.8618 hari
- [x] Evaluasi 3-way: XGBoost vs LSTM V2 vs GRU
- [x] Error analysis per kelas
  (WARNING MAE=1.91, CRITICAL MAE=0.01)
- [x] Export model (Cell 4)

**Verdict:** TIDAK DIPILIH — GRU underfit pada WARNING
**Model Final Track B:** LSTM V2 (lstm_rul_best_v2.keras)

---

### 🏆 KEPUTUSAN FINAL FASE 8

#### Model 1 Final — Health Status Classifier:
**XGBoost V2 + Threshold (threshold WARNING=0.60)**
`models/ml_track/xgb_classifier.pkl`
| Metrik | Val | Test |
|---|---|---|
| F1 Macro | 0.9894 | 0.9906 |
| WARNING F1 | 0.9818 | 0.9832 |
| CRITICAL F1 | 0.9868 | 0.9865 |

#### Model 2 Final — RUL Predictor:
**LSTM V2 (WARNING+CRITICAL only)**
`models/dl_track/lstm_rul_best_v2.keras`
| Metrik | Val | Test |
|---|---|---|
| MAE (hari) | 1.6461 | 0.7985 |
| Error ≤ 1 hari | 97.73% | 98.04% |

---

## FASE 9 — Evaluation, Calibration & Model Selection ✅
**Notebook:** `notebooks/fase_9_evaluation/09_evaluation.ipynb`
**Status:** ✅ SELESAI

### Model 1 — Classifier Comparison
- [x] Tabel perbandingan RF vs XGBoost vs LightGBM
  - F1 Macro Val & Test
  - F1 per kelas (HEALTHY, WARNING, CRITICAL)
  - Accuracy, Precision, Recall
  - Inference time & Model size
- [x] Confusion Matrix semua model side-by-side (2 baris × 3 kolom)
- [x] ROC-AUC Curve per kelas (semua model, overlay)
- [x] Feature importance comparison (Top 15 overlay + konsensus tabel)
- [x] LSTM Permutation Feature Importance (Top 20)
- [x] Inference Time Benchmark (10 runs average)
- [x] Business Critical Metrics (False Alarm Rate, Fatal Error Rate)
- [x] Keputusan formal: **XGBoost V2 + Threshold 0.60 TERPILIH**

**Hasil Model 1 Final (Test Set):**
| Model | F1 Macro | WARNING F1 | Fatal Error |
|---|---|---|---|
| XGBoost ✅ | 0.9906 | 0.9832 | 0 |
| LightGBM | 0.9908 | — | 0 |
| Random Forest | 0.9914 | 0.9856 | 0 |

### Model 2 — RUL Regressor Comparison
- [x] Tabel perbandingan XGBoost Regressor vs LSTM V2
  - MAE, RMSE, R² (Val & Test)
  - Error ≤ 1 hari, Error ≤ 3 hari
  - Inference time & Model size
- [x] Residual distribution (histogram overlay)
- [x] Actual vs Predicted scatter (warna per kelas WARNING/CRITICAL)
- [x] Prediction Timeline M-19 (XGBoost vs LSTM side-by-side)
- [x] Error timeline per timestep (bar chart)
- [x] Per-kelas error analysis (WARNING vs CRITICAL)
- [x] Keputusan formal: **LSTM V2 TERPILIH**

**Hasil Model 2 Final (Test Set):**
| Model | MAE | RMSE | Error≤1hari |
|---|---|---|---|
| LSTM V2 ✅ | 0.7985 | 6.3803 | 98.04% |
| XGBoost Reg | 1.1020 | 5.6002 | 93.53% |

### Output Fase 9
- [x] `notebooks/fase_9_evaluation/09_evaluation.ipynb` (4 cell + 1 cell sementara)
- [x] `notebooks/fase_9_evaluation/model_evaluation_report.html`
  (standalone HTML, embed semua plot sebagai base64 PNG)

---

## CATATAN & ISSUES AKTIF

| ID | Fase | Catatan | Status |
|---|---|---|---|
| NOTE-01 | Fase 8B | XGBoost WARNING threshold=0.60 wajib di API Contract | 🔄 Dicatat di draft |
| NOTE-02 | Fase 9 | Export evaluation report sebagai HTML untuk laporan | ✅ Done — model_evaluation_report.html |
| NOTE-03 | Fase 10 | Arsitektur: ML Service handle feature engineering | ✅ Dikunci |
| DFT-03 | Fase 5 | severity_score bimodal (1&3 saja) | ⏳ Re-encode di Fase 8 jika perlu |

---

## LEADERBOARD MODEL (Update Berkala)

### Model 1 — Health Status Classifier

| Rank | Model | F1 Val | F1 Test | WARNING F1 | Status |
|---|---|---|---|---|---|
| 🥇 | XGBoost V2+Threshold | 0.9894 | 0.9906 | 0.9818 | ✅ FINAL |
| 🥈 | LightGBM+Threshold | 0.9845 | 0.9908 | — | Runner-up |
| 🥉 | Random Forest | 0.9292 | 0.9914 | 0.811 | Baseline |

### Model 2 — RUL Predictor (WARNING+CRITICAL Only)
| Rank | Model | Val MAE | Test MAE | Error≤1hari | Status |
|---|---|---|---|---|---|
| 🥇 | LSTM V2 | 1.6461 hari | 0.7985 hari | 98.04% | ✅ FINAL |
| 🥈 | XGBoost | 1.7189 hari | 1.1020 hari | 93.53% | Runner-up |
| 🥉 | GRU | 1.8618 hari | 0.9515 hari | 97.80% | Tidak dipilih |

---

## FASE 10 — Artifact Export & API Contract Definition ✅
**Notebook:** `notebooks/fase_10_export/10_artifact_export.ipynb`
**Status:** SELESAI & DIAUDIT

### Preprocessing Pipeline Object
- [x] Kemas seluruh preprocessing dalam satu sklearn Pipeline object
      → `FeatureEngineeringTransformer` didefinisikan di
        `src/preprocessing_pipeline.py` (bukan notebook)
        untuk menghindari __main__ pickle deserialization bug
- [x] Test pipeline dengan raw sensor data baru
      → Smoke test: shape (5, 69), NaN=False, dtype=float64 ✅
- [x] Simpan sebagai `models/final/preprocessing_pipeline.pkl` (6.0 KB)

### Model Artifacts Final
- [x] Copy model terpilih ke `models/final/`:
  - `classifier_final.pkl`        (1.68 MB) — XGBoost V2
  - `rul_predictor_final.keras`   (610.4 KB) — LSTM V2
- [x] Buat Model Card JSON per model:
  - `classifier_model_card.json`      (1.9 KB)
  - `rul_predictor_model_card.json`   (2.0 KB)
- [x] Verifikasi inference dengan sample data
      → Classifier shape (3, 3) ✅ | LSTM shape (1, 1) ✅
- [x] MANIFEST.json dibuat (daftar semua file + ukuran)

### API Contract JSON Final
**Catatan Arsitektur (dikunci):**
ML Service melakukan feature engineering.
Backend hanya kirim raw sensor data.

- [x] Definisi endpoint `POST /api/ml/predict`
- [x] Request schema (raw sensor input + sensor_history opsional 23 entri)
- [x] Response schema:
  - Model 1: label + probabilities + threshold info ✅
  - Model 2: rul_days + rul_hours + urgency_level + is_active ✅
- [x] Error response schema (400 / 422 / 500 / 503)
- [x] WARNING threshold = 0.60 tercantum eksplisit sebagai float ✅
- [x] Simpan sebagai `api_contract_final_v1.json` (7.1 KB)
      → Disimpan di 2 lokasi: root + notebooks/fase_10_export/
- [x] Update dari draft: `api_contract_draft_v1.json` → v1.0-final

### Refactoring .ipynb → .py
- [x] `src/preprocessing_pipeline.py` (FeatureEngineeringTransformer portable)
- [x] `src/inference.py` (fungsi predict() — Singleton pattern, semua model
      di-load sekali saat import, LSTM warm-up call otomatis saat startup)
- [x] `src/utils/feature_engineering.py` (pure functions, importable)
- [x] End-to-end test via Cell 5: `from src.inference import predict` ✅
      (pengganti --sample test, lebih komprehensif: 5 skenario)

### Catatan Arsitektur Kritis (Fase 10)
| Issue | Resolusi |
|---|---|
| `__main__` pickle bug | `FeatureEngineeringTransformer` dipindah ke `src/preprocessing_pipeline.py` |
| LSTM cold start 693ms | Warm-up call di dalam `_load_models()` → inference ~116ms |
| `scaler_final.pkl` redundan | Ada di `models/final/` tapi tidak di-expose ke Backend — pipeline sudah cukup |

### Final Smoke Test (5/5 PASSED) ✅
| Skenario | Hasil |
|---|---|
| S1 HEALTHY (tanpa history) | label=HEALTHY, RUL inactive, 46.5ms ✅ |
| S2 CRITICAL + history 23 entri | RUL=1.585 hari, Urgency=CRITICAL, 116ms ✅ |
| S3 Missing sensor_readings | Error 400, message spesifik ✅ |
| S4 Missing field 'vibration' | Error 400, field teridentifikasi ✅ |
| S5 Timing 5x consecutive | Avg 49.7ms, Max 54.0ms (< 200ms) ✅ |

### Dokumentasi Final
- [x] Update `PROJECT_LOG.md` (section Fase 9 & Fase 10)
- [x] Update `TASK_CHECKLIST_ROLE_A.md` (semua ✅)


---

## STATUS KESELURUHAN ROLE A: ✅ COMPLETE

| Fase | Status |
|---|---|
| Fase 0 — Environment Setup | ✅ |
| Fase 1 — Data Ingestion | ✅ |
| Fase 2 — EDA Forensik | ✅ |
| Fase 3 — Label Engineering | ✅ |
| Fase 4 — Feature Engineering | ✅ |
| Fase 5 — Preprocessing | ✅ |
| Fase 6 — SSBS Imbalance Handling | ✅ |
| Fase 6.5 — RUL Engineering | ✅ |
| Fase 7 — Splitting & SMOTE | ✅ |
| Fase 8 — Modeling (ML + DL Track) | ✅ |
| Fase 9 — Evaluation & Model Selection | ✅ |
| Fase 10 — Artifact Export & API Contract | ✅ |

**Siap untuk handover ke Backend Engineer.** 



*Dokumen ini diupdate setiap langkah selesai dieksekusi dan diaudit.*
*Jangan update status ✅ sebelum mendapat persetujuan audit dari Lead Architect.*
