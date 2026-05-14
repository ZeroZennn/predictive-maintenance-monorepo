# TASK CHECKLIST — ROLE D: FRONTEND ENGINEER
### Lapis AI Predictive Maintenance System
**Last Updated:** 2026-05-14
**Status Keseluruhan:** In Progress

---

## LEGENDA STATUS
| Simbol | Makna |
|---|---|
| ✅ | Selesai & Diaudit |
| 🔄 | Sedang Dikerjakan |
| ⏳ | Belum Dimulai |
| ⚠️ | Perlu Perhatian / Ada Issue |
| 🔴 | Blocked / Perlu Fix |

---

## KEPUTUSAN ARSITEKTUR YANG SUDAH DIKUNCI
(Referensi cepat — jangan diubah tanpa diskusi arsitek)

| Parameter | Nilai | Dikunci di |
|---|---|---|
| Framework | Next.js 14 (App Router) | Fase 0 |
| Styling | Tailwind CSS + CSS Custom Properties | Fase 0 |
| State Management | Zustand v4 (4 stores) | Fase 3 |
| Animasi | Framer Motion (selektif, ujung tree) | Blueprint |
| Charting | Recharts + SVG murni | Fase 6 |
| WebSocket | Singleton Class di luar React tree | Fase 4 |
| API Layer | Axios instance terpusat + interceptor | Fase 4 |
| Auth | JWT di httpOnly cookie, decode manual | Fase 2 |
| RBAC | Next.js Edge Middleware (2 lapis) | Fase 2 |
| Dev Bypass | NEXT_PUBLIC_SKIP_AUTH=true (.env.local) | Fase 5 |
| Sensor Count | 8 sensor (+ operating_hours) | Fase 6 |
| Machine Count | 20 mesin (M-01 s/d M-20) | Fase 3 |
| Monorepo | Manual (folder /frontend di root repo) | Fase 0 |
| Background | CSS Custom Properties :root | Fase 0 |
| Port Dev | localhost:3000 | Fase 0 |
| Port Backend | localhost:8000 | Fase 4 |
| WS URL | ws://localhost:8000/ws/telemetry | Fase 4 |

---

## TARGET DELIVERABLES FINAL
(Sesuai Knowledge Base Role D V2.0 & Master Blueprint V3.0)

| No | Deliverable | Status |
|---|---|---|
| 1 | Halaman Authentication (/login) | 🔄 Shell selesai, form belum |
| 2 | Halaman Real-Time Dashboard (/) | 🔄 In Progress |
| 3 | Halaman AI Copilot Hub (/copilot-hub) | ⏳ Fase 9 |
| 4 | Halaman Admin Panel (/admin) | ⏳ Fase 10 |
| 5 | Modul AI Copilot Sliding Panel | ⏳ Fase 8 |
| 6 | Halaman Maintenance Scheduler (/scheduler) | ⏳ Fase 11 |
| 7 | Halaman Historical Logs & Reports (/logs) | ⏳ Fase 12 |
| 8 | Sistem Global Toast Alert (cross-route) | ✅ Selesai |

---

## FASE 0 — Foundation & Project Scaffold ✅
**Status:** SELESAI

- [x] Inisialisasi Next.js 14 di /frontend
  (TypeScript, ESLint, Tailwind, App Router)
- [x] Install dependencies: zustand, framer-motion, 
  recharts, axios, lucide-react, clsx, tailwind-merge
- [x] Hapus boilerplate default Next.js
- [x] Buat struktur folder lengkap:
  src/app/(auth), src/app/(app), src/components/,
  src/stores/, src/lib/api/, src/lib/websocket/,
  src/hooks/, src/types/, src/config/
- [x] Setup tailwind.config.ts dengan design tokens 
  Lapis AI (CSS Custom Properties)
- [x] Setup src/app/globals.css dengan :root variables,
  scrollbar custom, utility classes glow
- [x] TypeScript types: auth, machine, copilot, 
  maintenance, toast (+ barrel index.ts)
- [x] Config constants: SENSOR_CONFIG (8 sensor), 
  STATUS_CONFIG, MACHINE_IDS (M-01–M-20), ROUTES
- [x] npx tsc --noEmit: PASSED ✅

**Background warna #081819 tampil di localhost:3000**

---

## FASE 1 — Design Token & Theme System ✅
**Status:** SELESAI (dikerjakan dalam Fase 0)

- [x] Palet warna terdefinisi di CSS Custom Properties
- [x] Tailwind extend: lapis-bg, lapis-surface, 
  lapis-card, lapis-border, lapis-neon, lapis-amber, 
  lapis-red, lapis-text, lapis-muted
- [x] Custom boxShadow: glow-neon, glow-amber, glow-red
- [x] Custom keyframes: pulse-critical, slide-in-top,
  slide-in-right, fade-in
- [x] Custom animations: animate-pulse-critical,
  animate-slide-in-top, animate-slide-in-right
- [x] Utility classes: .glow-neon, .glow-amber, 
  .glow-red, .text-glow-neon, .text-glow-amber,
  .text-glow-red

---

## FASE 2 — Layout Shell & RBAC Auth Guard ✅
**Status:** SELESAI

- [x] (auth)/layout.tsx — full viewport centered, clean
- [x] (auth)/login/page.tsx — placeholder shell
- [x] src/middleware.ts — Edge Middleware RBAC:
  - Layer 1: validasi JWT cookie "lapis_token"
  - Layer 2: role check untuk /admin (ADMIN only)
  - Helper decodeJwtPayload() — base64url → base64
  - Anti-loop: malformed token → hapus cookie, 
    redirect /login tanpa loop
- [x] AppShell.tsx — ml-[90px] dari IconNavBar
- [x] IconNavBar.tsx — w-[90px], transparent bg,
  icon + label, active state neon glow
- [x] (app)/layout.tsx — Server Component,
  render WebSocketInitializer + NotificationProvider
  + AppShell
- [x] (app)/page.tsx — placeholder Dashboard
- [x] Dev bypass: NEXT_PUBLIC_SKIP_AUTH=true
- [x] npm run build: PASSED ✅

**Fix yang pernah dilakukan:**
- Bug redirect loop: base64url decode error → 
  fix helper decodeJwtPayload()
- WebSocketInitializer path error → fix barrel export

---

## FASE 3 — Global State Architecture ✅
**Status:** SELESAI

- [x] machineStore.ts:
  - machines: Record<string, Machine> 
    (20 mesin default)
  - sensors: SensorData per machine
  - updateMachineReading() action
  - selectedMachineId, statusFilter
- [x] copilotStore.ts:
  - messages: Message[] (dengan sources[])
  - isOpen, isLoading, sessionId
  - activeMachineContext
  - togglePanel(), clearHistory()
- [x] uiStore.ts:
  - activeTab, sidebarCollapsed, isPageLoading
- [x] toastStore.ts:
  - alerts[], persistentAlerts[]
  - addAlert() — anti-duplikasi per machine_id
  - dismissToast() → pindah ke persistentAlerts
  - resolveAlert() — hapus dari kedua array
- [x] stores/index.ts barrel export
- [x] Custom hooks:
  - useMachine.ts: useMachineList(), 
    useMachineDetail(), useSelectedMachine()
  - useCopilot.ts: useCopilot() + sendMessage()
  - useToast.ts: useToast()
  - hooks/index.ts barrel export
- [x] npx tsc --noEmit: PASSED ✅

---

## FASE 4 — WebSocket Engine & API Layer ✅
**Status:** SELESAI

- [x] ws-events.ts: WS_EVENTS constants,
  WsConnectionState type, message interfaces,
  type guards (isMachineUpdate, isCriticalAlert, 
  isWarningAlert, isStatusResolved)
- [x] ws-manager.ts: WebSocketManager singleton
  - connect(), disconnect()
  - handleOpen/Message/Close/Error()
  - scheduleReconnect() — exponential backoff
  - dispatch ke machineStore & toastStore 
    via .getState() (di luar React)
  - export const wsManager = getInstance()
  - Zero React imports ✅
- [x] useWebSocketInit.ts hook:
  - connect() on mount, disconnect() on cleanup
  - interval 2s sync connectionState
- [x] WebSocketInitializer client component
  di (app)/layout.tsx
- [x] src/lib/websocket/index.ts barrel
- [x] API Abstraction Layer (8 modules):
  - axios-instance.ts: request interceptor 
    (auto Bearer token), response interceptor 
    (auto redirect 401), server-side guard
  - auth.api.ts: loginUser, logoutUser
  - telemetry.api.ts: fetchAllMachines, 
    fetchMachineDetail, fetchMachineHistory
  - nlp.api.ts: queryCopilot
  - maintenance.api.ts: fetchMaintenanceTasks, 
    updateTaskStatus
  - logs.api.ts: fetchSensorLogs, 
    fetchMaintenanceLogs, exportLogs
  - admin.api.ts: fetchUsers, createUser, 
    updateUser, deleteUser, uploadDocument
  - src/lib/api/index.ts barrel
- [x] src/lib/index.ts root barrel
- [x] npm run build: PASSED ✅

---

## FASE 5 — Global Toast System ✅
**Status:** SELESAI

- [x] ToastCard.tsx — unit card notifikasi:
  - Framer Motion animate (initial/animate/exit)
  - Mapping severity → icon, warna, glow
  - Dismiss button
- [x] ToastContainer.tsx:
  - AnimatePresence mode="sync"
  - Auto-dismiss useEffect (5 detik per toast)
  - Fixed top-4 right-4 z-50
- [x] PersistentAlertBar.tsx:
  - Muncul permanen selama kondisi kritis
  - AnimatePresence height animation
  - Max 3 alert tampil + counter "+N lainnya"
  - Resolve button per alert
  - TODO: integrasi ke RUL Banner di Fase 7
- [x] NotificationProvider.tsx:
  - Wrapper ToastContainer + PersistentAlertBar
  - Di-render di (app)/layout.tsx
- [x] Smoke test: tombol trigger CRITICAL/WARNING/INFO
- [x] npx tsc --noEmit: PASSED ✅

**Fix yang pernah dilakukan:**
- Toast tidak auto-dismiss → tambah useEffect 
  timer di ToastContainer
- PersistentAlertBar posisi gap aneh → 
  dipindah integrasi ke Fase 7

---

## FASE 6 — Dashboard Atomic Components 🔄
**Status:** IN PROGRESS

### Atoms
- [x] SensorGaugeChart.tsx:
  - SVG arc murni (semi-circular speedometer)
  - useMotionValue + animate (luar React cycle)
  - Tick marks, needle, value text, unit
  - Warna arc: HEALTHY=neon, WARNING=amber, 
    CRITICAL=red
- [x] StatusBadge.tsx:
  - Driven by STATUS_CONFIG
  - size prop (sm/md)
  - animated prop → animate-pulse-critical
- [x] MachineStatusDot.tsx:
  - size prop (sm/md/lg)
  - Glow shadow per status
  - CRITICAL: animate-pulse-critical

### Molecules
- [x] SensorCard.tsx:
  - Surgical subscription: 
    useMachineStore(state => state.machines[id]
    ?.sensors[key])
  - Border glow berubah sesuai status mesin
  - Header: AlignJustify icon + label uppercase
- [x] MachineCard.tsx:
  - Framer Motion whileHover/whileTap scale
  - next/image dengan fallback
  - Active state: neon glow + bg-neon-dim
  - CRITICAL state: animate-pulse-critical
  - Asset path: /assets/machines/{machineId}.png
- [x] RULCircularGauge.tsx:
  - SVG circle stroke-dasharray/offset
  - Framer Motion animate dari 0 → value
  - Percentage + status label di tengah
- [x] KPIItem.tsx:
  - Icon circular container + label + value
  - valueColor prop untuk override warna nilai

### Organisms
- [x] AnomalyTimeline.tsx:
  - Horizontal timeline dengan garis oranye dan tick marks
  - Green active window untuk zona anomali
  - Floating pill badge berkedip (animate-pulse) di dalam zone hijau
  - Dot dihilangkan sesuai desain final
  - Mock data statis (siap swap ke live data dari BE/ML)
- [x] MaintenanceKPIBar.tsx:
  - 6 KPIItems (Confidence, Last Maintenance, Uptime, Issues/Week, Remaining Life, Cost)
  - Layout Grid 3x2, sinkron dengan style VITAL SIGNS
  - Surgical subscription dari machineStore
- [x] MachineListSidebar.tsx:
  - Dropdown filter: ALL / HEALTHY / WARNING / CRITICAL
  - Scrollable machine list dengan MachineCard
  - Surgical subscription (selectedMachineId dibaca dari store di MachineCard)
  - useMemo untuk filteredMachines
- [x] RULBanner (inline di page.tsx):
  - Header "M-XX VITAL SIGNS" + AlignJustify icon
  - Teks hero "ESTIMATED RUL : XXX DAYS" neon
  - RULCircularGauge di kanan
- [x] SensorGrid (inline di page.tsx):
  - 8 SensorCards grid 4×2
  - Map dari SENSOR_CONFIG
  - Data dari machineStore via SensorCard surgical subscription

### Layout Refactor
- [x] IconNavBar.tsx: w-[90px], transparent bg,
  icon + label, active route highlight
- [x] AppShell.tsx: ml-[90px], minimal shell
- [x] public/assets/machines/ folder dibuat
- [x] docs/DASHBOARD_DESIGN_BRIEF.md dibuat
- [x] src/components/dashboard/index.ts 
  barrel export

- [x] npx tsc --noEmit: PASSED ✅

---

## FASE 7 — Dashboard Page Full Assembly ✅
**Status:** SELESAI

- [x] MachineListSidebar organism:
  - Zone filter dropdown (All/Healthy/Warning/Critical)
  - MachineCards scrollable, surgical isActive dari store
  - Klik card → update selectedMachineId di store
- [x] RULBanner organism (inline di page.tsx):
  - "M-XX VITAL SIGNS" header dengan AlignJustify icon
  - "ESTIMATED RUL : XXX DAYS" hero text neon
  - RULCircularGauge di kanan
  - NOTE: PersistentAlertBar ditunda ke iterasi berikutnya
- [x] SensorGrid organism (inline di page.tsx):
  - 8 SensorCards grid 4×2
  - Data dari machineStore surgical subscription per sensor
- [x] MaintenanceKPIBar organism:
  - 6 KPIItems (Confidence, Last Maintenance,
    Uptime, Issues/Week, Remaining Life, Cost)
- [x] Assembly halaman Dashboard penuh
- [x] Validasi klik machine card → semua
  panel update (RUL, sensor, KPI)
- [ ] Validasi WebSocket mock update →
  gauge needle animasi (ditunda — BE belum live)
- [x] npx tsc --noEmit: PASSED ✅

---

## FASE 8 — AI Copilot Sliding Panel ⏳
**Status:** BELUM DIMULAI

- [ ] CopilotSlidingPanel.tsx:
  - Framer Motion slide-in-right
  - Render di (app)/layout.tsx (persistent)
  - Tidak di-unmount saat navigasi
- [ ] ChatBubble.tsx — user vs assistant style
- [ ] CitationChip.tsx — source file + page number
- [ ] SuggestedActionButton.tsx
- [ ] ChatInput.tsx — input + send button
- [ ] Integrasi dengan nlp.api.ts queryCopilot()
- [ ] Floating trigger button (semua halaman)
- [ ] copilotStore persistent validasi
- [ ] npx tsc --noEmit: PASSED

---

## FASE 9 — Halaman AI Copilot Hub ⏳
**Status:** BELUM DIMULAI

- [ ] /copilot-hub/page.tsx — full page chat
- [ ] Layout dua panel: history + input area
- [ ] CitationCard (expanded version dari chip)
- [ ] session_id management
- [ ] RBAC: accessible semua role authenticated
- [ ] npx tsc --noEmit: PASSED

---

## FASE 10 — Halaman Admin Panel ⏳
**Status:** BELUM DIMULAI

- [ ] /admin/page.tsx — tab layout
- [ ] Tab Manajemen Dokumen:
  - Drag & drop file upload (PDF/DOCX/TXT)
  - Progress bar upload
  - Tabel dokumen terindeks (nama, tipe, status)
  - Delete dengan konfirmasi dialog
- [ ] Tab Manajemen User:
  - Tabel CRUD pengguna
  - Modal tambah/edit user
  - Role dropdown (TECHNICIAN/ADMIN)
  - Delete dengan konfirmasi
- [ ] RBAC: hanya ADMIN (middleware sudah handle)
- [ ] npx tsc --noEmit: PASSED

---

## FASE 11 — Halaman Maintenance Scheduler ⏳
**Status:** BELUM DIMULAI

- [ ] /scheduler/page.tsx
- [ ] Task Board 3 kolom:
  - 🔴 URGENT (< 3 hari)
  - 🟡 SOON (3–7 hari)
  - 🟢 SCHEDULED (> 7 hari)
- [ ] TaskCard: machineId, type, tanggal, 
  durasi, teknisi
- [ ] Badge MaintenanceType: 
  PREVENTIVE/CORRECTIVE/EMERGENCY
- [ ] Auto-update dari WebSocket (mesin kritis 
  → kartu baru muncul)
- [ ] Integration dengan maintenance.api.ts
- [ ] npx tsc --noEmit: PASSED

---

## FASE 12 — Halaman Historical Logs & Reports ⏳
**Status:** BELUM DIMULAI

- [ ] /logs/page.tsx — tab layout
- [ ] Tab Sensor Logs:
  - Tabel: Timestamp, Machine ID, Sensor, 
    Nilai, Status, Anomaly Flag
  - Filter: Date Range, Machine ID, Status
  - Pagination 50 baris
- [ ] Tab Maintenance History:
  - Tabel: Tanggal, Machine ID, Tipe, 
    Teknisi, Durasi, Hasil
- [ ] Export PDF button
- [ ] Export Excel button
- [ ] Integration dengan logs.api.ts
- [ ] npx tsc --noEmit: PASSED

---

## FASE 13 — Integration & RBAC Validation ⏳
**Status:** BELUM DIMULAI

- [ ] copilotStore persistent saat navigasi 
  Dashboard → Scheduler → Logs → Admin
- [ ] Toast Alert muncul dari semua halaman
- [ ] Rute /admin tidak bisa diakses Teknisi
- [ ] Rute /copilot-hub accessible semua role
- [ ] WebSocket reconnect otomatis tervalidasi
- [ ] selectedMachineId persist di machineStore

---

## FASE 14 — Performance Audit & Hardening ⏳
**Status:** BELUM DIMULAI

- [ ] React DevTools Profiler:
  - Validasi SensorGaugeChart hanya 
    re-render saat nilai sensor-nya berubah
  - Validasi MachineCard inactive tidak 
    re-render saat gauge update
- [ ] Lighthouse score:
  - Performance > 80
  - INP < 200ms saat 8 sensor update bersamaan
- [ ] Bundle analyzer — cek chunk size
- [ ] Pastikan tidak ada memory leak:
  - WebSocket cleanup di useWebSocketInit
  - setInterval cleanup
  - AnimatePresence unmount bersih

---

## FASE 15 — Build & Deployment Preparation ⏳
**Status:** BELUM DIMULAI

- [ ] .env.local → .env.production
- [ ] Set NEXT_PUBLIC_SKIP_AUTH=false 
  (WAJIB sebelum production)
- [ ] Environment variables:
  - NEXT_PUBLIC_API_BASE_URL
  - NEXT_PUBLIC_WS_URL
- [ ] npm run build: zero errors + zero warnings
- [ ] Test production build: npm run start
- [ ] Konfigurasi Edge Middleware production

---

## CATATAN & ISSUES AKTIF

| ID | Fase | Catatan | Status |
|---|---|---|---|
| NOTE-01 | Fase 5 | PersistentAlertBar belum diintegrasikan ke RUL Banner — ditunda ke Fase 7 | ⏳ |
| NOTE-02 | Fase 6 | Asset ilustrasi mesin perlu ditempatkan di public/assets/machines/{id}.png | ⏳ |
| NOTE-03 | Fase 6 | Background pattern image belum diintegrasikan ke globals.css | ⏳ |
| NOTE-04 | Semua | API contracts bisa berubah — update src/lib/api/ dan src/types/ saja | 🔄 Ongoing |
| NOTE-05 | Fase 15 | NEXT_PUBLIC_SKIP_AUTH WAJIB di-set false sebelum production deploy | ⚠️ |
| DFT-01 | Fase 2 | Middleware redirect loop (base64url) → FIXED | ✅ |
| DFT-02 | Fase 4 | useWebSocketInit path not found → FIXED | ✅ |
| DFT-03 | Fase 6 | Machine.sensors type missing → FIXED | ✅ |

---

*Dokumen ini diupdate setiap langkah selesai dieksekusi dan diaudit.*
*Jangan update status ✅ sebelum mendapat konfirmasi dari Lead Architect.*
*File ini adalah living document — update menyesuaikan implementasi aktual.*
