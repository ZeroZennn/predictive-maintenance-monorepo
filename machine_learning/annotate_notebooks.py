"""
PRIME ML Pipeline  Notebook Annotator
Menambahkan markdown annotation (Task A), menandai cell eksperimental (Task B),
dan membuat PRESENTATION_RUN_GUIDE.md (Task C)
"""

import json
import os
import re
import uuid
from pathlib import Path
from copy import deepcopy

#  ROOT PATH 
ML_ROOT = Path(__file__).parent
NB_ROOT  = ML_ROOT / "notebooks"

#  DAFTAR NOTEBOOK 
NOTEBOOKS = [
    ("00", "FASE 0  Environment Check",        NB_ROOT / "00_environment_check.ipynb"),
    ("01", "FASE 1  Data Ingestion",            NB_ROOT / "fase_1_ingestion/01_data_ingestion.ipynb"),
    ("02", "FASE 2  EDA Forensik",              NB_ROOT / "fase_2_eda/02_eda_forensik.ipynb"),
    ("03", "FASE 3  Label Engineering",         NB_ROOT / "fase_3_label_engineering/03_label_engineering.ipynb"),
    ("04", "FASE 4  Feature Engineering",       NB_ROOT / "fase_4_feature_engineering/04_feature_engineering.ipynb"),
    ("05", "FASE 5  Preprocessing",             NB_ROOT / "fase_5_preprocessing/05_preprocessing.ipynb"),
    ("06", "FASE 6  Imbalance Handling",        NB_ROOT / "fase_6_imbalance/06_imbalance_handling.ipynb"),
    ("06b","FASE 6.5  RUL Engineering",         NB_ROOT / "fase_6_imbalance/06b_rul_engineering.ipynb"),
    ("07", "FASE 7  Dataset Splitting",         NB_ROOT / "fase_7_splitting/07_dataset_splitting.ipynb"),
    ("08a","FASE 8A  Random Forest Classifier", NB_ROOT / "fase_8_modeling/08a_clf_random_forest.ipynb"),
    ("08b","FASE 8B  XGBoost Classifier",       NB_ROOT / "fase_8_modeling/08b_clf_xgboost.ipynb"),
    ("08c","FASE 8C  LightGBM Classifier",      NB_ROOT / "fase_8_modeling/08c_clf_lightgbm.ipynb"),
    ("08d","FASE 8D  XGBoost RUL Regressor",    NB_ROOT / "fase_8_modeling/08d_rul_xgboost_regressor.ipynb"),
    ("08e","FASE 8E  LSTM RUL Predictor",       NB_ROOT / "fase_8_modeling/08e_rul_lstm.ipynb"),
    ("08f","FASE 8F  GRU RUL Predictor",        NB_ROOT / "fase_8_modeling/08f_rul_gru.ipynb"),
    ("09", "FASE 9  Evaluation",                NB_ROOT / "fase_9_evaluation/09_evaluation.ipynb"),
    ("10", "FASE 10  Artifact Export",          NB_ROOT / "fase_10_export/10_artifact_export.ipynb"),
    ("FIG","Figure Export",                      NB_ROOT / "figure_export.ipynb"),
]

#  KNOWLEDGE BASE (dari PROJECT_LOG.md) 
# Annotation per notebook: setiap code cell mendapat markdown annotation
# Format: { nb_key: [ list of cell_annotations in order ] }
# Jika jumlah annotation < jumlah code cell, yang terakhir di-extend.

ANNOTATIONS = {
    "00": [
        {
            "title": "1. Cek Executable Python Aktif",
            "tujuan": "Memverifikasi bahwa Jupyter kernel menggunakan interpreter Python dari venv `lapis_ai` yang benar.",
            "input": "sys.executable (built-in)",
            "output": "Path executable Python yang aktif (stdout)",
            "catatan": "Jika path bukan `\\\\venv\\\\Scripts\\\\python.exe`, kernel salah  harus diganti ke kernel 'Lapis AI (Python 3.10)' sebelum menjalankan notebook lain.",
        },
        {
            "title": "2. Environment Check Report",
            "tujuan": "Memvalidasi versi semua library kunci dan ketersediaan file data sesuai config.py.",
            "input": "src/config.py (SENSOR_FILE, MAINTENANCE_FILE, GLOBAL_SEED, W_CRITICAL_HRS, W_WARNING_HRS)",
            "output": "Laporan Environment Check ke stdout",
            "catatan": (
                "[WARN] Output menampilkan W_WARNING_HRS=72 (nilai lama dari hipotesis awal Blueprint). "
                "Nilai final yang dikunci setelah EDA Forensik Fase 2 adalah W_WARNING_HRS=48. "
                "Pastikan config.py sudah diupdate sebelum menjalankan ulang Fase 38."
            ),
            "dipakai_di": "Slide halaman 1 (konfirmasi setup environment)",
        },
    ],

    "01": [
        {
            "title": "1. Setup, Load Data & Audit Awal",
            "tujuan": "Memuat sensor_readings.csv (100.000 baris, 20 mesin) dan maintenance_logs.csv, lalu validasi tipe data kolom kunci.",
            "input": "data/raw/sensor_readings.csv, data/raw/maintenance_logs.csv (via src/config.py)",
            "output": "df_sensor (100.000×11), df_maintenance (500×8)  in-memory",
            "catatan": (
                "Kritis: timestamp harus ter-parse sebagai datetime64[ns]  pra-syarat untuk semua operasi rolling/lag di Fase 4. "
                "machine_id harus dibaca sebagai str (bukan int) agar konsisten dengan kode downstream."
            ),
        },
        {
            "title": "2. Audit Lanjutan  Missing Values · Distribusi Failure · Statistik Sensor",
            "tujuan": "Menjalankan tiga pemeriksaan mendalam: missing values per kolom, distribusi label failure, dan statistik deskriptif sensor numerik.",
            "input": "df_sensor, df_maintenance (dari Cell 1)",
            "output": "Laporan audit ke stdout (missing values, distribusi label, statistik sensor)",
            "catatan": (
                "Distribusi label: failure=0 (99.944%) vs failure=1 (0.056%)  imbalance ekstrem yang menjadi motivasi utama SSBS di Fase 6. "
                "Nilai negatif pada vibration (min=-0.09) adalah Defect DFT-02 yang diselesaikan di Fase 5 dengan clip ke 0."
            ),
            "dipakai_di": "Paper IEEE Section III.A (Dataset Description)",
        },
        {
            "title": "3. Audit Temporal Integrity",
            "tujuan": "Memverifikasi konsistensi dimensi waktu: rentang global, duplikat timestamp, distribusi baris per mesin, dan gap temporal >1 jam.",
            "input": "df_sensor (dari Cell 1)",
            "output": "Laporan temporal integrity ke stdout",
            "catatan": (
                "Semua pemeriksaan PASSED: 0 duplikat timestamp, 5.000 baris per mesin (balanced), 0 gap >1 jam. "
                "Rentang waktu: 1 Jul 2025  25 Jan 2026 (208 hari)."
            ),
        },
    ],

    "02": [
        {
            "title": "1. Setup, Load Data & Isolasi Failure",
            "tujuan": "Memuat dataset sensor dan maintenance, mengkonfigurasi style visualisasi global, dan mengisolasi semua baris failure=1 untuk analisis forensik.",
            "input": "data/raw/sensor_readings.csv, data/raw/maintenance_logs.csv (via src/config.py)",
            "output": "df_sensor, df_maintenance, df_failures  DataFrame isolasi 56 kejadian failure",
            "catatan": (
                "Semua 20 mesin pernah mengalami failure minimal 1x. "
                "Rata-rata 2.80x failure per mesin. Distribusi failure per bulan paling tinggi di Agustus 2025 (30.36%)."
            ),
        },
        {
            "title": "2. Failure Autopsy Visualization (3 Mesin × 8 Sensor)",
            "tujuan": "Visualisasi pola sensor 72 jam sebelum failure untuk 3 mesin representatif (M-01: 4x failure, M-09: 2x, M-05: 1x) guna menemukan window waktu degradasi.",
            "input": "df_sensor, df_failures (dari Cell 1)",
            "output": "3 figure multi-panel (8 subplot sensor per mesin)  matplotlib",
            "catatan": (
                "TEMUAN KUNCI: Sinyal degradasi mulai terdeteksi T-48 jam, eskalasi dramatis di T-24 jam. "
                "Pola konsisten di ketiga mesin  bersifat universal. "
                "Ini menjadi basis penetapan W_WARNING_HRS=48 dan W_CRITICAL_HRS=24 (direvisi dari hipotesis awal W_WARNING=72)."
            ),
            "dipakai_di": "Paper IEEE Fig.1 (Failure Autopsy) / Slide halaman 5-6",
        },
        {
            "title": "3. Sensor Informativeness Test  Boxplot + Cohen's D",
            "tujuan": "Mengukur kemampuan diskriminatif setiap sensor antara kondisi HEALTHY vs FAILURE menggunakan Cohen's d effect size.",
            "input": "df_sensor (dari Cell 1)",
            "output": "Tabel Cohen's d per sensor + boxplot comparison",
            "catatan": (
                "6 sensor prioritas tinggi (Cohen's d > 2.5): vibration (3.37), pressure (3.06), rpm (2.91), noise_level (2.89), temperature (2.71), power_consumption (2.61). "
                "operating_hours menunjukkan paradoks: lebih rendah pada FAILURE  kemungkinan bias sampling. "
                "Semua sensor dipertahankan; keputusan final diserahkan ke feature importance Fase 8."
            ),
            "dipakai_di": "Paper IEEE Fig.2 (Cohen's D Chart) / Slide halaman 7",
        },
    ],

    "03": [
        {
            "title": "1. Setup + Temporal Backward-Labeling + Validasi",
            "tujuan": "Memuat df_sensor_labeled dari Fase 3, menerapkan temporal backward-labeling per failure event dengan window W_CRITICAL=24h dan W_WARNING=48h.",
            "input": "data/raw/sensor_readings.csv, W_CRITICAL_HRS=24, W_WARNING_HRS=48 (via src/config.py)",
            "output": "df_labeled (100.000×12)  DataFrame dengan kolom health_label baru",
            "catatan": (
                "Algoritma backward-labeling: CRITICAL  [T-24h, T_failure], WARNING  [T-48h, T-24h). "
                "WARNING tidak pernah menimpa CRITICAL (mutex constraint). "
                "Parameter window dikunci empiris dari Fase 2 EDA."
            ),
        },
        {
            "title": "2. Sensor Confirmation Layer & Export ke Parquet",
            "tujuan": "Memvalidasi label WARNING/CRITICAL menggunakan sensor evidence (2 dari 6 sensor melewati threshold P90 HEALTHY), encode label ke integer, lalu export ke parquet.",
            "input": "df_labeled (dari Cell 1), threshold P90 per sensor dari distribusi HEALTHY",
            "output": "data/interim/df_sensor_labeled.parquet (100.000×14), health_label_confirmed, health_label_encoded",
            "catatan": (
                "Threshold P90 yang dikunci: temp=76.30, vibration=0.59, pressure=103.80, rpm=2540, power=82.10, noise=74.30. "
                "Total downgrade: 49 baris WARNING  HEALTHY (1.82%). 0 CRITICAL di-downgrade. "
                "Distribusi final: HEALTHY=97.364%, WARNING=1.247%, CRITICAL=1.389%."
            ),
            "dipakai_di": "Paper IEEE Table II (Label Distribution)",
        },
        {
            "title": "3. Data Preview per Kelas + Export CSV",
            "tujuan": "Verifikasi visual hasil labeling dengan menampilkan sampel 3 baris per kelas dan mengexport CSV preview untuk inspeksi manual.",
            "input": "data/interim/df_sensor_labeled.parquet",
            "output": "data/interim/df_sensor_labeled_preview.csv (8.43 MB)  hanya untuk inspeksi manual",
            "catatan": "File CSV hanya untuk preview manual di Excel. Pipeline resmi tetap menggunakan .parquet.",
        },
    ],

    "04": [
        {
            "title": "1. Setup + Rolling Statistics per machine_id",
            "tujuan": "Memuat df_sensor_labeled, menghitung rolling statistics (mean, std, max) untuk 6 sensor prioritas tinggi dengan window 24h dan 48h per machine_id.",
            "input": "data/interim/df_sensor_labeled.parquet, W_CRITICAL_HRS=24, W_WARNING_HRS=48",
            "output": "df (100.000×50)  +36 kolom rolling: 6 sensor × 2 window × 3 stats",
            "catatan": (
                "Window 24h selaras W_CRITICAL_HRS, window 48h selaras W_WARNING_HRS  memastikan rolling features menangkap sinyal degradasi di kedua zona. "
                "Rolling std menghasilkan 20 NaN per sensor (baris pertama per mesin = undefined)  diselesaikan di Cell 2."
            ),
        },
        {
            "title": "2. Fix NaN pada Kolom Rolling STD",
            "tujuan": "Mengisi NaN pada 12 kolom rolling std (baris pertama tiap mesin) dengan 0 menggunakan fillna(0).",
            "input": "df (100.000×50) dari Cell 1",
            "output": "df (100.000×50)  0 NaN di seluruh DataFrame",
            "catatan": (
                "std dari 1 sampel = mathematically undefined  NaN pada baris pertama per mesin (20 baris × 12 kolom = 240 NaN). "
                "Fill dengan 0 = 'tidak ada variabilitas'  semantis tepat untuk awal pengukuran."
            ),
        },
        {
            "title": "3. Lag Features per machine_id",
            "tujuan": "Menghitung lag features (shift 6h, 12h, 24h) untuk 6 sensor prioritas tinggi per machine_id, lalu fill NaN dengan ffill + bfill.",
            "input": "df (100.000×50) dari Cell 2",
            "output": "df (100.000×68)  +18 kolom lag: 6 sensor × 3 lag size",
            "catatan": (
                "Lag features memberi model konteks temporal historis: 'nilai sensor 6/12/24 jam lalu'. "
                "Fill strategy: ffill (gunakan nilai terdekat sebelumnya)  bfill (untuk NaN di baris awal mesin)."
            ),
        },
        {
            "title": "4. Cross-Sensor Ratios & Degradation Proxy",
            "tujuan": "Menghitung 4 rasio cross-sensor (temp/vibration, power/rpm, pressure/temp, noise/vibration) dan 1 fitur degradasi (hours_since_last_maint) dari maintenance logs.",
            "input": "df (100.000×68) dari Cell 3, data/raw/maintenance_logs.csv",
            "output": "df (100.000×73)  +4 kolom ratio + 1 kolom degradation proxy",
            "catatan": (
                "Rasio cross-sensor menangkap interaksi antar sensor yang tidak bisa ditangkap individual. "
                "hours_since_last_maint: baris dengan nilai -1 = 2.856 (belum ada maintenance tercatat sebelumnya)  acceptable, bukan bug."
            ),
        },
    ],

    "05": [
        {
            "title": "1. Setup + Load Feature-Engineered Data",
            "tujuan": "Memuat df_sensor_featured dari Fase 4 dan memverifikasi shape dan kolom sebelum preprocessing.",
            "input": "data/interim/df_sensor_featured.parquet",
            "output": "df (100.000×75 atau lebih)  DataFrame siap preprocessing",
            "catatan": "Verifikasi bahwa semua 75 kolom feature (hasil Fase 4) hadir sebelum preprocessing dimulai.",
        },
        {
            "title": "2. Resolusi Defect Log + Pembersihan Data",
            "tujuan": "Menyelesaikan 4 defect log dari Fase 4: DFT-01 (parts_replaced NaN), DFT-02 (vibration negatif), DFT-03 (severity_score bimodal), DFT-04 (damage_category mismatch).",
            "input": "df dari Cell 1",
            "output": "df cleaned  vibration di-clip ke 0, kolom identifier diidentifikasi",
            "catatan": (
                "DFT-01 CLOSED: parts_replaced tidak di-merge ke df sensor. "
                "DFT-02 CLOSED: vibration negatif di-clip ke 0 (bisa karena sensor noise). "
                "DFT-03 DEFERRED: severity_score bimodal  re-encode jika diperlukan di Fase 8. "
                "DFT-04 CLOSED: damage_category mismatch minor  acceptable."
            ),
        },
        {
            "title": "3. StandardScaler  Fit pada Training Machines (M-01M-14)",
            "tujuan": "Menerapkan StandardScaler yang di-fit HANYA pada data mesin training (M-01 s/d M-14 = 70.000 baris) untuk mencegah data leakage.",
            "input": "df cleaned dari Cell 2, training machines = M-01 s/d M-14",
            "output": "df_model_ready (76 kolom), models/ml_track/scaler.pkl (4.28 KB)",
            "catatan": (
                "ARSITEKTUR KRITIS: Scaler di-fit hanya pada training machines  mencegah leakage informasi distribusi Val/Test ke model. "
                "Sebelumnya scaler di-fit pada 100.000 baris penuh  bug ini ditemukan di Fase 8A Forensic Investigation dan sudah difix. "
                "Dampak performa: F1 Val/Test tidak berubah karena homogenitas operasional 20 mesin."
            ),
        },
        {
            "title": "4. Export df_model_ready ke Parquet",
            "tujuan": "Mengexport DataFrame final yang sudah di-scale ke parquet sebagai input pipeline Fase 68.",
            "input": "df_model_ready dari Cell 3",
            "output": "data/processed/df_model_ready.parquet (19.27 MB), data/processed/df_model_ready_preview.csv (137.28 MB)",
            "catatan": "File parquet adalah pipeline resmi. CSV hanya untuk inspeksi manual di Excel.",
        },
    ],

    "06": [
        {
            "title": "1. Setup + Load df_model_ready",
            "tujuan": "Memuat df_model_ready dari Fase 5 dan memverifikasi distribusi kelas sebelum sampling.",
            "input": "data/processed/df_model_ready.parquet",
            "output": "df_model_ready  in-memory, distribusi kelas terverifikasi",
            "catatan": "Distribusi awal: HEALTHY=97.364%, WARNING=1.247%, CRITICAL=1.389%  imbalance ekstrem yang memotivasi SSBS.",
        },
        {
            "title": "2. SSBS  Stratified Sequential Block Sampling",
            "tujuan": "Menerapkan SSBS untuk mereduksi kelas HEALTHY sambil mempertahankan SEMUA baris WARNING dan CRITICAL, menggunakan strategi 2 blok temporal per mesin.",
            "input": "df_model_ready (100.000×76), parameter: quota=1000/mesin, block_size=500, safety_buffer=24 jam",
            "output": "df_ssbs  20.423 baris: HEALTHY=17.787 (87.09%), WARNING=1.247 (6.11%), CRITICAL=1.389 (6.80%)",
            "catatan": (
                "Metode SSBS: Blok A (500 baris pertama = kondisi prima) + Blok B (500 baris terakhir = pre-warning boundary). "
                "8 mesin dengan shortfall HEALTHY < 1.000: M-06(523), M-10(534), M-08(776), M-18(673), M-14(719), M-20(655), M-04(952), M-19(955). "
                "Shortfall adalah konsekuensi integritas temporal  bukan bug."
            ),
            "dipakai_di": "Paper IEEE Section III.C (Sampling Strategy)",
        },
        {
            "title": "3. Export df_ssbs ke Parquet",
            "tujuan": "Mengexport hasil SSBS ke parquet sebagai input Fase 6.5 (RUL Engineering) dan Fase 7 (Splitting).",
            "input": "df_ssbs dari Cell 2",
            "output": "data/processed/df_ssbs.parquet (4.47 MB), data/processed/df_ssbs_preview.csv (27.93 MB)",
            "catatan": (
                "ARSITEKTUR KRITIS: SMOTE TIDAK dijalankan di Fase 6. "
                "Dipindah ke Fase 7  diaplikasikan HANYA pada X_train setelah time-aware split. "
                "Alasan: mencegah Data Leakage temporal (sintetis dari Val/Test bisa bocor ke Train)."
            ),
        },
    ],

    "06b": [
        {
            "title": "1. Setup + Load df_ssbs + Rekayasa Kolom rul_days",
            "tujuan": "Memuat df_ssbs dari Fase 6 dan menghitung target variabel rul_days (Remaining Useful Life dalam hari) menggunakan timestamp dan failure events.",
            "input": "data/processed/df_ssbs.parquet",
            "output": "df_ssbs_rul  +1 kolom rul_days (float64, satuan hari)",
            "catatan": (
                "rul_days = waktu hingga failure berikutnya, dihitung per mesin. "
                "Baris HEALTHY yang tidak memiliki failure berikutnya  rul_days tinggi (outlier acceptable). "
                "Statistik: min=0.04 hari, max=146.92 hari, mean=29.38 hari, median=18.88 hari."
            ),
        },
        {
            "title": "2. Validasi & Export df_ssbs_rul",
            "tujuan": "Memvalidasi distribusi rul_days per kelas dan mengexport ke parquet sebagai input Fase 7.",
            "input": "df_ssbs_rul dari Cell 1",
            "output": "data/processed/df_ssbs_rul.parquet (4.50 MB), data/processed/df_ssbs_rul_preview.csv (28.05 MB)",
            "catatan": (
                "WARNING median ~2 hari (sesuai W_WARNING_HRS=48). CRITICAL median ~1 hari (sesuai W_CRITICAL_HRS=24). "
                "Outlier di CRITICAL (max=146.92)  CRITICAL rows dari failure terakhir mesin tanpa next failure. "
                "Model 2 HANYA aktif saat Model 1 mendeteksi WARNING/CRITICAL  scope deployment yang tepat."
            ),
            "dipakai_di": "Paper IEEE Table III (RUL Target Statistics)",
        },
    ],

    "07": [
        {
            "title": "1. Setup + Load Data + Machine-Based Split",
            "tujuan": "Memuat df_ssbs_rul dan menerapkan Machine-Based Split: Train=M-01M-14, Val=M-15M-17, Test=M-18M-20.",
            "input": "data/processed/df_ssbs_rul.parquet",
            "output": "X_train_clf, X_val, X_test, y_train_clf, y_val, y_test  split dasar",
            "catatan": (
                "Alasan Machine-Based (bukan Global Temporal): data run-to-failure menyebabkan WARNING/CRITICAL terkonsentrasi di akhir timeline. "
                "Global temporal split akan mengkonsentrasi minority class ke Test set  Train tidak belajar pola degradasi. "
                "Machine-based: setiap split punya full run-to-failure cycle."
            ),
        },
        {
            "title": "2. SMOTE pada X_train_clf (CLF Track Only)",
            "tujuan": "Menerapkan SMOTE HANYA pada X_train_clf untuk menyeimbangkan kelas minority WARNING dan CRITICAL di training set.",
            "input": "X_train_clf, y_train_clf (dari Cell 1)  Train: 14.419 baris",
            "output": "X_train_clf_smote (20.504×69), y_train_clf_smote  +6.085 sintetis",
            "catatan": (
                "SMOTE target: WARNING 901  4.000 (+3.099 sintetis), CRITICAL 1.014  4.000 (+2.986 sintetis). HEALTHY tidak berubah. "
                "X_train_rul TIDAK melalui SMOTE (regression track = natural data). "
                "Val & Test = 100% natural data, tanpa sintetis  Zero Data Leakage terkonfirmasi."
            ),
            "dipakai_di": "Paper IEEE Section III.D (Imbalance Handling)",
        },
        {
            "title": "3. Export 13 Split Artifacts",
            "tujuan": "Mengexport semua split artifacts (X, y untuk CLF dan RUL track) ke parquet untuk digunakan di Fase 8.",
            "input": "Semua DataFrame hasil split dan SMOTE",
            "output": "13 file parquet di data/processed/: X_train_clf, X_train_rul, X_val, X_test, y_train_clf, y_train_rul, y_val_clf, y_val_rul, y_test_clf, y_test_rul, machine_id_val, machine_id_test, df_ssbs_rul",
            "catatan": (
                "Shape final: CLF Train=20.504×69, Val=3.288×69, Test=2.716×69. "
                "RUL Train=14.419×69 (no SMOTE), Val=3.288×69, Test=2.716×69."
            ),
        },
    ],

    "08a": [
        {
            "title": "1. Setup + Load Data + Training Random Forest",
            "tujuan": "Memuat split artifacts dan melatih Random Forest Classifier dengan hyperparameter final: n_estimators=300, max_depth=20, class_weight='balanced'.",
            "input": "data/processed/X_train_clf.parquet, y_train_clf.parquet, X_val.parquet, y_val.parquet, X_test.parquet, y_test.parquet",
            "output": "model RF terlatih (in-memory), models/ml_track/rf_classifier.pkl (3.15 MB)",
            "catatan": (
                "class_weight='balanced' digunakan sebagai pengganti SMOTE untuk RF (atau tambahan). "
                "F1 Train=1.0000  slight overfitting, tapi learning curve konvergen (gap=0.001 di data penuh). "
                "Zero CRITICALHEALTHY error di Val dan Test  metrik bisnis terpenting."
            ),
        },
        {
            "title": "2. Evaluasi Val & Test + Confusion Matrix",
            "tujuan": "Mengevaluasi performa RF pada Val Set dan Test Set dengan F1-Score, Accuracy, Classification Report, dan Confusion Matrix.",
            "input": "model RF (dari Cell 1), X_val, y_val, X_test, y_test",
            "output": "Classification Report + Confusion Matrix figure  Val: F1=0.9292, Test: F1=0.9914",
            "catatan": (
                "WARNING Precision Val=0.692 (59 false alarm)  kelemahan utama RF yang menjadi motivasi XGBoost. "
                "Top feature: temperature_roll_max_24h (importance=0.077)  konfirmasi W_WARNING_HRS=48."
            ),
            "dipakai_di": "Paper IEEE Table IV (Classifier Comparison)",
        },
        {
            "title": "3. Learning Curve + Feature Importance",
            "tujuan": "Memplot learning curve untuk mendiagnosis overfitting dan feature importance untuk memahami kontribusi fitur.",
            "input": "model RF (dari Cell 1), X_train_clf, y_train_clf",
            "output": "Learning Curve figure + Feature Importance bar chart",
            "catatan": (
                "Learning curve konvergen di data penuh (Train-Val gap=0.001)  overfitting minor, acceptable. "
                "Rolling 48h mendominasi  konfirmasi W_WARNING_HRS=48 sebagai window yang tepat."
            ),
            "dipakai_di": "Paper IEEE Fig.4 (Feature Importance) / Slide halaman 12",
        },
    ],

    "08b": [
        {
            "title": "1. Setup + Load Data + Training XGBoost V1",
            "tujuan": "Memuat split artifacts dan melatih XGBoost Classifier versi pertama (V1) dengan early_stopping=30.",
            "input": "data/processed/X_train_clf.parquet, y_train_clf.parquet, X_val.parquet, y_val.parquet, X_test.parquet, y_test.parquet",
            "output": "model XGBoost V1 (berhenti di iterasi 40), F1 Val=0.6721, WARNING F1 Val=0.2186",
            "catatan": (
                "V1 GAGAL: early_stopping terlalu agresif (berhenti di iterasi 40 dari 500). "
                "mlogloss Val=0.317  model belum konvergen. WARNING F1=0.2186  jauh di bawah target. "
                "Ini adalah scientific iteration yang valid  tunjukkan sebagai bukti proses saat presentasi."
            ),
            "experimental": True,
            "exp_reason": (
                "Early stopping terlalu agresif (berhenti di iterasi 40), menghasilkan WARNING F1 Val=0.2186  jauh di bawah target. "
                "Diganti V2 dengan parameter early_stopping yang lebih longgar (PROJECT_LOG.md, Eksperimen 08B)."
            ),
            "exp_nilai": "Tunjukkan ini sebagai bukti proses scientific iteration  'ini percobaan pertama yang gagal, dan inilah kenapa kami ubah ke V2.'",
            "exp_status": "Output masih ada dari run sebelumnya.",
        },
        {
            "title": "2. Training XGBoost V2 + Threshold Tuning",
            "tujuan": "Melatih XGBoost V2 dengan parameter yang diperbaiki: learning_rate=0.01, early_stopping=99, max 499 iterasi. Lalu tuning threshold WARNING ke 0.60.",
            "input": "X_train_clf, y_train_clf, X_val, y_val (dari Cell 1)",
            "output": "models/ml_track/xgb_classifier.pkl (1.68 MB), threshold WARNING=0.60 dikunci",
            "catatan": (
                "V2 berjalan 499 iterasi  mlogloss 0.121 (vs V1: 0.317). "
                "Threshold 0.60 eliminasi false alarm: 954  1 baris. "
                "KRITIS untuk deployment: threshold=0.60 HARUS digunakan saat inference."
            ),
            "dipakai_di": "Paper IEEE Table IV + Slide halaman 13",
        },
        {
            "title": "3. Evaluasi Komprehensif V2 + Comparison vs RF",
            "tujuan": "Mengevaluasi XGBoost V2 (dengan threshold=0.60) pada Val dan Test set, lalu membandingkan performa dengan Random Forest.",
            "input": "model XGBoost V2 (dari Cell 2), X_val, y_val, X_test, y_test, threshold=0.60",
            "output": "Classification Report + Confusion Matrix + Perbandingan RF vs XGBoost",
            "catatan": (
                "Hasil final V2+Threshold: F1 Val=0.9894, F1 Test=0.9906, WARNING F1 Val=0.9818. "
                "XGBoost menang di F1 Val dan WARNING F1. RF menang di F1 Test (tipis: 0.9914 vs 0.9906). "
                "XGBoost dipilih sebagai Model 1 final berdasarkan WARNING F1 Val terbaik."
            ),
            "dipakai_di": "Paper IEEE Table IV (Leaderboard Classifier) / Slide halaman 14",
        },
    ],

    "08c": [
        {
            "title": "1. Setup + Load Data + Training LightGBM",
            "tujuan": "Memuat split artifacts dan melatih LightGBM Classifier. Early stopping aktif di iterasi 27 (sangat agresif).",
            "input": "data/processed/X_train_clf.parquet, y_train_clf.parquet, X_val.parquet, y_val.parquet",
            "output": "Model LightGBM (berhenti di iterasi 27), Val logloss=0.470, WARNING precision=0.119 (sebelum threshold)",
            "catatan": (
                "Early stopping sangat agresif karena learning_rate=0.05 + early_stopping=50 membuat kurva logloss stagnan di awal. "
                "Val logloss=0.470 vs XGBoost 0.121  LightGBM underperform sebelum tuning. "
                "985 HEALTHY salah prediksi sebagai WARNING (false alarm tinggi)."
            ),
        },
        {
            "title": "2. Threshold Tuning + Evaluasi Komprehensif",
            "tujuan": "Melakukan threshold tuning WARNING ke 0.65 untuk menyelamatkan LightGBM dari false alarm berlebihan, lalu evaluasi pada Val dan Test set.",
            "input": "Model LightGBM (dari Cell 1), X_val, y_val, X_test, y_test",
            "output": "models/ml_track/lgbm_classifier.pkl, threshold WARNING=0.65",
            "catatan": (
                "Threshold 0.65 berhasil 'menyelamatkan' model: F1 Val naik 0.6663  0.9845. "
                "F1 Test final: 0.9908 (sedikit lebih tinggi dari XGBoost 0.9906). "
                "Rekomendasi jika ingin re-run: gunakan learning_rate=0.01 + early_stopping=100 untuk iterasi lebih banyak."
            ),
            "dipakai_di": "Paper IEEE Table IV (Leaderboard Classifier)",
        },
    ],

    "08d": [
        {
            "title": "1. Setup + Load Data + Filter WARNING+CRITICAL + Training XGBoost Regressor",
            "tujuan": "Memuat data RUL track, filter hanya baris WARNING dan CRITICAL, lalu melatih XGBoost Regressor dengan 1.000 estimators dan MAE sebagai eval metric.",
            "input": "data/processed/X_train_rul.parquet, y_train_rul.parquet, X_val_rul.parquet, y_val_rul.parquet, df_ssbs_rul.parquet",
            "output": "models/ml_track/xgb_regressor.pkl, best_iteration=497, Val MAE=1.7189 hari",
            "catatan": (
                "RUL Predictor hanya bekerja pada WARNING+CRITICAL: Train=1.915 baris, Val=288, Test=433. "
                "Filter ini adalah keputusan arsitektur: HEALTHY tidak informatif untuk prediksi RUL jangka panjang (MAE=13.77 hari). "
                "MAPE tidak digunakan (nilai RUL mendekati 0 inflate MAPE)."
            ),
        },
        {
            "title": "2. Evaluasi + Error Analysis per Kelas",
            "tujuan": "Mengevaluasi XGBoost Regressor pada Val dan Test set dengan MAE, RMSE, R², dan business accuracy (Error  N hari).",
            "input": "Model XGBoost Regressor (dari Cell 1), X_val, y_val, X_test, y_test (filtered WARNING+CRITICAL)",
            "output": "Metrik evaluasi + Actual vs Predicted scatter plot",
            "catatan": (
                "Test MAE=1.1020 hari, Error 1 hari=93.53%, Error 3 hari=94.92%. "
                "Per kelas: WARNING MAE=0.10 hari (excellent!), CRITICAL MAE=2.03 hari (good). "
                "R²=0.3961 rendah karena outlier RUL tinggi  bukan indikator kualitas prediksi jangka pendek."
            ),
            "dipakai_di": "Paper IEEE Table V (RUL Comparison) / Slide halaman 16",
        },
        {
            "title": "3. Feature Importance XGBoost Regressor",
            "tujuan": "Menganalisis feature importance XGBoost Regressor untuk memahami fitur yang paling berkontribusi pada prediksi RUL.",
            "input": "Model XGBoost Regressor (dari Cell 1)",
            "output": "Feature Importance bar chart  top feature: power_consumption_roll_std_48h",
            "catatan": "Top feature power_consumption_roll_std_48h adalah domain-valid: variabilitas konsumsi daya 48 jam terakhir mencerminkan degradasi mesin.",
        },
    ],

    "08e": [
        {
            "title": "1. Setup, Load Data & Sequence Preparation",
            "tujuan": "Memuat data RUL track, filter WARNING+CRITICAL, lalu reshape data ke format 3D sequence untuk LSTM: (samples, SEQ_LEN=24, n_features=69).",
            "input": "data/processed/X_train_rul.parquet, y_train_rul.parquet, X_val_rul, y_val_rul, X_test_rul, y_test_rul, df_ssbs_rul.parquet",
            "output": "X_train_seq (shape: N×24×69), X_val_seq, X_test_seq, y_train_seq, y_val_seq, y_test_seq",
            "catatan": (
                "SEQ_LEN=24 timesteps = 24 jam look-back window. "
                "[WARN] TensorFlow mengalami DLL load error pada hardware ini (CPU tanpa AVX/AVX2). "
                "Model V2 sudah tersimpan sebagai checkpoint  jalankan Cell 2 untuk load checkpoint langsung."
            ),
        },
        {
            "title": "2. Load Checkpoint V2 (Val MAE = 0.8160)",
            "tujuan": "Memuat model LSTM V2 terbaik dari checkpoint yang sudah tersimpan sebelumnya (Val MAE = 0.8160 hari di epoch 184).",
            "input": "models/dl_track/lstm_rul_best_v2.keras",
            "output": "model_v2  LSTM model siap untuk evaluasi (47.649 params)",
            "catatan": (
                "Checkpoint V2 merupakan hasil training 200 epoch dengan L2 regularization dan Dropout 0.3. "
                "JALANKAN CELL INI (bukan Cell 3 training) jika ingin menampilkan evaluasi tanpa re-training."
            ),
        },
        {
            "title": "3. Arsitektur & Training LSTM V2",
            "tujuan": "Mendefinisikan arsitektur LSTM V2 (2 LSTM layer + BatchNorm + Dropout + Dense) dan melatih ulang dari awal dengan max 200 epoch.",
            "input": "X_train_seq, y_train_seq, X_val_seq, y_val_seq (dari Cell 1)",
            "output": "models/dl_track/lstm_rul_best_v2.keras (checkpoint), history_v2 (training history)",
            "catatan": (
                "HANYA JALANKAN JIKA ingin re-training. Waktu training: ~30-60 menit. "
                "Arsitektur V2: LSTM(64)+Dropout(0.3)+BatchNorm  LSTM(32)+Dropout(0.3)+BatchNorm  Dense(16)  Dense(1). "
                "Perubahan dari V1: dropout 0.20.3, +L2(0.001), epoch 100200, patience 1530."
            ),
            "experimental": True,
            "exp_reason": (
                "V1 belum konvergen (berhenti di epoch 99 = max epoch, Val MAE=1.7516). "
                "V2 menghasilkan Val MAE=0.8160 di epoch 184  improvement signifikan. "
                "V3 gagal (optimizer reset, epoch 5). V3 sudah dihapus dari notebook (PROJECT_LOG.md, 08E)."
            ),
            "exp_nilai": "Menunjukkan proses iteratif hyperparameter tuning dari V1  V2  V3 (gagal)  V2 sebagai final.",
            "exp_status": "Output sudah di-clear. Jalankan Cell 2 (load checkpoint) untuk melihat model tanpa re-training.",
        },
        {
            "title": "4. Training History Visualization",
            "tujuan": "Memvisualisasikan learning curve (MAE full, MAE zoomed, Train-Val gap, Learning Rate schedule) untuk analisis konvergensi dan overfitting.",
            "input": "history_v2 (dari Cell 3)  ATAU gunakan Cell 2 checkpoint",
            "output": "Figure 2×2 panel: MAE Full, MAE Zoomed, Train-Val Gap, LR Schedule",
            "catatan": (
                "Train-Val gap = 0.60 hari (moderate, acceptable). Val curve masih turun di akhir  bukan overfitting sejati. "
                "Root cause gap: Val set hanya 264 samples (statistical noise)."
            ),
            "dipakai_di": "Paper IEEE Fig.5 (LSTM Training Curve) / Slide halaman 17",
        },
        {
            "title": "5. Evaluasi Final & Comparison vs XGBoost",
            "tujuan": "Mengevaluasi LSTM V2 pada Val dan Test set, lalu membandingkan head-to-head dengan XGBoost Regressor.",
            "input": "model_v2 (dari Cell 2 atau 3), X_val_seq, y_val_seq, X_test_seq, y_test_seq",
            "output": "Metrik LSTM + Comparison table + Actual vs Predicted scatter plot",
            "catatan": (
                "LSTM V2 unggul: MAE Test=0.7985 hari (vs XGBoost 1.1020), Error 1 hari=98.04% (vs 93.53%). "
                "LSTM dipilih sebagai Model 2 Final berdasarkan MAE Test terbaik dan Error  N hari."
            ),
            "dipakai_di": "Paper IEEE Table V (RUL Leaderboard) / Slide halaman 18",
        },
        {
            "title": "6. Export Model Final",
            "tujuan": "Menyimpan model LSTM V2 final ke direktori models/dl_track sebagai artifact pipeline.",
            "input": "model_v2 (dari Cell 2 atau 3)",
            "output": "models/dl_track/lstm_rul_best_v2.keras (610.4 KB)",
            "catatan": "Model ini akan dipackage ulang di Fase 10 ke models/final/rul_predictor_final.keras.",
        },
    ],

    "08f": [
        {
            "title": "1. Setup + Load Data + Filter WARNING+CRITICAL + Training GRU",
            "tujuan": "Memuat data RUL track, filter WARNING+CRITICAL, lalu melatih GRU Predictor dengan arsitektur yang lebih ringan dari LSTM.",
            "input": "data/processed/X_train_rul.parquet, y_train_rul.parquet, X_val_rul, y_val_rul, X_test_rul, y_test_rul, df_ssbs_rul.parquet",
            "output": "models/dl_track/gru_rul_final.keras, Val MAE=1.8618 hari (Test MAE=0.9515)",
            "catatan": (
                "Arsitektur GRU: GRU(48)+Dropout(0.3)+BatchNorm  GRU(24)+Dropout(0.3)+BatchNorm  Dense(16)  Dense(1). "
                "~27.000 params (lebih ringan dari LSTM 47.649). "
                "Early stopping aktif di epoch 151 dari max 300."
            ),
        },
        {
            "title": "2. Evaluasi + Perbandingan 3-Way (XGBoost vs LSTM vs GRU)",
            "tujuan": "Mengevaluasi GRU pada Val dan Test set, lalu membandingkan dengan XGBoost Regressor dan LSTM V2.",
            "input": "Model GRU (dari Cell 1), X_val_seq, y_val_seq, X_test_seq, y_test_seq",
            "output": "Metrik GRU + Tabel perbandingan 3-way + Visualisasi",
            "catatan": (
                "GRU TIDAK DIPILIH sebagai model final: overspecialize pada CRITICAL (MAE=0.01 hari) tapi sangat buruk di WARNING (MAE=1.91 hari). "
                "GRU menang di 0 dari 6 metrik vs LSTM V2 dan XGBoost. "
                "Disimpan sebagai artefak dokumentasi eksperimen."
            ),
            "experimental": True,
            "exp_reason": (
                "GRU gagal bersaing dengan LSTM V2: Train-Val gap=0.90 hari (lebih buruk dari LSTM 0.60), "
                "kapasitas representasi terlalu terbatas untuk menangkap pola WARNING yang kompleks. "
                "VERDICT: TIDAK DIPILIH sebagai Model Final (PROJECT_LOG.md, Eksperimen 08F)."
            ),
            "exp_nilai": "Tunjukkan sebagai perbandingan arsitektur: GRU lebih ringan tapi kalah akurasi di WARNING zone.",
            "exp_status": "Output evaluasi masih ada. Model tersimpan di models/dl_track/gru_rul_final.keras.",
        },
    ],

    "09": [
        {
            "title": "1. Setup + Load Semua Model + Data",
            "tujuan": "Memuat 5 model terlatih (3 classifier + 2 RUL predictor) dan semua split artifacts untuk evaluasi komprehensif.",
            "input": "models/ml_track/{rf,xgb,lgbm}_classifier.pkl, models/ml_track/xgb_regressor.pkl, models/dl_track/lstm_rul_best_v2.keras, semua split artifacts",
            "output": "5 model object siap evaluasi  in-memory",
            "catatan": "Pastikan semua model sudah ada di direktori yang benar sebelum menjalankan notebook ini.",
        },
        {
            "title": "2. Evaluasi Komprehensif Classifier (3 Model)",
            "tujuan": "Mengevaluasi RF, XGBoost V2+Threshold, dan LightGBM+Threshold pada Test Set dengan metrik bisnis utama: F1, Fatal Error rate, false alarm rate.",
            "input": "3 classifier models + X_test, y_test",
            "output": "Comprehensive metrics table + Confusion Matrices + Feature Importance Consensus",
            "catatan": (
                "Metrik bisnis kritis: Fatal Error (CRITICALHEALTHY) = 0 untuk SEMUA model. "
                "False Alarm Rate terendah: XGBoost. "
                "KEPUTUSAN: XGBoost V2 + Threshold(0.60) dipilih sebagai Model 1 Final."
            ),
            "dipakai_di": "Paper IEEE Table IV (Final Classifier Comparison) / Slide halaman 19",
        },
        {
            "title": "3. Evaluasi Komprehensif RUL (XGBoost vs LSTM)",
            "tujuan": "Mengevaluasi XGBoost Regressor dan LSTM V2 pada Val dan Test set dengan core metrics dan business accuracy.",
            "input": "2 RUL models + X_val_seq, y_val_seq, X_test_seq, y_test_seq",
            "output": "Core Metrics + Business Accuracy table + Timeline M-19 visualization",
            "catatan": (
                "KEPUTUSAN: LSTM V2 dipilih sebagai Model 2 Final: MAE Test=0.7985 hari, Error 1 hari=98.04%. "
                "Known limitation: R² lebih rendah dari XGBoost karena sensitivitas outlier  bukan cacat model."
            ),
            "dipakai_di": "Paper IEEE Table V (Final RUL Comparison) / Slide halaman 20",
        },
        {
            "title": "4. LSTM Permutation Feature Importance",
            "tujuan": "Menghitung Permutation Feature Importance untuk LSTM V2 dengan seed terkunci (GLOBAL_SEED=42).",
            "input": "LSTM V2 model, X_test_seq, y_test_seq",
            "output": "Top 5 fitur paling berpengaruh terhadap prediksi LSTM (bervariasi per run)",
            "catatan": "Cell tambahan  bukan bagian cell evaluasi utama. Seed dikunci untuk konsistensi antar run.",
        },
        {
            "title": "5. Generate HTML Report Evaluasi Final",
            "tujuan": "Menggenerate laporan evaluasi HTML standalone dengan 7 visualisasi ter-embed sebagai base64 PNG dan narrative decision.",
            "input": "Semua hasil evaluasi dari Cell 2 dan 3",
            "output": "notebooks/fase_9_evaluation/model_evaluation_report.html (standalone)",
            "catatan": "File HTML standalone bisa dibuka di browser tanpa koneksi internet. Berguna untuk presentasi offline.",
            "dipakai_di": "Lampiran laporan / Portfolio showcase",
        },
    ],

    "10": [
        {
            "title": "1. Setup + Load Model Final + Validasi",
            "tujuan": "Memuat model final (XGBoost V2 + LSTM V2) dan memvalidasi sebelum packaging ke deployment artifacts.",
            "input": "models/ml_track/xgb_classifier.pkl, models/dl_track/lstm_rul_best_v2.keras, models/ml_track/scaler.pkl",
            "output": "Model objects siap packaging  in-memory",
            "catatan": "Verifikasi threshold=0.60 masih terkunci di XGBoost sebelum packaging.",
        },
        {
            "title": "2. Build sklearn Pipeline (FeatureEngineeringTransformer)",
            "tujuan": "Membangun sklearn Pipeline yang portable dengan custom FeatureEngineeringTransformer untuk digunakan di production inference.",
            "input": "src/preprocessing_pipeline.py (FeatureEngineeringTransformer)",
            "output": "models/final/preprocessing_pipeline.pkl (6.0 KB)",
            "catatan": (
                "FeatureEngineeringTransformer dipindah ke src/preprocessing_pipeline.py untuk menghindari __main__ pickle deserialization bug. "
                "Pipeline = scaler + feature transformer dalam satu object sklearn."
            ),
        },
        {
            "title": "3. Export Classifier Final",
            "tujuan": "Mengexport XGBoost V2 + threshold sebagai classifier_final.pkl ke models/final/.",
            "input": "models/ml_track/xgb_classifier.pkl",
            "output": "models/final/classifier_final.pkl (1.68 MB)",
            "catatan": "File ini yang diload oleh src/inference.py di production.",
        },
        {
            "title": "4. Export RUL Predictor Final",
            "tujuan": "Mengexport LSTM V2 sebagai rul_predictor_final.keras ke models/final/.",
            "input": "models/dl_track/lstm_rul_best_v2.keras",
            "output": "models/final/rul_predictor_final.keras (610.4 KB)",
            "catatan": (
                "LSTM warm-up call dijalankan saat _load_models() startup untuk menghindari cold-start latency. "
                "workers=1 di uvicorn CMD  LSTM tidak thread-safe untuk multi-worker."
            ),
        },
        {
            "title": "5. Generate Model Cards (JSON)",
            "tujuan": "Membuat model card JSON untuk setiap model final, berisi metadata, constraints, dan deployment info.",
            "input": "Model metadata dari Fase 8-9",
            "output": "models/final/classifier_model_card.json (1.9 KB), models/final/rul_predictor_model_card.json (2.0 KB)",
            "catatan": "Model card mencatat threshold=0.60, seq_len=24, scope deployment (WARNING/CRITICAL only untuk RUL), dan known limitations.",
        },
        {
            "title": "6. FastAPI HTTP Wrapper + Smoke Test",
            "tujuan": "Memverifikasi src/app.py FastAPI wrapper berfungsi dengan 5 skenario smoke test: HEALTHY, CRITICAL+history, missing sensor, missing field, timing test.",
            "input": "src/app.py, src/inference.py, semua model final",
            "output": "5/5 smoke test PASSED  latency: avg 49.7ms, max 54.0ms",
            "catatan": (
                "API endpoints: GET /health + POST /api/ml/predict. "
                "sensor_history (23 entri) opsional untuk LSTM sequence. "
                "CRITICAL+history test: RUL=1.585 hari, Urgency=CRITICAL, 116ms."
            ),
            "dipakai_di": "Laporan deployment / Demo live ke dosen",
        },
    ],

    "FIG": [
        {
            "title": "1. Setup + Load Data untuk Figure Export",
            "tujuan": "Memuat semua artifacts yang diperlukan untuk menggenerate figure-figure publikasi berkualitas tinggi.",
            "input": "Semua parquet artifacts + model pkl/keras files",
            "output": "Variabel data siap untuk plotting",
            "catatan": "Figure export menggunakan DPI tinggi (300dpi) untuk kualitas publikasi IEEE.",
        },
        {
            "title": "2. Export Figures untuk Paper & Presentasi",
            "tujuan": "Menggenerate dan menyimpan semua figure ke direktori figures/ dalam format PNG berkualitas publikasi.",
            "input": "Data dan model dari Cell 1",
            "output": "machine_learning/figures/*.png  semua figure untuk paper IEEE dan slide",
            "catatan": "Jalankan cell ini jika figures/ perlu di-regenerate setelah perubahan data atau model.",
            "dipakai_di": "Paper IEEE (semua figure) / Slide (semua halaman dengan visualisasi)",
        },
    ],
}

#  FUNGSI HELPER 

def make_markdown_cell(source_lines: list) -> dict:
    """Membuat markdown cell baru."""
    return {
        "cell_type": "markdown",
        "id": uuid.uuid4().hex[:8],
        "metadata": {},
        "source": source_lines,
    }


def build_annotation_markdown(cell_num: int, ann: dict) -> list:
    """Membuat source lines untuk markdown annotation cell."""
    lines = []
    lines.append(f"### {ann['title']}\n")
    lines.append(f"**Tujuan:** {ann['tujuan']}  \n")
    lines.append(f"**Input:** {ann['input']}  \n")
    lines.append(f"**Output:** {ann['output']}  \n")
    if ann.get("catatan"):
        lines.append(f"**Catatan:** {ann['catatan']}  \n")
    if ann.get("dipakai_di"):
        lines.append(f"\n[TARGET] **Dipakai di:** {ann['dipakai_di']}")
    return lines


def build_experimental_markdown(ann: dict) -> list:
    """Membuat source lines untuk markdown peringatan EXPERIMENTAL."""
    lines = []
    lines.append("> [WARN] **[EXPERIMENTAL/DEPRECATED  Tidak digunakan di pipeline final]**\n")
    lines.append(">\n")
    lines.append(f"> **Alasan:** {ann.get('exp_reason', 'Lihat PROJECT_LOG.md untuk detail.')}\n")
    lines.append(">\n")
    lines.append(f"> **Nilai untuk presentasi:** {ann.get('exp_nilai', 'Menunjukkan proses iteratif.')}\n")
    lines.append(">\n")
    lines.append(f"> **Status output:** {ann.get('exp_status', 'Cek dan isi sesuai kondisi aktual.')}")
    return lines


def is_annotation_already_present(cells: list, code_cell_idx: int) -> bool:
    """
    Cek apakah markdown annotation dengan format standar sudah ada
    tepat di atas code cell ke-code_cell_idx.
    """
    if code_cell_idx == 0:
        return False
    prev_cell = cells[code_cell_idx - 1]
    if prev_cell.get("cell_type") != "markdown":
        return False
    src = "".join(prev_cell.get("source", []))
    # Annotation standar dimulai dengan ### dan mengandung **Tujuan:**
    return "**Tujuan:**" in src and src.strip().startswith("###")


def is_experimental_already_present(cells: list, code_cell_idx: int) -> bool:
    """Cek apakah peringatan EXPERIMENTAL sudah ada di atas code cell."""
    if code_cell_idx == 0:
        return False
    prev_cell = cells[code_cell_idx - 1]
    if prev_cell.get("cell_type") != "markdown":
        return False
    src = "".join(prev_cell.get("source", []))
    return "EXPERIMENTAL" in src or "DEPRECATED" in src


def process_notebook(nb_key: str, nb_label: str, nb_path: Path) -> dict:
    """
    Proses satu notebook:
    - Tambahkan/perbaiki markdown annotation (Task A)
    - Tandai cell eksperimental (Task B)
    - Kembalikan statistik
    """
    print(f"\n  [NB] [{nb_key}] Memproses: {nb_path.name}")

    if not nb_path.exists():
        print(f"     [WARN]  FILE TIDAK DITEMUKAN: {nb_path}")
        return {
            "label": nb_label,
            "path": str(nb_path),
            "total_cells": 0,
            "code_cells": 0,
            "md_added": 0,
            "md_improved": 0,
            "experimental": 0,
            "error": "File tidak ditemukan",
        }

    # Load notebook
    with open(nb_path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    cells = nb.get("cells", [])
    ann_list = ANNOTATIONS.get(nb_key, [])

    new_cells = []
    code_cell_counter = 0
    md_added = 0
    md_improved = 0
    experimental_count = 0

    i = 0
    while i < len(cells):
        cell = cells[i]
        cell_type = cell.get("cell_type", "")

        if cell_type == "code":
            ann_idx = min(code_cell_counter, len(ann_list) - 1) if ann_list else -1
            ann = ann_list[ann_idx] if ann_idx >= 0 else None

            #  Task B: Tandai cell EXPERIMENTAL 
            if ann and ann.get("experimental"):
                # Cek apakah peringatan sudah ada
                exp_already = (
                    i > 0
                    and cells[i-1].get("cell_type") == "markdown"
                    and "EXPERIMENTAL" in "".join(cells[i-1].get("source", []))
                )
                if not exp_already:
                    exp_md = make_markdown_cell(build_experimental_markdown(ann))
                    new_cells.append(exp_md)
                    experimental_count += 1
                    print(f"     [WARN]  Cell {code_cell_counter+1}: Ditandai EXPERIMENTAL")

            #  Task A: Tambah/perbaiki markdown annotation 
            if ann:
                # Cek apakah annotation sudah ada di sel sebelumnya di new_cells
                already_annotated = (
                    len(new_cells) > 0
                    and new_cells[-1].get("cell_type") == "markdown"
                    and "**Tujuan:**" in "".join(new_cells[-1].get("source", []))
                )

                if already_annotated:
                    # Perbaiki/timpa annotation yang ada dengan versi lebih lengkap
                    new_cells[-1]["source"] = build_annotation_markdown(code_cell_counter + 1, ann)
                    md_improved += 1
                    print(f"     [EDIT]  Cell {code_cell_counter+1}: Markdown diperbaiki ({ann['title'][:40]}...)")
                else:
                    # Cek apakah ada markdown biasa tepat sebelumnya (header notebook, dll)
                    prev_is_plain_md = (
                        len(new_cells) > 0
                        and new_cells[-1].get("cell_type") == "markdown"
                        and "**Tujuan:**" not in "".join(new_cells[-1].get("source", []))
                    )
                    # Tambahkan annotation baru
                    ann_md = make_markdown_cell(build_annotation_markdown(code_cell_counter + 1, ann))
                    new_cells.append(ann_md)
                    md_added += 1
                    print(f"     [OK]  Cell {code_cell_counter+1}: Markdown ditambahkan ({ann['title'][:40]}...)")

            new_cells.append(cell)
            code_cell_counter += 1

        else:
            # Markdown/raw cell  pertahankan
            new_cells.append(cell)

        i += 1

    # Update notebook
    nb["cells"] = new_cells

    # Simpan notebook
    with open(nb_path, "w", encoding="utf-8") as f:
        json.dump(nb, f, indent=1, ensure_ascii=False)

    total_cells = len(new_cells)
    print(f"     [CHART] Total cells: {total_cells} | Code cells: {code_cell_counter} | MD Ditambah: {md_added} | MD Diperbaiki: {md_improved} | Experimental: {experimental_count}")

    return {
        "label": nb_label,
        "path": str(nb_path),
        "total_cells": total_cells,
        "code_cells": code_cell_counter,
        "md_added": md_added,
        "md_improved": md_improved,
        "experimental": experimental_count,
        "error": None,
    }


#  TASK C: GENERATE PRESENTATION RUN GUIDE 

GUIDE_CONTENT = """# PRIME ML Pipeline  Presentation Run Guide
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
"""


def generate_run_guide(output_path: Path) -> None:
    """Generate PRESENTATION_RUN_GUIDE.md."""
    output_path.write_text(GUIDE_CONTENT, encoding="utf-8")
    print(f"\n  [DOC] PRESENTATION_RUN_GUIDE.md ditulis ke: {output_path}")


#  MAIN 

def main():
    print("=" * 60)
    print("  NOTEBOOK ANNOTATION  MULAI PROSES")
    print("=" * 60)

    results = []

    for nb_key, nb_label, nb_path in NOTEBOOKS:
        stat = process_notebook(nb_key, nb_label, nb_path)
        results.append((nb_key, nb_label, stat))

    # Generate Run Guide
    guide_path = ML_ROOT / "PRESENTATION_RUN_GUIDE.md"
    generate_run_guide(guide_path)

    # Ringkasan
    print("\n" + "=" * 60)
    print("  NOTEBOOK ANNOTATION  SUMMARY")
    print("=" * 60)

    total_added = 0
    total_improved = 0
    total_experimental = 0

    for nb_key, nb_label, stat in results:
        if stat.get("error"):
            print(f"\n  [ERR] {nb_label}")
            print(f"     Error: {stat['error']}")
        else:
            print(f"\n  {nb_label}")
            print(f"    Total cells        : {stat['total_cells']}")
            print(f"    Code cells         : {stat['code_cells']}")
            print(f"    Markdown ditambah  : {stat['md_added']}")
            print(f"    Markdown diperbaiki: {stat['md_improved']}")
            print(f"    Cell EXPERIMENTAL  : {stat['experimental']}")
        total_added      += stat.get("md_added", 0)
        total_improved   += stat.get("md_improved", 0)
        total_experimental += stat.get("experimental", 0)

    print("\n" + "=" * 60)
    print(f"  TOTAL Markdown ditambah  : {total_added}")
    print(f"  TOTAL Markdown diperbaiki: {total_improved}")
    print(f"  TOTAL Cell EXPERIMENTAL  : {total_experimental}")
    print("=" * 60)
    print("  [OK] PRESENTATION_RUN_GUIDE.md generated")
    print("=" * 60)


if __name__ == "__main__":
    main()
