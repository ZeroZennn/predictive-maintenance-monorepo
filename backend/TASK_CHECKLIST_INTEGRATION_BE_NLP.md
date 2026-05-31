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
[ ] STEP 1: NLP Docker container healthy
[ ] STEP 2A: Redis key machine:{id}:status tertulis dengan benar
[ ] STEP 2B: GET /api/nlp/chat query umum → response dari NLP Engine
[ ] STEP 2C: GET /api/nlp/chat query spesifik → live_context_used: true
[ ] STEP 3: migrate6.js berhasil dijalankan
[ ] STEP 4: Tunggu konfirmasi Lead Architect
```

---

### JIKA MENEMUKAN ERROR

Catat error di sini sebelum melaporkan ke Lead Architect:

```
Error yang ditemukan:
- Step X: [deskripsi error]
- Log output: [paste log error]
- Langkah yang sudah dicoba: [...]
```