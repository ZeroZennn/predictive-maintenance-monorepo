KNOWLEDGE BASE MODUL ROLE A: MACHINE LEARNING ENGINEER (Pemilik Pipa Prediktif)

1. Deskripsi Peran & Fokus Utama
Anda adalah "Otak Prediktif" dari sistem ini. Tugas utama Anda adalah mengubah data mentah dari mesin fisik (sensor) dan catatan historis teknisi menjadi tiga jenis model Kecerdasan Buatan (AI) yang mampu mendeteksi anomali seketika, mengklasifikasikan tingkat bahaya, dan meramal sisa umur mesin.
Anda TIDAK mengurus urusan database server, API, antarmuka web, atau Chatbot LLM. Dunia Anda murni berkutat pada Jupyter Notebook, eksperimen algoritma, dan akurasi model matematis.

2. Batasan Ruang Lingkup (Scope)
- Input Data:
    1. sensor_readings.csv (100.000+ baris, data time-series dari 20 mesin).
    2. maintenance_logs.csv (Ratusan baris, catatan teks teknisi).
- Output / Deliverables Akhir:
    1. Script preprocessing Python (untuk mengubah data mentah baru menjadi format yang siap diprediksi).
    2. File model AI yang sudah dilatih (format .pkl untuk Scikit-learn, .h5 atau .keras untuk LSTM).
    3. Kontrak API (JSON) final untuk tim Frontend & Backend.

3. Langkah Pengerjaan Detail (Development Lifecycle)
Pekerjaan Anda dibagi menjadi 5 fase eksperimen utama:
Fase 1: Exploratory Data Analysis (EDA) & Pembersihan Data
Sebelum melatih AI, Anda harus memahami anatomi data.
    - Tujuan: Menemukan pola dasar, korelasi, dan membuang data yang tidak berguna.
    - Tugas:
        1. Visualisasikan gelombang sensor readings over time menggunakan matplotlib/seaborn.
        2. Identifikasi pola atau lonjakan (degradasi) yang terjadi beberapa hari/jam sebelum kolom failure bernilai 1. Fakta Fisika: Identifikasi bahwa lonjakan kerusakan secara visual selalu berpusat pada area suhu ekstrem (>80°C), yang didahului oleh lonjakan getaran.
        3. Feature Selection: Cek korelasi antar sensor (misal: apakah saat vibration naik, temperature selalu ikut naik?). Wajib menghapus kolom humidity dan operating_hours karena terbukti memiliki korelasi 0.00 terhadap kerusakan mesin.
        4. Bersihkan data dari Missing Values (NaN) menggunakan interpolasi time-series.
        
Fase 2: Feature Engineering & Basic Text Mining (Pabrik Fitur)
Algoritma butuh variabel bantuan yang lebih bermakna daripada sekadar angka sensor mentah.
    - Tujuan: Menciptakan fitur prediktif dari data sensor dan log teks.
    - Tugas Sensor (Matematika Gelombang):
        1. Buat kolom Rolling Statistics: Hitung mean, std, dan max dari sensor suhu dan getaran menggunakan window 24 jam terakhir.
        2. Buat kolom Rate of Change: Hitung kecepatan kenaikan suhu dalam 1 jam terakhir.
        3. Peak Frequency: Gunakan Fast Fourier Transform (FFT) untuk mengekstrak frekuensi dominan dari sinyal vibration.
    - Tugas Text Mining & Penggabungan (Log Teknisi): 
        1. Baca maintenance_logs.csv. Gunakan RegEx untuk mencari kata kunci (contoh: "overheat", "panas" -> kategori Termal(is_thermal_issue); "bearing", "bocor" -> kategori Mekanikal(is_mechanical_issue); "sensor", "berhenti" -> kategori Mekanikal(is_electrical_issue)).
        2. Buat variabel biner baru (is_thermal_issue, is_mechanical_issue, is_electrical_issue). Contoh: is_thermal_issue = 1 jika mesin pernah rusak karena panas.
        3. Hukum Konteks: Wajib mengabaikan log dengan maintenance_type == "Preventive" agar AI tidak mengira perawatan rutin sebagai kerusakan.
        4. Hukum Multi-Key Join: Gabungkan (merge) data log ke data sensor WAJIB berdasarkan 2 kunci: machine_id DAN timestamp (untuk menghindari ledakan Cartesian Product).
        5. Penanganan Pasca-Join: Isi nilai kosong (NaN) hasil penggabungan dengan angka 0 (fillna(0)), yang berarti mesin sehat/tidak ada keluhan teknisi.

Fase 3: Deteksi Anomali (Penjaga Garis Depan)
    - Tujuan: Membuat alarm dini yang menyala ketika grafik sensor bergerak tidak wajar, meskipun mesin belum rusak.
    - Metode: Unsupervised Learning.
    - Tugas:
        1. Hukum Normalisasi: Wajib melakukan scaling (misal: StandardScaler) sebelum memodelkan data, agar sensor berskala besar (RPM) tidak membutakan sensor berskala desimal (Vibration).
        2. Latih model Isolation Forest (dari scikit-learn). Model ini akan belajar "seperti apa bentuk gelombang mesin sehat". Jika ada data baru yang polanya melenceng jauh dari kebiasaan historis, model akan mengeluarkan output -1 (Anomali).
        3. Konsep Suspek vs Vonis: Model AI hanya bertugas mencari "Suspek" per baris. Terapkan Aturan Bisnis (Rolling Window): Alarm baru dikirim ke dashboard jika anomali terdeteksi selama 3 jam berturut-turut untuk mencegah False Alarm.

Fase 4: Failure Classification (Dokter Diagnosa)
    - Tujuan: Memberikan label pasti apakah mesin ini sedang Healthy, Warning, atau Critical (Atau klasifikasi biner: Akan rusak dalam 7 hari? Ya/Tidak).
    - Metode: Supervised Learning.
    - Tugas:
        1. Rekayasa Target: Buat label 3 Kelas (Healthy, Warning, Critical) dengan melakukan look-ahead ke masa depan menggunakan fungsi .shift(-n) di Pandas.
        2. Hukum Split Waktu: Pisahkan data menjadi Train dan Test menggunakan Linear Split atau TimeSeriesSplit. HARAM MENGACAK DATA (shuffle=True) karena akan memicu Data Leakage.
        3. Latih model Random Forest (direkomendasikan karena kebal terhadap skala yang berbeda dan andal menangkap relasi non-linear).
        4. Hukum Data Timpang & Evaluasi: Jangan terkecoh metrik Accuracy. Fokus pada metrik Recall. Terapkan teknik SMOTE dari library imbalanced-learn HANYA pada data Training untuk menyelamatkan model dari bias (pemalas).
        5. Ekstraksi Otak AI: Panggil atribut feature_importances_ dari model Random Forest. Pastikan noise_level dan vibration menjadi indikator dengan bobot tertinggi.

Fase 5: RUL Estimation (Peramal Sisa Umur)
    - Tujuan: Menghitung regresi angka pasti, contoh: "Sisa umur mesin ini 4.2 hari".
    - Metode: Deep Learning (Time-Series).
    - Tugas:
        1. Ubah format dataset tabular (2D) Anda menjadi format Tensor 3D (samples, time_steps, features) menggunakan teknik sliding window atau lagged features. LSTM wajib menerima input berwujud urutan langkah waktu (sequence).
        2. Bangun arsitektur Jaringan Saraf Tiruan menggunakan LSTM (Long Short-Term Memory) atau GRU dengan TensorFlow/Keras atau PyTorch.
        3. Evaluasi kinerja model regresi ini menggunakan metrik RMSE (Root Mean Square Error) atau MAE (Mean Absolute Error).

4. Tumpukan Teknologi (Tech Stack) & Tools
Gunakan pustaka Python berikut di dalam environment kerja Anda (sebaiknya gunakan conda atau venv):
    - Data Manipulation: pandas, numpy
    - Data Visualization: matplotlib, seaborn
    - Machine Learning & Feature Eng: scikit-learn, scipy (untuk FFT), tslearn, imbalanced-learn (untuk SMOTE).
    - Deep Learning: tensorflow (Keras) atau pytorch.
    - Workspace: Jupyter Notebook / Google Colab (untuk fase eksperimen).

5. Definisi Selesai (Definition of Done)
Modul Anda dianggap tuntas jika Anda sudah bisa menyerahkan artefak berikut kepada Role C (Backend Engineer):
    - File preprocessing_pipeline.pkl (berisi skalar normalisasi data seperti MinMaxScaler dan logika ekstraksi fitur agar Backend bisa memproses data sensor streaming yang baru masuk).
    - File model anomaly_detector.pkl (Isolation Forest).
    - File model classifier_rf.pkl (Random Forest).
    - File model rul_lstm.h5 atau rul_lstm.keras (Model Deep Learning).
    - Dokumen API Contract (JSON) yang menyertakan penyesuaian terbaru (seperti noise_level, rpm, dan logika is_rolling_anomaly).

