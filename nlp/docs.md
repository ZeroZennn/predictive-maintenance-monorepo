# Bedah Arsitektur "Lapis AI"

## Arsitektur Dasar Lapis AI RAG Pipeline

Proyek Lapis AI berfokus pada pembangunan sistem Retrieval-Augmented Generation (RAG) untuk studi kasus pemeliharaan prediktif (predictive maintenance). Arsitektur dirancang dengan standar *Enterprise* dan memiliki beberapa pilar utama:

1. **Hierarchical Chunking (4 Level)**: Untuk menghindari pemotongan konteks (context truncation), sistem melakukan chunking bertingkat. Chunk berukuran kecil (Level 2) digunakan sebagai penanda pencarian di dalam Vector Database. Namun, saat sistem melempar prompt ke dalam LLM, ukuran konteks akan dikembangkan dengan mengambil hirarki penuhnya (Level 1 / Section). 
2. **Live Context Priority**: Laporan historis (knowledge base) akan kalah prioritas dibanding data sensor waktu-nyata (real-time). Data Live Context ini selalu diletakkan pada hierarki paling atas dalam injeksi prompt agar LLM memahami kondisi mesin yang paling baru dan faktual.
3. **Hybrid Retrieval**: Sistem tidak sepenuhnya bergantung pada pencarian vektor kosinus padat (Dense Retrieval menggunakan model embedding semantik). Terdapat kombinasi dengan algoritma pencarian teks klasik BM25 (Sparse Retrieval). Metode gabungan ini krusial mengingat dokumen manufaktur sering memakai nomor seri spesifik (contoh: "BRG-002" atau "M-01") yang sering tidak terdeteksi oleh Semantic Search murni. Hasil kedua algoritma ini digabung menggunakan formula Reciprocal Rank Fusion (RRF).

---

## FASE 1: Document Ingestion

Fase 1 bertugas sebagai filter masuk awal sebelum teks diberikan ke sistem NLP. Tujuannya adalah memproses dokumen laporan berformat PDF dan menghasilkan kumpulan teks bersih tanpa kehilangan struktur tabel dan paragraf. File operasional dari fase ini terletak di dalam `nlp/ingestion.py`.

### 1. File Konfigurasi dan Struktur Direktori 
Meskipun bukan script, struktur awal menjadi prasyarat berjalannya `ingestion.py`:
- `config.yaml` menjadi *single source of truth*. Ini mencegah eksistensi *magic numbers* tertanam (hardcoded) secara acak di dalam script Python.
- Terdapat partisi data di dalam direktori `data/`:
  - `data/raw`: Menyimpan file dokumen asli yang diletakkan oleh *user*.
  - `data/processed`: Menyimpan file hasil dari proses ingestion ini (yaitu `*.clean.txt`, `*.tables.json`, dan `*.meta.json`).

---

### 2. File: `nlp/ingestion.py`

File ini mengorkestrasi pembacaan PDF, pembersihan teks, ekstraksi tabel, dan pembentukan metadata dokumen.

#### 2.1. Dataclass: `DocumentMetadata`
- **Alur Logika**: Ini adalah kerangka data (data structure) yang bertujuan memastikan struktur JSON dari semua meta-dokumen konsisten. Menggunakan dekorator `@dataclass` meminimalisasi *boilerplate code* di dalam Python. 
- **Fields (Atribut)**:
  - `doc_id` (str): Identifier unik untuk dokumen (misal: "LAP-M01").
  - `doc_type` (str): Jenis laporan, terstandarisasi menjadi `maintenance_report`, `knowledge_base`, `schema`, dsb.
  - `source_file` (str): Menyimpan nama dokumen PDF fisik aslinya.
  - `month` (Optional[str]): Jika dokumen memuat nama bulan (M01, M02), akan disimpan. Bisa bernilai tunggal, *range* (M01-M20), atau kosong (`None`).
  - Atribut placeholder seperti `machine_ids` dan `anomaly_flags` sengaja diatur ke *empty list*. Keduanya akan diisi oleh *Chunker* pada Fase 2.
  - Metrik ekstraksi fisik seperti `page_count` (int), `extraction_method` (str), `extracted_at` (str datetime format iso), `has_tables` (bool), dan `table_count` (int) digunakan untuk audit di kemudian hari.

#### 2.2. Class: `DocumentIngestionPipeline`
Kelas orkestrator yang menguasai fungsionalitas keseluruhan pada fase ingestion.

**`__init__(self, config_path: str)`**
- **Input**: *String* dari path file konfigurasi `.yaml`.
- **Logika**: Menginisialisasi *state* saat pertama instansiasi pipeline dilakukan. Membaca file yaml dengan `yaml.safe_load`. Kelas ini juga mendaftarkan direktori input (`raw_dir`) dan output (`processed_dir`). Direktori target akan dibuat jika tidak ditemukan di dalam hirarki *file system* menggunakan library `pathlib`.

**`infer_doc_type(self, filename: str) -> str`**
- **Input**: Nama file `filename` berformat string.
- **Logika**: Melakukan normalisasi string ke alfabet kecil (`lower()`). Mengeksekusi rentetan kondisional `if` untuk mendeteksi *substring*. Contoh, mendeteksi eksistensi kata "laporan" dan mengubahnya menjadi penamaan standar klasifikasi "maintenance_report".
- **Output**: Mengembalikan string identitas pengelompokan yang sudah divalidasi.

**`infer_month(self, filename: str) -> Optional[str]`**
- **Input**: Nama file `filename` berformat string.
- **Logika**: Menggunakan ekspresi reguler (RegEx) `r"M(\d{2})"` untuk memindai pola karakter berawalan 'M' diikuti dua angka numerik. List hasil temuan (matches) dilakukan *deduplikasi* dengan menjaga urutan aslinya menggunakan `dict.fromkeys(matches)`.
  - Jika satu bulan ditemukan, keluarkan format absolut: "M01".
  - Jika multi-bulan ditemukan di dalam nama file yang berisikan bundle laporan, keluarkan *range* dari nilai *min* ke *max*: "M01-M20".
- **Output**: Kembalian string rentang bulan atau objek `None`.

**`generate_doc_id(self, filename: str, doc_type: str) -> str`**
- **Input**: Nama file dan tipe dokumen.
- **Logika**: Menciptakan primary key identifier. File "maintenance_report" mendapat *prefix* "LAP-", lalu digabungkan dengan bulannya. File *bundle* bulan dipaksa menggunakan nama statis "LAP-BUNDLE". Tipe knowledge base, schema, dan API juga diberikan format statis dengan *prefix* berurutan "KB-", "SCH-", "API-". Jika tidak masuk klasifikasi mana pun, nilai jatuh ke blok *fallback* dengan memberikan ID "DOC-XXXXXXXX".
- **Output**: Key string identifier unik.

**`extract_with_pdfplumber(self, pdf_path: Path) -> Tuple[str, List[Dict], int]`**
- **Input**: Absolut path yang diarahkan ke file PDF spesifik.
- **Logika**: Menggunakan pustaka *pdfplumber* yang optimal dalam mengekstrak koordinat kotak huruf di dalam PDF. Fungsi mengiterasi setiap nomor dan isi halaman dengan `pdf.pages`.
  - Memanggil `extract_text()`. Teks halaman diakumulasi ke dalam list. Teks kosong dibuang dan dilog sebagai *warning*.
  - Pemanggilan `extract_tables()` memberikan kembalian *list of lists*. Modul ini akan menyertakan data tabel dan nomor halaman di dictionary temporer agar tidak membingungkan mesin RAG nanti.
  - Gabungkan seluruh paragraf antar halaman menggunakan batas dua baris (`\n\n`).
- **Output**: Menghasilkan 3 elemen kembalian: string kombinasi teks, list-dictionary dari semua data tabel, dan hitungan integritas halaman (integer).

**`extract_with_pymupdf(self, pdf_path: Path) -> Tuple[str, int]`**
- **Input**: Absolut path PDF.
- **Logika**: Fungsi *fallback*/cadangan yang dipanggil secara reaktif hanya apabila `pdfplumber` terbentur file PDF yang terkorupsi struktur tabelnya atau lambat. PyMuPDF (bernama namespace `fitz`) bekerja layaknya utilitas dump tingkat rendah. Menggunakan `.get_text("text")` dan melakukan metode penggabungan *newline* yang ekuivalen.
- **Output**: Teks penggabungan (string) dan total halaman (integer). Tidak mengembalikan tabel.

**`clean_text(self, raw_text: str) -> str`**
- **Input**: Teks kotor hasil instrumen PDF (`raw_text`).
- **Logika**: 
  - Langkah krusial pertama adalah melakukan normalisasi garis putus (*linebreaks*). Karakter non-standar `\r\n` (CRLF bawaan teks windows) dan `\r` direndahkan menjadi standar karakter linux/unix `\n`.
  - PDF memotong paragraf secara arbiter mengikuti garis cetaknya. Penggunaan RegEx tingkat menengah `re.sub(r"([a-z0-9,;])\n([a-z])", r"\1 \2", text)` memvalidasi apabila baris pertama berakhir dengan huruf non-kapital / numerik dan dilanjutkan baris kedua dengan huruf kecil; pemotongan diubah menjadi sebuah spasi.
  - Menghapus eksistensi nomer halaman berulang. Jika suatu baris dievaluasi *hanya* mengandung angka `\d+`, maka akan dimusnahkan.
  - Menghapus baris statis *noise* dan sisa debu OCR dengan memblokir string berkarakter kurang dari 3 panjang (selain newline).
  - Melipatgandakan *whitespace* mati menggunakan operasi kompresi, dan melakukan `strip()` atau pemotongan spasi ujung sisi pada seluruh file utuh.
- **Output**: Karakter super-bersih bebas bias pemenggalan yang akan meringankan kerja LLM.

**`process_single_file(self, pdf_path: Path) -> Optional[DocumentMetadata]`**
- **Input**: `pdf_path` file spesifik.
- **Logika**: Fungsi eksekutor satu unit dokumen. 
  - Mengeksekusi inferensi fungsi bantuan untuk ID dan Tipe. 
  - Menempatkan blok isolasi kesalahan `try-except` di seputar eksekusi `extract_with_pdfplumber`. Jika terbentur *exception*, segera turunkan gigi mesin pemrosesan dan masuk ke instrumen `extract_with_pymupdf`.
  - Teks dilemparkan pada utilitas `clean_text()`.
  - Membangkitkan representasi instansi `DocumentMetadata` ke memori dengan parameter statistik yang didapat.
  - Proses file I/O dimulai: Teks bersih di-write pada destinasi disk bernama `{doc_id}.clean.txt`.
  - Mengonversi instance dari atribut Dataclass menggunakan pustaka bantu `asdict()`, dikonversikan menjadi format baku JSON, dan diletakkan dalam nama `{doc_id}.meta.json`.
  - Sama halnya dengan matriks List-of-list array tabel ditaruh pada berkas `{doc_id}.tables.json` apabila flag parameter *has_table* bernilai *True*.
- **Output**: Mengembalikan model instansi objek metadata ke *caller* (pengguna fungsi) sebagai referensi audit.

**`process_all(self) -> List[DocumentMetadata]`**
- **Input**: Tidak memiliki argumen parameter.
- **Logika**: 
  - Mencari iterasi ekstensi `"*.pdf"` pada inputan `raw_dir`.
  - Melakukan looping fungsi `process_single_file` untuk array dari pointer file yang sudah didapatkan. Memasukkan list metadata hasil yang *valid* (tidak melempar null) ke dalam list gabungan besar.
  - Mengompilasi format statistik makro `summary`: total files, *success pass*, *error fallbacks*, timestamp.
  - Menyimpan manifest file summary gabungan pada folder processed bernama `ingestion_summary.json`.
- **Output**: Array list dari keseluruhan manifest dokumen.

## FASE 2: Semantic Text Chunking

Fase 2 bertujuan memecah dokumen yang telah dibersihkan di Fase 1 menjadi potongan-potongan kecil (chunks) yang memiliki makna semantik. Chunk ini nantinya akan dikonversi menjadi vektor. Terdapat 4 file krusial yang mengimplementasikan metode "Polymorphic Chunking" menggunakan arsitektur berbasis *Object-Oriented Programming* (OOP).

### 1. `nlp/chunking/base_chunker.py`
File ini menyediakan kerangka dasar abstrak (Blueprint) yang wajib ditaati oleh semua tipe chunker.

#### Dataclass: `BaseChunk`
- **Tujuan**: Struktur data standar untuk menyimpan hasil potongan teks beserta konteksnya.
- **Fields (Atribut)**:
  - `chunk_id`, `doc_type`, `source_doc`, `source_page`: Identifier dan asal dokumen (penting untuk referensi citation ke pengguna).
  - `chunk_type` (str): Klasifikasi spesifik misal `event_emergency` atau `procedure`.
  - `text_content` (str): Potongan teks aktual yang akan dikonversi menjadi vektor embedding.
  - `machine_ids` (List[str]): Kunci untuk filter *metadata* (misal: "M-01").
  - `priority` (int): Bobot prioritas (misal 3 untuk darurat).
  - Field opsional (kosong bila tak relevan): `month_label`, `event_type`, `downtime_hours`, `cost_idr`, `part_codes`, `thresholds`, `extra_metadata`.
- **Method `get_citation(self)`**: Menghasilkan *dictionary* ringkas berisi referensi dokumen untuk dikirim ke UI / *Frontend*.

#### Class Abstrak: `BaseChunker(ABC)`
- **Tujuan**: Kelas induk (*parent class*) turunan dari modul `ABC` (Abstract Base Class). Tidak bisa diinstansiasi langsung.
- **`__init__(self)`**: Membaca konfigurasi `config.yaml` dan mendaftarkan `processed_dir`.
- **Abstract Methods**: `chunk(self, doc_id)` dan `get_statistics(self, chunks)`. Kedua metode ini dideklarasikan kosong dan **memaksa** (enforce) kelas turunannya untuk mengimplementasikan logikanya sendiri.
- **Utility Methods (Bantuan)**: 
  - `save_chunks`: Menyimpan *list of chunks* ke format `*.chunks.json`.
  - `load_clean_text`, `load_tables`, `load_metadata`: Menarik (load) kembali file dari Fase 1.
  - `detect_machine_ids(self, text, filename)`: Logika *RegEx* pencarian pola (M-01 s/d M-20) pada nama file dan 500 karakter pertama teks untuk menandai keterkaitan *chunk* terhadap ID Mesin tertentu.

### 2. `nlp/chunking/maintenance_chunker.py`
Chunker yang dirancang khusus untuk membedah bentuk laporan pemeliharaan bulanan yang penuh dengan tabel (*Tabular Data*).

#### Class: `MaintenanceChunker` (turunan `BaseChunker`)
- **`__init__(self)`**: Menginisialisasi pemetaan (mapping) bulan teks bahasa Indonesia ke index (Januari -> 1), pemetaan tingkat prioritas (emergency=3), dan tipe *event* ("event_emergency").
- **`build_context_map(self, clean_text: str)`**:
  - **Input**: Teks bersih dokumen.
  - **Proses**: Memindai baris per baris. Jika ada pola "Mesin M-XX", id tersebut dicatat. Jika ada pola "Bulan: Juli 2025", bulan tersebut dicatat.
  - **Output**: *List of dictionary* yang memetakan konteks mesin ke halaman/tabel mana konteks tersebut valid.
- **`create_event_chunk(self, row, context, source_page, row_index, source_doc)`**:
  - **Input**: Data baris (*row*) spesifik tabel, metadata tabel, halaman.
  - **Proses**: Mengambil field seluler tabel (Tanggal, Tipe, Catatan, Downtime, dll). Membentuk teks semantik dengan menggabungkan konteks (*[EVENT_PREVENTIVE | M-01 | Juli 2025]*). Field biaya dinormalisasi. String waktu *downtime* diparsing menjadi float.
  - **Output**: Membangkitkan objek dataclass turunan `MaintenanceChunk`.
- **`create_summary_chunk(self, machine_id, events, source_doc)`**:
  - **Input**: ID Mesin dan *list* seluruh event-nya di dokumen tersebut.
  - **Proses**: Menghitung kalkulasi agregat (Total events, Jumlah darurat, Total downtime, Suku cadang dominan diganti).
  - **Output**: Menghasilkan sebuah "Meta-Chunk" dengan tipe `machine_summary` sebagai ringkasan. (Ini adalah teknik krusial untuk menjawab pertanyaan *"Berapa total masalah mesin X?"* tanpa meminta LLM menghitung satu persatu *chunks*).
- **`chunk(self, doc_id: str)`**:
  - **Logika Utama**: Membaca struktur tabel yang dihasilkan oleh *pdfplumber* di Fase 1. Melakukan validasi kesesuaian jumlah elemen baris dengan *header*. Melakukan iterasi penciptaan `event_chunk` per baris. Di akhir iterasi, semua chunk diurutkan per mesin untuk menciptakan `summary_chunk`. Menyimpannya di *disk*.

### 3. `nlp/chunking/prose_chunker.py`
Chunker yang menangani teks prosa tak terstruktur (naratif) seperti SOP, Manual, atau Panduan Bebas.

#### Class: `ProseChunker` (turunan `BaseChunker`)
- **`__init__(self)`**: Mendaftarkan kamus pencarian *regex patterns* yang canggih (RegEx list). Contoh: kata "darurat" atau "loto" akan diklasifikasikan sebagai `safety`. Terdapat juga pola pendeteksi spesifikasi *(suhu/getaran/tekanan/rpm)* dan suku cadang pabrikan (format XXX-YYY).
- **`split_into_sections(self, clean_text: str)`**:
  - **Proses**: Pemecahan didasarkan pada keberadaan penomoran numerik (contoh: "1. Pendahuluan"). Teks di- *split* menggunakan ekspresi reguler `^(\d+\.\s+.+)$` dengan dukungan *multiline flag*. Bagian teks di atas *header* bernomor akan digolongkan ke *section* nol ("Pendahuluan"). Jika dokumen tidak bernomor, dikelompokkan menjadi satu "Konten Utama".
- **`extract_thresholds(self, text: str)`**:
  - **Proses**: Menerapkan regex terhadap konten suatu seksi. Jika nilai angka yang bersandingan dengan derajat / unit tertentu (Celcius, Psi, mm/s) ditemukan, angka tersebut diubah menjadi *float* dan didaftarkan sebagai parameter `threshold` di metadata chunk tersebut.
- **`chunk(self, doc_id: str)`**:
  - **Logika Utama**: Mengambil teks bersih, memotongnya menjadi *sections*, dan mengabaikan bagian dengan panjang kata tak bermakna (< 20 karakter). Ekstraksi `part_code` dan parameter ambang operasional (thresholds). Memangkas *(trim)* ukuran teks dengan *hard limit* 800 karakter agar dimensi *embedding* terjaga. Menyimpan chunks ke *disk*.

### 4. `nlp/chunking/router.py`
File cerdas pengatur lalu lintas (*Smart Dispatcher*). Menggabungkan desain *Factory Pattern*.

#### Class: `ChunkerRouter`
- **Atribut `ROUTING_MAP`**: *Dictionary* di level kelas yang mendaftarkan relasi antara `doc_type` dan Kelas Chunker yang bertanggung jawab mengeksekusinya. Misal: `maintenance_report` diarahkan ke `MaintenanceChunker`, sedangkan `sop` diarahkan ke `ProseChunker`. 
- **`get_chunker(self, doc_type: str)`**: 
  - **Logika**: Mencari instansiasi kelas dari *map*. Apabila tiba-tiba sistem mendeteksi dokumen dengan *doc_type* gaib/tak dikenal, sistem memiliki jaring pengaman (*fallback mechanism*) untuk memaksakan eksekusi menggunakan `ProseChunker`.
- **`route(self, doc_id: str)`**: Menerima `doc_id`, mencari tipe dari metadata (Fase 1), mengambil chunker yang cocok, dan menjalankan `chunker.chunk(doc_id)`.
- **`route_all(self)`**: Memindai seluruh artefak `*.meta.json` di `processed_dir` untuk diproses massal oleh *pipeline*.

---

## FASE 3: Embedding & Vector Database

Fase 3 bertugas mengonversi potongan teks (chunks) dari Fase 2 menjadi representasi vektor matematis (embeddings) dan menyimpannya ke dalam sistem basis data vektor (Vector DB) agar dapat dicari berdasarkan kedekatan semantik.

### 1. `nlp/embeddings/embedder.py`
Modul ini bertindak sebagai pembungkus (wrapper) untuk model embedding, mengelola konversi teks menjadi representasi *Dense Vector*.

#### Class: `EmbeddingModel`
- **Tujuan**: Mengimplementasikan *Singleton Pattern* untuk memastikan model *HuggingFace SentenceTransformer* yang sangat besar (berat di RAM/VRAM) hanya dimuat satu kali selama *runtime* aplikasi.
- **`load_model(self)`**:
  - **Logika**: Membaca nama `primary_model` dari `config.yaml` (yaitu `intfloat/multilingual-e5-large`). Jika terjadi kegagalan muat (misal karena koneksi internet putus saat mengunduh bobot/weights), fungsi ini otomatis mengeksekusi model cadangan (`fallback_model`). Sistem bersifat idempoten; jika dipanggil berkali-kali, ia tidak akan memuat ulang model yang sudah aktif.
- **`_add_prefix(self, texts, is_query)`**:
  - **Logika**: Khusus untuk arsitektur model E5, teks harus diawali dengan instruksi spesifik agar hasil embedding optimal. Fungsi ini menyematkan string awalan `"query: "` jika input adalah pertanyaan user, dan `"passage: "` jika input adalah dokumen *knowledge base*.
- **`embed_texts(self, texts, is_query, show_progress)`**:
  - **Input**: List string teks.
  - **Proses**: Memanggil metode `.encode()` bawaan model dengan pengaturan *batch_size* untuk pemrosesan paralel, dan *normalize_embeddings=True* yang mengonversi skor kecocokan murni menjadi *Cosine Similarity* rentang -1 hingga 1.
  - **Output**: *Numpy array* (*nd-array*) dengan dimensi matriks (N, dimension).
- **`embed_chunks(self, chunks)`**:
  - **Proses**: Menerima list *dictionary chunks*, mengekstrak nilai dari kunci `text_content`, mengeksekusinya ke `embed_texts()`, dan langsung menyuntikkan vektor hasilnya ke kunci baru bernama `embedding` secara *in-place*.

### 2. `nlp/embeddings/vector_store.py`
Modul ini menangani antarmuka (interface) database khusus vektor menggunakan pustaka `Qdrant`.

#### Class: `VectorStore`
- **Tujuan**: Abstraksi CRUD (Create, Read, Update, Delete) dan eksekusi algoritma *Similarity Search* ke dalam koleksi Qdrant.
- **`__init__(self)`**: Mendukung tiga mode operasi database dari konfigurasi: `memory` (volatil untuk testing), `local` (disimpan pada file/disk lokal), atau mode server/host.
- **`create_collection(self, recreate)`**:
  - **Logika**: Mengonfigurasi parameter indeks matriks `VectorParams` (ukuran dimensi vektor dan metode jarak ukur/distance `Distance.COSINE`). Mengontrol pembuatan koleksi secara hati-hati agar tidak menimpa data tanpa otorisasi flag `recreate`.
- **`_build_payload(self, chunk)`**:
  - **Proses**: Membuang (pop) atribut matriks `embedding` dari dalam *dictionary chunk*, karena vektor matriks diproses terpisah oleh mesin Qdrant. Menyisakan metadata teks murni untuk disimpan sebagai `payload`. Memastikan setiap metadata kompatibel dengan serialisasi JSON Qdrant.
- **`upsert_chunks(self, embedded_chunks, batch_size)`**:
  - **Input**: List chunks yang sudah berisikan vektor.
  - **Proses**: Melakukan perulangan batch (chunking data upload). Membangkitkan objek `PointStruct` berisikan id sekuensial, array vektor, dan metadata payload. Data dikirim (di-*upsert*) ke dalam database Qdrant.
- **`search_with_filter(self, query_vector, top_k, ...)`**:
  - **Input**: Array vektor dari kueri pertanyaan, nilai batas jumlah *output*, dan kumpulan argumen penyaringan metadata (filter).
  - **Logika**: Memanfaatkan fitur canggih *Payload Filtering* Qdrant. Membentuk daftar `FieldCondition`. Jika filter diberikan (misal `chunk_types=["event_emergency"]`), Qdrant akan mengeliminasi/membuang dokumen yang tak relevan *sebelum* algoritma vektor dijalankan, menjadikannya sangat cepat. Memanggil `.query_points()`.
  - **Output**: Format ulang ke *List of Dictionaries* berisi teks, metadata, dan bobot kesamaan semantik (`score`).

### 3. `nlp/embeddings/run_pipeline.py`
- **Tujuan**: Skrip orkestrator peluncuran eksekusi nyata dari ujung-ke-ujung (End-to-End) untuk Fase 3.
- **Proses Inti (`run_full_pipeline`)**: 
  1. Instansiasi dan pemuatan model ke RAM (`load_model()`).
  2. Mengumpulkan puluhan ribu *chunks* (teks kecil) berformat `.json` yang dihasilkan dari Fase 2.
  3. Konversi besar-besaran (mass-embedding) menjadi susunan angka vektor berdimensi spesifik.
  4. Penyuntikan (Upsert) semua vektor matematika tersebut ke dalam koleksi Qdrant.
- **`run_retrieval_tests(vs, embedder)`**: Eksekusi uji coba (Smoke Test) mandiri yang mengirim 5 pertanyaan kasus simulasi untuk memastikan mesin Qdrant merespons dengan skor relevansi yang tinggi (>0.70).

---

## FASE 4: Hybrid Retrieval System

Fase 4 adalah inti dari arsitektur *Information Retrieval* (Pencarian Informasi) pada Lapis AI. Fase ini tidak langsung melakukan pencarian, namun menggunakan desain 3 lapis: analisis kecerdasan kueri (Routing), pencarian gabungan (Hybrid Retriever), dan pemeringkatan ulang berbasis AI (Reranking).

### 1. `nlp/retrieval/query_router.py`
Modul ini bertindak sebagai otak pertama yang mencegat (*intercept*) pertanyaan pengguna sebelum menyentuh database. Modul ini melakukan dekonstruksi *intent* (niat kueri).

#### Class: `QueryRouter`
- **Tujuan**: Menganalisis kueri mentah dan menghasilkan parameter *pre-filtering* berwujud `RouterResult`.
- **Ekstraksi Kueri (`extract_*` & `detect_keywords`)**:
  - Menggunakan teknik *RegEx* canggih (contoh: `\bM-?\d{2}\b`) untuk mengekstrak identitas mesin secara otomatis dari teks.
  - Memindai pola waktu relatif dan absolut (misal "Agustus 2025" atau "kemarin").
  - Mencocokkan kueri terhadap tiga leksikon kata kunci bawaan: `EMERGENCY_KEYWORDS` (darurat, kebakaran), `MAINTENANCE_KEYWORDS` (bearing, perbaikan), dan `SOP_KEYWORDS` (loto, keselamatan).
- **`classify_mode(self, text, machine_ids)`**:
  - **Proses**: Menentukan `QueryMode` (Enum). Jika kueri mengandung lebih dari 1 ID Mesin, dikategorikan `MULTI_MACHINE`. Jika 1 ID, menjadi `MACHINE_SPECIFIC`. Jika mengandung kata waktu, menjadi `HISTORICAL`. Jika hanya menanyakan SOP/Manual tanpa menyebut nama mesin, menjadi `GENERAL`.
- **`build_*_filter(self, text, mode)`**: 
  - Menyusun filter khusus untuk Qdrant. Contoh: Jika terdeteksi kata "darurat", maka `chunk_type` difilter eksklusif hanya untuk array `["event_emergency"]`.
- **`route(self, query, machine_ids_hint)`**:
  - **Logika Utama**: Mengorkestrasi semua ekstraksi di atas, meluaskan/memperkaya kueri dengan `expand_query` (menambahkan konteks agar vektor *SentenceTransformer* lebih presisi), lalu membungkus semuanya ke dalam dataclass `RouterResult` dengan nilai keyakinan (confidence).

### 2. `nlp/retrieval/retriever.py`
Modul ini bertanggung jawab menjalankan pencarian sesungguhnya ke database menggunakan algoritma *Hybrid Search*.

#### Class: `HybridRetriever`
- **Tujuan**: Menggabungkan pencarian makna (Dense) dan pencarian kata presisi (Sparse/BM25) untuk mengungguli batas arsitektur pencarian tunggal.
- **`_dense_search(self, query, router_result, top_k)`**:
  - Memanggil `EmbeddingModel` untuk mengubah pertanyaan jadi matriks vektor.
  - Memanggil `VectorStore.search_with_filter` dengan mengaplikasikan parameter filter (seperti array ID mesin atau `doc_type`) yang telah disiapkan oleh `QueryRouter`. Ini mencegah halusinasi dengan memastikan pencarian hanya melihat area database yang relevan.
- **`_bm25_search(self, query, router_result, top_k)`**:
  - Membangun indeks Sparse BM25 menggunakan pustaka `rank_bm25`. Indeks ini (algoritma *Okapi BM25*) sangat andal menangani kueri dengan kata sandi teknis atau *Serial Number* spesifik.
  - Mengambil kandidat kasar sebanyak $3 \times top\_k$, kemudian mengaplikasikan penyaringan (post-filtering) berbasis metadata secara manual di atas Python.
- **`_rrf_fusion(self, dense_results, bm25_results, top_k)`**:
  - **Logika Inti**: Mengimplementasikan algoritma matematika *Reciprocal Rank Fusion* (RRF). RRF menghitung bobot akhir dokumen berdasarkan posisi ranking (*rank*) dari dua algoritma berbeda. Rumus utamanya: `score = 1.0 / (k + rank)`. Memastikan dokumen yang muncul baik di pencarian *Dense* maupun *BM25* didorong naik ke posisi teratas.
- **`retrieve(self, query, router_result)`**: Entry point yang menjalankan kombinasi ketiga tahap di atas dan mengubah luaran Qdrant menjadi sekumpulan objek `RetrievalResult`.

### 3. `nlp/retrieval/reranker.py`
Modul ini menyempurnakan hasil ranking kasar menggunakan model perbandingan AI yang lebih mahal secara komputasi.

#### Class: `CrossEncoderReranker`
- **Tujuan**: Membaca ulang setiap pasang dokumen yang terpilih oleh retriever dan memberikan skor absolut tingkat kecocokan menggunakan model jaringan saraf (Neural Network) berjenis *Cross-Encoder*.
- **`rerank(self, query, results, top_k)`**:
  - Menyiapkan himpunan masukan/input berupa tuple pasangan kueri dan teks dokumen.
  - Mengeksekusi `.predict(pairs)` via HuggingFace CrossEncoder. Berbeda dengan SentenceTransformer (Bi-Encoder), Cross-Encoder memberikan atensi mandiri antara kueri dan teks secara silang sehingga hasil korelasinya (skor 0-1) teramat akurat.
- **`rerank_with_fallback(self, ...)`**: Jaring pengaman sistem. Apabila model reranker gagal di-load (karena limitasi memori mesin peladen), fungsi ini mengangkap (catch) Exception dan mengembalikan skor RRF asli agar arsitektur tidak lumpuh.

### 4. `nlp/retrieval/pipeline.py`
Skrip pembungkus level tertinggi penyambung antar komponen.

#### Class: `RetrievalPipeline`
- **Tujuan**: Fasilitator antarmuka API FastAPI ke sistem kompleks Retrieval.
- **`run(self, query, ...)`**: Menginisialisasi kelas `QueryRouter`, `HybridRetriever`, dan `CrossEncoderReranker`, dan menyalurkan aliran datanya secara berurutan (*pipeline pattern*).
- **`get_context_text(self, results)`**: Metode *Formatter*. Mengonversi dataclass menjadi teks panjang masif (context payload) yang akan disuntikkan (*injection*) ke ruang *Prompt* LLM, di mana dokumen diformat terstruktur dengan penomoran, label (SOP/Emergency), dan ID sumber dokumen (Citation).

---

## FASE 5: Live Context Injection

Fase 5 menambahkan dimensi operasional nyata (real-time) ke dalam RAG pipeline. Alih-alih hanya berpegang pada dokumen statis (Fase 1-4), sistem menarik metrik sensor mesin terkini (suhu, getaran, RPM, dsb) secara instan.

### 1. `nlp/prompting/live_context.py`
Modul penyambung antara RAG dan sistem permesinan IoT (Internet of Things).

#### Class: `LiveContextFetcher`
- **Tujuan**: Mengambil status mesin (kritis/sehat) langsung dari sistem *Redis* (database memori real-time), atau menghasilkan data simulasi tersistem (*mock*) jika peladen Redis sedang tidak tersedia.
- **Data Generator (`_PROFILES`)**: 
  - Terdapat tiga profil kondisi terenkode: `healthy`, `warning`, dan `critical`. Jika sistem berjalan secara *Mock Mode* (untuk pengembangan), angka generator acak (RNG) akan dikunci/diseed secara deterministik per `machine_id`. M-01 selalu berada dalam parameter *warning* dengan suhu tinggi dan rentang waktu perbaikan tersisa (RUL) 12-25 hari.
- **`_fetch_from_redis(self, machine_id)`**:
  - Mengambil objek JSON langsung dari kunci *Redis*: `machine:{machine_id}:status`.
- **`fetch(self, machine_id)`**:
  - Alur fail-safe. Membaca dari memori fisik (Redis). Jika koneksi tak tersedia, melempar pesan *fallback* dan mencetak (*render*) objek Dataclass `LiveContextData` berdasarkan profil generator buatan.
- **Metode `to_prompt_text()` pada Dataclass `LiveContextData`**:
  - Secara pintar menerjemahkan atribut angka komputer menjadi teks naratif alamiah (misal: "Suhu : 85.5 °C") dalam satu blok string raksasa berjudul `[KONDISI REAL-TIME MESIN]`.

## FASE 6: Prompt Engineering & LLM Interface

Fase 6 adalah tahap eksekusi terakhir di mana konteks dokumen historis (RAG) dan konteks data mesin aktual digabungkan menjadi sebuah perintah (*prompt*) untuk diselesaikan oleh AI Generatif. 

### 1. `nlp/prompting/prompt_builder.py`
Pembangun (Builder) perintah sistemik secara leksikal. 

#### Class: `PromptBuilder`
- **Tujuan**: Merakit blok-blok teks (Live Context, Retrieved Chunks, History) menjadi satu kesatuan objek komplit `PromptPackage`.
- **Atribut `SYSTEM_PROMPT_TEMPLATE`**: Berisi karakter, persona (PT Tirta Segar Asisten), dan instruksi penjara (Guardrails) untuk LLM. Di sini diterapkan aturan keras *ZERO HALLUCINATION* (penolakan tegas jika informasi tidak ada di konteks) dan kewajiban standardisasi bentuk respon tindakan (`[SEGERA]`, `[7 HARI]`, `[PREVENTIF]`).
- **`build(self, query, results, live_context_data, history)`**:
  - Mengurutkan tingkat prioritas injeksi konteks ke dalam otak LLM. Susunan (Hierarchy) teks dari atas ke bawah:
    1. Kondisi Sensor Real-time (paling atas, agar LLM tahu status mutakhir).
    2. Referensi Historis (hasil retrieval Fase 4).
    3. Riwayat Percakapan (untuk mempertahankan konteks obrolan).
    4. Pertanyaan Pengguna (Query).
    5. Aturan Paksa Format Jawaban.
  - Memasukkan ke dalam `PromptPackage` yang mampu secara otomasi mencetak array pesan standardisasi API `{"role": "user", "content": ...}`.

### 2. `nlp/prompting/llm_interface.py`
Adapter cerdas untuk mengomunikasikan instruksi pengguna kepada penyedia API *Large Language Model*.

#### Class: `LLMInterface`
- **Tujuan**: Menerapkan arsitektur *Multi-Provider Fallback Chain* (*Resilience Pattern*). Sistem tidak akan macet (crash) apabila satu penyedia API bermasalah.
- **Metode Panggilan `_call_*` (Anthropic, Google, NVIDIA, Mock)**:
  - Masing-masing diisolasi dengan fungsi `try...except`. 
  - Panggilan utama dirancang menggunakan layanan **NVIDIA NIM** (memanfaatkan pustaka OpenAI SDK sebagai interface yang kompatibel) untuk mencapai *throughput* inferensi kecepatan tertinggi.
- **`generate(self, prompt_package)`**:
  - Logika utama eksekusi model bertingkat. Jika panggilan *primary_provider* gagal atau kehabisan kredit, secara perlahan menuruni rantai jaring keselamatan (*graceful degradation*) ke *fallback_provider* (Google Gemini), lalu terakhir ke modul `_call_mock` yang tidak mengkonsumsi biaya API sama sekali namun membalas dengan respon statis (hardcode) berbasis regex kasar.
- **`_extract_actions(self, answer)`**:
  - Sebuah pasca-pemrosesan (*post-processing*). Mencari dan menyaring label kaku (contoh: `[SEGERA]`) dari paragraf teks LLM, lalu membaginya menjadi array tindakan konkrit terpisah untuk selanjutnya dapat dieksekusi menjadi daftar *Checklist* UI bagi teknisi.

---

## FASE 7: FastAPI Backend & API Layer

Fase 7 berperan membungkus seluruh orkestrasi internal (Fase 1-6) menjadi sebuah layanan peladen web modern dan asinkron (API) yang siap dikonsumsi oleh aplikasi klien (contoh: *Demo UI* atau *Next.js Dashboard*).

### 1. `nlp/api/schemas.py`
Pusat definisi tipe data berbasis *Pydantic*.
- **Tujuan**: Menegakkan validasi ketat (strict typing) terhadap segala masukan (*request*) dan keluaran (*response*) API. Jika payload JSON dari klien cacat, API akan menolak secara otomatis (HTTP 422).
- **Struktur Kunci**:
  - `QueryRequest`: Skema pertanyaan, memiliki dukungan untuk penyaringan array `machine_ids` dan penyimpanan parameter status historis perbincangan (`history`).
  - `QueryResponse`: Skema mahakarya keluaran RAG, berisi blok teks jawaban (`answer`), saran tindakan yang dipartisi ke list array (`action_suggestions`), tingkat kepercayaan algoritma (`confidence`), tingkat latensi, hingga susunan objek `citations`.

### 2. `nlp/api/endpoints.py`
Pusat kontrol rute HTTP (*Controller/Route Handler*).
- **`get_components()`**: Mekanisme pola *Singleton/Lazy-Init*. Menjamin bahwa model kecerdasan raksasa (VectorStore, LLM, Retriever) hanya diload ke RAM secara intensif satu kali saat *server* mulai hidup (startup), bukan setiap kali ada request baru.
- **`@router.post("/query")`**: Titik tumpu pengeksekusian Pipeline RAG. Memanggil `RetrievalPipeline.run()`, `LiveContextFetcher.fetch()`, `PromptBuilder.build()`, dan `LLMInterface.generate()` lalu merajut semua balasan ke dalam format `QueryResponse`.
- **`@router.post("/ingest")`**: Endpoint khusus untuk penambahan data. Saat klien mengirimkan laporan PDF baru, fungsi `_run_ingest_background` dilempar ke *BackgroundTasks* agar proses *chunking* dan *embedding* (yang memakan waktu) tidak membuat koneksi API *timeout/hanging*. Klien akan langsung menerima HTTP 200 "accepted" sementara mesin bekerja secara tak sinkron di belakang layar.

### 3. `nlp/api/citation.py`
- **`CitationExtractor`**: Pemformat (*formatter*). Bertugas merangkum hasil kasar dari `RetrievalResult` dengan membuang duplikasi *(deduplication)* dan memetakan metadata dokumen ke struktur `CitationItem` siap baca. Juga menghitung skor `confidence` deterministik dari performa vektor pencarian.

## FASE 8: Evaluation Framework (RAGAS)

Fase 8 menggunakan **RAGAS** (*Retrieval-Augmented Generation Assessment*) secara murni — tanpa custom framework atau lapisan abstraksi tambahan. Evaluasi dijalankan langsung melalui `ragas.evaluate()` sebagaimana dimaksud oleh framework tersebut.

### Filosofi: Mengapa RAGAS?
RAGAS menggunakan **LLM-as-a-Judge** untuk mengukur kualitas RAG secara holistik — bukan sekedar mengecek apakah dokumen yang benar ditemukan, melainkan apakah jawaban LLM *benar*, *relevan*, *setia pada konteks*, dan *semantik sesuai dengan ground truth*.

### `nlp/tests/evaluation.py`

File ini terdiri dari tiga bagian fungsional:

**1. `GOLDEN_DATASET`** — 10 kasus uji deterministik dalam bentuk list of dict biasa, masing-masing berisi `query`, `machine_ids` (filter mesin), dan `ground_truth` (jawaban referensi manusia).

**2. `run_pipeline(cases)`** — Fungsi yang menjalankan full Lapis AI RAG pipeline (Retrieval → Live Context → Prompt → LLM) untuk setiap kasus, lalu mengumpulkan tiga hal yang dibutuhkan RAGAS:
- `user_input` → query teknisi
- `response` → jawaban LLM Lapis AI
- `retrieved_contexts` → list teks potongan dokumen yang diambil retriever
- `reference` → ground truth

Hasilnya dikemas langsung sebagai `SingleTurnSample` RAGAS dan dirakit ke `EvaluationDataset`.

**3. `main()`** — Orkestrasi utama:
1. Jalankan `run_pipeline()` → dapat `EvaluationDataset`
2. Konfigurasi RAGAS judge (LLM + Embedding) — **hanya menggunakan NVIDIA_API_KEY**
3. Panggil `ragas.evaluate(dataset, metrics)` — RAGAS yang bekerja sepenuhnya
4. Tampilkan hasil via `print(result)` (tabel skor RAGAS bawaan)
5. Simpan ke JSON via `result.to_pandas()`

### Delapan Metrik RAGAS yang Dipakai

#### Retrieval Metrics
| Metrik | Kelas Python | Yang Diukur |
|---|---|---|
| **Context Precision** | `LLMContextPrecisionWithReference` | *Signal-to-noise ratio* — apakah semua chunk yang diambil benar-benar relevan? |
| **Context Recall** | `LLMContextRecall` | Apakah informasi dari ground truth berhasil ditemukan dalam konteks? |
| **Context Entity Recall** | `ContextEntityRecall` | Apakah entitas kunci (nama mesin, kode, tanggal) dari ground truth ada di konteks? |
| **Noise Sensitivity** | `NoiseSensitivity` | Seberapa besar dokumen tidak relevan (noise) merusak kualitas jawaban? |

#### Generation Metrics
| Metrik | Kelas Python | Yang Diukur |
|---|---|---|
| **Faithfulness** | `Faithfulness` | Apakah setiap klaim jawaban LLM dapat dibuktikan dari konteks? (anti-halusinasi) |
| **Response Relevancy** | `ResponseRelevancy` | Seberapa tepat jawaban menjawab pertanyaan? |
| **Answer Correctness** | `AnswerCorrectness` | Seberapa benar jawaban LLM vs ground truth? |
| **Semantic Similarity** | `SemanticSimilarity` | Kesamaan makna jawaban LLM vs ground truth via embedding. |

### Konfigurasi Provider (Tanpa OpenAI Key)
- **LLM Judge**: `ChatOpenAI` diarahkan ke NVIDIA NIM (`base_url = https://integrate.api.nvidia.com/v1`) dengan model DeepSeek. NVIDIA NIM kompatibel penuh dengan OpenAI SDK.
- **Embedding**: `_E5Embeddings` — adapter tipis yang membungkus model `intfloat/multilingual-e5-large` lokal (sudah ada di proyek) sebagai LangChain `Embeddings`. Tidak perlu API key.

### Cara Menjalankan
```bash
# Full (10 kasus)
python -m nlp.tests.evaluation

# Quick (3 kasus pertama)
python -m nlp.tests.evaluation quick
```

---
**Dokumentasi Arsitektur RAG Lapis AI (Fase 1-8) Selesai.**

