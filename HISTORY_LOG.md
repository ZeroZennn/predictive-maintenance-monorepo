# ðŸ“‹ LAPIS AI â€” NLP Pipeline History Log

> Dokumen ini mencatat progress eksekusi setiap fase pipeline.
> Diupdate di akhir setiap fase oleh NLP Engineer (Role D).
> Reviewed oleh: Lead NLP Architect.

---

## âœ… FASE 1 â€” Document Ingestion & Pre-processing
**Status:** SELESAI  
**Branch:** `fase/1-ingestion`  
**Tanggal Selesai:** 2026-04-29

### Deliverables
| File | Lokasi | Deskripsi |
|------|--------|-----------|
| `ingestion.py` | `nlp/` | Pipeline ingestion utama |
| `config.yaml` | `nlp/configs/` | Konfigurasi pipeline |
| `.env.example` | `nlp/configs/` | Template environment variables |
| `requirements.txt` | `nlp/` | Dependencies terkunci |
| `LAP-BUNDLE.clean.txt` | `nlp/data/processed/` | Teks bersih laporan M01-M20 |
| `KB-001.clean.txt` | `nlp/data/processed/` | Knowledge base NLP |
| `SCH-001.clean.txt` | `nlp/data/processed/` | Data schema |
| `API-001.clean.txt` | `nlp/data/processed/` | API contracts |

### Statistik Ingestion
| Dokumen | Pages | Tables | Method | Size |
|---------|-------|--------|--------|------|
| LAP-BUNDLE (M01-M20) | 32 | 119 | pdfplumber | 55.2 KB |
| KB-001 | - | - | pdfplumber | - |
| SCH-001 | - | - | pdfplumber | - |
| API-001 | - | - | pdfplumber | - |

### Keputusan Arsitektur
- **Chunking strategy:** Hybrid Semantic (4 tipe: prose, tabel, anomali, rekomendasi)
- **Embedding model:** `intfloat/multilingual-e5-large`
- **Vector DB (dev):** ChromaDB â†’ Qdrant (prod)
- **PDF Parser:** pdfplumber (primary), PyMuPDF (fallback)

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| 3 PDF tidak ter-copy ke raw/ saat Langkah 3 | âœ… Fixed di Langkah 4 | Copy manual dilakukan |
| File PDF biner masuk gitignore | âœ… Fixed | .gitignore dibuat di Langkah 4 |

---

## â³ FASE 2 â€” Semantic Text Chunking
**Status:** BELUM DIMULAI  
**Branch:** `fase/2-chunking` *(akan dibuat)*

---

## â³ FASE 3 â€” Embedding & Vector Database
**Status:** BELUM DIMULAI  
**Branch:** `fase/3-embedding` *(akan dibuat)*

---

## â³ FASE 4 â€” Hybrid Retrieval System
**Status:** BELUM DIMULAI

---

## â³ FASE 5 â€” Live Context Integration
**Status:** BELUM DIMULAI

---

## â³ FASE 6 â€” Prompt Engineering & LLM Generation
**Status:** BELUM DIMULAI

---

## â³ FASE 7 â€” API Integration & Orchestration
**Status:** BELUM DIMULAI

---

## â³ FASE 8 â€” Evaluation & Continuous Improvement
**Status:** BELUM DIMULAI

---

*Log ini di-maintain secara manual. Setiap entri harus diisi sebelum merge ke `main`.*

