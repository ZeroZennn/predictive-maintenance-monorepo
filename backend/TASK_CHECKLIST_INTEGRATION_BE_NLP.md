# Task List Integration Backend ↔ NLP

## ✅ Task 1: Memperbaiki Format Data Sensor di Redis (Live Context)
- [x] Menambahkan metode `writeNLPContextToRedis` di `dispatcherService.js`
- [x] Menyimpan data telemetri ke key `machine:{machine_id}:status` di Redis dengan format JSON yang diminta NLP (`status`, `temperature`, `ml_prediction`, dll)
- [x] Mengatur TTL 120 detik untuk memastikan NLP mendapat data yang fresh atau fallback ke mock.

## ✅ Task 2: Menyesuaikan Payload Request & Response untuk `/nlp/query`
- [x] Memperbaiki `nlpController.js` untuk mengirim `machine_ids` (sebagai array), `session_id`, dan `history` (dari req.body).
- [x] Menghapus pengiriman parameter `live_context` dan `mode` dari request payload yang dikirim Backend karena NLP akan menentukannya sendiri dan langsung membaca dari Redis.
- [x] Melakukan mapping balasan dari service NLP yang baru (`live_context_used` menjadi `has_live_context`, mengekstrak string `machine_id` dari list `live_context_data`, dan `latency_ms` menjadi `processing_time_ms`).
- [x] Menyesuaikan URL API endpoint menjadi `/nlp/query` tanpa prefix `/api`.

## ✅ Task 3: Menyesuaikan Proses Upload Dokumen `/nlp/ingest` (Sangat Krusial)
- [x] Memverifikasi implementasi di `adminController.js` bahwa Backend telah mengunduh/menyimpan dokumen ke local disk terlebih dahulu.
- [x] Endpoint sudah dikonfirmasi mengirim URL menggunakan format JSON (bukan multipart/form-data) ke `/nlp/ingest` (beserta field `file_path` absolute, `filename`, `doc_type`, dan `document_id`).

## ✅ Task 4: Menyesuaikan Mapping Response untuk `/nlp/health`
- [x] Menyesuaikan pemanggilan endpoint dari `/api/nlp/health` menjadi `/nlp/health`.
- [x] Melakukan mapping format balasan:
  - `vector_db` dipetakan ke `qdrant`
  - `chunks_indexed` dipetakan ke `vector_count`

---

## 🔧 PANDUAN MANDIRI — Langkah Selanjutnya

> Dikerjakan secara mandiri saat Lead Architect tidak tersedia.
> Tandai [x] setiap task setelah selesai dan diverifikasi.

---

### STEP 1: Build & Jalankan NLP Docker Container

**Tujuan:** Menghidupkan NLP Engine di port 8001 agar bisa ditest.

**Prasyarat:** Pastikan file-file NLP Engineer sudah ada di folder `nlp/`:
```
predictive-maintenance-monorepo/
└── nlp/
    ├── Dockerfile (atau Dockerfile.nlp)
    ├── requirements.txt
    └── ... (source code NLP)
```

**Langkah:**

```bash
# 1. Cek struktur folder nlp
ls nlp/

# 2. Lihat isi Dockerfile NLP
cat nlp/Dockerfile

# 3. Tambahkan service nlp ke docker-compose.yml
# (minta snippet dari NLP Engineer seperti yang dilakukan ML Engineer)
```

Setelah dapat snippet dari NLP Engineer, tambahkan ke `docker-compose.yml`:
```yaml
  nlp-service:
    build:
      context: ./nlp
      dockerfile: Dockerfile
    container_name: lapis-nlp-service
    ports:
      - "8001:8001"
    environment:
      - REDIS_URL=redis://:lapis_redis_secret@redis:6379
    networks:
      - lapis_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/nlp/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

```bash
# 4. Build dan jalankan NLP service
docker compose up nlp-service -d --build

# 5. Pantau progress build
docker compose logs nlp-service -f

# 6. Tunggu hingga healthy, lalu verifikasi
docker compose ps
curl http://localhost:8001/nlp/health
```

**Output yang diharapkan:**
```json
{
  "status": "ok",
  "vector_db": "ok",
  "embedding_model": "loaded",
  "llm_provider": "groq",
  "llm_status": "ok",
  "chunks_indexed": 0
}
```

**Jika error saat build:**
- `requirements.txt hash mismatch` → sama seperti ML Engineer: hapus hash atau downgrade package
- `model not found` → minta file model dari NLP Engineer
- `port already in use` → jalankan `netstat -ano | findstr :8001`

---

### STEP 2: Verifikasi Task 1-4 yang Sudah Dikerjakan

Setelah NLP service healthy, verifikasi semua fix berjalan:

```bash
# Restart backend server
npm run dev
```

**Test 2A — Redis key machine:{id}:status tertulis:**
```bash
docker exec -it lapis_redis redis-cli -a lapis_redis_secret

# Kirim satu data ingest dulu via PowerShell, lalu:
KEYS machine:*

# Harus muncul DUA key per mesin:
# machine:M-01:last_reading  ← key lama
# machine:M-01:status        ← key baru untuk NLP

GET machine:M-01:status
# Harus return JSON dengan field: status, temperature, ml_prediction, rul_days, dll
exit
```

**Test 2B — NLP chat endpoint:**
```powershell
$res = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}'
$token = $res.data.token

# Test query umum
Invoke-RestMethod -Uri "http://localhost:3000/api/nlp/chat" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization = "Bearer $token"} `
  -Body '{
    "query": "Apa prosedur penggantian bearing?",
    "session_id": "SES-TEST-001"
  }' | ConvertTo-Json -Depth 5
```

**Output yang diharapkan:**
```json
{
  "status": "success",
  "data": {
    "answer": "...",
    "citations": [...],
    "live_context_used": true/false,
    "mode": "general"
  }
}
```

**Test 2C — Query spesifik mesin:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/nlp/chat" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization = "Bearer $token"} `
  -Body '{
    "query": "Kenapa M-01 sering overheat?",
    "machine_id": "M-01",
    "session_id": "SES-TEST-002"
  }' | ConvertTo-Json -Depth 5
```

**Test 2D — Query Keyword tanpa explicit machine id:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/nlp/chat" `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization = "Bearer $token"} `
  -Body '{"query":"Berapa RUL mesin M-07 sekarang?","session_id":"SES-TEST-003"}' | ConvertTo-Json -Depth 5
```

---

### STEP 3: Setup Chat Session Tables (migrate6.js)

**Tujuan:** Membuat tabel `chat_sessions` dan `chat_messages` di PostgreSQL
untuk menyimpan riwayat percakapan permanen.

```bash
# Di folder backend/
# Buat file migrate6.js dengan konten berikut:
```

Buat file `backend/src/config/migrate6.js`:

```javascript
'use strict';

require('dotenv').config();
const logger = require('./logger');
const pgPool = require('./postgresClient');

async function migrateV6() {
  // Tabel chat_sessions
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id            SERIAL PRIMARY KEY,
      session_id    VARCHAR(50) UNIQUE NOT NULL,
      user_id       INTEGER REFERENCES users(id),
      machine_id    VARCHAR(10),
      title         VARCHAR(255),
      created_at    TIMESTAMPTZ DEFAULT NOW(),
      updated_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Tabel chat_messages
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id            SERIAL PRIMARY KEY,
      session_id    VARCHAR(50) NOT NULL 
                    REFERENCES chat_sessions(session_id),
      role          VARCHAR(20) NOT NULL 
                    CHECK (role IN ('user', 'assistant')),
      content       TEXT NOT NULL,
      citations     JSONB,
      machine_id    VARCHAR(10),
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pgPool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id 
      ON chat_messages(session_id)
  `)

  await pgPool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id 
      ON chat_sessions(user_id)
  `)

  logger.info('✅ V6: chat_sessions + chat_messages tables ready.')
}

async function runMigrationsV6() {
  logger.info('🚀 Starting migrations V6...')
  try {
    await migrateV6()
    logger.info('✅ All V6 migrations completed.')
  } catch (err) {
    logger.error(`❌ Migration V6 failed: ${err.message}`)
    process.exit(1)
  } finally {
    await pgPool.end()
  }
}

runMigrationsV6()
```

```bash
# Jalankan migration
node src/config/migrate6.js

# Expected output:
# ✅ V6: chat_sessions + chat_messages tables ready.
# ✅ All V6 migrations completed.
```

---

### STEP 4: Tambah Chat Endpoints (Opsional — tunggu konfirmasi Lead)

> ⚠️ **TUNGGU KONFIRMASI** sebelum mengerjakan step ini.
> Lead Architect perlu review desain endpoint chat sebelum implementasi.

Endpoint yang perlu ditambahkan:
- `POST /api/chat/query` — endpoint utama chat
- `GET /api/chat/sessions` — list sesi chat user
- `GET /api/chat/sessions/:id/messages` — history pesan per sesi

---

### CHECKLIST PROGRESS

```
[x] STEP 1: NLP Docker container healthy
[x] STEP 2A: Redis key machine:{id}:status tertulis dengan benar
[x] STEP 2B: GET /api/nlp/chat query umum → response dari NLP Engine
[x] STEP 2C: GET /api/nlp/chat query spesifik → live_context_used: true
[x] STEP 2D: GET /api/nlp/chat query keyword tanpa explicit machine id
[x] STEP 3: migrate8.js berhasil dijalankan
[x] Step 4: Chat endpoints (POST /api/chat/query, GET sessions, dll)
[x] Step 5: Test dokumen upload ke NLP (belum ditest)
[ ] Step 6: Fix rul_days float→int (tunggu NLP Engineer)
[x] Step 7: NLP-Backend Request/Response Alignment & Payload Fixes
```

---

### DETAIL PERBAIKAN INTEGRASI BE-NLP-FE TERBARU

Berikut adalah daftar penyesuaian yang telah diselesaikan untuk menyelaraskan komunikasi antara Frontend, Backend, dan NLP Engine:

1. **Penyesuaian Alias API Route:**
   Mengubah endpoint dari `/api/chat/query` menjadi `/api/nlp/query` dengan menambahkan Alias Route di `nlpRoutes.js`.
2. **Perubahan Format Respons (Wrapper):**
   Mengubah struktur format respons dari `{ "status": "success", "data": { "answer": "...", "citations": [...] } }` menjadi `{ "message": "...", "citations": [...], "machine_status": {...} }`.
3. **Injeksi Data `machine_status`:**
   Menambahkan objek `machine_status` yang diambil dari Redis (atau `ml_predictions`) dan menginjeksikannya ke dalam payload respons sebelum dikirim ke Frontend pada file `chatController.js`.
4. **Penyesuaian Kontrak Respons Frontend:**
   Menyelaraskan *key* respons pada `chatController.js` sesuai ekspektasi Frontend (menambahkan 3 baris *return* ekstra):
   - `message` disalin menjadi `reply`
   - `citations` disalin menjadi `sources`
   - `action_suggestions` disalin menjadi `suggested_actions`
5. **Ekstraksi Otomatis `machine_id` (Regex):**
   Menyuntikkan fungsi ekstraksi `detectMachineId` (menggunakan Regex) langsung ke dalam `chatController.js`. Dengan ini, NLP Engine tetap bisa mendeteksi konteks mesin (dan membaca *live context* dari Redis) meskipun Frontend hanya mengirimkan nama mesin di dalam teks *query* (organik) tanpa melampirkan *key* `machine_id` secara spesifik di payload.

---

### JIKA MENEMUKAN ERROR

Catat error di sini sebelum melaporkan ke Lead Architect:

```
Error yang ditemukan:
- Step 5: Test dokumen upload ke NLP
- Error 1: Test upload document muncul error "Only PDF, DOCX, TXT allowed"
Tapi file yang diupload adalah .txt
- Log output: {
  "status": "error",
  "message": "Only PDF, DOCX, TXT allowed"
}
- root cause: 
  - PowerShell -Form mengirim file TXT dengan mimetype:
    application/octet-stream (generic binary)

  - Tapi fileFilter di adminRoutes.js hanya allow:
    'text/plain' ← tidak cocok dengan octet-stream
- Langkah yang sudah dicoba:
  1. Tambah Extension Check sebagai Fallback di fileFilter pada adminRoutes.js

- Status: Solved
```

- Error 2: Endpoint POST /nlp/ingest pada NLP Engine (Port 8001) mengembalikan respons 404 Not Found. Setelah diinvestigasi lebih lanjut, terkonfirmasi bahwa 404 terjadi bukan karena kesalahan rute (missing endpoint), melainkan karena bad practice pada penanganan eror di kode Python NLP yang sengaja melemparkan status 404 jika file_path dokumen tidak ditemukan di dalam filesystem kontainer Docker NLP.

- Log output: - docker logs nlp-service: "POST /nlp/ingest HTTP/1.1" 404
              - Sebelumnya (error): "GET /docs HTTP/1.1" 404 Not Found"
              - Saat ini (Sukses): 200 OK $\rightarrow$ {"status": "accepted", "message": "Dokumen 'DOC...' diterima dan sedang diproses"}

- Langkah yang sudah dicoba: 
    1. Memeriksa Swagger UI di port 8001 (http://localhost:8001/docs/nlp) dan mengonfirmasi bahwa endpoint POST /nlp/ingest terdaftar resmi dengan skema Request Body berupa application/json (meminta parameter document_id, file_path, filename, dan doc_type).
    2. Melakukan pengujian langsung menggunakan fitur "Try it out" dan "Execute" di dalam halaman Swagger UI tersebut, namun hasilnya tetap memuntahkan respons 404 Not Found (Request URL: http://localhost:8001/nlp/ingest).
    3. Menjalankan perintah cURL lokal ke http://localhost:8001/nlp/ingest untuk mengeliminasi isu library Axios, tetapi hasil yang didapat tetap konsisten 404
    4. Log menunjukkan request masuk ke web server (Uvicorn/Gunicorn) tetapi terhenti di gerbang routing terdepan sebelum mengeksekusi fungsi internal Python.
  
  - Solusi perbaikan: 
    1. Memodifikasi fungsi uploadDocument pada backend/src/controllers/adminController.js untuk menduplikasi file secara sinkron menggunakan fs.copyFileSync ke direktori lokal yang terikat dengan bind-mount kontainer NLP (nlp/data/raw).
    2. Memperbarui payload pengiriman Axios di dalam blok setImmediate pada Backend, mengubah properti file_path dari path lokal Windows menjadi path absolut internal kontainer Linux milik NLP (/app/nlp/data/raw/${finalFilename}).
    3. Melakukan pengujian ulang via Swagger UI dan nlp/ingest endpoint, menghasilkan respons sukses 200 OK dengan status "accepted" (background task pengolahan data di sisi NLP berhasil dipicu).

- Status: Solved
```
