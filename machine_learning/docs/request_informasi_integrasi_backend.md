Hai Reynaldi,

Selamat atas keberhasilan *fix* sebelumnya! Sekarang saya ingin memulai verifikasi integrasi *end-to-end* dengan alur: **Replay Script → Backend → ML Service → WebSocket → Frontend**.

Untuk kelancaran proses tersebut, saya membutuhkan beberapa informasi teknis dari sisi *backend*. Berikut detail yang saya perlukan:

### 1. Struktur Folder Backend
Mohon bantuannya untuk membagikan struktur folder *project backend* (2-3 level ke dalam) agar saya lebih mudah memahami arsitekturnya. Contoh format yang diharapkan:
```text
backend/
├── src/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── ...
├── docker-compose.yml
├── .env.example
└── ...
```

### 2. Setup & Installation Guide
Tolong berikan panduan langkah-langkah *setup*, meliputi:
* **Prerequisites:** Kebutuhan versi Docker, Node.js, atau dependensi lainnya.
* **Initial Setup:** Langkah *clone* dan *setup* pertama kali (termasuk *environment variables* apa saja yang wajib diisi).
* **Service Execution:** Urutan menjalankan semua *service* di `docker-compose`. Apakah ada urutan spesifik (misal: jalankan DB dulu, baru BE)?
* **Health Check:** Cara atau perintah (URL) untuk memverifikasi bahwa semua *service* sudah berstatus *healthy*.

### 3. Replay Script
Terkait *Replay Script*, mohon informasinya untuk hal-hal berikut:
* Lokasi file script tersebut di dalam folder *backend*.
* Command / cara menjalankannya.
* Apakah kecepatan *replay* bisa diatur (misal *tick* per detik)?
* Apakah script bisa dijalankan untuk mesin tertentu saja (misal hanya `M-01`)?
* Cara menghentikan atau me-reset *replay*.

### 4. WebSocket Event Contract
Saya butuh dokumentasi lengkap terkait WebSocket event yang dikirim Backend ke Frontend. Minimal mencakup:
* **Event saat data sensor baru masuk:** Nama event & struktur *payload* lengkap.
* **Event saat hasil prediksi ML sudah ada:** Nama event & struktur *payload* lengkap (wajib memuat: `label`, `confidence`, `rul_days`, dan `urgency`).
* **Event saat mesin berstatus CRITICAL (alert):** Nama event & struktur *payload* lengkap.
* **Channel / Room Naming Convention:** Apakah penamaan *channel* dibuat spesifik per `machine_id` atau bersifat *global*?

### 5. Cara Monitor & Debug
Mohon panduan untuk proses *monitoring* dan *debugging*:
* Command untuk melihat log ML Service di container (contoh: `docker logs [container_name] --tail 50 -f`).
* Apakah ada *dashboard monitoring* (misal: Adminer, RedisInsight, atau endpoint `/api/debug`)?
* Cara memastikan hasil prediksi ML sudah tersimpan dengan benar di Redis dan TimescaleDB.
* Cara melihat data yang berhasil masuk ke tabel `ml_predictions` di TimescaleDB.

### 6. File `.env.example`
Tolong lampirkan file `.env.example` atau daftar *environment variables* yang wajib diset, khususnya:
* `ML_SERVICE_URL` (harus cocok dengan konfigurasi `docker-compose`).
* `DATABASE_URL` (*connection string* TimescaleDB).
* `REDIS_URL`.
* `JWT_SECRET` (untuk testing *protected endpoints*).
* `PORT` Backend.

---

Setelah seluruh informasi ini lengkap, saya bisa segera memverifikasi dari sisi ML Service bahwa:
1. Setiap *tick* Replay Script berhasil memanggil ML Service.
2. *Response* dari ML Service diterima *backend* dan langsung di-*broadcast* via WebSocket.
3. Frontend dapat menangkap WebSocket event tersebut dan menampilkan label serta estimasi RUL dengan akurat.

Terima kasih atas bantuan dan kerja samanya!
