# Instruksi Penulisan Technical Report NLP (Untuk Claude AI)

**Konteks untuk Claude:** 
Saya sedang menyusun dokumen *V2 Technical Report - Kainosoph* untuk proyek **Lapis AI** (sistem *Predictive Maintenance* cerdas berbasis IoT dan AI). Tolong bantu saya menulis/mengembangkan ulang **Bagian 4.3 Poin B (NLP & Generative AI)** dan **Tabel 4.8 (Hasil Evaluasi Custom Baseline Framework)** menggunakan data dan informasi teknis terlengkap di bawah ini. Jabarkan dengan bahasa akademik formal yang lugas dan sangat mendetail.

---

## 1. Referensi Diagram Arsitektur NLP
Sebagai panduan alur, saya merujuk pada diagram arsitektur NLP Pipeline berikut:
`(Gambar terlampir: Dokumen Mentah -> Ingestion -> Analyzer -> Chunking -> Embedding -> Vector DB -> User Query -> Hybrid Search -> Prompt Engineering -> API)`

Penjelasan teknis dari setiap komponen diagram tersebut terbagi menjadi 6 Fase Implementasi:

## 2. Rincian Fase Implementasi (Fase 1 - 6)

### Fase 1: Ingestion (Ekstraksi & Pembersihan Data Mentah)
- **Komponen Diagram:** *Dokumen Mentah (raw) -> Ingestion*
- **Detail Teknis:** Proses bermula dari dokumen mentah berformat PDF (Laporan Pemeliharaan, Buku Manual, dan *Standard Operating Procedure*/SOP). Modul *Ingestion* dibangun menggunakan pustaka `PyMuPDF` untuk mengekstraksi teks mentah secara efisien. Setelah diekstraksi, data melewati proses normalisasi intensif untuk menghapus *noise* karakter, *whitespace* berlebih, dan merapikan struktur teks agar siap diproses oleh tahapan selanjutnya.

### Fase 2: Analyzer & Chunking (Analisis Metadata & Segmentasi Adaptif)
- **Komponen Diagram:** *Analyzer -> Chunking*
- **Detail Teknis:** Modul *Analyzer* secara otomatis mengklasifikasikan tipe dokumen dan mengekstrak metadata kunci (misalnya: ID Mesin, Tanggal Laporan, Bahasa). Teks kemudian dipecah pada modul *Chunking* yang menerapkan dua strategi dinamis:
  1. **Section-based Chunking:** Menggunakan *Regular Expression* (RegEx) untuk dokumen terstruktur, memotong teks secara spesifik berdasarkan hirarki penanda Bab/Sub-bab.
  2. **Semantic Sliding Window:** Diterapkan pada dokumen berwujud prosa naratif. Memotong teks dengan tingkat tumpang-tindih (*overlap*) sebesar 20% guna mencegah terputusnya konteks semantik antar paragraf.

### Fase 3: Embedding (Representasi Vektor Semantik)
- **Komponen Diagram:** *Embedding*
- **Detail Teknis:** Potongan teks (*chunks*) ditransformasikan menjadi matriks representasi numerik menggunakan model *dense embedding* `intfloat/multilingual-e5-small` (dimensi 384) dari *HuggingFace* yang dijalankan menggunakan *backend* ONNX. Model arsitektur *small* ini dipilih secara khusus untuk menyelesaikan insiden memori bocor (OOM Killer) pada fase sebelumnya, sehingga tercapai keseimbangan (*trade-off*) paling optimal: penggunaan RAM yang minimal di lingkungan produksi (GCP E2 instances) tanpa mengorbankan kualitas retensi makna semantik Bahasa Indonesia.

### Fase 4: Vector Database (Penyimpanan & Indexing)
- **Komponen Diagram:** *Vector DB*
- **Detail Teknis:** Infrastruktur ruang vektor direalisasikan menggunakan **Qdrant Vector DB** yang diorkestrasikan dalam *container* Docker mandiri. Qdrant menyimpan jutaan vektor *embedding* lengkap dengan metadatanya, mendukung komputasi jarak (*nearest neighbor search*) secara *real-time* dengan latensi sangat rendah untuk operasi *retrieval*.

### Fase 5: User Query & Hybrid Search (Penelusuran Hibrida & Reranking)
- **Komponen Diagram:** *User Query -> Hybrid Search*
- **Detail Teknis:** Saat sistem menerima *User Query* (pertanyaan dari teknisi), kueri tersebut tidak hanya dicari menggunakan satu metode. Kerangka **Hybrid Search** memadukan keunggulan dua sisi:
  - *Dense Retrieval:* Mencari makna kontekstual melalui kemiripan vektor.
  - *Sparse Retrieval (BM25):* Mencari presisi leksikal / pencocokan kata kunci eksak (seperti kode *sparepart* atau kode error).
  Kedua hasil ini kemudian dinormalisasi silang menggunakan algoritma pemeringkatan **Reciprocal Rank Fusion (RRF, k=60)**. Guna menyaring hasil akhir, diterapkan mekanisme **Cross-Encoder Reranker** (`ms-marco-MiniLM-L-6-v2`) yang mengeliminasi dokumen *noise* dan hanya mempertahankan 8 dokumen (top-8) yang paling relevan secara absolut.

### Fase 6: Prompt Engineering & API (Generasi Kontekstual & Eksposur Layanan)
- **Komponen Diagram:** *Prompt Engineering -> API*
- **Detail Teknis:** Tahap final ini dikepalai oleh *Large Language Model* **gpt-4o-mini** via OpenAI API. Terdapat modul cerdas **Query Router** untuk menganalisis *intent* (niat) kueri, dan **Live Context Fetcher** yang menyuntikkan data sensor *real-time* (suhu, getaran, prediksi ML) langsung dari Redis ke dalam struktur *System Prompt*. Hal ini memungkinkan LLM menjawab kueri diagnostik berdasarkan kondisi riil mesin detik itu juga. Seluruh alur ini dibungkus dan diekspos melalui kerangka kerja **FastAPI** yang asinkron, lengkap dengan jalur panggil balik (*webhook callback*) untuk integrasi *seamless* dengan Backend utama.

---

## 3. Pembaruan Tabel Evaluasi (Tabel 4.8)

Selain penjelasan di atas, tolong sesuaikan juga data pada **Tabel 4.8 Hasil Evaluasi Custom Baseline Framework** menggunakan hasil pengujian teranyar berbasis framework **RAGAS (Retrieval Augmented Generation Assessment)** di bawah ini:

| Metrik Penilaian | Skor Rata-rata | Kategori Pilar |
| :--- | :---: | :--- |
| **Context Recall** | **1.0000** | Retrieval (Pencarian) |
| **Answer Similarity** | **0.9571** | Generation (Pembangkitan) |
| **Answer Relevancy** | **0.9201** | Generation (Pembangkitan) |
| **Context Precision** | **0.9000** | Retrieval (Pencarian) |
| **Faithfulness** | **0.7096** | Generation (Pembangkitan) |
| **Answer Correctness** | **0.5785** | Generation (Pembangkitan) |

*Penekanan Khusus untuk Claude:* Berikan *highlight* atau apresiasi teknis pada skor **Context Recall yang mencapai angka absolut (1.0000)** dan **Context Precision (0.9000)**, sebagai bukti empiris dari superioritas teknik *Hybrid Search* dan *Reranker* yang diimplementasikan pada Fase 5.
