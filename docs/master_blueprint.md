MASTER BLUEPRINT: Sistem Predictive Maintenance & AI Copilot Terintegrasi
BAGIAN 1: Cetak Biru & Arsitektur Final (Master Plan)

Latar Belakang
Industri manufaktur dan logistik mengalami kerugian besar akibat downtime peralatan yang tidak terduga. Pendekatan maintenance tradisional (preventive) melakukan perawatan berdasarkan jadwal tetap, yang seringkali terlalu dini (membuang biaya) atau terlambat (kerusakan sudah terjadi). Dengan sensor IoT yang terpasang pada mesin, data operasional dapat dimanfaatkan untuk memprediksi kapan mesin akan mengalami kegagalan. Xquisite Al ingin mahasiswa membangun sistem predictive maintenance yang menggunakan data sensor untuk memprediksi kegagalan mesin sebelum terjadi, sehingga perusahaan dapat melakukan maintenance pada waktu yang optimal.

Visi Proyek
Merespons tantangan industri di atas dan memenuhi spesifikasi dari Xquisite AI / Lapis AI, proyek ini dirancang untuk membangun sistem Predictive Maintenance tingkat lanjut. Dengan memanfaatkan aliran data dari sensor IoT yang terpasang pada peralatan, sistem ini dituntut mampu memprediksi potensi kegagalan mesin jauh sebelum kerusakan benar-benar terjadi berdasarkan pola data operasional.
Lebih dari sekadar memenuhi spesifikasi dasar, visi utama proyek ini tidak berhenti sebagai alat analitik prediksi standar. Sistem ini secara ambisius dielevasi menjadi sebuah Platform Asisten Cerdas Terintegrasi bertaraf Enterprise. Visi ini diwujudkan dengan menyuntikkan dua inovasi utama:
1. Modul Decision Support System (DSS) yang komprehensif untuk memberikan rekomendasi tindakan sekaligus kalkulasi finansial (Cost-Benefit Analysis).
2. Teknologi Generative AI (arsitektur RAG) yang bertindak sebagai Copilot atau asisten virtual untuk memandu teknisi lapangan membaca buku manual dan SOP secara interaktif.

Ruang Lingkup & Deliverables
Sistem akan memberikan luaran (deliverables) yang melebihi standar spesifikasi awal:
1. Model Prediksi Kegagalan Hybrid: Menggunakan data sensor time-series untuk mendeteksi anomali seketika dan memprediksi kerusakan.
2. Estimasi Sisa Umur (RUL): Menghitung Remaining Useful Life untuk setiap mesin dalam satuan hari.
3. Dashboard Kustom Berbasis Next.js: Meninggalkan tools kaku seperti Grafana/Streamlit, dan membangun antarmuka interaktif yang menampilkan: health score (Spidometer/Gauge), grafik gelombang live telemetry, dan prediksi waktu kegagalan.
4. Sistem Alert Otomatis: Peringatan visual (layar berkedip merah) ketika health score di bawah batas ambang kritis.
5. Decision Support System (DSS) Lanjutan: Tidak sekadar memberi alarm, modul ini menghitung rekomendasi jadwal maintenance menggunakan metode SMART/SAW (berdasarkan RUL, Beban Produksi, Ketersediaan Suku Cadang) dan dilengkapi analisis Cost-Benefit otomatis (Perbandingan Biaya Preventif vs Kerugian Mati Mendadak = ROI Penghematan).
6. Floating Chat Widget (Inovasi RAG): Asisten virtual di sudut layar dashboard yang tersambung ke Large Language Model (LLM) untuk menjawab pertanyaan teknisi berdasarkan buku manual pabrik.

Pemetaan 5 Mata Kuliah Integrasi
- Machine Learning: Penerapan Time series forecasting (LSTM, GRU), classification (Random Forest untuk status healthy/warning/critical), dan survival analysis.
- Data Mining: Anomaly detection pada data sensor, pattern discovery sebelum kegagalan, dan feature extraction dari time series.
- NLP (Natural Language Processing): Analisis log teknisi (text mining) untuk pengayaan model AI prediktif, dipadukan dengan arsitektur RAG (Chunking, Multilingual Vectorization, Hybrid Search) untuk AI Copilot.
- Kewirausahaan: Pengembangan Business case predictive maintenance, kalkulasi ROI/CBA pada modul DSS, dan analisis market.
- Metodologi Penelitian: Time series experiment design, teknik cross-validation untuk data temporal, dan evaluasi pengujian AI (Faithfulness/Relevancy).

Alur Kerja & Arsitektur Sistem (Dual Pipeline)
Untuk memastikan tidak ada proses yang memblokir satu sama lain, sistem dibagi menjadi dua "Otak AI" yang bekerja paralel secara microservice:
A. Pipeline Prediktif (Sensor & Angka)
1. Simulasi Data Streaming (Data Exploration & Ingestion): Memanipulasi dataset CSV statis menjadi streaming real-time (mirip Apache Kafka) menggunakan script Python yang menembakkan data sensor per detik ke server.
2. Feature Engineering Terpadu: Sistem secara otomatis meracik variabel baru (kolom baru) dari data mentah:
    - Rolling statistics: Menghitung mean, std, dan max dalam window 24 jam terakhir.
    - Rate of change: Menghitung kecepatan perubahan nilai sensor.
    - Peak frequency (FFT): Ekstraksi frekuensi tertinggi dari data getaran (vibration).
    - Text Mining Pengayaan: Mengubah teks sederhana dari maintenance_logs.csv menjadi fitur biner matematis (misal: "mesin overheat" menjadi history_thermal_issue = 1).
3. Hybrid Prediction (Classification & Anomaly): * Anomaly Detection: Menggunakan Isolation Forest / Autoencoder untuk mendeteksi pola sensor abnormal secara unsupervised (berjaga di garis depan).
    - Failure Classification: Klasifikasi biner dan multi-kelas (healthy/warning/critical) sekaligus menangani severe class imbalance (SMOTE).
    - RUL Estimation: Implementasi arsitektur LSTM/GRU untuk memprediksi Sisa Umur Mesin.

B. Pipeline Generatif / RAG (Dokumen & Bahasa) - FITUR INOVASI
1. Ingestion & Chunking: Mengekstrak teks kompleks dari buku manual teknis dan SOP pabrik berformat PDF menggunakan pustaka seperti PyMuPDF.
2. Vectorization: Memecah teks menjadi chunks dan mengubahnya menjadi vektor menggunakan model Multilingual Embedding agar akurat menangkap konteks bahasa Indonesia dan istilah teknis mesin.
3. Hybrid Search Retrieval: Menyimpan matriks vektor di ChromaDB. Saat teknisi mengetik pertanyaan di dashboard, sistem melakukan kombinasi pencarian makna (Semantic Search) dan kata kunci pasti (BM25).
4. Generation: Menyuntikkan halaman SOP yang berhasil ditemukan sebagai konteks ke dalam LLM (Llama 3 / Gemini) untuk merakit jawaban panduan operasional yang natural dan terpercaya.

C. Decision Support System (DSS) Tingkat Lanjut
- Tidak sekadar menyuruh "perbaiki sekarang", sistem menggunakan metode SMART / SAW untuk memilih hari perbaikan terbaik dengan mempertimbangkan 3 kriteria: RUL Mesin, Beban Produksi Harian pabrik, dan Ketersediaan Suku Cadang.
- Modul Cost-Benefit Analysis (CBA) menghitung secara otomatis: (Estimasi Kerugian Mati Mendadak) - (Biaya Perbaikan Terencana) = ROI / Penghematan Perusahaan.

D. Arsitektur Frontend Kustom (Next.js)
- Meninggalkan tools bawaan yang kaku (Grafana/Streamlit) dan membangun UI interaktif menggunakan Next.js dan Tailwind CSS.
- Menampilkan Spidometer Kesehatan Mesin (Gauge).
- Menampilkan Dashboard Telemetry (Grafik gelombang live).
- Menampilkan DSS Action Panel untuk menyetujui jadwal maintenance.
[INOVASI] Menampilkan Floating Chat Widget (Asisten Teknisi) di sudut layar yang tersambung langsung ke sistem RAG LLM.


BAGIAN 2: Pembagian Jobdesc Modular (Pendekatan Microservices)
Agar tim dapat bekerja paralel tanpa ada yang nganggur menunggu proses teman yang lain, tugas dipecah menjadi 4 peran tegas berdasarkan Kontrak API (API Contract):
1. ROLE A: Data & Machine Learning Engineer (Pembangun Otak Prediktif)
Fokus Utama: Mengolah data masa lalu untuk melatih model Kecerdasan Buatan yang bisa memprediksi kerusakan mesin sebelum terjadi. Pekerjaan dilakukan secara offline (di Jupyter Notebook/Python).
Rincian Tugas Utama:
    - Data Preprocessing: Membersihkan dataset sensor (sensor_readings.csv) dan log pemeliharaan (maintenance_logs.csv) dari data kosong atau anomali yang merusak.
    - Text Mining (NLP Dasar): Membaca kolom catatan teknisi, melakukan ekstraksi kata kunci (misal: "overheat", "bearing"), dan mengubahnya menjadi variabel biner (contoh: history_thermal_issue = 1).
    - Feature Engineering: Meracik variabel matematis baru dari data mentah, seperti menghitung rata-rata dan nilai maksimum dalam jendela 24 jam terakhir (rolling statistics).
    - Melatih 3 Lapis Model AI:
        1. Anomaly Detection (Isolation Forest): Mendeteksi apakah pergerakan sensor saat ini wajar atau aneh (outlier).
        2. Classification (Random Forest): Mengklasifikasikan status bahaya mesin ke dalam 3 kategori pasti: Healthy, Warning, atau Critical.
        3. Regression Time-Series (LSTM): Memprediksi Sisa Umur Mesin (RUL - Remaining Useful Life) dalam hitungan hari.
Output Akhir (Deliverables):
    - Menyerahkan file model matang (isolation_forest.pkl, random_forest.pkl, lstm_rul.h5).
    - Menyerahkan file kamus riwayat NLP (riwayat_nlp.json) kepada Role C.

2. ROLE B: NLP & Generative AI Engineer (Pembangun Asisten Virtual)
Fokus Utama: Membangun sistem Retrieval-Augmented Generation (RAG) agar AI bisa membaca buku manual pabrik berformat PDF dan menjawab pertanyaan teknisi layaknya ChatGPT.
Rincian Tugas Utama:
    - Document Processing: Mengekstrak teks dari file PDF (buku manual/SOP Lapis AI) dan memotongnya menjadi paragraf-paragraf kecil (Chunking).
    - Vector Database: Mengubah potongan teks menjadi matriks angka (Embeddings) dan menyimpannya ke dalam database vektor lokal (menggunakan ChromaDB).
    - Hybrid Search Engine: Membuat mesin pencari yang menggabungkan pencarian makna (Semantic/Vector) dan pencarian kata kunci pasti (BM25).
    - LLM Integration: Menyusun instruksi (Prompt Engineering) dan menghubungkan mesin pencari dengan Large Language Model (Llama 3 / Gemini) via LangChain.
Output Akhir (Deliverables):
    - Menyerahkan folder database vektor (ChromaDB) yang sudah terisi.
    - Menyerahkan script Python utama (misal: rag_chain.py) yang berisi fungsi siap panggil untuk menjawab pertanyaan kepada Role C.

3. ROLE C: Backend & Data Engineer (Jantung Lalu Lintas Data & Logika Bisnis)
Fokus Utama: Membangun server utama penyambung nyawa aplikasi, memastikan data sensor mengalir real-time, dan mengalkulasi keputusan finansial untuk mata kuliah Kewirausahaan.
Rincian Tugas Utama:
    - API Gateway Setup: Membangun server berkinerja tinggi menggunakan FastAPI.
    - Streaming Simulator: Membuat script Python terpisah yang membaca CSV masa lalu dan menembakkannya ke server setiap 1 detik layaknya sensor fisik yang hidup.
    - Live Feature Engineering: Membuat memori cache di server untuk menghitung nilai rolling 24 jam secara kilat, menyisipkan riwayat NLP dari Role A, lalu menyuapkannya ke model .pkl untuk mendapatkan prediksi seketika.
    - Decision Support System (DSS): Menulis algoritma pembuat keputusan yang menerima sisa umur (RUL) dari AI, lalu menghitung rekomendasi jadwal perbaikan serta nilai ROI (Rupiah yang dihemat).
    - Endpoint Provisioning: Menyediakan jalur komunikasi mutlak sesuai API Contract: WebSockets (/ws/telemetry) untuk data mengalir, dan REST API (/api/dss/calculate & /api/chat).
Output Akhir (Deliverables):
    - Server FastAPI yang berjalan mulus di localhost:8000.
    - Script simulator sensor yang terus berjalan di terminal.

4. ROLE D: Frontend Engineer (Seniman Wajah Aplikasi & UI/UX)
Fokus Utama: Merancang antarmuka visual (Dashboard) yang interaktif, elegan, dan mampu menangani aliran data real-time tanpa membuat browser menjadi lag (lambat).
Rincian Tugas Utama:
    - Web Development Setup: Membangun fondasi aplikasi menggunakan Next.js dan menata gayanya menggunakan Tailwind CSS.
    - Real-time Visualization: Menghubungkan aplikasi web dengan WebSockets dari Role C, lalu merender grafik garis suhu dan getaran yang bergerak terus-menerus menggunakan pustaka seperti Recharts.
    - DSS Action Panel: Membuat antarmuka untuk kalkulator bisnis, di mana teknisi bisa memencet tombol dan melihat rekomendasi jadwal perbaikan serta total uang yang berhasil dihemat perusahaan.
    - AI Copilot Integration: Membuat Widget Chat melayang di pojok layar yang terhubung dengan API Chatbot, lengkap dengan animasi loading dan gelembung pesan (chat bubbles).
    - Polishing: Memastikan desain responsif (bisa dibuka di tablet/HP) dan memberikan peringatan visual mencolok (warna merah berkedip) jika status mesin berubah menjadi Critical.
Output Akhir (Deliverables):
    - Aplikasi dashboard web yang berjalan sempurna di localhost:3000 dan siap dipresentasikan kepada dosen penguji.

Dengan rincian jobdesc ini, setiap orang memiliki area kekuasaannya masing-masing dan tahu persis ke mana harus menyerahkan hasil pekerjaannya.


BAGIAN 4: Tumpukan Teknologi Final (Tech Stack)
    - Inti AI Prediktif (Role A): Python, pandas, scikit-learn (Random Forest, SVM, Isolation Forest, SMOTE), TensorFlow/Keras (LSTM/GRU), tslearn.
    - Inti AI Generatif / RAG (Role B): Python, LangChain, PyMuPDF, Hugging Face sentence-transformers (Multilingual), ChromaDB, LLM (Llama 3 via Ollama / Gemini API). Evaluasi menggunakan RAGAS Framework.
    - Backend & Data Pipeline (Role C): FastAPI (REST & WebSockets), PostgreSQL (Untuk data manajerial DSS), Apache Kafka/REST polling (Untuk simulasi IoT).
    - Frontend (Role D): Next.js (React), Tailwind CSS, Recharts.

Dengan dokumen Master Blueprint yang lengkap dan terstruktur rapi ini, proyek Anda siap dijalankan dan dipertanggungjawabkan di hadapan dosen penguji sebagai karya komprehensif yang menjangkau seluruh aspek 5 mata kuliah.


