# 📋 LAPIS AI — NLP Pipeline History Log

> Dokumen ini mencatat progress eksekusi setiap fase pipeline.
> Diupdate di akhir setiap fase oleh NLP Engineer (Role D).
> Reviewed oleh: Lead NLP Architect.

---

## ✅ FASE 1 — Document Ingestion & Pre-processing
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
- **Vector DB (dev):** ChromaDB → Qdrant (prod)
- **PDF Parser:** pdfplumber (primary), PyMuPDF (fallback)

### Issues & Resolusi
| Issue | Status | Catatan |
|-------|--------|---------|
| 3 PDF tidak ter-copy ke raw/ saat Langkah 3 | ✅ Fixed di Langkah 4 | Copy manual dilakukan |
| File PDF biner masuk gitignore | ✅ Fixed | .gitignore dibuat di Langkah 4 |

---

## ⏳ FASE 2 — Semantic Text Chunking
**Status:** BELUM DIMULAI  
**Branch:** `fase/2-chunking` *(akan dibuat)*

---

## ⏳ FASE 3 — Embedding & Vector Database
**Status:** BELUM DIMULAI  
**Branch:** `fase/3-embedding` *(akan dibuat)*

---

## ⏳ FASE 4 — Hybrid Retrieval System
**Status:** BELUM DIMULAI

---

## ⏳ FASE 5 — Live Context Integration
**Status:** BELUM DIMULAI

---

## ⏳ FASE 6 — Prompt Engineering & LLM Generation
**Status:** BELUM DIMULAI

---

## ⏳ FASE 7 — API Integration & Orchestration
**Status:** BELUM DIMULAI

---

## ⏳ FASE 8 — Evaluation & Continuous Improvement
**Status:** BELUM DIMULAI

---

*Log ini di-maintain secara manual. Setiap entri harus diisi sebelum merge ke `main`.*
