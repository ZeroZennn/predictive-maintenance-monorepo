# DESIGN BRIEF — FASE REVISI (CALENDAR VIEW)
## Halaman Maintenance Scheduler (`/scheduler`)
**Proyek:** PRIME (Predictive Reliability & Intelligence Maintenance Engine)
**Status:** Ready for Execution
**Referensi:** Revisi Kanban ke Calendar View

---

## 1. TUJUAN HALAMAN

Menggantikan sistem Kanban lama dengan **Interactive Calendar View**. Halaman ini berfungsi memetakan jadwal perbaikan mesin (Preventive manual & Predictive otomatis dari ML) dalam kanvas waktu (Time-Series UI). Halaman harus **auto-update via WebSocket** dan menampilkan indikator visual (dot warna) pada tanggal yang memiliki tindakan kritis.

---

## 2. LAYOUT & STRUKTUR HALAMAN
┌─────────────────────────────────────────────────────────────┐
│  [CONDITIONAL BANNER] ⚠️ N Jadwal Prediktif Menunggu Konfirmasi│
├─────────────────────────────────────────────────────────────┤
│  HEADER: <  MEI 2026  >                                     │
│  FILTER: [Semua Mesin ▼] [Semua Tipe ▼]  [+ Tambah Jadwal]  │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────┤
│ SEN  │ SEL  │ RAB  │ KAM  │ JUM  │ SAB  │ MIN  │            │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ SLIDE      │
│ 1    │ 2    │ 3    │ 4    │ 5    │ 6    │ 7    │ PANEL      │
│      │      │      │      │      │ 🔴   │      │ DETAIL     │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ CARD       │
│ 8    │ 9    │ 10   │ 11   │ 12   │ 13   │ 14   │ (Muncul    │
│      │      │ 🟡🟢 │      │      │      │      │  saat      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤  tanggal   │
│ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │  diklik)   │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴────────────┘
**Layout Rules:**
- Area Atas: Banner Notification (muncul jika ada task `PENDING_CONFIRMATION`).
- Area Bawah: CSS Grid 7 kolom untuk kalender. Full-width di dalam `AppShell`.
- Panel Kanan (TaskSlidePanel): Slide dari kanan (`x: 100% -> 0`) dengan lebar absolut (misal `w-96`), z-index tinggi.

---

## 3. DESIGN TOKENS (Warna & Tema)

| Elemen | Token / Class Tailwind |
|---|---|
| Background Kalender | `bg-[#081819]` |
| Border Grid | `border border-white/5` |
| Font Judul/Angka | `font-heading` (Space Grotesk) |
| Kotak Hari (Hari ini) | Teks angka `text-[#5FDA0A]` |
| Indikator EMERGENCY | `bg-red-500` (🔴) + border luar kemerahan |
| Indikator PENDING/CORRECTIVE | `bg-yellow-500` (🟡) |
| Indikator SCHEDULED/PREVENTIVE| `bg-green-500` (🟢) |

---

## 4. KOMPONEN YANG DIBUTUHKAN

### 4.1 `CalendarView.tsx` — Organism
Fungsi: Merender header, filter bar, dan grid kalender menggunakan `date-fns`.
- Looping `CalendarDay` untuk setiap tanggal di bulan aktif.

### 4.2 `CalendarDay.tsx` — Molekul
Props: `date`, `isCurrentMonth`, `tasks[]`, `onClick`.
- Min-height: `h-32`.
- Merender maksimal 3 indikator *dot* (berdasarkan warna `urgency`/`status` task).
- Jika `tasks.length > 3`, render teks `+{tasks.length - 3} lagi` dengan teks sangat kecil.

### 4.3 `TaskSlidePanel.tsx` — Organism
Fungsi: *Off-canvas menu* yang muncul dari kanan saat `CalendarDay` diklik.
- Menampilkan tanggal terpilih di header.
- Me-mapping `TaskDetailCard` untuk setiap task di tanggal tersebut.

### 4.4 `TaskDetailCard.tsx` — Molekul
Memiliki 3 Varian *rendering* berdasarkan Status/Tipe:

**Varian A: PREDICTIVE (Pending Confirmation)**
- Badge: `[EMERGENCY/WARNING] [PREDICTIVE] Mesin-ID`
- Info: Jadwal, Est. Durasi, Catatan Sensor.
- ML Metrics: 🤖 Sisa Umur (RUL), 📊 Confidence (%), ⚡ Urgency.
- Status: 🟡 PENDING CONFIRMATION.
- Tombol: `[✅ Konfirmasi]` `[📅 Reschedule]`.

**Varian B: MANUAL (Preventive Scheduled)**
- Badge: `[MONITOR] [PREVENTIVE] Mesin-ID`
- Info: Jadwal, Est. Durasi, Catatan Rutin.
- Status: 🟢 SCHEDULED.
- Tombol: `[✏️ Edit]` `[✅ Mark Selesai]`.

**Varian C: COMPLETED (History)**
- UI lebih redup (opacity rendah atau border abu-abu).
- Info Eksekusi: Tgl Terlaksana, Durasi Aktual, Part Diganti, Biaya (Rp).
- Status: ✅ COMPLETED.

### 4.5 `SchedulerModals.tsx` — Molekul
- **Modal Add Preventive:** Dropdown Mesin, Datepicker, Input Jam, Textarea.
- **Modal Mark Selesai:** Datepicker Realisasi, Durasi Aktual, Komponen Diganti (Opsional), Biaya (Opsional).

---

## 5. STATE MANAGEMENT & WEBSOCKET

- `selectedDate`: State lokal untuk memicu buka/tutup `TaskSlidePanel`.
- **Listen `maintenance:new_suggestion`**: 
  - Munculkan toast. 
  - Update data store (membuat dot kuning muncul di kalender).
  - Update Notification Banner counter.
- **Listen `maintenance:confirmed`**:
  - Ubah status task di store (dot kuning berubah jadi hijau/merah).

---

## 6. MOCK DATA (Untuk UI Development)

```typescript
const MOCK_CALENDAR_TASKS = [
  {
    task_id: 'task-001',
    machine_id: 'M-01',
    scheduled_date: '2026-05-19T08:00:00Z', // Sesuaikan bulan ini
    urgency_level: 'IMMEDIATE',
    maintenance_type: 'EMERGENCY',
    status: 'PENDING_CONFIRMATION',
    ml_metrics: { rul_days: 1.5, confidence: 96.07 },
    notes: 'Degradasi terdeteksi sensor vibration'
  },
  {
    task_id: 'task-002',
    machine_id: 'M-13',
    scheduled_date: '2026-05-28T09:00:00Z',
    urgency_level: 'MONITOR',
    maintenance_type: 'PREVENTIVE',
    status: 'SCHEDULED',
    estimated_duration: 2,
    notes: 'Inspeksi rutin Q2'
  },
  {
    task_id: 'task-003',
    machine_id: 'M-07',
    scheduled_date: '2026-05-23T10:00:00Z',
    urgency_level: 'WARNING',
    maintenance_type: 'CORRECTIVE',
    status: 'COMPLETED',
    actual_duration: 3.5,
    replaced_parts: 'Belt & Pulley',
    cost: 9427034
  }
];
```
