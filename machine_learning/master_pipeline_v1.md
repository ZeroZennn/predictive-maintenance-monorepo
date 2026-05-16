# MASTER BLUEPRINT: LAPIS AI — PREDICTIVE MAINTENANCE PIPELINE
### *Arsitektur Standar Enterprise | Mode 1: Architecture Design*

---

## BAGIAN 1: DAFTAR MASTER PIPELINE

> **Prinsip Fondasi:** *"Garbage In, Garbage Out"* — Kita investasikan 70% energi di Fase 1–4 sebelum menyentuh algoritma apapun.

---

**FASE 0 — Environment & Reproducibility Setup**
Membangun fondasi teknis yang deterministik: struktur direktori proyek, manajemen dependensi, dan seed global agar setiap eksperimen dapat direproduksi secara identik.

**FASE 1 — Data Ingestion & Sanity Check**
Memuat kedua sumber data (`sensor_readings.csv` & `maintenance_logs.csv`) dan melakukan audit integritas awal: tipe data, range nilai, jumlah missing values, dan distribusi label target sebelum satu baris pun dimodifikasi.

**FASE 2 — Exploratory Data Analysis (EDA) Forensik**
Melakukan investigasi mendalam berbasis visualisasi untuk memahami perilaku sensor pada periode mendekati *failure*, mengidentifikasi korelasi antar fitur, dan mendeteksi anomali atau outlier yang bersifat informatif (bukan sekadar noise).

**FASE 3 — Temporal Label Engineering (The Core Logic)**
Fase paling kritis dan unik proyek ini: mentransformasi label biner `failure` menjadi klasifikasi multi-kelas **Healthy / Warning / Critical** menggunakan logika temporal berbasis *look-back window* terhadap setiap kejadian `failure = 1`.

**FASE 4 — Feature Engineering & Enrichment**
Mengekstrak fitur-fitur baru yang kaya sinyal dari data mentah: *rolling statistics* (mean, std, max per window), *lag features*, fitur turunan dari `maintenance_logs`, dan perhitungan degradasi berbasis `operating_hours`.

**FASE 5 — Data Preprocessing & Cleansing Pipeline**
Menangani missing values secara strategis (bukan sekedar *drop* atau *mean-fill*), normalisasi/standarisasi fitur numerik, dan encoding kategorikal — semua dibungkus dalam `Pipeline` objek yang dapat di-*reuse* saat inferensi.

**FASE 6 — Imbalance Handling: SSBS (Stratified Sequential Block Sampling)**
Mengatasi dominasi kelas HEALTHY (97.4%) menggunakan teknik Stratified Sequential Block Sampling — mengambil dua blok kronologis per mesin (kondisi prima & pre-warning boundary) dengan safety buffer 24 jam. Output fase ini adalah dataset SSBS bersih (±20,423 baris) TANPA augmentasi sintetis — menjaga integritas temporal sepenuhnya. SMOTE TIDAK dijalankan di fase ini untuk mencegah Data Leakage. 

**FASE 6.5 — RUL Target Engineering**
Membuat kolom 'rul_days' di df_ssbsm Karena Model 2 membutuhkan target variabel numerik RUL dalam satuan hari.

**FASE 7 — Dataset Splitting & SMOTE on Train Only**
Membagi dataset SSBS menggunakan strategi time-aware split (bukan random split) menjadi Train/Validation/Test set. SMOTE diaplikasikan HANYA pada X_train setelah splitting selesai — menggunakan imblearn Pipeline agar Test dan Validation set tetap 100% natural tanpa data sintetis. Ini adalah standar enterprise untuk mencegah Data Leakage temporal pada time-series modeling. 

**FASE 8 — Modeling Experimentation (ML Track & DL Track)**
Menjalankan eksperimen terstruktur: ML Track (ensemble-based) untuk baseline yang cepat dan interpretable, DL Track (sequence-based) untuk menangkap dependensi temporal jangka panjang.

**FASE 9 — Evaluation, Calibration & Model Selection**
Membandingkan semua kandidat model menggunakan metrik yang tepat untuk *imbalanced problem*, kalibrasi probabilitas, dan pemilihan model final berdasarkan kriteria bisnis (bukan semata akurasi).

**FASE 10 — Artifact Export & API Contract Definition**
Menyimpan model terpilih dalam format `.pkl` & `.h5/.keras`, membangun *preprocessing pipeline* yang dapat di-*serialize*, dan mendefinisikan kontrak JSON final untuk konsumsi tim Backend/Frontend.

## STATUS IMPLEMENTASI

| Fase | Status | Catatan |
|---|---|---|
| Fase 0 | ✅ | Environment & reproducibility |
| Fase 1 | ✅ | Data ingestion & sanity check |
| Fase 2 | ✅ | EDA Forensik — W dikunci empiris |
| Fase 3 | ✅ | Label engineering 3-class |
| Fase 4 | ✅ | 75 kolom feature engineered |
| Fase 5 | ✅ | Preprocessing anti-leakage |
| Fase 6 | ✅ | SSBS 20,423 baris |
| Fase 6.5 | ✅ | RUL target engineering |
| Fase 7 | ✅ | Machine-based split + SMOTE |
| Fase 8 | ✅ | 5 eksperimen (RF,XGB,LGBM,XGBReg,LSTM) |
| Fase 9 | ✅ | Evaluation & model selection |
| Fase 10 | ✅ | Artifact export & API contract |

**Model Final:**
- Model 1: XGBoost Classifier (F1=0.9906)
- Model 2: LSTM V2 (MAE=0.7985 hari)

**Keputusan Arsitektur Kritis:**
1. Machine-based split (bukan global temporal)
2. SMOTE hanya pada X_train setelah split
3. Scaler fit hanya pada train machines
4. RUL scope: WARNING+CRITICAL only
5. ML Service melakukan feature engineering