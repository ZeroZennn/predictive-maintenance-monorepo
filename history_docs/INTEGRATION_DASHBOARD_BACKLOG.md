---
# PRIME — Integration Dashboard Backlog
**Sprint:** Integration & Verification Sprint
**Terakhir diupdate:** 2026-05-26
**Status:** 🔄 Active

---

## CARA MENGGUNAKAN DOKUMEN INI (Panduan Mandiri)
1. Kerjakan item berdasarkan prioritas: CRITICAL dulu
2. Update status segera setelah item selesai
3. Tambahkan item baru di section sesuai prioritas
4. Setiap item harus punya PIC yang jelas
5. Item CRITICAL yang blocked > 2 hari → eskalasi ke Lead

---

## STATUS LEGEND
⏳ Belum dimulai | 🔄 In Progress | ✅ Done | 🔴 Blocked | ❌ Cancelled

---

## PRIORITAS: CRITICAL (Blocker — harus selesai sebelum demo)

| ID | Story | PIC | Est. | Status |
|---|---|---|---|---|
| INT-001 | Fix rul_days Math.ceil → toFixed(2) | Zikran | 15m | ✅ Done |
| INT-002 | E2E Tahap 1–5 (infrastructure s/d WebSocket) | Zikran + Reynaldi | 2j | ✅ Done |
| INT-003 | Gauge 8 sensor live di dashboard real-time | Amir | 2j | ✅ Done |
| INT-004 | Health badge + health score tampil | Amir | 1j | ✅ Done |
| INT-005 | RUL banner conditional (WARNING/CRITICAL only) | Amir | 1j | ✅ Done |
| INT-006 | Global Toast Alert saat mesin CRITICAL | Amir | 1j | ✅ Done |
| INT-015 | Idle/Offline Dashboard State | Amir | 3j | ✅ Done |
| INT-016 | TAHAP 6: Edge Case & Stress Test | Zikran + Reynaldi | 2j | ✅ Done |
| INT-017 | TAHAP 7: Historical Logs & Reports | Amir + Reynaldi | 3j | ✅ Done |

---

## PRIORITAS: HIGH (Penting untuk fungsionalitas utama)

| ID | Story | PIC | Est. | Status |
|---|---|---|---|---|
| INT-007 | Sidebar machine cards update warna real-time + Multi-Select Filter | Amir / Antigravity | 2j | ✅ Done |
| INT-008 | Scheduler: kartu baru dari WebSocket (useMaintenanceSocket) | Amir / Antigravity | 3j | ✅ Done |
| INT-009 | Konfirmasi jadwal predictive → update status DB | Reynaldi + Amir | 2j | ✅ Done |
| INT-010 | Tambah jadwal preventive manual (form + POST endpoint) | Reynaldi + Amir | 2j | ✅ Done |
| INT-011 | Calendar dot update real-time saat task dibuat | Amir | 2j | ✅ Done (via lifted state + useMaintenanceSocket) |
| INT-012 | Historical Logs table tampil dari TimescaleDB | Amir + Reynaldi | 2j | ✅ Done (with pagination & filters) |
| INT-022 | Full Scheduler Revision: schema baru, PREVENTIVE/PREDICTIVE | Reynaldi + Amir | 2h | ✅ Done |
|         | split, confirmation flow, endpoints baru | | | |

---

## PRIORITAS: MEDIUM (Nice to have untuk demo)

| ID | Story | PIC | Est. | Status |
|---|---|---|---|---|
| INT-013 | Anomaly Timeline dari TimescaleDB | Reynaldi + Amir / Antigravity | 3j | ✅ Done |
| INT-014 | Maintenance KPIs widget (issues/week, MTBF) | Reynaldi + Amir | 3j | ✅ Done |
| INT-018 | Export PDF di Historical Logs | Reynaldi | 4j | ✅ Done |
| INT-019 | Export Excel di Historical Logs | Reynaldi | 2j | ✅ Done |
| INT-020 | Completion Form: mark maintenance selesai | Amir | 2j | ✅ Done (UI Ready) |
| INT-021 | Admin Panel: CRUD maintenance_logs | Amir + Reynaldi | 4j | ✅ Done |
| INT-023 | Admin Panel: CRUD maintenance_schedules | Amir + Reynaldi | 3j | ⏳ |
| INT-028 | Responsive UI adjustments for mobile (Chat, Calendar, Debug) | Antigravity | 2j | ✅ Done |
| INT-029 | Middleware Role Auth strict separation for Admin | Antigravity | 1j | ✅ Done |

---

## PRIORITAS: LOW (Post-demo enhancement)

| ID | Story | PIC | Est. | Status |
|---|---|---|---|---|
| INT-024 | AI Copilot: Live context injection dari Redis | Aqsa + Reynaldi | 1h | 🔴 Blocked (NLP belum ready) |
| INT-025 | Simulator control panel di Admin UI | Amir | 3j | ✅ Done |
| INT-026 | Stress test tick_interval=0.5 formal | Zikran + Reynaldi | 1j | ✅ Done |
| INT-027 | README.md update dengan integration status | Tim | 30m | ✅ Done |

---

## KNOWN DEPENDENCIES
| Item | Bergantung Pada | Keterangan |
|---|---|---|
| INT-016 (TAHAP 6) | INT-015 (Skeleton Loading) | UX harus siap sebelum stress test |
| INT-009 | INT-022 (Full Scheduler Revision) | Endpoint baru di Backend diperlukan |
| INT-021, INT-023 | INT-022 | Schema baru dibutuhkan untuk CRUD |
| INT-024 | NLP Engine (Aqsa) | RAG belum ready |

---

## DEFINITION OF DONE — INTEGRATION SPRINT
| # | Kriteria | Status |
|---|---|---|
| 1 | Replay Script → 20 mesin update di dashboard | ✅ |
| 2 | Minimal 1 mesin WARNING/CRITICAL terdeteksi | ✅ |
| 3 | RUL banner tampil float yang benar | ✅ |
| 4 | Global Toast Alert muncul saat CRITICAL | ✅ |
| 5 | Maintenance Scheduler auto-create kartu via WS | ✅ |
| 6 | Skeleton Loading saat initial load / reconnect | ✅ |
| 7 | Stress test tick=0.5 tidak ada error 500 | ✅ |
| 8 | Historical Logs tampil data real dari TimescaleDB | ✅ |

---
