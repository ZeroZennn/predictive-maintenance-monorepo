# PRIME ML Pipeline  Presentation Run Guide
**Tujuan:** Panduan eksekusi cell untuk live walkthrough ke dosen  
**Dibuat:** Auto-generated oleh `annotate_notebooks.py`

---

## Cara Pakai

- Jalankan notebook **SESUAI URUTAN** di bawah
- Cell bertanda [WARN] **EXPERIMENTAL** bersifat **OPSIONAL**  jalankan hanya jika ingin menunjukkan proses iterasi
- Estimasi waktu adalah perkiraan kasar di hardware standar (CPU only, tanpa GPU)
- **Kernel:** Gunakan kernel `Lapis AI (Python 3.10)` untuk semua notebook

---

## FASE 0  Environment Check

**File:** `notebooks/00_environment_check.ipynb`  
**Total cells:** 2 | **Estimasi waktu:** < 1 menit  
**Urutan run:** Cell 1  2 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Konfirmasi interpreter Python benar (path ke venv)
- Cell 2  Environment Check Report (versi library + ketersediaan data)

**Cell EXPERIMENTAL (opsional):** Tidak ada

**[WARN] Catatan Presentasi:** Output Cell 2 menampilkan W_WARNING_HRS=72 (nilai lama). Nilai final adalah 48  jelaskan bahwa config sudah diupdate setelah EDA Forensik Fase 2.

---

## FASE 1  Data Ingestion

**File:** `notebooks/fase_1_ingestion/01_data_ingestion.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 1-2 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Load data + konfirmasi tipe (timestamp=datetime64, machine_id=str)
- Cell 2  Distribusi label failure (imbalance 99.944% HEALTHY vs 0.056% FAILURE)
- Cell 3  Temporal integrity audit (0 gap, 0 duplikat, 5.000 baris/mesin)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 2  EDA Forensik

**File:** `notebooks/fase_2_eda/02_eda_forensik.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 3-5 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  **HIGHLIGHT UTAMA**: Failure Autopsy 3 mesin (Figure multi-panel)  bukti empiris W_WARNING=48h
- Cell 3  Cohen's D bar chart (6 sensor prioritas tinggi dengan d > 2.5)

**Cell EXPERIMENTAL (opsional):** Tidak ada

**[TARGET] Key Message:** "EDA forensik ini yang mengubah hipotesis W_WARNING dari 72 jam menjadi 48 jam berdasarkan data."

---

## FASE 3  Label Engineering

**File:** `notebooks/fase_3_label_engineering/03_label_engineering.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 2-3 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Temporal backward-labeling algorithm + distribusi label final
- Cell 2  Sensor Confirmation Layer (threshold P90 dikunci) + export parquet

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 4  Feature Engineering

**File:** `notebooks/fase_4_feature_engineering/04_feature_engineering.ipynb`  
**Total cells:** 4+ (code) | **Estimasi waktu:** 5-10 menit  
**Urutan run:** Cell 1  2  3  4  5 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Rolling statistics (36 kolom baru: 6 sensor × 2 window × 3 stats)
- Cell 4  Cross-sensor ratios + degradation proxy (hours_since_last_maint)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 5  Preprocessing

**File:** `notebooks/fase_5_preprocessing/05_preprocessing.ipynb`  
**Total cells:** 4 (code) | **Estimasi waktu:** 3-5 menit  
**Urutan run:** Cell 1  2  3  4 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 3  **ARSITEKTUR KRITIS**: StandardScaler di-fit HANYA pada M-01M-14 (zero leakage)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 6  Imbalance Handling (SSBS)

**File:** `notebooks/fase_6_imbalance/06_imbalance_handling.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 2-3 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  SSBS algorithm (2 blok temporal per mesin, shortfall explanation)
- Cell 3  Export + penjelasan kenapa SMOTE dipindah ke Fase 7

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 6.5  RUL Engineering

**File:** `notebooks/fase_6_imbalance/06b_rul_engineering.ipynb`  
**Total cells:** 2 (code) | **Estimasi waktu:** 1-2 menit  
**Urutan run:** Cell 1  2 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Rekayasa rul_days (target variabel Model 2) + statistik distribusi per kelas

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 7  Dataset Splitting

**File:** `notebooks/fase_7_splitting/07_dataset_splitting.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 2-3 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 1  Machine-Based Split (Train=M-01M-14, Val=M-15M-17, Test=M-18M-20)
- Cell 2  **ARSITEKTUR KRITIS**: SMOTE HANYA pada X_train_clf (zero leakage terkonfirmasi)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 8A  Random Forest Classifier

**File:** `notebooks/fase_8_modeling/08a_clf_random_forest.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 5-10 menit (training)  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  Confusion Matrix Val & Test (Zero CRITICALHEALTHY error)
- Cell 3  Learning Curve (konvergen) + Feature Importance (rolling 48h dominan)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 8B  XGBoost Classifier [STAR] (MODEL 1 FINAL)

**File:** `notebooks/fase_8_modeling/08b_clf_xgboost.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 3-5 menit  
**Urutan run:** Cell 1 (OPSIONAL)  Cell 2  Cell 3

**Cell penting untuk ditunjukkan:**
- Cell 2  Training V2 + threshold tuning (0.60)  F1 Val=0.9894
- Cell 3  Comparison RF vs XGBoost (XGBoost menang di WARNING F1)

**Cell EXPERIMENTAL (opsional):**
- Cell 1  V1 yang gagal (early stopping di iter 40, WARNING F1=0.2186)  jalankan untuk menunjukkan iterasi

**[TARGET] Key Message:** "Ini adalah model akhir untuk klasifikasi. Threshold 0.60 dikunci dan wajib digunakan saat inference."

---

## FASE 8C  LightGBM Classifier

**File:** `notebooks/fase_8_modeling/08c_clf_lightgbm.ipynb`  
**Total cells:** 2 (code) | **Estimasi waktu:** 2-3 menit  
**Urutan run:** Cell 1  2 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  Threshold tuning 0.65 "menyelamatkan" LightGBM (0.6663  0.9845)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 8D  XGBoost RUL Regressor

**File:** `notebooks/fase_8_modeling/08d_rul_xgboost_regressor.ipynb`  
**Total cells:** 3 (code) | **Estimasi waktu:** 3-5 menit  
**Urutan run:** Cell 1  2  3 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  Error analysis per kelas: WARNING MAE=0.10 hari (excellent!)
- Cell 3  Feature Importance (power_consumption_roll_std_48h = top feature)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## FASE 8E  LSTM RUL Predictor [STAR] (MODEL 2 FINAL)

**File:** `notebooks/fase_8_modeling/08e_rul_lstm.ipynb`  
**Total cells:** 6 (code) | **Estimasi waktu:** 2-3 menit (load checkpoint) / 30-60 menit (re-training)  
**Urutan run untuk presentasi:** Cell 1  Cell 2 (load checkpoint)  Cell 4  Cell 5

**Cell penting untuk ditunjukkan:**
- Cell 2  Load checkpoint V2 (Val MAE=0.8160 hari)
- Cell 4  Training History 2×2 figure (MAE, Gap, LR Schedule)
- Cell 5  Comparison vs XGBoost (LSTM menang di 4 dari 6 metrik)

**Cell EXPERIMENTAL (opsional):**
- Cell 3  Training V2 dari awal (30-60 menit)  skip untuk presentasi

**[WARN] Catatan TensorFlow:** Mungkin ada DLL error pada hardware ini. Cell 2 (load checkpoint) tetap bisa berjalan jika model keras sudah tersimpan.

**[TARGET] Key Message:** "LSTM dipilih sebagai Model 2 Final: MAE Test=0.7985 hari, Error 1 hari=98.04%."

---

## FASE 8F  GRU RUL Predictor (Eksperimental)

**File:** `notebooks/fase_8_modeling/08f_rul_gru.ipynb`  
**Total cells:** 2 (code) | **Estimasi waktu:** 2-3 menit  
**Urutan run:** Cell 1  2 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  3-Way comparison (GRU gagal bersaing)

**Cell EXPERIMENTAL (opsional):**
- Cell 1 & 2  Seluruh notebook ini adalah eksperimen (GRU tidak dipilih)

---

## FASE 9  Evaluation & Model Selection

**File:** `notebooks/fase_9_evaluation/09_evaluation.ipynb`  
**Total cells:** 5 (code) | **Estimasi waktu:** 5-10 menit  
**Urutan run:** Cell 1  2  3  4  5 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  **HIGHLIGHT**: Comprehensive classifier comparison (Fatal Error=0 semua model)
- Cell 3  RUL comparison (LSTM vs XGBoost head-to-head)
- Cell 5  HTML Report generation (standalone, bisa dibuka offline)

**Cell EXPERIMENTAL (opsional):**
- Cell 4  Permutation Feature Importance (opsional, bisa di-skip jika waktu terbatas)

---

## FASE 10  Artifact Export

**File:** `notebooks/fase_10_export/10_artifact_export.ipynb`  
**Total cells:** 6 (code) | **Estimasi waktu:** 3-5 menit  
**Urutan run:** Cell 1  2  3  4  5  6 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 6  **HIGHLIGHT**: Smoke test 5/5 PASSED (demo API inference)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## Figure Export

**File:** `notebooks/figure_export.ipynb`  
**Total cells:** 2 (code) | **Estimasi waktu:** 2-5 menit  
**Urutan run:** Cell 1  2 (sequential, no skip)

**Cell penting untuk ditunjukkan:**
- Cell 2  Export semua figure ke figures/*.png (untuk paper IEEE)

**Cell EXPERIMENTAL (opsional):** Tidak ada

---

## RINGKASAN OUTPUT KUNCI PER FASE

| Fase | Output File Utama | Ukuran/Shape | Cell # |
|---|---|---|---|
| 1 | (tidak ada  data tetap di raw) | df_sensor 100K×11, df_maintenance 500×8 | 1 |
| 2 |  (analisis only) | Cohen's d table + 3 Failure Autopsy figures | 3 |
| 3 | df_sensor_labeled.parquet | 100K×14  HEALTHY/WARNING/CRITICAL | 2 |
| 4 | df_sensor_featured.parquet | 100K×75  +36 rolling, +18 lag, +5 ratio/degradation | 4 |
| 5 | df_model_ready.parquet + scaler.pkl | 100K×76 (scaled), 4.28 KB | 3-4 |
| 6 | df_ssbs.parquet | 20.423×76  SSBS result | 3 |
| 6.5 | df_ssbs_rul.parquet | 20.423×77 (+rul_days) | 2 |
| 7 | 13 split artifacts di data/processed/ | CLF Train 20.504×69, Val 3.288×69, Test 2.716×69 | 3 |
| 8A | rf_classifier.pkl | 3.15 MB  F1 Test=0.9914 | 1 |
| 8B | xgb_classifier.pkl + threshold=0.60 | 1.68 MB  F1 Val=0.9894 [STAR] | 2 |
| 8C | lgbm_classifier.pkl + threshold=0.65 |  F1 Test=0.9908 | 2 |
| 8D | xgb_regressor.pkl |  MAE Test=1.1020 hari | 1 |
| 8E | lstm_rul_best_v2.keras | 610.4 KB  MAE Test=0.7985 hari [STAR] | 2/3 |
| 8F | gru_rul_final.keras |  MAE Test=0.9515 (tidak dipilih) | 1 |
| 9 | model_evaluation_report.html | Standalone HTML report | 5 |
| 10 | classifier_final.pkl + rul_predictor_final.keras | 1.68 MB + 610.4 KB | 3-4 |

---

## CELL YANG PERLU DI-RUN ULANG UNTUK MENAMPILKAN OUTPUT

| Prioritas | Notebook | Cell # | Apa yang ditampilkan | Perlu run cell sebelumnya? |
|---|---|---|---|---|
| 1 (HIGH) | 08b | Cell 3 | Confusion Matrix XGBoost V2 + Comparison RF vs XGB | Ya, Cell 2 (training/load model) |
| 2 (HIGH) | 08e | Cell 5 | Actual vs Predicted LSTM + Comparison vs XGBoost | Ya, Cell 1 + Cell 2 (load checkpoint) |
| 3 (HIGH) | 02 | Cell 2 | Failure Autopsy 3 mesin (figure kritis) | Ya, Cell 1 (load data) |
| 4 (HIGH) | 02 | Cell 3 | Cohen's D bar chart (sensor informativeness) | Ya, Cell 1 (load data) |
| 5 (MED) | 09 | Cell 2 | Classifier comprehensive comparison table | Ya, Cell 1 (load semua model) |
| 6 (MED) | 09 | Cell 3 | RUL comparison LSTM vs XGBoost | Ya, Cell 1 + Cell 2 |
| 7 (MED) | 08a | Cell 3 | Feature Importance RF + Learning Curve | Ya, Cell 1 (training RF) |
| 8 (LOW) | 08e | Cell 4 | Training History 2×2 figure | Ya, Cell 3 (training) atau cukup Cell 2 (checkpoint) |
| 9 (LOW) | 09 | Cell 5 | HTML Report generation | Ya, Cell 1-4 |

---

## KEPUTUSAN FINAL (DIKUNCI)

| Track | Model | File | Metrik Utama |
|---|---|---|---|
| **Model 1  Classifier** | XGBoost V2 + Threshold 0.60 | `models/final/classifier_final.pkl` | F1 WARNING Val=0.9818, Fatal Error=0 |
| **Model 2  RUL Predictor** | LSTM V2 | `models/final/rul_predictor_final.keras` | MAE Test=0.7985 hari, Error1hari=98.04% |

**Deployment scope:**
- Model 1 berjalan untuk semua data sensor (real-time, satu sample sekaligus)
- Model 2 HANYA aktif jika Model 1 output = WARNING atau CRITICAL
- Input Model 2: sequence 24 timesteps × 69 fitur

---

*Generated by PRIME ML Pipeline Notebook Annotator*
