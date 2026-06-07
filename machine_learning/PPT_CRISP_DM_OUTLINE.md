# PRESENTASI CRISP-DM: LAPIS AI PREDICTIVE MAINTENANCE SYSTEM

## BAGIAN 0 — OPENING

### Slide 1 — COVER
- **Judul:** Lapis AI: Sistem Predictive Maintenance Berbasis Machine Learning & Deep Learning
- **Sub-judul:** Pendekatan CRISP-DM pada Data Sensor IoT Industri
- **Informasi Tambahan:** [Nama Anda], [NIM Anda], [Mata Kuliah], [Semester], [Tahun]
> **Speaker Notes:** Selamat pagi/siang. Hari ini saya akan mempresentasikan proyek Lapis AI, sebuah sistem pemeliharaan prediktif (predictive maintenance) untuk industri manufaktur, yang kami kembangkan menggunakan metodologi standar industri, yaitu CRISP-DM.

### Slide 2 — AGENDA
- **1. Business Understanding**
- **2. Data Understanding**
- **3. Data Preparation** (Fokus utama eksplorasi data)
- **4. Modeling**
- **5. Evaluation**
- **6. Deployment**
> **Speaker Notes:** Presentasi ini akan mengikuti enam fase metodologi CRISP-DM. Proyek ini adalah proyek end-to-end, artinya kita membangun sistem tidak hanya sampai tahap evaluasi model, melainkan sampai tahap deployment dalam bentuk API siap pakai.

### Slide 3 — GAMBARAN SISTEM LAPIS AI
- Arsitektur 4 modul utama dari Blueprint V3.0:
  1. ML Predictive Engine (Role A — fokus presentasi)
  2. Hybrid RAG & Knowledge Base (Role B)
  3. Telemetry Ingestion (Role C)
  4. Frontend Dashboard (Role D)
- **Catatan:** Presentasi ini fokus pada Modul ML Predictive Engine.
- [VIS] Diagram alur bisnis singkat (user journey: Sensor -> Backend -> ML Service -> Frontend).
> **Speaker Notes:** Sistem Lapis AI terdiri dari 4 modul utama. Data telemetry masuk melalui ingestion, diproses oleh ML Engine, divisualisasikan oleh Frontend, dan dibantu oleh RAG assistant. Pada presentasi Data Mining kali ini, saya akan berfokus sepenuhnya pada modul pertama, yaitu Machine Learning Predictive Engine yang saya kembangkan sebagai Role A.

## FASE 1 CRISP-DM: BUSINESS UNDERSTANDING

### Slide 4 — LATAR BELAKANG & PROBLEM STATEMENT
- **Problem:** Downtime peralatan yang tidak terduga menyebabkan kerugian besar di industri manufaktur.
- **Pendekatan Tradisional:** Pemeliharaan reaktif (tunggu rusak) atau preventif (berbasis jadwal) sangat tidak efisien dan boros biaya.
- **Solusi:** Predictive Maintenance berbasis IoT dan Machine Learning yang mendeteksi pola anomali sebelum kerusakan terjadi.
- [VIS] Diagram perbandingan: Reactive vs Preventive vs Predictive.
> **Speaker Notes:** Mengapa proyek ini penting? Karena downtime industri itu sangat mahal. Pendekatan lama seperti preventive maintenance sering mengganti part yang masih sehat. Solusi Lapis AI menggunakan sensor IoT untuk memantau kesehatan mesin secara real-time dan memprediksi kerusakan sebelum benar-benar terjadi, sehingga meminimalkan kerugian downtime.

### Slide 5 — TUJUAN PENELITIAN & SUCCESS CRITERIA
- **Tujuan 1:** Klasifikasi status kesehatan mesin (HEALTHY / WARNING / CRITICAL).
- **Tujuan 2:** Prediksi Remaining Useful Life (RUL) dalam satuan HARI.
- **Success Criteria:**
  - Model 1 (Classifier): F1-Macro ≥ 0.90 pada mesin yang belum pernah dilihat (unseen).
  - Model 2 (RUL): MAE ≤ 3 hari, persentase Error ≤ 1 hari harus ≥ 90%.
- **Deliverables Final:** File `.pkl`, `.keras`, dan API Contract JSON.
- [VIS] Tabel success criteria vs hasil aktual (Spoiler: semua target terlampaui).
> **Speaker Notes:** Ada dua tujuan utama: mendiagnosis status saat ini (sehat, waspada, kritis), dan memprediksi sisa umur mesin. Kriteria sukses kami tetapkan di awal, dan spoiler sedikit, hasil aktual yang kami capai jauh melampaui target dasar tersebut.

### Slide 6 — DEFINISI PROBLEM ML
- **Model 1: Multi-class Classification**
  - **Input:** Data sensor time-series
  - **Output:** HEALTHY (0) / WARNING (1) / CRITICAL (2)
- **Model 2: Regression** (Hanya aktif untuk WARNING+CRITICAL)
  - **Input:** Urutan sensor (sequence)
  - **Output:** `rul_days` (float)
- **Data:** 20 mesin × 5,000 jam = 100,000 baris observasi.
- **Tantangan Utama:** Extreme imbalance (kasus kerusakan hanya 0.056%).
- [VIS] Diagram alur input → model → output untuk kedua model.
- [VIS] Pie chart distribusi label awal (failure 0.056% vs normal 99.944%).
> **Speaker Notes:** Masalah bisnis ini diterjemahkan menjadi dua problem machine learning: klasifikasi dan regresi. Tantangan terbesar yang harus kami pecahkan adalah ketimpangan data yang sangat ekstrem, di mana data kerusakan (failure) hanya berjumlah 0.056% dari total populasi data.

## FASE 2 CRISP-DM: DATA UNDERSTANDING

### Slide 7 — SUMBER DATA
- **Dataset 1: sensor_readings.csv**
  - 100,000 baris, 11 kolom (20 mesin, interval 1 jam, Jul 2025–Jan 2026).
  - 8 sensor: temperature, vibration, pressure, rpm, power_consumption, noise_level, humidity, operating_hours.
  - Target mentah: `failure` (biner, 0/1).
- **Dataset 2: maintenance_logs.csv**
  - 500 baris, 8 kolom (Catatan teknisi, downtime, part_replaced, biaya).
- [VIS] Tabel schema kedua dataset (dari data_schema.md).
> **Speaker Notes:** Kita menggunakan dua sumber data. Pertama, data sensor yang dicatat setiap jam dari 20 mesin berbeda. Kedua, log pemeliharaan yang mencatat tindakan perbaikan teknisi. Total ada 100,000 baris data sensor yang menjadi input utama algoritma kita.

### Slide 8 — DATA QUALITY & SANITY CHECK
- **Hasil Sanity Check:**
  - `sensor_readings.csv`: 0 missing values.
  - `maintenance_logs.csv`: 11.8% NaN di `parts_replaced`.
  - Integritas Temporal: 0 gap, 0 duplikat timestamp.
- **Distribusi `failure`:**
  - `failure=0`: 99,944 baris (99.944%)
  - `failure=1`: 56 baris (0.056%) ← Ketimpangan ekstrem.
  - Rata-rata setiap mesin rusak 2.8 kali.
- [VIS] Bar chart distribusi label biner (gunakan skala logaritmik agar kelas minoritas terlihat).
> **Speaker Notes:** Data secara umum sangat bersih tanpa missing value pada sensor. Integritas waktu sangat rapi. Namun, kita mengonfirmasi adanya extreme class imbalance yang akan menjadi tantangan utama kita di tahap data preparation nanti.

### Slide 9 — EDA FORENSIK: FAILURE AUTOPSY
- **Metode:** Menganalisis data 72 jam sebelum setiap kejadian failure (Look-back window).
- **Mesin Sampel:** M-01 (4x failure), M-09 (2x failure), M-05 (1x failure).
- **Temuan Universal:**
  - Sinyal mulai menyimpang perlahan pada **T-48 jam**.
  - Eskalasi kerusakan sangat tajam pada **T-24 jam**.
  - Pola ini sangat konsisten di semua mesin yang diteliti.
- [VIS] Screenshot grafik Failure Autopsy (menunjukkan lonjakan grafik sensor pada T-48h dan T-24h).
> **Speaker Notes:** Kami melakukan 'autopsi' data forensik pada momen-menjelang kerusakan. Menariknya, kami menemukan bahwa pola anomali mulai terlihat 48 jam sebelum mesin mati, dan semakin parah pada 24 jam terakhir. Temuan empiris ini akan menjadi dasar kita melabeli data nanti.

### Slide 10 — ANALISIS STATISTIK SENSOR (Cohen's D)
- **Metode:** Uji ukuran efek (Cohen's d) per sensor antara kondisi sehat vs rusak.
- **Hasil:**
  - **Tinggi (d > 2.5):** vibration (3.37), pressure (3.06), rpm (2.91), noise_level (2.89), temperature (2.71), power_consumption (2.61).
  - **Sedang:** operating_hours (0.29), humidity (0.21).
- **Keputusan:** Semua sensor dipertahankan. Keputusan final diserahkan pada model feature importance.
- [VIS] Bar chart nilai Cohen's d per sensor (hijau untuk Besar, kuning untuk Sedang).
> **Speaker Notes:** Uji Cohen's d membuktikan bahwa 6 dari 8 sensor memiliki daya beda yang sangat besar (nilai d di atas 2.5). Artinya sinyal kerusakan benar-benar terekam kuat pada sensor vibrasi, tekanan, RPM, dan suhu.

## FASE 3 CRISP-DM: DATA PREPARATION

### Slide 11 — TEMPORAL LABEL ENGINEERING
- **Problem:** Label asli (0/1) terlalu kaku, tidak menangkap fase degradasi awal.
- **Solusi:** Temporal Backward-Labeling berdasarkan EDA Forensik.
  - T_failure → **CRITICAL** (24 jam sebelumnya).
  - T_failure - 24h → **WARNING** (24-48 jam sebelumnya).
  - Sebelum T-48h → **HEALTHY**.
- **Sensor Confirmation Layer:** Validasi threshold P90 (minimal 2 sensor melampaui batas normal).
- **Hasil Transformasi:** HEALTHY=97,364 | WARNING=1,247 | CRITICAL=1,389.
- [VIS] Diagram timeline visual zona HEALTHY → WARNING → CRITICAL.
> **Speaker Notes:** Ini adalah kontribusi terbesar di Fase Data Preparation. Ketimbang menggunakan target 1/0, kami merekayasa ulang label menjadi 3 kelas. Aturan 48 jam dan 24 jam ini murni diambil dari hasil penemuan EDA sebelumnya, bukan sekadar tebakan.

### Slide 12 — FEATURE ENGINEERING
- **Total:** Mengekspansi 8 sensor mentah menjadi 69 fitur informatif.
- **Kategori Fitur:**
  - **Rolling Statistics (36 fitur):** Mean, std, max dengan window 24h & 48h.
  - **Lag Features (18 fitur):** Shift nilai sensor pada 6h, 12h, 24h ke belakang.
  - **Cross-Sensor Ratios (4 fitur):** Rasio antar sensor (misal temp/vibration).
  - **Degradation Proxy (1 fitur):** Jam sejak maintenance terakhir (`hours_since_last_maint`).
  - **NLP Text Mining (2 fitur):** `damage_category` & `severity_score` dari log maintenance.
- [VIS] Diagram alur ekstraksi raw sensor → engineered features.
> **Speaker Notes:** Algoritma sulit membaca raw data satu per satu. Jadi kami buatkan fitur seperti rata-rata bergerak (rolling mean) atau nilai dari 24 jam yang lalu (lag feature) agar model bisa memahami tren tren data sepanjang waktu.

### Slide 13 — RUL TARGET ENGINEERING
- **Problem:** Model 2 membutuhkan target numerik RUL (Remaining Useful Life).
- **Definisi RUL:** Waktu tersisa (dalam hari) sebelum mesin akan rusak (failure berikutnya).
- **Scope Model:** Hanya dihitung untuk baris data dengan label WARNING dan CRITICAL. Kondisi HEALTHY tidak reliable untuk prediksi RUL jangka panjang.
- **Statistik RUL:** WARNING median ~2 hari, CRITICAL median ~1 hari.
- [VIS] Histogram/Boxplot distribusi rul_days.
> **Speaker Notes:** RUL adalah variabel target untuk regresi sisa umur mesin. Variabel ini kami rekayasa dari timeline historis. Namun, kami membatasi prediksinya HANYA jika mesin berstatus WARNING atau CRITICAL, karena menebak sisa umur mesin yang masih sehat 100% adalah sangat tidak akurat.

### Slide 14 — IMBALANCE HANDLING (SSBS + SMOTE)
- **Problem:** Data HEALTHY mendominasi (97%).
- **Solusi 2 Tahap (Anti-Leakage):**
  - **Tahap 1: SSBS (Stratified Sequential Block Sampling):** Mengambil blok kronologis kondisi prima dan blok pre-warning. Ukuran data turun dari 100k → 20,423 baris dengan integritas waktu terjaga.
  - **Tahap 2: SMOTE:** Diaplikasikan **HANYA** pada X_train untuk mensintesis kelas minoritas menjadi 4,000 baris.
- [VIS] Diagram timeline: urutan SSBS → Split → SMOTE. Bar chart perbandingan jumlah kelas.
> **Speaker Notes:** Kami tidak langsung melakukan SMOTE pada data, karena akan menyebabkan Data Leakage atau kebocoran data masa depan ke masa lalu. Kami menggunakan sampling berbasis blok waktu (SSBS), lalu baru melakukan SMOTE, dan itupun HANYA untuk data training. Data test tetap natural.

### Slide 15 — DATA SPLITTING & ANTI-LEAKAGE
- **Strategi:** Machine-Based Split (Bukan Global Temporal).
  - **Train (70%):** Mesin M-01 s/d M-14.
  - **Val (16%):** Mesin M-15, M-16, M-17.
  - **Test (13%):** Mesin M-18, M-19, M-20.
- **Alasan:** Split berbasis waktu global akan menyebabkan kelas WARNING/CRITICAL terkumpul di Test set (karena data run-to-failure).
- **Tindakan Anti-Leakage:** Scaler di-fit hanya di data Train; zero overlap antar dataset terverifikasi.
- [VIS] Tabel/Diagram pembagian mesin ke 3 split.
> **Speaker Notes:** Teknik pemisahan data ini sangat penting. Kami memisahkan berdasarkan unit mesin, bukan potong waktu secara global. Model dilatih di 14 mesin, dan diuji pada 6 mesin yang benar-benar belum pernah dia kenali sebelumnya untuk menguji generalisasinya secara realistik.

## FASE 4 CRISP-DM: MODELING

### Slide 16 — STRATEGI EKSPERIMEN
- **Track A — Model 1 (Classifier):** 3 algoritma
  - Random Forest (baseline)
  - XGBoost Classifier
  - LightGBM Classifier
- **Track B — Model 2 (RUL Regressor):** 3 algoritma
  - XGBoost Regressor
  - LSTM (Long Short-Term Memory)
  - GRU (Gated Recurrent Unit)
- **Prinsip:** Fair comparison dengan input data dan metrik yang identik. Seed dikunci di 42.
- [VIS] Matrix diagram eksperimen Track A & B.
> **Speaker Notes:** Untuk modeling, kami mencoba dua jalur. Track A untuk klasifikasi kondisi, kami uji 3 model berbasis pohon keputusan. Track B untuk memprediksi sisa umur dalam hari, kami menguji regressor biasa melawan arsitektur deep learning untuk deret waktu, yaitu LSTM dan GRU.

### Slide 17 — MODEL 1: CLASSIFIER EXPERIMENTS
- **Random Forest:** F1 Val=0.9292 | F1 Test=0.9914 (Baseline yang bagus).
- **XGBoost V2 + Threshold (0.60):** F1 Val=0.9894 | F1 Test=0.9906.
  - Threshold WARNING digeser ke 0.60 untuk meminimalkan false alarm (peringatan palsu).
- **LightGBM:** F1 Val=0.9845 | F1 Test=0.9876 (Early stopping terlalu agresif).
- **Keputusan:** XGBoost V2 + Threshold terpilih sebagai Model 1.
- [VIS] Bar chart F1 Macro (Val vs Test) ketiga model.
> **Speaker Notes:** XGBoost adalah pemenang untuk tugas klasifikasi ini. Rahasianya adalah kami melakukan 'Threshold Engineering' dengan menaikkan batas probabilitas Warning menjadi 60% agar operator pabrik tidak pusing dengan alarm peringatan palsu.

### Slide 18 — MODEL 2: RUL PREDICTOR EXPERIMENTS
- **Scope:** Hanya bekerja pada rentang data WARNING & CRITICAL.
- **XGBoost Regressor:** MAE Test = 1.10 hari, Error ≤ 1 hari = 93.5%.
- **LSTM V2:** MAE Test = **0.80 hari**, Error ≤ 1 hari = **98.0%**.
- **GRU:** MAE Test = 0.95 hari (Overspecialize di CRITICAL, buruk di WARNING).
- **Keputusan:** Arsitektur LSTM V2 (Deep Learning) terpilih sebagai Model 2.
- [VIS] Bar chart perbandingan MAE Test ketiga model.
> **Speaker Notes:** Untuk prediksi hari (RUL), algoritma Deep Learning LSTM mengalahkan XGBoost. LSTM mampu memanfaatkan sequence data sensor masa lalu dan mencetak rata-rata error absolut (MAE) di bawah 1 hari (tepatnya sekitar 19 jam saja)!

### Slide 19 — ARSITEKTUR LSTM
- **Input:** Sequence 24 timestep (jam) × 69 fitur.
- **Struktur Layer:**
  - LSTM(64) + Dropout(0.3) + BatchNorm
  - LSTM(32) + Dropout(0.3) + BatchNorm
  - Dense(16, ReLU) → Dense(1, Linear) untuk output float `rul_days`.
- **Hyperparameter & Regularisasi:**
  - Total parameter: 47,649.
  - L2 Regularization (0.001) untuk mencegah overfitting.
  - Callbacks: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint.
- [VIS] Diagram kotak arsitektur layer LSTM dari Keras.
> **Speaker Notes:** Ini adalah arsitektur LSTM kita. Kami merancangnya agar tidak terlalu dalam (hanya 47 ribu parameter) dan menggunakan dropout serta L2 regularization agar model tidak overfit dan dapat berlatih secara mulus. Model melihat riwayat 24 jam terakhir untuk menebak sisa waktu.

## FASE 5 CRISP-DM: EVALUATION

### Slide 20 — EVALUASI MODEL 1 (CLASSIFIER)
- **Metrik Utama:** F1-Score Macro (tidak bias ke kelas mayoritas) dan Fatal Error Rate.
- **Performa XGBoost (Model Terpilih):**
  - **F1 Test = 0.9906** (Akurasi nyaris sempurna di mesin unseen).
  - **AUC-ROC = 1.000** (Separabilitas sempurna antar 3 kelas).
  - **Fatal Error = 0** (Tidak ada kondisi CRITICAL yang diprediksi salah sebagai HEALTHY).
  - Kecepatan inferensi: 0.0055 ms per sampel (sangat ringan).
- [VIS] Confusion Matrix XGBoost (Test Set). ROC Curve.
> **Speaker Notes:** Hasil evaluasi XGBoost sangat luar biasa. Yang paling penting bagi bisnis, tingkat Fatal Error-nya adalah 0. Artinya, tidak pernah ada kejadian di mana mesin yang sebenarnya sedang 'KRITIS' dideteksi sebagai 'SEHAT'.

### Slide 21 — EVALUASI MODEL 2 (RUL PREDICTOR)
- **Metrik Utama Bisnis:** MAE (Mean Absolute Error) dan Persentase Error ≤ 1 Hari.
- **Performa LSTM V2 (Model Terpilih):**
  - **MAE Test = 0.7985 hari.**
  - **Error ≤ 1 hari = 98.04%** (98% prediksi meleset kurang dari 24 jam).
  - MAE pada fase WARNING: **0.024 hari (sekitar 34 menit!)**
  - MAE pada fase CRITICAL: 1.44 hari.
- [VIS] Actual vs Predicted scatter plot. Bar chart "Error ≤ 1 hari".
> **Speaker Notes:** LSTM V2 menunjukkan hasil yang mencengangkan, di mana saat mesin baru memasuki zona WARNING, prediksi sisa umurnya memiliki error rata-rata hanya 34 menit dari target aslinya! Lebih dari 98% prediksi RUL kita meleset kurang dari 1 hari.

### Slide 22 — FEATURE IMPORTANCE & VALIDASI EDA
- **Konsensus Top 6 Fitur (Muncul di semua model pohon):**
  - `temperature_roll_max_24h`
  - `noise_level_roll_mean_24h`
  - `temperature_roll_mean_48h`
  - `power_consumption_roll_mean_48h`
  - `vibration_roll_mean_48h`
  - `noise_level_roll_mean_48h`
- **Insight Akademis:**
  - Fitur rolling 48 jam mendominasi (mengkonfirmasi window 48h dari EDA).
  - Konsisten dengan analisis statistik Cohen's d di awal proyek.
- [VIS] Tabel konsensus feature importance atau bar chart Top 10 fitur XGBoost.
> **Speaker Notes:** Mengekstrak arti dari kotak hitam (black-box) model, kita temukan bahwa fitur buatan yang melihat mundur sejauh 48 jam menjadi faktor penentu utama. Hal ini memvalidasi secara meyakinkan analisis visual EDA kita di awal yang juga mengunci window 48 jam.

### Slide 23 — ANTI-OVERFITTING & GENERALIZATION VALIDATION
- **Data Leakage Check (Forensic):**
  - Scaler fit pada full data terdeteksi → **DI-FIX** (scaler re-fit HANYA di train set).
  - SMOTE dilakukan sebelum split terdeteksi → **DI-FIX** (SMOTE HANYA di X_train).
- **Generalization Test:**
  - Diuji di M-18, M-19, M-20 yang 100% tidak pernah disentuh saat training.
  - Performa Val dan Test identik dan tinggi → generalisasi dikonfirmasi valid tanpa kebocoran data masa depan.
- [VIS] Checklist tabel Data Leakage (semua berstatus ✅ Fix).
> **Speaker Notes:** Di proyek enterprise, performa tinggi seringkali disebabkan oleh kebocoran data. Kami memastikan 100% pipeline kami anti-leakage. Model murni memprediksi tanpa pernah 'mengintip' jawaban masa depan.

## FASE 6 CRISP-DM: DEPLOYMENT

### Slide 24 — ARSITEKTUR DEPLOYMENT
- **Sistem Microservice:** ML Service dijalankan sebagai *long-running process* via FastAPI, bukan *serverless* (model dan pipeline di-load persisten di memory).
- **Endpoint:** `POST /api/ml/predict`
- **Integrasi Backend:** Menerima raw sensor data → Output `health_label` + `rul_days` + `urgency_level`.
- **Urgency Mapping:**
  - IMMEDIATE (Servis < 24 jam)
  - CRITICAL (Servis < 48 jam)
  - WARNING (Jadwal < 7 hari)
  - MONITOR (Aman)
- [VIS] Diagram Arsitektur Deployment (Backend -> FastAPI -> Output JSON).
> **Speaker Notes:** Model yang dilatih kemudian dibungkus menggunakan FastAPI menjadi REST API. Model dipertahankan di RAM (memory) untuk menghindari waktu tunggu. ML service inilah yang akan dikonsumsi oleh tim Backend dan ditampilkan di layar Frontend.

### Slide 25 — SENSOR GAUGE THRESHOLDS UNTUK UI
- **Pembuatan Threshold Real-Time:** 
  - Zona Hijau (HEALTHY) = Nilai < P90.
  - Zona Kuning (WARNING) = P90 ≤ Nilai < P95.
  - Zona Merah (CRITICAL) = Nilai ≥ P95.
- **Validasi Overlap:** Memastikan P95 Healthy tidak bertabrakan dengan batas bawah P10 Critical. Jika tabrakan, diambil titik rata-rata.
- **Output:** File `gauge_thresholds_validated.json` diserahkan ke tim Frontend untuk kalibrasi instrumen *Dashboard*.
- [VIS] Mockup gauge chart dengan 3 zona warna (Hijau, Kuning, Merah).
> **Speaker Notes:** Selain model cerdas, kami juga mengekstrak ambang batas statistik (threshold) P90 dan P95 untuk setiap sensor. Angka ini diberikan kepada tim Frontend untuk mengatur pergerakan jarum Gauge Chart agar menyala kuning dan merah dengan akurasi tinggi.

### Slide 26 — ARTIFACTS & DELIVERABLES FINAL
- **Daftar Artefak yang Diserahkan (Role A):**
  1. `preprocessing_pipeline.pkl` (Transformasi pipeline full sklearn)
  2. `inference.py` (Script prediksi singleton)
  3. `classifier_final.pkl` (Model XGBoost)
  4. `rul_predictor_final.keras` (Model LSTM)
  5. `api_contract_final_v1.json` (Dokumen kontrak komunikasi API)
- [VIS] Screenshot Real-Time Dashboard Lapis AI.
> **Speaker Notes:** Ini adalah output akhir dari modul Data Mining ini. Keseluruhan artefak diserahkan sesuai API Contract dan diintegrasikan sempurna menjadi Lapis AI Dashboard yang responsif dan canggih.

## BAGIAN PENUTUP

### Slide 27 — KESIMPULAN
- **Pencapaian Model:**
  - XGBoost (Model 1): Akurasi f1=0.9906, Zero Fatal Error.
  - LSTM V2 (Model 2): MAE 0.80 hari (error hanya 34 menit pada zona warning).
- **Kontribusi Utama Pendekatan CRISP-DM:**
  - Rekayasa *Temporal Backward-Labeling* mengatasi kelemahan target biner.
  - Sampling SSBS menjaga integritas waktu time-series secara murni.
  - Implementasi *Zero Data-Leakage* enterprise grade.
- **Keterbatasan / Future Work:**
  - Keterbatasan sampel validasi RUL akibat run-to-failure cycle yang terbatas.
> **Speaker Notes:** Kesimpulannya, metodologi CRISP-DM terbukti sangat tangguh mengatur proyek ini. Kontribusi terpenting kami justru ada di rekayasa label dan anti-kebocoran data. Model yang dihasilkan mampu memprediksi waktu mati mesin secara sangat akurat dan terhindar dari bias data.

### Slide 28 — REFERENSI & QnA
- **Referensi:**
  - Master Blueprint Lapis AI V3.0
  - C-MAPSS Dataset methodology (Saxena & Goebel, 2008)
  - SMOTE methodology (Chawla et al., 2002)
- **Terima Kasih:**
  - Role A (ML Engine), Role B (RAG), Role C (Backend), Role D (Frontend)
- **Tanya Jawab / Diskusi**
> **Speaker Notes:** Terima kasih atas perhatiannya. Kami mengapresiasi kerjasama solid antar Role dalam merakit Lapis AI secara keseluruhan. Sesi sekarang saya kembalikan untuk tanya jawab.
