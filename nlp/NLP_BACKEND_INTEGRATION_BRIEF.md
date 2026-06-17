# 📡 LAPIS AI — NLP ↔ Backend Integration Brief
> Dokumen ini adalah panduan lengkap untuk integrasi modul NLP dengan Backend.
> Dibuat untuk: Backend Engineer (Reynaldi) + NLP Engineer (Aqsa)
> Last updated: 2026-05-28

---

## 1. GAMBARAN ARSITEKTUR

```
[Frontend / Streamlit]
        │
        ▼
[Backend Service :8000]  ←──── yang mengatur auth, routing, business logic
        │
        │  HTTP REST
        ▼
[NLP Service :8001]      ←──── ini yang kita bangun
  ├── POST /nlp/query    ← RAG query utama
  ├── POST /nlp/ingest   ← upload & index dokumen baru
  └── GET  /nlp/health   ← health check
        │
        ├── Qdrant (vector DB, local)
        ├── Redis (live sensor context, read-only dari NLP)
        └── Embedding Model (multilingual-e5-large, lokal)
```

**Prinsip penting:**
- Backend adalah **orchestrator** — dia yang memanggil NLP, bukan sebaliknya
- NLP **tidak punya akses ke database Backend** (users, machines, logs)
- NLP **read-only** dari Redis — Backend/ML yang write ke Redis
- NLP berjalan di port **8001**, Backend di port **8000**

---

## 2. NLP API ENDPOINTS — SPESIFIKASI LENGKAP

### 2.1 POST /nlp/query

**Fungsi:** Terima pertanyaan teknisi → retrieve konteks → generate jawaban AI

**URL:** `http://localhost:8001/nlp/query`

**Request Body (JSON):**
```json
{
  "query": "string — pertanyaan dari teknisi (wajib)",
  "machine_id": "string — contoh: 'M-01', null jika tidak spesifik (opsional)",
  "chat_history": [
    {
      "role": "user",
      "content": "pertanyaan sebelumnya"
    },
    {
      "role": "assistant", 
      "content": "jawaban sebelumnya"
    }
  ],
  "user_id": "string — untuk logging, opsional"
}
```

**Response Body (JSON):**
```json
{
  "answer": "string — jawaban lengkap dari LLM dalam format markdown",
  "citations": [
    {
      "chunk_id": "Laporan_M-01_Agustus_2025__chunk_0001_abc123",
      "source_doc": "Laporan_M-01_Agustus_2025",
      "page": 0,
      "doc_type": "maintenance_report",
      "relevance": 0.8429
    }
  ],
  "has_live_context": true,
  "machine_id": "M-01",
  "query_mode": "machine_specific",
  "processing_time_ms": 1250
}
```

**Format `answer`:** Selalu dalam tiga section:
```
## ANALISIS
[ringkasan kondisi berdasarkan konteks]

## REKOMENDASI
- [SEGERA] tindakan dalam 24 jam
- [7 HARI] tindakan dalam seminggu
- [PREVENTIF] tindakan pencegahan

## REFERENSI
- [Referensi 1]: nama dokumen
```

**Status Codes:**
| Code | Kondisi |
|------|---------|
| 200 | Sukses |
| 422 | Validation error (query kosong, format salah) |
| 500 | Internal error (LLM gagal, Qdrant tidak available) |
| 503 | Service unavailable (startup belum selesai) |

---

### 2.2 POST /nlp/ingest

**Fungsi:** Upload dokumen baru (PDF/DOCX/TXT) → proses → masuk ke vector DB

**URL:** `http://localhost:8001/nlp/ingest`

**Request:** `multipart/form-data`
```
file: <binary file>          — PDF, DOCX, atau TXT (wajib)
doc_type: "maintenance_report" | "manual" | "sop" | "knowledge_base" (opsional)
```

**Response Body (JSON):**
```json
{
  "doc_id": "Laporan_M-01_Juli_2025",
  "status": "success",
  "chunks_created": 7,
  "message": "Dokumen berhasil diindeks ke vector database"
}
```

**Catatan penting untuk Backend:**
- File disimpan sementara di `nlp/data/raw/` selama proses
- Setelah selesai, file dipindah ke `nlp/data/processed/`
- Proses bisa memakan 5-30 detik tergantung ukuran file
- Endpoint ini **blocking** — response dikirim setelah proses selesai
- Recommended: Backend panggil ini secara async (background task)

---

### 2.3 GET /nlp/health

**URL:** `http://localhost:8001/nlp/health`

**Response:**
```json
{
  "status": "healthy",
  "qdrant": "connected",
  "vector_count": 535,
  "llm_provider": "nvidia_nim",
  "llm_status": "available",
  "redis": "mock_mode",
  "uptime_seconds": 3600
}
```

---

## 3. LIVE CONTEXT — REDIS INTEGRATION

Ini adalah bagian yang paling kritis untuk integrasi.

### 3.1 Schema Redis yang NLP Ekspektasikan

NLP membaca dari Redis dengan key pattern:
```
machine:{machine_id}:status
```

**Contoh key:** `machine:M-01:status`

**Value format (JSON string):**
```json
{
  "machine_id": "M-01",
  "timestamp": "2026-05-28T10:30:00Z",
  "health_status": "WARNING",
  "temperature": 82.5,
  "vibration": 0.67,
  "pressure": 108.2,
  "rpm": 2450,
  "rul_days": 12,
  "ml_prediction": "WARNING",
  "active_alerts": ["TEMP_HIGH"],
  "data_source": "live"
}
```

**Field yang WAJIB ada:**
| Field | Type | Keterangan |
|-------|------|------------|
| `machine_id` | string | "M-01" sampai "M-20" |
| `timestamp` | ISO 8601 string | Waktu data diupdate |
| `health_status` | "HEALTHY" / "WARNING" / "CRITICAL" | Status dari ML model |
| `temperature` | float | Celsius |
| `vibration` | float | mm/s |
| `pressure` | float | PSI |
| `rpm` | float | RPM |
| `rul_days` | int | Remaining Useful Life dalam hari |
| `ml_prediction` | string | Output classifier ML |

**Field opsional:**
| Field | Type | Keterangan |
|-------|------|------------|
| `active_alerts` | list of string | Alert aktif saat ini |
| `data_source` | string | "live" / "mock" / "cached" |

### 3.2 Redis Connection Config

NLP membaca `REDIS_URL` dari `.env`:
```
REDIS_URL=redis://localhost:6379
```

Jika `REDIS_URL` tidak ada atau Redis tidak konek → NLP otomatis pakai **mock mode** (data sensor dummy). Ini **tidak crash** — pipeline tetap jalan.

### 3.3 TTL yang Direkomendasikan

Backend harus set TTL saat write ke Redis:
```
TTL = 120 detik (2 menit)
```
Jika mesin tidak mengirim data selama 2 menit, key expired → NLP akan fallback ke mock.

---

## 4. ALUR DATA LENGKAP — REQUEST LIFECYCLE

```
1. Teknisi ketik pertanyaan di Frontend
         │
2. Frontend kirim ke Backend
   POST /api/chat
   { "query": "...", "machine_id": "M-01", "session_id": "..." }
         │
3. Backend validasi auth (JWT), ambil machine_id dari session
         │
4. Backend forward ke NLP
   POST http://localhost:8001/nlp/query
   { "query": "...", "machine_id": "M-01", "chat_history": [...] }
         │
5. NLP proses:
   a. Query Router → deteksi intent (machine_specific / general / broad)
   b. Redis → ambil live sensor data M-01
   c. Retriever → dense + BM25 + RRF + section boost + doc grouping
   d. PromptBuilder → rakit: [LIVE_CONTEXT] + [CHUNKS] + [HISTORY] + [QUERY]
   e. LLM → generate response
   f. CitationExtractor → extract source metadata
         │
6. NLP return ke Backend
   { "answer": "...", "citations": [...], "has_live_context": true }
         │
7. Backend bisa enrich response (tambah machine data dari DB sendiri)
         │
8. Backend return ke Frontend
   { "message": "...", "citations": [...], "machine_status": {...} }
```

---

## 5. KONFIGURASI ENVIRONMENT

### 5.1 File `.env` yang Dibutuhkan NLP

Letakkan di root monorepo (`predictive-maintenance-monorepo/.env`):

```env
# LLM Provider (pilih salah satu)
NVIDIA_API_KEY=nvapi-xxxx          # Untuk pipeline utama
OPENAI_API_KEY=sk-xxxx             # Untuk RAGAS evaluation judge
GROQ_API_KEY=gsk_xxxx              # Fallback jika NVIDIA down

# Redis (Live Context)
REDIS_URL=redis://localhost:6379   # Jika kosong = mock mode otomatis

# NLP Service
NLP_HOST=0.0.0.0
NLP_PORT=8001

# Backend URL (untuk NLP memanggil balik jika diperlukan)
BACKEND_URL=http://localhost:8000
```

### 5.2 Cara Start NLP Service

```powershell
# Dari root monorepo
cd predictive-maintenance-monorepo

# Aktivasi venv (Windows)
.\.venv\Scripts\Activate.ps1

# Start NLP service
python -m nlp.api.main

# Atau dengan uvicorn langsung
uvicorn nlp.api.main:app --host 0.0.0.0 --port 8001 --reload
```

### 5.3 Dependency yang Harus Terinstall

```
pip install -r nlp/requirements.txt
```

Key dependencies:
- `fastapi`, `uvicorn` — web framework
- `qdrant-client` — vector database
- `sentence-transformers` — embedding model
- `langchain`, `langchain-openai`, `langchain-groq` — LLM integration
- `redis` — live context (opsional, ada fallback)
- `pdfplumber`, `pymupdf` — document parsing

---

## 6. SCHEMA CITATIONS — UNTUK FRONTEND

Backend perlu forward citations ke Frontend untuk ditampilkan sebagai chip/card.

**Format citation yang NLP kembalikan:**
```json
{
  "citations": [
    {
      "chunk_id": "Laporan_M-01_Agustus_2025__chunk_0001_abc123",
      "source_doc": "Laporan_M-01_Agustus_2025",
      "page": 0,
      "doc_type": "maintenance_report",
      "relevance": 0.8429
    },
    {
      "chunk_id": "Buku_Manual_M01__chunk_0002_def456",
      "source_doc": "Buku_Manual_M01",
      "page": 1,
      "doc_type": "manual",
      "relevance": 0.7231
    }
  ]
}
```

**Mapping ke tampilan Frontend (sesuai Blueprint):**
| Field NLP | Tampilan di Frontend |
|-----------|---------------------|
| `source_doc` | Nama dokumen di citation chip |
| `page` | Nomor halaman di citation chip |
| `doc_type` | Icon/warna chip (report vs manual) |
| `relevance` | Tidak perlu ditampilkan, gunakan untuk sorting |

---

## 7. ERROR HANDLING — YANG HARUS DIHANDLE BACKEND

### 7.1 LLM Timeout / Unavailable

NLP punya fallback chain:
```
NVIDIA NIM → Mock Response (deterministik)
```

Jika NVIDIA timeout, response tetap dikembalikan tapi dengan `answer` yang mengindikasikan mock:
```json
{
  "answer": "[MOCK] LLM tidak tersedia saat ini...",
  "citations": [],
  "has_live_context": false
}
```

Backend bisa deteksi ini dengan cek apakah `answer` mengandung `[MOCK]`.

### 7.2 Redis Tidak Available

NLP otomatis fallback ke mock sensor data. `has_live_context` akan `true` tapi data bersumber dari mock. Backend tidak perlu handle ini — NLP yang mengurus.

### 7.3 Qdrant Tidak Available

Ini **fatal error** — NLP tidak bisa retrieve dokumen. Response:
```json
{
  "status_code": 500,
  "detail": "Vector database unavailable"
}
```

Backend harus return user-friendly error message.

### 7.4 Timeout Recommendation

Backend harus set timeout saat memanggil NLP:
```
/nlp/query timeout: 60 detik (LLM bisa lambat)
/nlp/ingest timeout: 120 detik (processing dokumen)
/nlp/health timeout: 5 detik
```

---

## 8. TESTING CHECKLIST UNTUK INTEGRASI

Backend perlu test skenario berikut:

### Skenario Happy Path
- [ ] `POST /nlp/query` dengan `machine_id` valid → dapat response dengan citations
- [ ] `POST /nlp/query` tanpa `machine_id` → dapat response general
- [ ] `GET /nlp/health` → status healthy
- [ ] `POST /nlp/ingest` dengan PDF valid → chunks_created > 0

### Skenario Edge Case
- [ ] `POST /nlp/query` dengan `machine_id` tidak ada di sistem (misal "M-99") → response graceful
- [ ] `POST /nlp/query` dengan `query` kosong → 422 error
- [ ] `POST /nlp/ingest` dengan file bukan PDF/DOCX/TXT → error handling
- [ ] NLP down → Backend return 503 dengan pesan jelas

### Skenario Redis Integration
- [ ] Redis running + data M-01 ada → `has_live_context: true`, data real
- [ ] Redis down → `has_live_context: true`, data mock (NLP fallback otomatis)
- [ ] Redis key expired → NLP fallback ke mock

---

## 9. KNOWN LIMITATIONS (Backend perlu tahu)

| Limitasi | Dampak | Workaround |
|----------|--------|-----------|
| LLM NVIDIA free tier lambat (~30-40 detik) | Latency tinggi | Implementasi loading indicator di Frontend |
| Embedding model loaded di memori (~1.7GB) | Startup time ~30 detik pertama | Health check sebelum Frontend ready |
| Qdrant local mode (bukan server) | Tidak bisa multi-instance | Satu instance NLP service saja |
| Redis mock mode jika Redis down | Data sensor tidak real-time | Pastikan Redis jalan sebelum NLP |
| `context_entity_recall` masih ~0.55 | AI kadang miss Log ID spesifik | Acceptable untuk MVP |

---

## 10. QUICK START — INTEGRASI DALAM 15 MENIT

```powershell
# Step 1: Pastikan Redis jalan (Backend responsibility)
redis-server

# Step 2: Start NLP service
cd predictive-maintenance-monorepo
.\.venv\Scripts\Activate.ps1
python -m nlp.api.main

# Step 3: Test health check
curl http://localhost:8001/nlp/health

# Step 4: Test query pertama
curl -X POST http://localhost:8001/nlp/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Apa yang harus dilakukan jika mesin M-01 overheat?", "machine_id": "M-01"}'

# Step 5: Backend panggil NLP dari code-nya
# Python example:
import httpx
response = httpx.post(
    "http://localhost:8001/nlp/query",
    json={"query": query, "machine_id": machine_id, "chat_history": history},
    timeout=60.0
)
data = response.json()
answer = data["answer"]
citations = data["citations"]
```

---

## 11. PERUBAHAN YANG MUNGKIN DIPERLUKAN DARI BACKEND

Backend mungkin perlu:

1. **Proxy endpoint** — `/api/chat` di Backend yang forward ke `/nlp/query`
2. **Auth middleware** — validasi JWT sebelum forward ke NLP
3. **Machine ID mapping** — pastikan format machine_id konsisten ("M-01" bukan "m-01" atau "M01")
4. **Redis writer** — Backend/ML yang write sensor data ke Redis dengan format yang NLP ekspektasikan (lihat Section 3)
5. **File upload handler** — `/api/documents/upload` di Backend yang forward ke `/nlp/ingest`

---

*Dokumen ini harus dibagikan ke Backend Engineer sebelum sesi integrasi.*
*Jika ada perubahan API contract, update dokumen ini terlebih dahulu.*
