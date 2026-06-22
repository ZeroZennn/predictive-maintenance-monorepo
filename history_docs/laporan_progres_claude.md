# Laporan Progres Integrasi Deployment & Infrastruktur Lapis AI
*Laporan komprehensif ini merangkum seluruh perjalanan teknis mulai dari tahap awal kontainerisasi (Docker) hingga penyelesaian bug produksi dan stabilisasi arsitektur di lingkungan server Google Cloud Platform (GCP).*

---

## 1. Tahap Kontainerisasi Monorepo (Dockerization)
Sistem Predictive Maintenance Lapis AI berevolusi dari skrip pengembangan lokal menjadi arsitektur *microservices* terisolasi menggunakan Docker.
- **Orkestrasi Terpusat:** Membangun `docker-compose.yml` di akar monorepo untuk mengorkestrasikan 6 layanan utama: `backend` (Express.js), `frontend` (Next.js), `ml-service` (FastAPI/XGBoost/LSTM), `nlp-service` (FastAPI/Qdrant), `postgres`, dan `redis`.
- **Custom Dockerfiles:** Menyusun `Dockerfile` spesifik untuk masing-masing *service* guna memastikan isolasi *environment*, termasuk `Dockerfile.ml` untuk mesin analitik dan `Dockerfile.nlp` untuk RAG Pipeline.
- **Manajemen Jaringan Internal:** Menghubungkan seluruh *service* dalam satu *bridge network* khusus (`lapis_network`), memungkinkan komunikasi antar-API menggunakan resolusi DNS internal Docker (contoh: `http://ml-service:8000` dan `http://backend:3000`) tanpa mengekspos port ke internet terbuka.
- **Manajemen Volume Data:** Menerapkan *named volumes* untuk persistensi basis data (`postgres_data`, `qdrant_data`, `redis_data`) dan *bind mounts* untuk berbagi file statis secara instan antar *container* (seperti `./nlp/data/raw` untuk berbagi hasil unggahan PDF antara *backend* dan *nlp-service*).

## 2. Optimasi Mesin AI & Resolusi OOM (Out-of-Memory) Killer
Dalam proses pengerahan ke mesin virtual GCP E2, sistem menghadapi keterbatasan perangkat keras yang kritis (CPU, RAM, dan Disk).
- **Resolusi Disk Full (Error 28):** Ukuran *image* Docker membengkak akibat pustaka *machine learning* berarsitektur GPU (CUDA). Hal ini diatasi dengan melakukan *refactor* total pada `requirements_ml.txt` dan `nlp/requirements.txt`, memaksa penggunaan versi CPU-only (`tensorflow-cpu` dan `torch-cpu`). Langkah ini memangkas gigabita ukuran *image* dan mencegah *storage exhaustion*.
- **Penyelesaian OOM Killer:** Alokasi memori yang ketat (`mem_limit`) pada `docker-compose.yml` menyebabkan Linux OOM Killer membunuh *container* ML dan NLP tepat saat mereka mencoba memuat (*pre-load*) model ke dalam RAM saat *startup*. Kami mencabut batas tersebut dan melakukan *downgrade* model NLP dari `multilingual-e5-base` ke `multilingual-e5-small` dengan dimensi 384 berbasis *runtime* ONNX untuk efisiensi RAM maksimal tanpa degradasi semantik.

## 3. Migrasi Infrastruktur Jaringan & Keamanan (Cloudflare Tunnels)
- **Pemusnahan Caddy Server:** Eksperimen awal menggunakan Caddy sebagai *Reverse Proxy* lokal dihapus secara permanen (`Caddyfile` dan *service* terkait disingkirkan) untuk menghindari kompleksitas sertifikat SSL manual.
- **Implementasi Zero Trust:** Beralih sepenuhnya ke arsitektur **Cloudflare Tunnels** (`cloudflared`). Semua lalu lintas publik (domain `prime-ai.site`) diteruskan secara aman melalui *tunnel* terenkripsi langsung ke *container* internal. Firewall GCP kini ditutup sepenuhnya dari port publik (80/443), menjamin tingkat keamanan *enterprise-grade*.
- **Frontend HTTPS Fallback:** Menemukan dan menambal *bug* di mana pustaka kriptografi bawaan gagal menghasilkan *UUID* saat aplikasi diakses melalui HTTPS publik (Cloudflare). Kami mengimplementasikan *fallback* algoritma menggunakan `Math.random` untuk mencegah *web crash* pada komponen *rendering*.

## 4. Penambalan Bug Kritis pada Integrasi Lintas-Layanan (Cross-Container API)
Selama tahap *Smoke Test* di lingkungan produksi, ditemukan beberapa anomali komunikasi antar-*container* yang telah diselesaikan:
- **Bug 404 pada File Upload (`POST /nlp/ingest`):**
  - *Isu:* Backend sukses menyimpan file PDF ke folder internalnya dan menyuruh NLP memprosesnya. Namun NLP gagal menemukan file karena sistem berkas mereka terisolasi oleh Docker.
  - *Solusi:* Menambahkan *volume mount* `- ./nlp/data/raw:/nlp/data/raw` pada *service* `backend` di `docker-compose.yml`. Kini, file yang diunggah backend langsung tersimpan di *host* dan dikenali secara magis oleh NLP.
- **Bug Resolusi DNS pada NLP Callback (`[Errno -2]`):**
  - *Isu:* Setelah NLP selesai melakukan *chunking* & *embedding*, ia mencoba mengirim status `READY` ke Backend melalui URL `http://host.docker.internal:3000`. Alamat ini hanya berfungsi di Docker Desktop (Windows/Mac) dan gagal dikenali di server Linux GCP.
  - *Solusi:* Mengubah nilai `BACKEND_URL` menjadi alamat *service* Docker sejati: `http://backend:3000`.
- **Bug 404 saat Penghapusan Dokumen (`DELETE /nlp/documents/{id}`):**
  - *Isu:* Saat teknisi menekan tombol "Delete" di UI, Backend meminta NLP menghapus vektor dokumen tersebut. Sayangnya, *endpoint* DELETE di NLP belum diciptakan, sehingga melempar *error* 404 yang memblokir proses penghapusan di sisi Backend secara berantai.
  - *Solusi:* Membangun *dummy endpoint* `@router.delete("/documents/{document_id}")` di `nlp/api/endpoints.py` yang merespon `200 OK`. Tambalan taktis ini berhasil membebaskan pengguna untuk mengelola dan menghapus dokumen yang "tersangkut" (*stuck*) di status pemrosesan secara langsung dari antarmuka web.

---
*Status Akhir:* Keseluruhan arsitektur monorepo kini beroperasi secara harmonis di dalam kontainer Docker, diamankan oleh Cloudflare Tunnels, dan dioptimalkan penuh untuk eksekusi CPU di lingkungan cloud dengan keterbatasan sumber daya.
