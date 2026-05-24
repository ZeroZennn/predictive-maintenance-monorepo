# DESIGN BRIEF — FASE 11 (REVISED)
## Halaman Admin Panel (`/admin`)
**Proyek:** Lapis AI Predictive Maintenance System
**Role:** D — Frontend Engineer
**Status:** Ready for Execution — Revised
**Referensi:** Master Blueprint V3.0 · Handover Zikran · pesan_hasil_penyesuaian admin_panel (rev 2)

---

## 1. TUJUAN HALAMAN

Pusat kendali administratif untuk Manajer/Admin. Empat domain utama:
ringkasan sistem (Dashboard), manajemen akun, manajemen dokumen RAG,
dan riwayat log maintenance. **Hanya bisa diakses role ADMIN.**

---

## 2. LAYOUT & STRUKTUR HALAMAN

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                  │
│  [Shield icon]  "ADMIN PANEL"        [badge: ADMIN]         │
├──────────────────────────────────────────────────────────────┤
│  [Dashboard] [Manajemen User] [Manajemen Dokumen] [Logs]    │ ← Tab Bar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  KONTEN TAB AKTIF                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**4 Tab Final:**
| # | Tab | Akses Data |
|---|---|---|
| 1 | Dashboard Admin | machineStore + REST API summary |
| 2 | Manajemen User | GET/POST/PATCH/DELETE /api/admin/users |
| 3 | Manajemen Dokumen | GET/POST/DELETE /api/admin/documents |
| 4 | Maintenance Logs | GET/POST/PATCH/DELETE /api/admin/maintenance-logs |

---

## 3. DESIGN TOKENS

| Elemen | Token |
|---|---|
| Background halaman | `lapis-bg` |
| Tab aktif | `border-b-2 border-lapis-neon text-lapis-neon` |
| Tab inaktif | `text-lapis-muted hover:text-lapis-text` |
| Background card stat | `lapis-card border border-lapis-border` |
| Background tabel | `lapis-card` |
| Header tabel | `lapis-surface text-lapis-muted text-xs uppercase` |
| Row hover | `hover:bg-lapis-surface/50` |

---

## 4. TAB 1 — DASHBOARD ADMIN

### Komponen: `AdminDashboardTab`
**File:** `src/components/admin/AdminDashboardTab.tsx`

Sumber data yang VALID dan tersedia:
- `machineStore` → data 20 mesin (status, RUL)
- `GET /api/admin/users` → total & breakdown role pengguna
- `GET /api/admin/documents` → total & status dokumen
- `GET /api/admin/maintenance-logs` → total log historis
- `maintenanceStore` → task aktif saat ini

### 4.1 Stat Cards (baris atas) — 4 kartu

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  🏭           │ │  👥           │ │  📄           │ │  🔧           │
│  Total Mesin │ │  Total User  │ │  Total Dok.  │ │  Active Task │
│  20          │ │  [dari API]  │ │  [dari API]  │ │  [dari store]│
│  Units       │ │  Accounts    │ │  Documents   │ │  Maintenance │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Style setiap stat card:
```
bg-lapis-card border border-lapis-border rounded-xl p-5
Icon: circular container bg-lapis-neon/10 border border-lapis-neon/30
Value: text-2xl font-black text-lapis-text
Label: text-xs text-lapis-muted uppercase tracking-widest
```

### 4.2 Machine Health Overview (baris tengah)

Sumber: `machineStore.machines` — data real, bukan mock.

```
┌─────────────────────────────────────┐  ┌────────────────────────────┐
│  MACHINE HEALTH DISTRIBUTION        │  │  MESIN KRITIS / WARNING    │
│                                     │  │                            │
│  Healthy  ████████████████ 16       │  │  M-01  ● CRITICAL  12 days │
│  Warning  ████ 3                    │  │  M-07  ● WARNING   45 days │
│  Critical ██ 1                      │  │  M-13  ● WARNING   60 days │
│                                     │  │  (hanya tampil jika ada)   │
└─────────────────────────────────────┘  └────────────────────────────┘
```

**Kiri — Health Distribution Bar:**
- Horizontal progress bar per status
- Warna: HEALTHY=neon, WARNING=amber, CRITICAL=red
- Hitung dari `Object.values(machines)` grouped by `status`

**Kanan — Alert List:**
- Filter mesin dengan status WARNING atau CRITICAL saja
- Tampil: machine_id + status badge + rul_days
- Jika tidak ada mesin bermasalah → tampil:
  `"✓ Semua mesin dalam kondisi prima"`
- Max 5 baris, sisanya "+ N lainnya"

### 4.3 Document Status Overview (baris bawah kiri)

Sumber: `GET /api/admin/documents`

```
┌──────────────────────────────────┐
│  DOCUMENT INDEX STATUS           │
│                                  │
│  ● INDEXED     [dari API]        │
│  ● PROCESSING  [dari API]        │
│  ● FAILED      [dari API]        │
└──────────────────────────────────┘
```

### 4.4 Recent Maintenance Logs (baris bawah kanan)

Sumber: `GET /api/admin/maintenance-logs?limit=5`

```
┌──────────────────────────────────┐
│  LOG TERBARU                     │
│                                  │
│  ML-0001  M-06  Preventive  2.4h │
│  ML-0002  M-08  Corrective  9.6h │
│  ...                             │
└──────────────────────────────────┘
```
Tampilkan 5 log terbaru. Tanpa pagination — ini hanya preview.

---

## 5. TAB 2 — MANAJEMEN USER

### Komponen: `UserManagementTab`
**File:** `src/components/admin/UserManagementTab.tsx`

**Tabel Kolom:**
| Kolom | Keterangan |
|---|---|
| Nama | Nama lengkap |
| Email | Unique identifier |
| Role | TECHNICIAN (amber) / ADMIN (neon) badge |
| Status | ACTIVE (neon dot) / INACTIVE (muted dot) |
| Bergabung | Tanggal created_at |
| Aksi | [Detail] [Edit] [Hapus] |

**Fitur:**
- Search bar: cari by nama atau email
- Tombol kanan atas: `[+ Tambah User]`
- Pagination: 20 row per halaman

**Panel Detail User (slide-in atau modal):**
```
Nama Lengkap : [value]
Email        : [value]
Role         : [badge]
Status       : [indicator]
Bergabung    : [tanggal]
```

**Modal Tambah/Edit:**
```
Nama Lengkap : [Text input, required]
Email        : [Email input, required]
Password     : [Password input, required saat tambah,
                kosongkan = tidak berubah saat edit]
Role         : [Dropdown: TECHNICIAN | ADMIN, required]
Status       : [Toggle: ACTIVE | INACTIVE]
Tombol       : [Simpan] [Batal]
```

**API:**
```
GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
```

---

## 6. TAB 3 — MANAJEMEN DOKUMEN

### Komponen: `DocumentManagementTab`
**File:** `src/components/admin/DocumentManagementTab.tsx`

> ⚠️ Menunggu konfirmasi final NLP Engineer (Aqsa) untuk
> alur ingestion RAG. Implementasi menggunakan struktur
> `admin.api.ts → uploadDocument()` yang sudah ada.

**Area Upload (drag & drop):**
```
┌────────────────────────────────────────────────┐
│  📄  Drag & drop file di sini                 │
│       atau klik untuk browse                   │
│                                                │
│  Format: PDF, DOCX, TXT · Maks: 50MB / file  │
└────────────────────────────────────────────────┘
```

**Status Upload Lifecycle (sesuai permintaan):**
```
UPLOADING   → progress bar aktif
    ↓
PROCESSING  → badge kuning + spinner
  (NLP/ingestion berjalan)
    ↓
READY       → badge neon green ✓
    ↓
FAILED      → badge merah + pesan error
```

**Tabel Dokumen:**
| Kolom | Keterangan |
|---|---|
| Nama File | Nama + icon tipe (PDF/DOCX/TXT) |
| Tipe | Badge tipe file |
| Status | READY / PROCESSING / FAILED badge |
| Ukuran | File size KB/MB |
| Upload Date | Tanggal |
| Aksi | [Hapus] (disabled jika PROCESSING) |

**Catatan UX:**
- Tombol hapus disabled saat status PROCESSING
- FAILED: tampilkan tooltip error message on hover

**API:**
```
GET    /api/admin/documents
POST   /api/admin/documents/upload  (multipart/form-data)
DELETE /api/admin/documents/:id
```

---

## 7. TAB 4 — MAINTENANCE LOGS

### Komponen: `MaintenanceLogsTab`
**File:** `src/components/admin/MaintenanceLogsTab.tsx`

**Type Definition (tambah ke maintenance.ts):**
```typescript
export interface MaintenanceLog {
  log_id: string                    // "ML-0001"
  machine_id: string                // "M-06"
  date: string                      // ISO8601
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY'
  component_replaced?: string | null
  duration_hrs?: number | null
  cost_idr?: number | null
  technician_notes?: string | null
  created_at: string
  updated_at: string
}
```

**Tabel Kolom:**
| Kolom | Keterangan |
|---|---|
| Log ID | ML-XXXX |
| Tanggal | DD/MM/YYYY |
| Mesin | M-XX badge |
| Tipe | Preventive/Corrective/Emergency badge berwarna |
| Komponen | Komponen yang diganti |
| Durasi | X.X jam |
| Biaya | Rp X.XXX.XXX |
| Aksi | [Edit] [Hapus] |

**Badge Tipe Warna:**
| Tipe | Warna |
|---|---|
| PREVENTIVE | `bg-lapis-neon/10 text-lapis-neon` |
| CORRECTIVE | `bg-lapis-amber/20 text-lapis-amber` |
| EMERGENCY | `bg-lapis-red/20 text-lapis-red` |

**Fitur:**
- Search: by `machine_id` atau `log_id`
- Filter: Tipe maintenance (dropdown)
- Filter: Mesin M-01 s/d M-20 (dropdown)
- Pagination: 20 row per halaman
- Tombol kanan atas: `[+ Tambah Log Manual]`

**Modal Tambah/Edit:**
```
Mesin            : [Dropdown M-01–M-20, required]
Tanggal          : [Date picker, required]
Tipe             : [Dropdown: Preventive|Corrective|Emergency, required]
Catatan Teknisi  : [Textarea, opsional]
Komponen Diganti : [Text input, opsional]
Durasi (jam)     : [Number input ≥ 0, opsional]
Biaya (Rp)       : [Number input ≥ 0, format Rupiah, opsional]
Tombol           : [Simpan] [Batal]
```

**Format Rupiah helper:**
```typescript
const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
// Output: "Rp 2.731.555"
```

**API:**
```
GET    /api/admin/maintenance-logs
POST   /api/admin/maintenance-logs
PATCH  /api/admin/maintenance-logs/:log_id
DELETE /api/admin/maintenance-logs/:log_id
```

---

## 8. KOMPONEN SHARED

### `ConfirmDeleteModal`
**File:** `src/components/admin/ConfirmDeleteModal.tsx`
Dipakai oleh Tab User, Tab Dokumen, dan Tab Logs.

```typescript
interface ConfirmDeleteModalProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}
```
Animasi: Framer Motion `scale` dari tengah layar.

### `AdminTabBar`
**File:** `src/components/admin/AdminTabBar.tsx`

```typescript
type AdminTab = 'dashboard' | 'users' | 'documents' | 'logs'
```

### `AdminStatCard`
**File:** `src/components/admin/AdminStatCard.tsx`
Reusable stat card untuk Tab Dashboard.

```typescript
interface AdminStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  iconColor?: string    // default: text-lapis-neon
  iconBg?: string       // default: bg-lapis-neon/10
}
```

---

## 9. TYPES BARU YANG DIBUTUHKAN

### Update `src/types/maintenance.ts`
Tambahkan `MaintenanceLog` interface (lihat bagian 7).

### Buat `src/types/admin.ts`
```typescript
export interface AdminUser {
  user_id: string
  name: string
  email: string
  role: 'TECHNICIAN' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
  created_at: string
}

export interface AdminDocument {
  doc_id: string
  filename: string
  file_type: 'PDF' | 'DOCX' | 'TXT'
  status: 'READY' | 'PROCESSING' | 'FAILED'
  file_size_kb: number
  uploaded_at: string
}

export type AdminTab = 'dashboard' | 'users' | 'documents' | 'logs'
```

---

## 10. UPDATE WS-EVENTS

Tambahkan ke `ws-events.ts`:
```typescript
WS_EVENTS.MAINTENANCE_NEW_SUGGESTION: 'maintenance:new_suggestion'
WS_EVENTS.MAINTENANCE_CONFIRMED: 'maintenance:confirmed'
```

---

## 11. MOCK DATA

```typescript
// Mock Users
const MOCK_USERS: AdminUser[] = [
  { user_id: 'u-001', name: 'Budi Santoso',
    email: 'budi@laprisai.id', role: 'TECHNICIAN',
    status: 'ACTIVE', created_at: '2025-01-10T00:00:00Z' },
  { user_id: 'u-002', name: 'Rina Dewi',
    email: 'rina@laprisai.id', role: 'ADMIN',
    status: 'ACTIVE', created_at: '2025-01-08T00:00:00Z' },
]

// Mock Documents
const MOCK_DOCUMENTS: AdminDocument[] = [
  { doc_id: 'd-001', filename: 'SOP-01_M-01_Rev2.pdf',
    file_type: 'PDF', status: 'READY',
    file_size_kb: 2048, uploaded_at: '2026-04-25T00:00:00Z' },
  { doc_id: 'd-002', filename: 'Manual_Operasi_M-07.docx',
    file_type: 'DOCX', status: 'PROCESSING',
    file_size_kb: 512, uploaded_at: '2026-05-01T00:00:00Z' },
]

// Mock Logs (lihat Bagian 7 untuk struktur lengkap)
```

---

## 12. URUTAN EKSEKUSI

```
Step 11.1 → Update types: maintenance.ts + buat admin.ts
Step 11.2 → Update maintenance.api.ts (endpoint baru)
            + tambah admin maintenance-logs endpoints
Step 11.3 → AdminStatCard atom (reusable)
            + ConfirmDeleteModal atom (reusable)
Step 11.4 → AdminDashboardTab (Tab 1)
Step 11.5 → UserManagementTab (Tab 2)
Step 11.6 → DocumentManagementTab (Tab 3)
Step 11.7 → MaintenanceLogsTab (Tab 4)
Step 11.8 → AdminTabBar + /admin/page.tsx assembly
```

---

## 13. RBAC

- Route `/admin` → **ADMIN only** (middleware sudah handle)
- Tidak perlu logika RBAC tambahan di halaman

---

## 14. DEFINITION OF DONE

- [ ] 4 tab tampil dan bisa di-switch tanpa reload
- [ ] Tab Dashboard: 4 stat cards + health distribution + alert list + doc status + recent logs
- [ ] Stat cards menampilkan data REAL dari machineStore (bukan hardcode)
- [ ] Tab User: tabel + modal tambah/edit + detail + hapus
- [ ] Tab Dokumen: drag & drop + lifecycle status UPLOADING→PROCESSING→READY
- [ ] Tab Logs: tabel + search + 2 filter dropdown + pagination + modal CRUD
- [ ] Format Rupiah benar di kolom Biaya
- [ ] `ConfirmDeleteModal` dipakai di Tab User, Dokumen, dan Logs
- [ ] `npx tsc --noEmit` PASSED
- [ ] `npm run build` PASSED
