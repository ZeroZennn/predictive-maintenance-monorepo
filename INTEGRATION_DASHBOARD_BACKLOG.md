---
# PRIME — Integration Backlog
**Sprint:** Integration & Verification Sprint
**Periode:** 2026-05-25 — 2026-06-08

## PRIORITAS: CRITICAL (Blocker)
Item yang HARUS selesai sebelum demo/presentasi.

| ID | Story | PIC | Estimasi | Status |
|---|---|---|---|---|
| INT-001 | Fix rul_days Math.ceil → toFixed(2) di mlService.js | Reynaldi | 15 menit | ⏳ |
| INT-002 | Verifikasi full E2E Tahap 0-4 (infrastructure s/d WebSocket) | Zikran + Reynaldi | 2 jam | ⏳ |
| INT-003 | Gauge 8 sensor live di dashboard bergerak real-time | Amir | 2 jam | ⏳ |
| INT-004 | Health badge + health score tampil di dashboard | Amir | 1 jam | ⏳ |
| INT-005 | RUL banner conditional (tampil hanya saat WARNING/CRITICAL) | Amir | 1 jam | ⏳ |
| INT-006 | Global Toast Alert saat mesin CRITICAL | Amir | 1 jam | ⏳ |

## PRIORITAS: HIGH (Penting untuk Fungsionalitas Utama)

| ID | Story | PIC | Estimasi | Status |
|---|---|---|---|---|
| INT-007 | Sidebar machine cards update warna real-time & Multi-Select Filter | Amir / Antigravity | 2 jam | ✅ |
| INT-008 | Maintenance Scheduler: kartu baru dari WebSocket | Amir | 3 jam | ⏳ |
| INT-009 | Konfirmasi jadwal predictive → update status DB | Reynaldi + Amir | 2 jam | ⏳ |
| INT-010 | Tambah jadwal preventive manual (form + POST endpoint) | Reynaldi + Amir | 2 jam | ⏳ |
| INT-011 | Calendar dot update real-time saat maintenance dibuat | Amir | 2 jam | ⏳ |
| INT-012 | Historical Logs table tampil data dari TimescaleDB | Amir + Reynaldi | 2 jam | ⏳ |

## PRIORITAS: MEDIUM (Nice to Have untuk Demo)

| ID | Story | PIC | Estimasi | Status |
|---|---|---|---|---|
| INT-013 | Anomaly Timeline di dashboard (dari ml_predictions) | Reynaldi + Amir | 3 jam | ⏳ |
| INT-014 | Maintenance KPIs widget (issues/week, MTBF, dll) | Reynaldi + Amir | 3 jam | ⏳ |
| INT-015 | Export PDF/Excel di Historical Logs | Reynaldi | 4 jam | ⏳ |
| INT-016 | Completion Form: mark maintenance selesai | Amir | 2 jam | ⏳ |
| INT-017 | Admin Panel: CRUD maintenance_logs | Amir + Reynaldi | 4 jam | ⏳ |
| INT-018 | AI Copilot: Live context injection dari Redis | Aqsa + Reynaldi | 1 hari | ⏳ |

## PRIORITAS: LOW (Post-Demo Enhancement)

| ID | Story | PIC | Estimasi | Status |
|---|---|---|---|---|
| INT-019 | Simulator control panel di Admin (start/stop/speed) | Amir | 3 jam | ⏳ |
| INT-020 | Stress test: tick_interval=0.5 (20 mesin paralel) | Zikran + Reynaldi | 1 jam | ⏳ |
| INT-021 | README.md update dengan integration status | Zikran | 30 menit | ⏳ |

---

## DEFINITION OF DONE (Integration Sprint)
Sistem dinyatakan "Integration Complete" jika:
1. Replay Script berjalan → 20 mesin ter-update di dashboard
2. Minimal 1 mesin masuk WARNING/CRITICAL dan terdeteksi
3. RUL banner tampil dengan nilai float yang benar
4. Global Toast Alert muncul saat CRITICAL
5. Maintenance Scheduler otomatis membuat jadwal
6. Semua Tahap 0-5 di INTEGRATION_CHECKLIST.md ✅

---

## KNOWN DEPENDENCIES
| Item | Bergantung Pada | Keterangan |
|---|---|---|
| INT-003 s/d INT-008 | Struktur file Frontend (Amir) | Butuh readme_fe.md dari Amir |
| INT-018 | NLP Engine (Aqsa) | RAG belum ready |
| Semua Frontend items | INT-001 + INT-002 selesai | Backend + ML harus stable dulu |

---
