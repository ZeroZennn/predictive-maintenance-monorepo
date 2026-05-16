# Lapis AI — Real-Time Dashboard Design Brief

This document outlines the detailed design brief for the Real-Time Dashboard of the "Lapis AI" Industrial Predictive Maintenance application.

## 1. Overall Layout

Halaman terdiri dari 3 zona utama:

### Zone 1: Left Sidebar
- **Lebar**: `~200px` (fixed).
- **Bagian paling kiri (Navigation Bar)**: Sangat tipis (`~40px`).
  - Icon home (aktif, berwarna neon).
  - 3 icon placeholder (inactive, abu-abu).
  - Icon settings di paling bawah.
- **Area Utama Sidebar**:
  - **Filter**: Dropdown "Select Zone" di atas dengan value default "All Machine".
  - **Dropdown Options**: All Machine, Healthy, Warning, Critical.
  - **Machine Cards** (scrollable vertikal):
    - Setiap card memiliki gambar 3D robot/mesin di tengah.
    - **Label ID mesin**: e.g., "M-01" (bold).
    - **Sub-label tipe**: e.g., "Packing" (muted).
    - **Card aktif (M-01)**: Background hijau gelap dengan border neon green.
    - **Card inactive**: Background surface gelap, tidak ada border highlight.

### Zone 2: Top Bar
- **Lebar**: Full width minus sidebar.
- **Anomaly Timeline**: Bar horizontal tipis.
- **Timestamp Markers**: Dari kiri ke kanan (contoh: `10:00`, `10:05`, `10:10` ... `10:50`).
- **Highlighted Region**: Area semi-transparan berwarna hijau menandai periode anomali.
- **Dot Markers**: Titik kecil di atas timeline pada waktu tertentu.
- **Tooltip**: Label "Anomaly Timeline" muncul di tengah atas.

### Zone 3: Main Content Area
- **Lebar**: Sisa lebar layar.
- Terdiri dari 3 section vertikal:

#### Section A: RUL Banner
- Card full width dengan border.
- **Header Kiri**: Icon hijau kecil + teks `M-01 VITAL SIGNS` (font kecil, tracking lebar, uppercase).
- **Konten Utama Kiri**: Teks besar `ESTIMATED RUL : 362 DAYS`.
  - `ESTIMATED RUL :` berwarna putih, font sangat besar (display size).
  - `362 DAYS` berwarna neon green (`#5FDA0A`), font sama besar, bold.
- **Konten Kanan**: Circular gauge / donut chart.
  - Menampilkan angka `80%` di tengah (bold, besar).
  - Sub-label "Healthy" di bawah angka (kecil).
  - Arc berwarna neon green, 80% terisi.
  - Background arc berwarna dark border.

#### Section B: 8-Sensor Gauge Grid
- Layout: Grid 4 kolom x 2 baris dengan gap antar card.
- **Spesifikasi Gauge Card**:
  - **Background**: Lapis Card (`#162F31`).
  - **Border**: Lapis border tipis.
  - **Border Radius**: `rounded-xl`.
  - **Header**: Icon hijau kecil + nama sensor (uppercase, font kecil).
- **Gauge SVG Semi-circular (Speedometer)**:
  - **Background arc**: Dark (`#1E3D40`).
  - **Value arc**: Neon green untuk HEALTHY.
  - **Needle / Jarum**: Amber / orange (`#EF7513`), tipis dan runcing.
  - **Tick marks**: 5 buah, warna muted.
  - **Nilai di tengah**: Angka besar bold + satuan kecil di bawahnya.
- **Label Sensor**: Teks kecil, muted di bawah gauge.
- **Urutan 8 Gauge** (kiri ke kanan, atas ke bawah):
  - **Baris 1**: Temperature | Vibration | Pressure | RPM
  - **Baris 2**: Power Consumption | Noise Level | Humidity | Operating Hours

#### Section C: Maintenance KPIs Bar
- Card full width di paling bawah.
- **Header**: Dot hijau + `MAINTENANCE KPIs` (uppercase, tracking lebar).
- **Grid**: 3 kolom x 2 baris berisi 6 KPI item.
- **Struktur KPI Item**:
  - Icon circular (outline, warna muted) di kiri.
  - Label kecil di atas (muted text).
  - Nilai bold di bawah label.
- **6 KPI Items**:
  1. Confidence Score — nilai: `86%`
  2. Last Maintenance — nilai: `29 April 2025`
  3. Uptime Percentage — nilai: `90%`
  4. Issues per Week — nilai: `8` (icon warning amber)
  5. Remaining Operation Life — nilai: `30 Hours`
  6. Maintenance Costs — nilai: `$0`

## 2. Color Palette

| Penggunaan | Kode Hex |
|------------|----------|
| Background | `#081819` |
| Surface / Card | `#0F2A2C` / `#162F31` |
| Border | `#1E3D40` |
| Neon Green (Primary Accent) | `#5FDA0A` |
| Amber (Warning, Needle) | `#EF7513` |
| Red (Critical) | `#FF3B3B` |
| Text Primary | `#E2F0F1` |
| Text Muted | `#6B8F92` |

## 3. Typography

- **RUL Value**: Display / hero size, bold.
- **Sensor Values**: `18-20px`, bold.
- **Labels / Units**: `9-11px`, muted.
- **Section Headers**: `11-12px`, uppercase, letter-spacing wide.
- **Machine IDs**: `13-14px`, bold.

## 4. Interaction States

- **Machine Card Hover**: Subtle border highlight.
- **Machine Card Active**: `bg-lapis-neon-dim` + `border-lapis-neon` + `shadow-glow-neon`.
- **Gauge HEALTHY**: Arc neon green.
- **Gauge WARNING**: Arc amber + card border glow amber.
- **Gauge CRITICAL**: Arc red + `animate-pulse-critical` + card border glow red.
- **Sidebar Scrollable**: Aktif saat jumlah mesin melebihi area visual (visible area).

## 5. Komponen Yang Perlu Dibuat (Atomic Design)

### Atoms
- `SensorGaugeChart` ✅ (Sudah dibuat)
- `StatusBadge`
- `KPIItem`
- `MachineStatusDot`

### Molecules
- `SensorCard` (GaugeChart + header + border)
- `MachineCard` (Image + ID + status)
- `RULCircularGauge` (Donut chart health %)

### Organisms
- `SensorGrid` (8 SensorCards)
- `MachineListSidebar` (20 MachineCards + filter)
- `RULBanner` (Vital signs + circular gauge)
- `AnomalyTimeline` (Top bar)
- `MaintenanceKPIBar`

### Templates
- `DashboardLayout`
- `DashboardPage` (Assembly semua organisms)

## 6. File Structure Target

```text
src/components/dashboard/
├── atoms/
│   ├── SensorGaugeChart.tsx ✅
│   ├── StatusBadge.tsx
│   ├── KPIItem.tsx
│   └── MachineStatusDot.tsx
├── molecules/
│   ├── SensorCard.tsx
│   ├── MachineCard.tsx
│   └── RULCircularGauge.tsx
└── organisms/
    ├── SensorGrid.tsx
    ├── MachineListSidebar.tsx
    ├── RULBanner.tsx
    ├── AnomalyTimeline.tsx
    └── MaintenanceKPIBar.tsx
```

## 7. Notes

- **Live Data**: Semua data diambil live dari Zustand `machineStore`.
- **Update Frequency**: WebSocket update setiap `~1 detik`.
- **Performance**: Komponen gauge hanya re-render saat nilai sensor-nya berubah (surgical subscription).
- **Machine Sidebar**: Terdiri dari 20 Machine Cards (`M-01` s/d `M-20`).
- **Persistent Alert Bar**: Muncul di dalam atau di atas RUL Banner saat ada alert aktif.
