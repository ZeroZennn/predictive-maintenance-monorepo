# 📋 LAPIS AI — NLP Pipeline History Log

> Dokumen ini mencatat progress eksekusi setiap fase pipeline.
> Diupdate di akhir setiap fase oleh NLP Engineer (Role D).
> Reviewed oleh: Lead NLP Architect.

---

## ✅ FASE 1 — Document Ingestion & Pre-processing
**Status:** SELESAI (v2.0 — Universal Rewrite)
**Branch:** `nlp-1-ingestion` → `aqsa-workspace`
**Tanggal Selesai:** 2026-04-29 | **Tanggal Rewrite:** 2026-05-24

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `ingestion.py` | `nlp/` | Universal ingestion — content-based metadata extraction |
| `config.yaml` | `nlp/configs/` | Konfigurasi pipeline (single source of truth) |
| `.env.example` | `nlp/configs/` | Template environment variables |
| `requirements.txt` | `nlp/` | Dependencies terkunci |
| `Laporan_M-XX_BULAN_2025.clean.txt` | `nlp/data/processed/` | 119 laporan individual |
| `Buku_Manual_M01.clean.txt` | `nlp/data/processed/` | Manual teknis mesin M-01 |
| `*.meta.json` | `nlp/data/processed/` | Metadata per dokumen (machine_ids, periods, log_ids, lang) |

### Statistik Ingestion (v2.0)
| Dokumen | Jumlah | Method | Catatan |
|---------|--------|--------|---------|
| Laporan individual M-01–M-20 | 119 file | pdfplumber | 1 mesin × 1 bulan per file |
| Buku Manual M-01 | 1 file | pdfplumber | 2 halaman, 2 tabel |
| **TOTAL** | **120 file** | — | 100% berhasil (0 failed) |

### Perubahan Arsitektur v2.0
- **Sebelum:** 1 file bundle (LAP-BUNDLE), hardcoded `doc_type` & filename logic
- **Sesudah:** 120 file individual, `extract_content_metadata()` dari ISI teks via regex
- **`make_doc_id()`:** doc_id = nama file stem — tidak ada asumsi format
- **Fallback chain:** pdfplumber → PyMuPDF — tidak pernah crash

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| LAP-BUNDLE hardcoded doc_id | ✅ Fixed v2.0 | Dynamic doc_id dari nama file |
| machine_ids tidak terisi | ✅ Fixed v2.0 | Regex `M-\d{2}` dari konten |
| LF/CRLF warning saat commit di Windows | ✅ Fixed | `.gitattributes` ditambahkan |

---

## ✅ FASE 2 — Semantic Text Chunking
**Status:** SELESAI (v2.0 — Adaptive Semantic Rewrite)
**Branch:** `nlp-2-chunking` → `aqsa-workspace`
**Tanggal Selesai:** 2026-05-02 | **Tanggal Rewrite:** 2026-05-24

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `content_analyzer.py` | `nlp/chunking/` | Layer 2: ContentSignals detector |
| `adaptive_chunker.py` | `nlp/chunking/` | Layer 3: section_based + semantic sliding window |
| `router.py` | `nlp/chunking/` | Thin wrapper ke AdaptiveChunker |
| `base_chunker.py` | `nlp/chunking/` | Abstract base (dipertahankan) |

### Statistik Chunking (v2.0)
| Strategi | Chunks | Keterangan |
|---------|--------|------------|
| `section_based` | 307 | Potong di `[METADATA]`, `[SUMMARY]`, `[TIMELINE]` |
| `semantic_sliding_window` | 228 | Potong saat cosine similarity turun (topik berganti) |
| **TOTAL** | **535** | Deterministik |

### Arsitektur 3-Layer
```
Layer 1: Universal Extractor (ingestion.py)
   ↓
Layer 2: ContentAnalyzer → ContentSignals (has_bracket_sections, avg_paragraph_length, dll)
   ↓
Layer 3: AdaptiveChunker → section_based | header_based | semantic_sliding_window
```

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| MaintenanceChunker tidak bisa handle format `[SECTION]` baru | ✅ Fixed v2.0 | Diganti AdaptiveChunker |
| `chunk_type` lama tidak kompatibel | ✅ Fixed | Field mapping di retriever |

---

## ✅ FASE 3 — Embedding & Vector Database
**Status:** SELESAI
**Branch:** `nlp-3-embedding` | **Re-embed:** 2026-05-24

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `embedder.py` | `nlp/embeddings/` | Wrapper multilingual-e5-large |
| `vector_store.py` | `nlp/embeddings/` | Interface Qdrant |
| `run_pipeline.py` | `nlp/embeddings/` | Orchestrator + field mapping v2.0 |

### Statistik Embedding (v2.0)
| Metrik | Nilai |
|--------|-------|
| Total chunks | 535 |
| Model | `intfloat/multilingual-e5-large` (dim=1024) |
| Durasi | 164.3s (~3.3 chunks/detik, CPU) |
| Retrieval test | 5/5 PASSED (avg score 0.86) |

---

## ✅ FASE 4 — Hybrid Retrieval System
**Status:** SELESAI (v2.0 — Section-Aware + Document Grouping)
**Branch:** `nlp-4-retrieval` → `aqsa-workspace` | **Optimasi:** 2026-05-24

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `query_router.py` | `nlp/retrieval/` | `build_chunk_type_filter()` disabled |
| `retriever.py` | `nlp/retrieval/` | Hybrid + section boost + document grouping |
| `reranker.py` | `nlp/retrieval/` | Cross-encoder re-ranking |

### Fitur Baru v2.0
| Fitur | Detail |
|-------|--------|
| `_apply_section_boost()` | TIMELINE ×1.3 (event query), METADATA ×0.85 (non-aggregation) |
| `_expand_to_document_chunks()` | Top chunk → pull semua section dokumen yang sama |
| Dynamic max_docs | Event: max_docs=1 (4 chunks). Aggregation: max_docs=4 (2 chunks each) |
| SOP fallback | Force-inject Buku_Manual jika query SOP/LOTO/prosedur |

### Konfigurasi (v2.0)
| Parameter | Nilai |
|-----------|-------|
| `top_k_final` | 8 |
| `max_docs` event | 1 |
| `max_docs` aggregation | 4 |
| `rrf_k` | 60 |

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| `chunk_type_filter` → empty results | ✅ Fixed | `build_chunk_type_filter()` disabled |
| `KeyError: text_content` BM25 | ✅ Fixed | Field mapping `_load_all_chunks()` |
| TIMELINE chunk kalah bersaing | ✅ Fixed | Section boosting + document grouping |
| E003/E004 empty retrieval | 🔄 Partial | SOP fallback + dynamic max_docs, belum optimal |

---

## ✅ FASE 5 — Live Context Integration
**Status:** SELESAI
**Branch:** `nlp-5-live-context` | **Tanggal:** 2026-05-17

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `live_context.py` | `nlp/prompting/` | Redis reader + mock fallback otomatis |

### Catatan Evaluasi
- Live context **DISABLED** saat RAGAS evaluation (`live_data = None`)
- Alasan: mock sensor data mencemari `faithfulness` score (+0.22 setelah dinonaktifkan)

---

## ✅ FASE 6 — Prompt Engineering & LLM Generation
**Status:** SELESAI (v2.0 — Strict Citation Prompt)
**Branch:** `nlp-6-prompting` → `aqsa-workspace` | **Optimasi:** 2026-05-24

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `prompt_builder.py` | `nlp/prompting/` | Strict prompt: Log ID wajib, angka persis, fallback template |
| `llm_interface.py` | `nlp/prompting/` | Multi-provider abstraction layer |

### Perubahan Prompt v2.0
| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| Log ID citation | Tidak ada instruksi | WAJIB jika ada di konteks |
| Angka numerik | Bebas interpretasi | HARUS PERSIS — tidak boleh dibulatkan |
| Out-of-context | Jawaban generik | Template fallback terstandar |
| Section label di konteks | Tidak ada | `--- Referensi N [TIMELINE] ---` |
| `max_context_chars` | 3000 | 5000 |

---

## ✅ FASE 7 — API Integration & Orchestration
**Status:** SELESAI
**Branch:** `nlp-7-api` | **Tanggal:** 2026-05-17

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `main.py` | `nlp/api/` | FastAPI app + startup |
| `endpoints.py` | `nlp/api/` | `/nlp/query`, `/nlp/ingest`, `/nlp/health` |
| `schemas.py` | `nlp/api/` | Pydantic models |
| `citation.py` | `nlp/api/` | Citation extractor |

---

## 🔄 FASE 8 — Evaluation & Continuous Improvement
**Status:** DALAM PENGERJAAN
**Branch:** `nlp-8-evaluation` → `aqsa-workspace`
**Tanggal Mulai:** 2026-05-18 | **Last Updated:** 2026-05-25

### Konfigurasi RAGAS Final
| Komponen | Nilai |
|----------|-------|
| LLM Judge | OpenAI `gpt-4o-mini` |
| Embedding (vector metrics) | `multilingual-e5-large` (lokal) |
| `LLMSingleGenWrapper` | Intercept `n>1` |
| `RunConfig` | `max_workers=1`, `timeout=120s` |
| Global timeout | 600 detik |
| Live context | DISABLED untuk eval |

### Hasil RAGAS — Quick Mode (3 sampel)
| Metrik | Baseline | Terbaik | Target | Status |
|--------|----------|---------|--------|--------|
| `context_precision` | 0.33 | **1.00** | >0.70 | ✅ |
| `context_recall` | 0.33 | **0.75** | >0.70 | ✅ |
| `answer_relevancy` | 0.58 | **0.88** | >0.70 | ✅ |
| `answer_similarity` | 0.88 | **0.95** | >0.70 | ✅ |
| `faithfulness` | 0.54 | **0.63** | >0.70 | ⚠️ |
| `context_entity_recall` | 0.22 | **0.55** | >0.70 | ⚠️ |
| `answer_correctness` | 0.36 | **0.57** | >0.70 | ⚠️ |

### Hasil RAGAS — Full Mode (10 sampel, terkini)
| Metrik | Nilai | Target | Status |
|--------|-------|--------|--------|
| `faithfulness` | 0.6627 | >0.70 | ⚠️ |
| `answer_relevancy` | 0.7052 | >0.70 | ✅ |
| `context_precision` | 0.7667 | >0.70 | ✅ |
| `context_recall` | 0.5917 | >0.70 | ⚠️ |
| `context_entity_recall` | 0.3411 | >0.70 | ⚠️ |
| `answer_correctness` | 0.4619 | >0.70 | ⚠️ |
| `answer_similarity` | 0.9298 | >0.70 | ✅ |

### Progres Optimasi (Kronologis)
| Iterasi | Perubahan | Impact Utama |
|---------|-----------|--------------|
| v0 | Baseline — LLM judge Groq | Semua metrik rendah, banyak timeout |
| v1 | `LLMSingleGenWrapper` + OpenAI | Pipeline stabil, skor mulai bermakna |
| v2 | Universal ingestion + AdaptiveChunker | `context_precision` +0.33, `answer_relevancy` +0.29 |
| v3 | Fix field compatibility retriever | Empty results teratasi |
| v4 | `build_chunk_type_filter()` disabled | Seluruh pipeline flow normal |
| v5 | Golden dataset rewrite (verified facts) | `entity_recall` 0.06 → 0.45 |
| v6 | Prompt v2.0 (strict citation) | `answer_relevancy` +0.31 |
| v7 | Live context disabled saat eval | `faithfulness` +0.22 |
| v8 | Section-aware boosting | TIMELINE/METADATA score tuning |
| v9 | Document-level grouping (max_docs=1) | `context_precision` 1.00, `recall` 0.75 |
| v10 | Dynamic max_docs (intent-aware) | Full eval `faithfulness` 0.66 |

### Golden Dataset v2.0 (10 Kasus Terverifikasi dari Data Aktual)
| Case | Tipe | Mesin | Entity Kunci di Ground Truth |
|------|------|-------|------------------------------|
| E001 | Emergency | M-01 Agustus 2025 | ML-0119 (21.6j, Rp49.6jt), ML-0447 (33.5j) |
| E002 | Spesifikasi | M-01 | Suhu: normal 65-75°C, warning 80°C, critical >95°C |
| E003 | SOP | — | APD: sarung tangan, earmuff, sepatu; LOTO: listrik diputus |
| E004 | Aggregasi | M-02 | 3 events: ML-0216+ML-0055+ML-0058, total 110.6j |
| E005 | Emergency | M-02 Nov 2025 | ML-0058, 59.6j, Rp17.6jt, Part: Tidak ada |
| E006 | Spesifikasi | — | Getaran: normal 0.35-0.55, critical >1.0 mm/s, BRG-M01 |
| E007 | Emergency | M-01 Nov 2025 | ML-0230, 21.7j, Belt, Rp13.7jt |
| E008 | Incident | M-01 Juli 2025 | ML-0105, 20.3j, Seal, total 58.0j |
| E009 | SOP | — | 500 jam: oli pelumas, filter udara, koneksi elektrikal |
| E010 | Incident | M-02 Juli 2025 | ML-0266, 12.8j, Belt, Rp7.1jt |

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| RAGAS hang — NVIDIA NIM timeout | ✅ Fixed | Migrasi ke OpenAI gpt-4o-mini |
| `BadRequestError: n>1` | ✅ Fixed | `LLMSingleGenWrapper` |
| Groq TPM quota (6000) habis | ✅ Fixed | OpenAI gpt-4o-mini |
| `KeyError: text_content` | ✅ Fixed | Field mapping retriever |
| chunk_type_filter inject nilai lama | ✅ Fixed | Filter disabled |
| TIMELINE tidak ter-retrieve | ✅ Fixed | Boosting + document grouping |
| 8/10 golden dataset angka salah | ✅ Fixed | Rewrite dari data aktual |
| Live context mencemari faithfulness | ✅ Fixed | `live_data = None` saat eval |
| E003 LOTO empty retrieval | 🔄 In Progress | SOP fallback partial |
| E004 aggregation recall 0.00 | 🔄 In Progress | max_docs=4, belum optimal |
| `faithfulness` full mode <0.70 | 🔄 In Progress | LLM masih salah kutip Log ID |

---

*Log ini di-maintain secara manual. Setiap entri harus diisi sebelum merge ke `main`.*
*Last updated: 2026-05-25 oleh NLP Engineer (Role D)*