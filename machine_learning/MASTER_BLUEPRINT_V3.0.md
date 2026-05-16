# **MASTER BLUEPRINT: LAPIS AI PREDICTIVE MAINTENANCE SYSTEM**

**Versi:** 3.0 (Final Architecture & Deliverables)

**Definition of Done (DoD):** End-to-End Software Integration & Functional.

---

## **1\. TUJUAN PENELITIAN**

1. Membangun sistem pemodelan prediktif hibrida menggunakan Deep Learning dan Machine Learning untuk memprediksi sisa umur pakai mesin (RUL) serta mengklasifikasikan status kesehatannya berdasarkan data sensor *time-series*.  
2. Merancang asisten teknis cerdas berbasis arsitektur *Retrieval-Augmented Generation* (RAG) guna mempermudah teknisi menemukan instruksi dari dokumen SOP pabrik.  
3. Membangun *Maintenance Scheduler* yang merespons prediksi batas kritis mesin menjadi jadwal tindakan perbaikan otomatis.  
4. Mengintegrasikan seluruh modul AI ke dalam satu *dashboard* antarmuka web interaktif untuk visualisasi telemetri *real-time*.

---

## **2\. FINAL DELIVERABLES (OUTPUT PRODUK)**

### **A. Antarmuka (Halaman Web / UI) — *Frontend (Amir)***

1. **Halaman Authentication:** Akses masuk Enterprise tertutup (hanya form Login, tanpa registrasi).  
2. **Halaman Real-Time Dashboard (Pusat Kendali):**  
   * *Sidebar Navigasi Mesin (Master View):* Panel 20 *Machine Cards* untuk status kilat (*Healthy/Warning/Critical*) & navigasi mesin.  
   * *Panel Telemetry Utama (Detail View):* Area detail dinamis berisi *8-Sensor Gauge Charts* (animasi data *real-time* via WebSocket), *RUL Banner*, dan *Anomaly Timeline*.  
3. **Halaman AI Copilot Hub (Khusus Teknisi):** *Chatbot interface* layar penuh. Terdapat **Fitur Citation** (kartu/chip) pada setiap balasan AI yang menampilkan sumber dokumen & nomor halaman.  
4. **Halaman Admin Panel (Khusus Manajer/Admin):**  
   * *Tab Manajemen Dokumen:* Antarmuka *upload* (PDF, DOCX, TXT) & tabel daftar dokumen terindeks RAG.  
   * *Tab Manajemen User:* Tabel CRUD dasar untuk akun pengguna.  
5. **Modul AI Copilot (Sliding Panel):** Panel asisten AI *persistent* yang bisa ditarik dari halaman mana saja tanpa me-reset riwayat obrolan.  
6. **Halaman Maintenance Scheduler:** Papan Tugas (*Task Board*) dinamis berisi jadwal perbaikan mesin berdasarkan hitungan *Safety Margin*.  
7. **Halaman Historical Logs & Reports:** Tabel analitik rekam jejak sensor dan riwayat perbaikan dengan fitur *Export* (PDF/Excel).  
8. **Sistem Notifikasi:** Komponen *Global Toast Alert* yang muncul melayang di seluruh rute aplikasi jika mesin memasuki kondisi kritis.

### **B. Mesin & Logika (Modul Backend & AI) — *Zikran, Aqsa, Reynaldi***

1. **Modul ML Predictive Engine (Zikran):**  
   * *Model 1 (Health Status Classifier):* Model ML *ensemble* (Random Forest/XGBoost) pengklasifikasi status kesehatan (*Healthy, Warning, Critical*).  
   * *Model 2 (RUL Predictor):* Model DL *sequence-based* (LSTM) untuk memprediksi *Remaining Useful Life* secara numerik.  
2. **Modul Hybrid RAG & Knowledge Base (Aqsa):**  
   * *Multi-Format Ingestion Engine:* *Parser* PDF, DOCX, dan TXT menjadi teks bersih.  
   * *Vector Database:* Penyimpanan (Chroma/Qdrant) untuk *chunking* & *embedding*.  
   * *Live Context Injector:* Modul penyedot data Redis untuk disuntikkan ke prompt LLM.  
   * *Citation Extractor:* Algoritma pengembali *metadata* (nama file & halaman) ke Frontend.  
3. **Modul Telemetry Ingestion (Reynaldi):**  
   * *API Pipa Data:* *Endpoint* POST /api/telemetry/ingest dengan *Dispatcher* asinkron.  
   * *Dual-Write Database:* Penyimpanan paralel ke Redis (*live view*) dan TimescaleDB (arsip historis).  
4. **Modul Smart Routing & Automated Scheduler (Reynaldi):**  
   * *Smart NLP Router:* *Middleware* pendeteksi tipe pertanyaan teknisi (umum vs spesifik mesin).  
   * *Safety Margin Calculator:* Algoritma pengubah RUL menjadi tanggal eksekusi servis.  
   * *Alert Broadcaster:* Server WebSocket pemancar peringatan darurat ke Frontend.

---

## **3\. ALUR BISNIS (USER JOURNEY)**

1. **Secure Entry:** Teknisi/Admin *login* menggunakan kredensial yang sudah ada di *database*.  
2. **Global Monitoring:** Teknisi memantau *Real-Time Dashboard*. Sidebar menampilkan 20 mesin dalam status hijau (*Healthy*). Saat satu mesin diklik, *Gauge Chart* mesin tersebut berkedip menyajikan aliran data sensor langsung.  
3. **Anomaly & Alert:** Pipeline ML mendeteksi anomali pada M-01 ( muisal ketika terklasifikasi warning atau critical). Backend menembakkan *WebSocket broadcast*. Sistem memunculkan **Global Toast Alert** di layar teknisi: *"⚠️ M-01 memasuki fase Warning"*, dan kartu M-01 di sidebar berubah kuning.  
4. **AI Troubleshooting:** Teknisi menarik *Sliding Panel AI Copilot* dan bertanya solusi. AI menarik *live context* suhu M-01 dari Redis, mencarikan SOP di *Vector DB*, lalu menjawab dengan menyertakan *Citation* (Kutipan: SOP Halaman 42).  
5. **Automated Ticketing:** Tanpa perlu diketik manual, halaman *Maintenance Scheduler* sudah secara otomatis memunculkan Kartu Tugas darurat untuk perbaikan M-01 berdasarkan kalkulasi *Safety Margin*.  
6. **Admin Ops (Admin Only):** Manajer Pabrik masuk ke *Admin Panel* untuk menambahkan PDF manual pabrik versi terbaru dan mengunduh laporan di halaman *Historical Logs*.