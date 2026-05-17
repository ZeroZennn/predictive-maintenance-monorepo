# DESIGN BRIEF — FASE 10
## Halaman Maintenance Scheduler (`/scheduler`)
**Proyek:** Lapis AI Predictive Maintenance System
**Role:** D — Frontend Engineer
**Status:** Ready for Execution
**Referensi:** Master Blueprint V3.0 · Handover Zikran · API Contract v1.0-final

---

## 1. TUJUAN HALAMAN

Menampilkan **Kanban Board dinamis** berisi jadwal tindakan perbaikan mesin yang
dihasilkan secara otomatis oleh Backend berdasarkan kalkulasi Safety Margin (RUL).
Halaman ini harus **auto-update via WebSocket** tanpa refresh saat mesin baru
memasuki kondisi kritis.

---

## 2. LAYOUT & STRUKTUR HALAMAN

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                 │
│  "MAINTENANCE SCHEDULER"  [badge: X Active Tasks]          │
├───────────────┬───────────────┬─────────────────────────────┤
│  🔴 URGENT    │  🟡 SOON      │  🟢 SCHEDULED               │
│  (< 3 hari)  │  (3–7 hari)  │  (> 7 hari)                │
│               │               │                             │
│  [TaskCard]   │  [TaskCard]   │  [TaskCard]                │
│  [TaskCard]   │  [TaskCard]   │  [TaskCard]                │
│               │               │  [TaskCard]                │
│               │               │                             │
│  + N tasks    │  + N tasks    │  + N tasks                 │
└───────────────┴───────────────┴─────────────────────────────┘
```

**Layout Rules:**
- 3 kolom equal width (`grid-cols-3`), full height viewport
- Setiap kolom: header sticky + scrollable card list
- Tidak ada sidebar tambahan — konten full-width di dalam `AppShell`

---

## 3. DESIGN TOKENS (Warna & Tema)

Mengacu pada CSS Custom Properties yang sudah terdefinisi di `globals.css`:

| Elemen | Token |
|---|---|
| Background halaman | `lapis-bg` |
| Background kolom | `lapis-surface` |
| Background card | `lapis-card` |
| Border default | `lapis-border` |
| Teks utama | `lapis-text` |
| Teks sekunder | `lapis-muted` |

**Warna per kolom (header & accent):**

| Kolom | Warna Header | Border Accent | Badge BG |
|---|---|---|---|
| URGENT | `lapis-red` | `border-lapis-red/50` | `bg-lapis-red/20 text-lapis-red` |
| SOON | `lapis-amber` | `border-lapis-amber/50` | `bg-lapis-amber/20 text-lapis-amber` |
| SCHEDULED | `lapis-neon` | `border-lapis-neon/50` | `bg-lapis-neon/20 text-lapis-neon` |

---

## 4. KOMPONEN YANG DIBUTUHKAN

### 4.1 `KanbanColumn` — Organism
**File:** `src/components/scheduler/KanbanColumn.tsx`

Props:
```typescript
interface KanbanColumnProps {
  type: 'URGENT' | 'SOON' | 'SCHEDULED'
  tasks: MaintenanceTask[]
}
```

Struktur:
```
<div> ← wrapper kolom, flex-col, h-full
  <div> ← header sticky: icon + label + counter badge
  <div> ← scrollable area: map TaskCard
  <div> ← footer: "X tasks" counter
</div>
```

Header per kolom:
- URGENT: icon `AlertOctagon` (merah), label "URGENT", subtext "< 3 Hari"
- SOON: icon `Clock` (amber), label "SOON", subtext "3 – 7 Hari"
- SCHEDULED: icon `CalendarCheck` (neon), label "SCHEDULED", subtext "> 7 Hari"

### 4.2 `TaskCard` — Molekul
**File:** `src/components/scheduler/TaskCard.tsx`

Props:
```typescript
interface TaskCardProps {
  task: MaintenanceTask
}
```

Anatomi card (dari atas ke bawah):
```
┌────────────────────────────────────────┐
│ [UrgencyBadge]          [TypeBadge]   │  ← baris 1: dua badge
│                                        │
│  M-XX                                  │  ← baris 2: machine ID (bold)
│  Scheduled: DD MMM YYYY               │  ← baris 3: tanggal
│                                        │
│  ⏱ XX hari tersisa                    │  ← baris 4: countdown
│  👤 Teknisi: [nama atau "Unassigned"] │  ← baris 5: assignee
│                                        │
│  [●] PENDING  /  [●] IN PROGRESS      │  ← baris 6: status indicator
└────────────────────────────────────────┘
```

**UrgencyBadge** (dari `urgency_level` API):
| Value | Label | Warna |
|---|---|---|
| `IMMEDIATE` | ⚡ IMMEDIATE | `lapis-red` |
| `CRITICAL` | 🔴 CRITICAL | `lapis-red/70` |
| `WARNING` | ⚠️ WARNING | `lapis-amber` |
| `MONITOR` | 👁 MONITOR | `lapis-muted` |

**TypeBadge** (dari `maintenance_type`):
| Value | Label | Warna |
|---|---|---|
| `EMERGENCY` | EMERGENCY | `lapis-red` |
| `CORRECTIVE` | CORRECTIVE | `lapis-amber` |
| `PREVENTIVE` | PREVENTIVE | `lapis-neon` |

**Styling card:**
- `bg-lapis-card border border-lapis-border rounded-xl p-4`
- Hover: `hover:border-lapis-neon/30 transition-colors duration-150`
- URGENT card tambahan: `animate-pulse-critical` pada border (jika `urgency_level === 'IMMEDIATE'`)

### 4.3 `useMaintenanceSocket` — Custom Hook
**File:** `src/hooks/useMaintenanceSocket.ts`

Fungsi: Fetch initial data dari `maintenance.api.ts` saat mount, lalu
listen WebSocket event `new_maintenance_task` via `maintenanceStore`
(sudah di-handle ws-manager di Blok 1).

```typescript
export function useMaintenanceSocket() {
  const setTasks = useMaintenanceStore(s => s.setTasks)
  const setLoading = useMaintenanceStore(s => s.setLoading)

  useEffect(() => {
    // Fetch initial tasks dari REST API
    setLoading(true)
    fetchMaintenanceTasks()
      .then(data => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])
  // WebSocket sudah auto-update via ws-manager → maintenanceStore
}
```

### 4.4 `/scheduler/page.tsx` — Page Assembly
**File:** `src/app/(app)/scheduler/page.tsx`

```
'use client'
↓
useMaintenanceSocket() ← init data
↓
useMemo → urgentTasks, soonTasks, scheduledTasks
↓
Layout:
  <Header Bar />
  <div className="grid grid-cols-3 gap-4 p-6 h-full">
    <KanbanColumn type="URGENT"    tasks={urgentTasks} />
    <KanbanColumn type="SOON"      tasks={soonTasks} />
    <KanbanColumn type="SCHEDULED" tasks={scheduledTasks} />
  </div>
```

---

## 5. STATE MANAGEMENT

Menggunakan `maintenanceStore` yang sudah dibuat di Blok 1:

```
maintenanceStore.tasks[] (flat array)
        │
        ├── selectUrgentTasks()    → KanbanColumn URGENT
        ├── selectSoonTasks()      → KanbanColumn SOON
        └── selectScheduledTasks() → KanbanColumn SCHEDULED
```

**Surgical subscription per kolom:**
```typescript
// Di KanbanColumn URGENT — hanya re-render jika urgentTasks berubah
const tasks = useMaintenanceStore(s =>
  selectUrgentTasks(s.tasks)
)
```

**Real-time update flow:**
```
Backend WebSocket
  → event: new_maintenance_task
  → ws-manager.handleMessage()
  → maintenanceStore.addTask()        ← sudah ada (Blok 1)
  → KanbanColumn yang relevan re-render otomatis
```

---

## 6. MOCK DATA (untuk dev sebelum integrasi ML)

```typescript
const MOCK_TASKS: MaintenanceTask[] = [
  {
    task_id: 'task-001',
    machine_id: 'M-01',
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 1 * 86400000).toISOString(),
    rul_days: 1.5,
    rul_hours: 36,
    urgency_level: 'IMMEDIATE',
    maintenance_type: 'EMERGENCY',
    technician: 'Budi Santoso',
    status: 'PENDING',
  },
  {
    task_id: 'task-002',
    machine_id: 'M-07',
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    rul_days: 5,
    rul_hours: 120,
    urgency_level: 'WARNING',
    maintenance_type: 'CORRECTIVE',
    technician: null,
    status: 'PENDING',
  },
  {
    task_id: 'task-003',
    machine_id: 'M-13',
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    rul_days: 10,
    rul_hours: 240,
    urgency_level: 'MONITOR',
    maintenance_type: 'PREVENTIVE',
    technician: 'Rina Dewi',
    status: 'PENDING',
  },
]
```

---

## 7. ANIMASI & INTERAKSI

| Elemen | Animasi |
|---|---|
| TaskCard masuk baru (WebSocket) | Framer Motion: `initial={{ opacity: 0, y: -20 }}` → `animate={{ opacity: 1, y: 0 }}` |
| TaskCard IMMEDIATE | `animate-pulse-critical` pada border |
| Kolom kosong | Empty state: icon + teks "Tidak ada tugas" |
| Loading state | Skeleton 3 card per kolom dengan `animate-pulse` |

---

## 8. RBAC

- Route `/scheduler` → accessible semua role authenticated (Teknisi & Admin)
- Middleware sudah handle — tidak perlu logika tambahan di halaman

---

## 9. URUTAN EKSEKUSI

```
Step 10.1 → TaskCard.tsx (molekul)
Step 10.2 → KanbanColumn.tsx (organism)  
Step 10.3 → useMaintenanceSocket.ts (hook)
Step 10.4 → /scheduler/page.tsx (assembly)
```

---

## 10. DEFINITION OF DONE

- [ ] 3 kolom Kanban tampil dengan warna accent yang benar
- [ ] TaskCard menampilkan semua field: ID mesin, tanggal, badge urgency, badge type, countdown hari
- [ ] Mock data terdistribusi ke kolom yang benar berdasarkan `rul_days`
- [ ] Simulasi WebSocket: panggil `maintenanceStore.addTask()` dari console → card muncul otomatis di kolom yang tepat tanpa refresh
- [ ] `npx tsc --noEmit` PASSED
- [ ] `npm run build` PASSED
