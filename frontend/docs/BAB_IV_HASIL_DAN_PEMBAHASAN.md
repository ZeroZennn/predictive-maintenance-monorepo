# **BAB IV**

# **HASIL DAN PEMBAHASAN**

**4.1 Analisis Kebutuhan**

Analisis kebutuhan merupakan tahapan krusial untuk mengidentifikasi bahan baku data yang akan diolah serta mendefinisikan fungsionalitas utama yang harus dipenuhi oleh sistem. Pada pengembangan platform PRIME (*Predictive Reliability & Intelligent Maintenance Engine*), analisis ini dibagi menjadi dua bagian utama, yaitu kebutuhan data untuk pelatihan model kecerdasan buatan dan kebutuhan fungsional sistem secara keseluruhan.

**4.1.1 Analisis Kebutuhan Data** Sistem ini menggunakan arsitektur jalur ganda (*dual pipeline*) yang memproses data numerik dan tekstual secara bersamaan. Oleh karena itu, kebutuhan data dibagi menjadi tiga sumber utama:

1. **Dataset Sensor Operasional (*Time-Series*)** Data ini digunakan sebagai bahan baku utama untuk melatih model *Machine Learning* dan *Deep Learning* pada Modul Prediktif. Berdasarkan spesifikasi data historis yang dikumpulkan, dataset ini (`sensor_readings.csv`) memuat 100.000 baris rekaman dari 20 unit mesin selama periode 6 bulan.

   * **Fitur Utama:** Parameter yang wajib direkam meliputi stempel waktu (*timestamp*), identitas mesin (*machine\_id*), suhu (*temperature*), getaran (*vibration*), tekanan (*pressure*), serta status kegagalan mesin (*failure*).  
   * **Tantangan Data:** Terdapat ketidakseimbangan kelas (*class imbalance*) yang sangat ekstrem, di mana dari 100.000 baris, hanya terdapat sekitar 56 baris yang memiliki label kerusakan atau *failure*. Kondisi data dunia nyata ini membutuhkan teknik penanganan khusus, yaitu *Stratified Sequential Block Sampling* (SSBS), untuk memastikan model tidak bias tanpa merusak integritas temporal data.  
2. **Dataset Log Pemeliharaan Historis** Data ini (`maintenance_logs.csv`) mencakup 500 baris catatan historis dari teknisi pabrik.

   * **Fitur Utama:** Atribut yang dibutuhkan mencakup tanggal, identitas mesin, tipe perawatan (*Preventive/Corrective*), durasi *downtime*, dan catatan keluhan teknisi.  
   * **Kebutuhan Pemrosesan:** Teks dari catatan keluhan teknisi (misalnya: "motor *overheat*", "cek *bearing*") sangat dibutuhkan untuk diekstraksi menjadi variabel biner melalui *Natural Language Processing* (NLP) guna memperkaya fitur (*feature enrichment*) pada model prediktif.  
3. **Korpus Dokumen Standar Operasional Prosedur (SOP)** Data tekstual tidak terstruktur berupa fail PDF yang berisi buku manual mesin, SOP pemeliharaan, dan panduan Keselamatan dan Kesehatan Kerja (K3) pabrik.

   * **Kebutuhan Spesifik:** Dokumen wajib berformat teks digital yang dapat dibaca (*text-selectable*) atau diproses dengan *Optical Character Recognition* (OCR), bukan hasil pindaian gambar yang buram (prinsip *Garbage In, Garbage Out*). Data ini merupakan kebutuhan mutlak sebagai basis pengetahuan (*knowledge base*) bagi modul *Retrieval-Augmented Generation* (RAG).

**4.1.2 Analisis Kebutuhan Sistem** Untuk menjembatani peringatan dini teknis dan panduan operasional di lantai produksi pabrik, sistem harus memenuhi spesifikasi fungsional dari tiga pilar utama:

1. **Kebutuhan Fungsional Modul Prediktif (*Machine Learning Pipeline*)** Modul ini dituntut untuk tidak sekadar membaca data mentah, melainkan memprosesnya melalui rekayasa fitur (*feature engineering*). Kebutuhan output sistem ini terbagi dua:

   * **Klasifikasi Status Kesehatan Mesin:** Sistem harus mampu mengklasifikasikan kondisi operasional mesin ke dalam tiga kelas peringatan temporal, yaitu *Healthy*, *Warning*, dan *Critical*.  
   * **Regresi Peramalan Sisa Umur:** Sistem harus mampu memprediksi *Remaining Useful Life* (RUL) mesin ke dalam wujud variabel numerik bersatuan hari.  
2. **Kebutuhan Fungsional Modul Asisten Virtual (*RAG Pipeline*)** Modul ini merupakan inti interaksi sistem dengan pengguna akhir (teknisi). Fungsionalitas yang dibutuhkan meliputi:

   * **Pencarian Pintar (*Hybrid Retrieval*):** Sistem harus mampu menemukan instruksi perbaikan yang sangat spesifik dengan menggabungkan pencarian berbasis makna semantik (*Vector Search*) dan pencarian berbasis kecocokan kata kunci pasti (*BM25*) untuk menemukan kode suku cadang.  
   * **Pembangkitan Jawaban (LLM):** Sistem dituntut mampu mengintegrasikan hasil pencarian ke dalam model bahasa besar (LLM) untuk membangkitkan jawaban interaktif 24/7 yang bebas dari halusinasi serta murni berlandaskan pada dokumen SOP pabrik.  
3. **Kebutuhan Fungsional Integrasi & *Rule-Based Scheduler*** Kedua "Otak AI" (Prediktif dan Generatif) harus disatukan ke dalam satu platform utuh.

   * **Penjadwalan Otomatis:** Sistem memerlukan logika berbasis aturan (*rule-based*) yang dapat merespons angka RUL dari modul prediktif. Ketika RUL menyentuh ambang batas kritis, sistem harus secara otomatis memberikan rekomendasi tindakan perbaikan kepada manajemen.  
   * **Antarmuka Visual (*Dashboard*):** Dibutuhkan antarmuka yang responsif (dibangun dengan *framework* Next.js) untuk menampilkan spidometer kesehatan mesin (*health gauge*), grafik gelombang telemetri sensor secara seketika (*real-time*), dan elemen obrolan melayang (*floating chat widget*) agar teknisi dapat berinteraksi dengan *AI Copilot* secara langsung.

**4.2 Perancangan Sistem** *Bagian ini memaparkan arsitektur atau desain logis sebelum masuk ke penulisan kode.*

* **4.2.1 Perancangan Modul Prediktif:** Alur logis dari penerimaan data sensor hingga menjadi prediksi *Healthy/Warning/Critical* dan sisa umur mesin (RUL).  
* **4.2.2 Perancangan Modul *Retrieval-Augmented Generation* (RAG):** Arsitektur jalur teks, mulai dari dokumen mentah hingga diintegrasikan dengan LLM.  
* **4.2.3 Perancangan Integrasi dan Antarmuka:** Desain bagaimana hasil ML dan RAG disatukan ke dalam *Dashboard* (Next.js) dan diproses oleh *Rule-Based Scheduler*.

**4.3 Implementasi Sistem** *Di sinilah tahapan (Fase) dari "ML Engineer Pipeline" dan "RAG Pipeline" Anda dimasukkan, menunjukkan proses rekayasa (engineering) yang Anda lakukan.*

* **4.3.1 Implementasi Modul Prediktif (Eksperimen Pemodelan):**  
  * *Data Ingestion & Exploratory Data Analysis (EDA)* (Fase 1-2 ML)  
  * *Label & Feature Engineering* (Fase 3-4 ML)  
  * *Preprocessing & Imbalance Handling* (Fase 5-6 ML, menjelaskan teknik *Stratified Sequential Block Sampling*/SSBS tanpa augmentasi sintetis untuk mencegah *data leakage*)  
  * *Dataset Splitting & SMOTE* (Fase 7 ML)  
* **4.3.2 Implementasi Modul Asisten Virtual (RAG):**  
  * *Document Ingestion & Semantic Chunking* (Fase 1-2 RAG)  
  * *Embedding & Vector Database* (Fase 3 RAG)  
  * *Hybrid Retrieval System & LLM Generation* (Fase 4-6 RAG)  
* **4.3.3 Implementasi Integrasi API dan *Backend*:** Menjelaskan ekspor artifak model (Fase 10 ML) dan penyatuan *pipeline* RAG ke dalam *Endpoint API* FastAPI (Fase 7 RAG).

**4.4 Pengujian** *Struktur ini dipertahankan persis seperti format dosen, namun isinya menampung eksperimen komparasi model dan evaluasi.*

* **4.4.1 Deskripsi Pengujian:** Menjelaskan skenario apa saja yang diuji (misal: Skenario 1 menguji komparasi model klasifikasi Random Forest, XGBoost Classifier, LightGBM; Skenario 2 menguji regresi XGBoost Regressor, LSTM, GRU; Skenario 3 menguji RAG).  
* **4.4.2 Prosedur Pengujian:** Menjelaskan *bagaimana* pengujian dilakukan (misal: pembagian data *train/test*, *hyperparameter tuning*, dan metrik apa yang dipakai seperti RMSE/MAE untuk regresi, F1-Score untuk klasifikasi, dan RAGAS untuk teks).  
* **4.4.3 Data Hasil Pengujian (Komparasi Model):** Menampilkan tabel-tabel mentah hasil eksperimen (Fase 8 ML). Di sinilah tabel komparasi antar algoritma diletakkan.  
* **4.4.4 Analisis Data / Evaluasi Pengujian:** Pembahasan mendalam (Fase 9 ML & Fase 8 RAG). Menganalisis *mengapa* **XGBoost Classifier** menang untuk klasifikasi (F1=0.9906) dan *mengapa* **LSTM V2** terpilih untuk regresi (MAE=0.7985 hari). Di sini juga dibahas evaluasi metrik RAGAS ( *Faithfulness* & *Answer Relevancy*).l