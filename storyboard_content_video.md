# 🎬 Video Storyboard: PRIME — Cegah Kerusakan Sebelum Terjadi

## Meta

| Property | Value |
|---|---|
| Durasi Total | ~90 detik (2700 frames) |
| Aspect Ratio | 16:9 |
| FPS | 30 |
| Resolusi | 1920 × 1080 |
| Total Scenes | 8 |
| Voiceover | Ya (Bahasa Indonesia) |
| Target File Size | ≤ 18 MB |
| Max Frame Budget | 3600 frames |
| Platform Target | YouTube, Web, Presentasi PBL |

---

## Brand & Style Guide

### Color Palette

> **Filosofi**: Background utama **clean putih** (#FFFFFF / #FAFAFA) agar konten tampak profesional dan ringan. Ornamen, elemen UI, aksen, dan badge mengikuti palette warna PRIME — biru-indigo yang mencerminkan teknologi industri, didukung warna status mesin (hijau/kuning/merah) dari sistem prediksi ML.

| Token | Hex | Penggunaan |
|:---|:---|:---|
| `background-primary` | `#FFFFFF` | Background utama semua scene |
| `background-secondary` | `#F8FAFC` | Card, panel, sidebar — sedikit off-white |
| `background-tertiary` | `#F1F5F9` | Surface tambahan, subtle section divider |
| `accent-primary` | `#4F46E5` | Elemen utama: border aktif, badge, CTA button, icon highlight |
| `accent-secondary` | `#6366F1` | Glow subtle, gradient overlay ornamen |
| `accent-light` | `#EEF2FF` | Background chip / badge ringan |
| `status-healthy` | `#22C55E` | Indikator mesin HEALTHY |
| `status-warning` | `#F59E0B` | Indikator mesin WARNING |
| `status-critical` | `#EF4444` | Indikator mesin CRITICAL |
| `text-primary` | `#0F172A` | Teks heading utama |
| `text-secondary` | `#475569` | Teks body, subtitle, caption |
| `text-muted` | `#94A3B8` | Label kecil, placeholder |
| `border-subtle` | `#E2E8F0` | Border card, divider halus |
| `border-accent` | `rgba(79,70,229,0.25)` | Border elemen yang di-highlight |
| `shadow-card` | `0 4px 24px rgba(79,70,229,0.08)` | Shadow default card |
| `shadow-hover` | `0 8px 40px rgba(79,70,229,0.15)` | Shadow card saat di-highlight |

### Typography

| Peran | Font | Weight | Ukuran Referensi |
|:---|:---|:---|:---|
| Heading Scene | **Inter** | 800 (ExtraBold) | 52–64px |
| Subheading | **Inter** | 700 (Bold) | 28–36px |
| Body / Caption | **Inter** | 400–500 | 18–22px |
| Data / Stats | **JetBrains Mono** | 600 | 20–28px |
| Label Kecil | **Inter** | 500 | 14–16px |

### Visual Style

- **Background**: Solid putih (#FFFFFF) dengan noise texture sangat halus (opacity 2–3%) untuk menghindari kesan terlalu flat
- **Ornamen Visual**: Subtle grid dot pattern (`#E2E8F0`, dot size 1px, spacing 32px) di beberapa scene sebagai background texture — bukan dominan, hanya sebagai kedalaman
- **Card Style**: Border `1px solid #E2E8F0`, border-radius `16px`, background `#FFFFFF`, shadow `0 4px 24px rgba(79,70,229,0.08)` — terasa **elevated tapi ringan**
- **Accent Shapes**: Blobs/lingkaran gradient indigo dengan opacity rendah (5–10%) di corner layar sebagai ornamen — tidak mendominasi background putih
- **Highlight Elements**: Elemen penting diberi border `2px solid rgba(79,70,229,0.25)` + shadow `0 8px 40px rgba(79,70,229,0.15)` saat di-spotlight

### Animasi Style

| Tipe | Konfigurasi |
|:---|:---|
| Entrance elemen utama | `spring({ damping: 15, stiffness: 180 })` — slide up + fade |
| Reveal logo/brand | `spring({ damping: 12, stiffness: 200 })` — scale 0.85→1 + fade |
| Teks stagger | Fade-up per kata, stagger 0.08s antar kata |
| Transisi antar scene | Crossfade 15 frames, slight Y-translate (20px → 0) |
| Angka/statistik | Counting animation (0 → nilai akhir, easing ease-out) |
| Card entrance | Slide-up 30px → 0 + fade, stagger 8 frame antar card |
| Pulse ornamen | Sinusoidal opacity (0.04 → 0.10 → 0.04) interval 120 frame |
| Icon bounce | `spring({ damping: 10, stiffness: 250 })` satu kali saat muncul |

---

## Scene Breakdown

---

### Scene 1: HOOK — Logo & Tagline Reveal
**Frame Range**: 0 – 299 | **Durasi**: 10 detik
**Tujuan**: Kesan pertama yang kuat — brand PRIME hadir dengan confidence, didukung preview dashboard sebagai proof of concept

#### Visual
- Background: `#FFFFFF` solid
- **Layer bawah (blurred)**: Cuplikan screenshot dashboard PRIME (gauge chart, sidebar machine, RUL banner) di-blur `blur(20px)` dengan opacity `0.12` — hanya sebagai kedalaman, tidak terbaca detail
- **Ornamen**: Dua blob lingkaran gradient `#4F46E5` → `#6366F1`, opacity `0.06`, radius ~600px — satu di top-left corner, satu di bottom-right corner. Keduanya pulse halus
- **Center**: Logo "PRIME" — bisa berupa teks besar dengan aksen icon sensor/gear kecil di samping nama, atau SVG logo resmi
- Di bawah nama: tagline satu baris
- Di bawah tagline: pill badge kecil `#EEF2FF` border `#4F46E5` berisi teks "Predictive Maintenance Platform"
- Layout: Dead center, simetris

#### Animasi
- **Frame 0–20**: Background + blob ornamen fade in dari opacity 0
- **Frame 20–80**: Logo "PRIME" scale dari `0.85 → 1.0` dengan `spring({ damping: 12, stiffness: 200 })` + fade in. Bersamaan, blur preview dashboard muncul perlahan
- **Frame 80–160**: Tagline fade-up kata per kata (stagger 5 frame per kata). Shadow card di belakang logo muncul subtle
- **Frame 160–240**: Badge pill slide-up + fade in
- **Frame 240–299**: Semua elemen tetap visible, blob ornamen pulse sekali lebih terang → transisi ke scene 2

#### Teks On-Screen
```
[logo/wordmark, center, 72px, Inter 800, text-primary #0F172A]
"PRIME"

[tagline, 28px, Inter 400, text-secondary #475569, letter-spacing 0.5px]
"Predictive Reliability & Intelligence Maintenance Engine"

[badge pill, 14px, Inter 500, #4F46E5, bg #EEF2FF, border-radius 999px]
"Predictive Maintenance Platform"
```

#### Voiceover Script
> "PRIME — Platform pemantauan mesin berbasis AI yang hadir untuk mengubah cara industri manufaktur merespons ancaman kerusakan."
> Estimasi durasi baca: 8 detik

#### Assets Needed
- [ ] Logo/Wordmark PRIME (SVG) — jika belum ada, bisa render teks "PRIME" dengan Inter 800 + ikon kecil (sensor/gear)
- [ ] Screenshot dashboard (untuk blur preview background) — `public/screenshots/dashboard-preview.png`
- [ ] Background music intro: clean ambient/electronic piano, fade in mulai frame 0

---

### Scene 2: PROBLEM STATEMENT — Masalah Industri
**Frame Range**: 300 – 750 | **Durasi**: 15 detik
**Tujuan**: Bangun empati dan urgensi — audiens harus merasakan betapa mahalnya *tidak* melakukan predictive maintenance

#### Visual
- Background: `#FFFFFF` dengan grid dot pattern subtle (`#E2E8F0`, opacity 40%)
- **Layout split vertikal**: Sisi kiri (55%) berisi stat cards bertumpuk, sisi kanan (45%) berisi problem statement teks
- **3 Stat Cards** (muncul bertahap dari bawah, satu per satu):
  - Card 1 — Ikon ⚡ (warning): "20–30%" + label "Penurunan Produktivitas Akibat Downtime Mendadak" (sumber: McKinsey)
  - Card 2 — Ikon 🔧 (wrench): "3–5×" + label "Biaya Perbaikan Reaktif vs Intervensi Dini"
  - Card 3 — Ikon 📋 (clipboard): "Isolated" + label "Sistem Prediktif yang Ada Tidak Terhubung ke SOP & Operasional"
- Setiap card: background `#FFFFFF`, border `1px solid #E2E8F0`, shadow card, border-radius `16px`. Angka utama dalam `JetBrains Mono 600`, `accent-primary #4F46E5`
- Sisi kanan: Teks narasi muncul bertahap dengan stagger per baris
- **Ornamen kecil**: Ikon mesin/factory silhouette di background kanan, opacity 3%, warna `#4F46E5`

#### Animasi
- **Frame 300–330**: Grid dot pattern fade in. Sisi kanan teks mulai muncul (headline pertama)
- **Frame 330–450**: Teks sisi kanan muncul baris per baris dengan stagger 15 frame. Bersamaan:
  - Frame 330–390: Card 1 slide-up dari bawah 40px + fade in
  - Frame 390–450: Card 2 slide-up + fade in (stagger dari Card 1)
  - Frame 450–510: Card 3 slide-up + fade in
- **Frame 510–650**: Semua card idle. Angka di Card 1 & 2 menggunakan counting animation (0 → nilai). Card border pulse subtle satu kali
- **Frame 650–750**: Elemen kanan fade out lebih dulu, lalu cards fade out → crossfade ke Scene 3

#### Teks On-Screen
```
[sisi kanan, heading, 38px, Inter 700, text-primary]
"Maintenance Reaktif
Masih Menjadi Masalah Nyata"

[sisi kanan, body, 20px, Inter 400, text-secondary, mt-16]
"Sebagian besar fasilitas manufaktur masih
mengandalkan perbaikan setelah kerusakan —"

[sisi kanan, body lanjutan, italic]
"tanpa mempertimbangkan kondisi aktual mesin."

[card 1, stat, 42px, JetBrains Mono 600, accent-primary]
"20–30%"
[card 1, label, 15px, Inter 400, text-secondary]
"Penurunan produktivitas akibat downtime mendadak"
[card 1, source, 12px, text-muted]
"Sumber: McKinsey Global Institute"

[card 2, stat, 42px, JetBrains Mono 600, accent-primary]
"3–5×"
[card 2, label, 15px]
"Biaya maintenance reaktif vs intervensi dini"

[card 3, stat, 32px, JetBrains Mono 600, #0F172A]
"Isolated"
[card 3, label, 15px]
"Model ML berjalan terpisah dari sistem operasional & SOP pabrik"
```

#### Voiceover Script
> "Era Industri 4.0 menghasilkan ribuan titik data per menit — namun sebagian besar fasilitas manufaktur masih mengandalkan pendekatan reaktif. Downtime mendadak menekan produktivitas 20 hingga 30 persen. Biaya perbaikan reaktif bisa 3 hingga 5 kali lebih mahal. Dan sistem prediktif yang ada? Berjalan terisolasi — tidak terhubung ke operasional nyata."
> Estimasi durasi baca: 14 detik

#### Assets Needed
- [ ] Ikon SVG: warning/lightning, wrench/tool, clipboard/document (style: line icon, warna `#4F46E5`)
- [ ] Ikon silhouette factory (background ornamen, SVG)

---

### Scene 3: SOLUTION REVEAL — Introducing PRIME
**Frame Range**: 750 – 1050 | **Durasi**: 10 detik
**Tujuan**: Pivot dari masalah ke solusi — reveal PRIME sebagai jawaban atas gap yang ada

#### Visual
- Background: `#FFFFFF`
- **Ornamen**: Radial gradient `#4F46E5` → transparent, radius besar (~800px), opacity `0.07`, muncul dari center — memberi kesan "cahaya solusi" tanpa merusak white background
- Center: Tiga "pilar solusi" disajikan dalam pill badge horizontal + deskripsi singkat masing-masing
- Di atas pill: Kalimat penghubung kecil `"PRIME mengintegrasikan tiga sistem dalam satu ekosistem:"`
- Di bawah pill: Nama "PRIME" muncul besar dengan letter-by-letter reveal
- Architecture diagram mini (simplified): Tiga box (ML Engine → Backend API → Frontend Dashboard) terhubung dengan garis tipis `#E2E8F0`, muncul satu per satu

#### Sub-visual — 3 Pilar Solusi (horizontal badge row):
```
[Pilar 1: bg #EEF2FF, border #4F46E5]
🤖 ML/DL Hybrid Prediction

[Pilar 2: bg #ECFDF5, border #22C55E]
💬 RAG AI Copilot

[Pilar 3: bg #FFFBEB, border #F59E0B]
📅 Smart Maintenance Scheduler
```

#### Animasi
- **Frame 750–780**: Radial glow muncul dari center perlahan
- **Frame 780–840**: Kalimat penghubung fade-up
- **Frame 840–900**: 3 pill badge muncul satu per satu (stagger 12 frame)
- **Frame 900–960**: Nama "PRIME" letter-by-letter reveal (stagger 4 frame per huruf), ukuran 64px, `Inter 800`
- **Frame 960–1020**: Architecture diagram mini slide-up + fade in. Garis koneksi di-animate (draw from left to right)
- **Frame 1020–1050**: Hold, pulse glow satu kali → transisi ke Scene 4

#### Teks On-Screen
```
[intro kecil, 18px, Inter 500, text-muted, center]
"PRIME mengintegrasikan tiga sistem dalam satu ekosistem:"

[3 pill badge, horizontal center, 16px, Inter 600]
"🤖  ML/DL Hybrid Prediction"
"💬  RAG AI Copilot"
"📅  Smart Maintenance Scheduler"

[nama produk, 64px, Inter 800, text-primary, letter-spacing 4px, center]
"P R I M E"

[arsitektur mini label, 13px, JetBrains Mono, text-muted]
"IoT Sensor  →  Backend API  →  ML Service  →  WebSocket  →  Dashboard"
```

#### Voiceover Script
> "PRIME hadir sebagai jawabannya. Sebuah platform yang mengintegrasikan prediksi kondisi mesin berbasis ML dan Deep Learning, asisten teknis RAG berbasis dokumen SOP, dan penjadwalan maintenance otomatis — dalam satu ekosistem yang terhubung."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] Tidak ada asset eksternal — pure code/SVG

---

### Scene 4: FEATURE DEMO A — Real-time Dashboard
**Frame Range**: 1050 – 1350 | **Durasi**: 10 detik
**Tujuan**: Showcase dashboard monitoring real-time — 8 sensor gauge, machine status cards, RUL banner, anomaly timeline

#### Visual
- Background: `#FAFAFA` (sedikit off-white untuk kontras dengan dashboard UI)
- **Layout**: Laptop mockup (MacBook-style, light bezel) di center-right (65% lebar), caption callout cards di sisi kiri
- Di dalam laptop: Screen recording dashboard PRIME
  - Tampilkan: machine card sidebar kiri (M-01 hingga M-20 dengan badge status HEALTHY/WARNING/CRITICAL), area sensor gauge 8 sensor, RUL banner merah/kuning, anomaly timeline bawah
  - Scroll perlahan dari atas ke area gauge, lalu zoom ke salah satu gauge yang berstatus WARNING
- **Callout cards** (sisi kiri, muncul berurutan saat area terkait di-scroll):
  - Callout 1: "📡 8 Sensor Real-time" + "Suhu, Vibrasi, Tekanan, RPM, dan lebih"
  - Callout 2: "⏱️ RUL Banner" + "Sisa umur mesin dalam satuan hari — update tiap tick"
  - Callout 3: "🔔 Smart Alert" + "Severity otomatis dari prediksi ML — tidak tumpang-tindih"
- Setiap callout: card putih, border `1px solid #E2E8F0`, shadow, border-left `4px solid #4F46E5`

#### Animasi
- **Frame 1050–1110**: Laptop mockup slide-up + fade in. Shadow indigo subtle muncul di bawah laptop
- **Frame 1110–1200**: Screen recording plays inside mockup. Callout 1 slide-in dari kiri
- **Frame 1200–1260**: Video scroll ke area gauge. Callout 1 fade out, Callout 2 slide-in
- **Frame 1260–1320**: Video menampilkan WARNING gauge. Callout 2 fade out, Callout 3 slide-in
- **Frame 1320–1350**: Hold. Callout 3 fade out. Laptop mockup scale sedikit (1.0 → 0.97) + crossfade ke Scene 5

#### Teknis Implementation
```tsx
import { OffthreadVideo, staticFile } from "remotion";

// Screen recording di dalam laptop frame
<LaptopMockupLight>
  <OffthreadVideo
    src={staticFile("recordings/dashboard-realtime.mp4")}
    startFrom={0}
    endAt={300}
    volume={0}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</LaptopMockupLight>
```

**Cara rekam**: Login sebagai TECHNICIAN → buka `/dashboard` → tunggu WebSocket terhubung (simulator running) → rekam layar 10–15 detik: scroll dari machine card sidebar → lihat gauge area → perhatikan badge WARNING/CRITICAL. Resolusi: 1280×800, format MP4.

#### Teks On-Screen
```
[section label, 14px, Inter 600, #4F46E5, uppercase, letter-spacing 2px, kiri atas]
"FITUR 01"

[heading kiri, 32px, Inter 700, text-primary]
"Real-time Dashboard"

[callout 1, 16px, Inter 500, text-primary]
"📡 8 Sensor Real-time"
[callout 1 sub, 14px, text-secondary]
"Suhu, Vibrasi, Tekanan, RPM, dan lebih"

[callout 2, 16px]
"⏱️ RUL Banner"
[callout 2 sub, 14px, text-secondary]
"Sisa umur mesin dalam satuan hari — update tiap tick"

[callout 3, 16px]
"🔔 Smart Alert System"
[callout 3 sub, 14px, text-secondary]
"Severity otomatis dari ML — tidak pernah tumpang-tindih"
```

#### Voiceover Script
> "Dashboard PRIME menampilkan data delapan sensor secara real-time via WebSocket — suhu, vibrasi, tekanan, RPM, dan lebih. Setiap mesin punya status kesehatan langsung dari model machine learning, disertai banner Remaining Useful Life yang diperbarui tiap detik."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] **Screen recording: Dashboard real-time** (~15 detik, 1280×800, MP4) — login sebagai TECHNICIAN, simulator aktif
- [ ] SVG: laptop mockup light theme frame (bezel abu-abu terang, bukan hitam)

---

### Scene 5: FEATURE DEMO B — AI Copilot RAG
**Frame Range**: 1350 – 1650 | **Durasi**: 10 detik
**Tujuan**: Tunjukkan AI Copilot yang bisa menjawab pertanyaan teknis berbasis dokumen SOP dengan citation + rekomendasi aksi

#### Visual
- Background: `#FFFFFF`
- **Layout**: Chat interface mockup di center — bukan full laptop, melainkan floating chat panel (rounded card besar, 800×560px) di atas background putih
- Chat panel menampilkan:
  - Header: "💬 AI Copilot — PRIME" + badge "RAG Powered" (warna `#EEF2FF`)
  - Bubble pertanyaan user: `"Apa saja anomali yang terjadi pada M-06 bulan ini?"` (bubble kanan, bg `#4F46E5`, teks putih)
  - Bubble jawaban AI (bubble kiri, bg `#F8FAFC`, border subtle):
    - Section "## ANALISIS" dengan teks ringkas
    - Section "## REKOMENDASI" dengan bullet action items
  - Di bawah jawaban: **Citation chips** (3 chip horizontal) — setiap chip berisi nama dokumen PDF sumber (`Laporan_M-06_November_2025.pdf`) dengan ikon dokumen `#4F46E5`
- **Di luar panel kanan**: Floating info badge — "[TBC] Chunks Indexed — konfirmasi dengan Role B (Aqsa)" + "gpt-4o-mini" + "Hybrid Retrieval (Dense + BM25)"
- **Ornamen**: Subtle grid dot background (sangat ringan)

#### Animasi
- **Frame 1350–1400**: Chat panel slide-up + fade in
- **Frame 1400–1460**: Bubble pertanyaan user muncul dengan pop effect (scale 0.8 → 1.0)
- **Frame 1460–1540**: Bubble AI muncul dengan "typing" indicator (3 dot pulse, 0.5 detik) → kemudian jawaban muncul baris per baris (stagger 4 frame per baris)
- **Frame 1540–1590**: Citation chips muncul satu per satu slide-in dari kiri (stagger 8 frame)
- **Frame 1590–1620**: Floating info badge muncul dari kanan (slide-in). Hover glow pada citation chip pertama
- **Frame 1620–1650**: Hold → crossfade ke Scene 6

#### Teks On-Screen
```
[panel header, 17px, Inter 600, text-primary]
"💬 AI Copilot — PRIME"
[panel badge, 12px, #4F46E5, bg #EEF2FF]
"RAG Powered"

[user bubble, 16px, Inter 400, white]
"Apa saja anomali yang terjadi pada M-06 bulan ini?"

[AI bubble, 16px, Inter 400, text-primary]
"## ANALISIS
Mesin M-06 menunjukkan eskalasi status
HEALTHY → WARNING pada T-47 jam sebelum kritis...

## REKOMENDASI
• [PREVENTIF] Lakukan inspeksi bearing segera
• [MONITOR] Pantau vibrasi setiap 2 jam"

[citation chips, 13px, JetBrains Mono, #4F46E5]
"📄 Laporan_M-06_November_2025.pdf"
"📄 SOP_Inspeksi_Bearing.pdf"
"📄 Manual_Mesin_Rotary.pdf"

[floating badge kanan, 13px, JetBrains Mono, text-secondary]
"[TBC] Chunks Indexed — konfirmasi dengan Role B (Aqsa)"
"Model: gpt-4o-mini"
"Retrieval: Dense + BM25 + RRF"
```

#### Voiceover Script
> "AI Copilot PRIME menggunakan Retrieval-Augmented Generation untuk menjawab pertanyaan teknis secara akurat. Setiap jawaban dilengkapi sumber dokumen yang bisa dilacak — laporan maintenance, SOP pabrik, manual mesin. Bukan sekadar chatbot — melainkan asisten berpengetahuan berbasis data nyata pabrik Anda."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] Tidak perlu screen recording — pure animated chat mockup via Remotion component

---

### Scene 6: FEATURE DEMO C — Maintenance Scheduler
**Frame Range**: 1650 – 1950 | **Durasi**: 10 detik
**Tujuan**: Tunjukkan Maintenance Scheduler yang auto-generate task dari prediksi kritis, tampil real-time via WebSocket

#### Visual
- Background: `#FAFAFA`
- **Layout**: Scheduler panel mockup (card besar, mirip task board / calendar view) di center
- Panel menampilkan:
  - Header: "📅 Maintenance Scheduler" + badge "Auto-generated from ML Prediction" (`#FFFBEB` bg, `#F59E0B` text)
  - **Daftar task cards** (3–4 task) masing-masing berisi:
    - Badge mesin: "M-06", "M-12", "M-18"
    - Badge severity: CRITICAL (merah), WARNING (kuning)
    - Judul task: "Inspeksi Bearing Segera", "Penggantian Filter Oli"
    - RUL info: "RUL: 1.59 hari" dalam `JetBrains Mono`
    - Assignee chip + tanggal
  - **Live badge** di pojok kanan atas panel: titik hijau berkedip + teks "Live — via WebSocket"
- Satu task card baru **muncul tiba-tiba** di posisi pertama (dengan animasi slide-down + flash) untuk mendemonstrasikan real-time auto-generate
- **Ornamen**: Garis horizontal tipis `#E2E8F0` sebagai row divider; ikon kalender kecil di background kanan panel, opacity 3%

#### Animasi
- **Frame 1650–1710**: Scheduler panel slide-up + fade in
- **Frame 1710–1800**: 3 task card existing muncul stagger (slide-right + fade, 10 frame gap)
- **Frame 1800–1860**: Flash subtle di atas panel → task card baru (M-18, CRITICAL) slide-down dari atas ke posisi pertama. Border flash indigo satu kali. Badge "CRITICAL" pulse merah satu kali
- **Frame 1860–1920**: Live badge di pojok titik berkedip aktif (opacity 1.0 → 0.3 → 1.0, cycle 30 frame)
- **Frame 1920–1950**: Hold → crossfade ke Scene 7

#### Teknis Implementation
```tsx
// Animasi task baru muncul (frame 1800)
const newTaskOpacity = interpolate(frame, [1800, 1820], [0, 1]);
const newTaskY = interpolate(frame, [1800, 1830], [-40, 0], {
  easing: Easing.out(Easing.back(1.5))
});

// Live dot pulse
const dotOpacity = Math.sin((frame / 15) * Math.PI) * 0.35 + 0.65;
```

#### Teks On-Screen
```
[panel header, 18px, Inter 600, text-primary]
"📅 Maintenance Scheduler"
[auto badge, 12px, #92400E, bg #FFFBEB, border #F59E0B]
"Auto-generated from ML Prediction"

[live badge, 13px, Inter 500, #22C55E]
"● Live — via WebSocket"

[task card baru (flash), 16px, Inter 600, text-primary]
"[CRITICAL] Inspeksi Bearing — Mesin M-18"
[task rul, 14px, JetBrains Mono, #EF4444]
"RUL: 1.59 hari"

[task card 2, 16px]
"[CRITICAL] Periksa Sistem Pendingin — M-06"
[task 2 rul, JetBrains Mono, #EF4444]
"RUL: 2.31 hari"

[task card 3, 16px]
"[WARNING] Penggantian Filter Oli — M-12"
[task 3 rul, JetBrains Mono, #F59E0B]
"RUL: 7.14 hari"
```

#### Voiceover Script
> "Saat model mendeteksi status kritis, sistem langsung membuat jadwal maintenance secara otomatis — tampil real-time di Triage Center Scheduler via WebSocket. Teknisi tidak perlu menunggu laporan manual. Setiap detik prediksi kritis langsung berubah menjadi tugas aksi."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] Tidak perlu screen recording — pure animated task board mockup via Remotion

---

### Scene 7: KEY HIGHLIGHTS — Tech Stack & Architecture
**Frame Range**: 1950 – 2250 | **Durasi**: 10 detik
**Tujuan**: Tunjukkan kredibilitas teknis — stack teknologi yang digunakan, performance model, dan arsitektur sistem

#### Visual
- Background: `#FFFFFF` dengan grid dot pattern subtle
- **Layout tiga kolom** (masing-masing berisi tech badge group):
  - **Kolom 1 — ML Engine**: Badge: Python 3.10, XGBoost V2, TensorFlow 2.15 (LSTM), FastAPI
  - **Kolom 2 — Backend**: Badge: Node.js v24, Express v5, Socket.IO v4, TimescaleDB, Redis
  - **Kolom 3 — Frontend**: Badge: Next.js 15, TypeScript, Zustand, Recharts
- Di atas 3 kolom: Row dua **performance stat card**:
  - Stat 1: "Klasifikasi 3-Kelas" + `HEALTHY · WARNING · CRITICAL` + "Threshold: 0.60"
  - Stat 2: "RUL Error ≤ 0.05 hari" + "Saat status CRITICAL (verified)"
- **Arsitektur flow**: Di bawah badge, mini flow horizontal: `IoT Sensor → Backend API → ML Service → WebSocket → Dashboard` — setiap node sebagai pill kecil `#EEF2FF`, terhubung garis `#E2E8F0`
- Setiap tech badge: `14px Inter 600`, bg `#F8FAFC`, border `1px solid #E2E8F0`, rounded, padding 6px 12px

#### Animasi
- **Frame 1950–1990**: Grid background fade in
- **Frame 1990–2050**: 2 stat card performance slide-up + fade in
- **Frame 2050–2150**: Tiga kolom tech badge muncul stagger per kolom (20 frame gap). Setiap badge dalam satu kolom muncul stagger 5 frame
- **Frame 2150–2200**: Architecture flow muncul — node muncul satu per satu dari kiri (8 frame gap), garis draw-in setelah masing-masing node
- **Frame 2200–2250**: Hold semua elemen. Stat card 2 mendapat highlight border pulse satu kali → crossfade ke Scene 8

#### Teks On-Screen
```
[section label, 14px, uppercase, #4F46E5, letter-spacing 2px, top center]
"TECH STACK & PERFORMANCE"

[stat card 1, heading, 20px, Inter 700, text-primary]
"Health Status Classifier"
[stat card 1, body, 16px, JetBrains Mono, text-secondary]
"HEALTHY  ·  WARNING  ·  CRITICAL"
[stat card 1, caption, 14px, Inter 500, #4F46E5]
"F1 Macro: 0.99  ·  Threshold WARNING: 0.60"

[stat card 2, heading, 20px, Inter 700]
"RUL Predictor (LSTM)"
[stat card 2, body, 16px, JetBrains Mono, #22C55E]
"MAE: 0.80 hari  ·  Error ≤ 1 hari: 98%"
[stat card 2, caption, 14px]
"Hanya aktif saat WARNING / CRITICAL (LSTM V2)"

[kolom 1 header, 13px, Inter 600, text-muted, uppercase]
"ML Engine"
[badge list]
"Python 3.10"  "XGBoost V2"  "TensorFlow 2.15"  "FastAPI"

[kolom 2 header] "Backend"
[badge list]
"Node.js v24"  "Socket.IO v4"  "TimescaleDB"  "Redis 7"

[kolom 3 header] "Frontend"
[badge list]
"Next.js 15"  "TypeScript"  "Zustand"  "Recharts"

[architecture flow, 13px, JetBrains Mono, text-muted]
"IoT Sensor → Backend API → ML Service → WebSocket → Dashboard"
```

#### Voiceover Script
> "Di baliknya, PRIME berjalan di atas stack teknologi yang solid: XGBoost dan LSTM untuk prediksi, Node.js dan Socket.IO untuk komunikasi real-time, TimescaleDB untuk data time-series sensor, dan Next.js untuk visualisasi dashboard. Cascaded prediction mengoptimalkan latensi — classifier berjalan dulu, RUL predictor hanya aktif saat dibutuhkan."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] Tidak ada asset eksternal — pure code/SVG tech badges

---

### Scene 8: CALL TO ACTION — Closing
**Frame Range**: 2250 – 2700 | **Durasi**: 15 detik
**Tujuan**: Penutup yang bersih dan memorable — brand recall kuat, credit pengembangan, ajakan aksi

#### Visual
- Background: `#FFFFFF` dengan ornamen blob indigo sangat halus di dua corner (same seperti Scene 1, tapi lebih subtle — opacity `0.04`)
- **Bagian pertama (frame 2250–2500)**:
  - Center: Logo "PRIME" ukuran besar
  - Di bawah: Tagline CTA dalam teks bold
  - Di bawah tagline: Tiga icon + label horizontal (tiga pilar nilai):
    - 🤖 "Prediksi ML Hibrida" | 💬 "AI Copilot RAG" | 📅 "Auto Scheduler"
- **Bagian kedua (frame 2500–2700)** — crossfade/dissolve:
  - Teks tagline berubah menjadi credit section
  - Credit: nama pengembang, konteks PBL, tahun
  - Di bawah credit: GitHub repository atau versi aplikasi (opsional)
  - Ambient particles sangat ringan (titik-titik `#4F46E5`, opacity 0.15, float ke atas perlahan)

#### Animasi
- **Frame 2250–2310**: Logo fade in + scale (0.92 → 1.0) dengan spring gentle
- **Frame 2310–2390**: Tagline CTA muncul kata per kata (stagger 6 frame). Font bold, ukuran besar
- **Frame 2390–2450**: Tiga ikon + label muncul stagger dari kiri ke kanan (12 frame gap). Ornamen blob pulse sangat halus
- **Frame 2450–2500**: Hold pada logo reveal — ambient particles mulai muncul
- **Frame 2500–2530**: Crossfade: tagline CTA fade out bersamaan credit fade in (overlay di posisi sama)
- **Frame 2530–2650**: Credit text idle. Particles drift upward (translateY 0 → -80px selama 120 frame, loop)
- **Frame 2650–2700**: Semua elemen fade out perlahan. Background tetap putih bersih di frame terakhir (jangan fade to black)

#### Teks On-Screen
```
[logo/wordmark, 64px, Inter 800, #0F172A, letter-spacing 4px, center]
"PRIME"

[CTA tagline, 36px, Inter 700, text-primary, center, mt-24]
"Cegah Kerusakan Sebelum Terjadi."

[3 value icon row, 16px, Inter 500, text-secondary, center, mt-32]
"🤖 Prediksi ML Hibrida   |   💬 AI Copilot RAG   |   📅 Auto Scheduler"

--- [crossfade di frame 2500] ---

[logo tetap visible]
"PRIME"

[credit heading, 20px, Inter 600, text-secondary, center]
"Developed by"

[credit nama, 28px, Inter 700, text-primary, center]
"Achmad Zikran Maulida"

[credit sub, 16px, Inter 400, text-muted, center, mt-8]
"Predictive Maintenance — Project Based Learning 2025/2026"

[credit tim, 14px, Inter 400, text-muted, center, mt-4]
"[TBC] Tambahkan nama anggota tim lengkap: Aqsa · Reynaldi · Amir"

[credit repo, 13px, JetBrains Mono, #4F46E5, center, mt-12, opsional]
"github.com/ZeroZennn/predictive-maintenance-monorepo"
```

#### Voiceover Script
> "PRIME. Cegah kerusakan sebelum terjadi."
> *(pause 2 detik)*
> "Dikembangkan dalam kerangka Project Based Learning — membuktikan bahwa teknologi AI prediktif kini dapat dihadirkan langsung di lantai produksi industri."
> Estimasi durasi baca: 10 detik (sisa 5 detik untuk credit dan musik fade-out)

#### Assets Needed
- [ ] Logo/Wordmark PRIME (SVG, sama seperti Scene 1)
- [ ] Info credit lengkap (konfirmasi nama universitas, prodi, tahun ajaran, nama tim jika ada)
- [ ] Background music fade-out: mulai di frame 2600, turun ke volume 0 di frame 2700

---

## Timeline Overview

| # | Scene | Durasi | Frame Range | Voiceover Summary |
|---|-------|--------|-------------|-------------------|
| 1 | Hook — Logo & Tagline Reveal | 10s | 0–299 | Perkenalan PRIME secara brand |
| 2 | Problem Statement | 15s | 300–750 | Statistik downtime & biaya reaktif |
| 3 | Solution Reveal — PRIME | 10s | 750–1050 | Tiga pilar solusi PRIME |
| 4 | Feature Demo A — Dashboard | 10s | 1050–1350 | Real-time gauge, RUL, alert |
| 5 | Feature Demo B — AI Copilot | 10s | 1350–1650 | RAG chat dengan citation |
| 6 | Feature Demo C — Scheduler | 10s | 1650–1950 | Auto-generate task dari prediksi |
| 7 | Key Highlights — Tech Stack | 10s | 1950–2250 | Stack teknologi & model performance |
| 8 | Call to Action & Credit | 15s | 2250–2700 | CTA + credit pengembang |
| | **TOTAL** | **90s** | **2700 frames** | |

---

## Remotion Implementation Notes

### Struktur Komponen yang Direkomendasikan

```
src/
├── Root.tsx                          # Composition setup
├── PrimeVideo.tsx                    # Main video component (sequences all scenes)
├── scenes/
│   ├── Scene01Hook.tsx               # Hook — Logo PRIME + tagline
│   ├── Scene02Problem.tsx            # Problem statement + stat cards
│   ├── Scene03SolutionReveal.tsx     # 3 pilar PRIME reveal
│   ├── Scene04DashboardDemo.tsx      # Real-time dashboard showcase
│   ├── Scene05CopilotDemo.tsx        # AI Copilot RAG chat mockup
│   ├── Scene06SchedulerDemo.tsx      # Maintenance scheduler auto-generate
│   ├── Scene07TechStack.tsx          # Tech stack + model performance
│   └── Scene08CTA.tsx               # CTA + credit penutup
├── components/
│   ├── AnimatedText.tsx              # Reusable fade-up text (word stagger)
│   ├── StatCard.tsx                  # Card stat dengan counting animation
│   ├── TechBadge.tsx                 # Badge teknologi (pill style)
│   ├── CalloutCard.tsx               # Floating callout sisi kiri/kanan
│   ├── LaptopMockupLight.tsx         # Laptop frame light theme + video container
│   ├── ChatPanel.tsx                 # Chat UI mockup (AI Copilot scene)
│   ├── SchedulerPanel.tsx            # Task board mockup (Scheduler scene)
│   ├── ArchitectureFlow.tsx          # Mini flow diagram antar node
│   ├── BlobOrnament.tsx              # Radial blob gradient (ornamen BG)
│   ├── DotGridBackground.tsx         # Subtle dot grid background texture
│   ├── AmbientParticles.tsx          # Titik-titik float ambient (Scene 8)
│   ├── PillBadge.tsx                 # Reusable pill/chip badge
│   ├── CitationChip.tsx              # Citation dokumen chip (AI Copilot)
│   ├── LiveDotBadge.tsx              # Titik hijau berkedip + label "Live"
│   └── CountingNumber.tsx            # Angka counting animation
├── styles/
│   └── theme.ts                      # Design tokens — wajib gunakan ini
scripts/
│   └── record-screens.ts            # Playwright headless recorder (dashboard)
public/
├── recordings/
│   └── dashboard-realtime.mp4       # Screen recording dashboard (hanya Scene 4)
├── screenshots/
│   └── dashboard-preview.png        # Blur preview untuk Scene 1 background
└── assets/
    ├── logo-prime.svg               # Logo/wordmark PRIME
    └── icons/
        ├── warning.svg
        ├── wrench.svg
        ├── clipboard.svg
        └── factory-silhouette.svg
```

### Design Tokens (theme.ts) — WAJIB

```ts
// src/styles/theme.ts

export const COLORS = {
  // Background
  bgPrimary:         "#FFFFFF",
  bgSecondary:       "#F8FAFC",
  bgTertiary:        "#F1F5F9",

  // Accent
  accentPrimary:     "#4F46E5",
  accentSecondary:   "#6366F1",
  accentLight:       "#EEF2FF",

  // Status
  statusHealthy:     "#22C55E",
  statusWarning:     "#F59E0B",
  statusCritical:    "#EF4444",

  // Text
  textPrimary:       "#0F172A",
  textSecondary:     "#475569",
  textMuted:         "#94A3B8",

  // Border
  borderSubtle:      "#E2E8F0",
  borderAccent:      "rgba(79, 70, 229, 0.25)",

  // Shadow
  shadowCard:        "0 4px 24px rgba(79, 70, 229, 0.08)",
  shadowHover:       "0 8px 40px rgba(79, 70, 229, 0.15)",
} as const;

export const FONTS = {
  heading:  "Inter",
  body:     "Inter",
  mono:     "JetBrains Mono",
} as const;

export const SPRING = {
  enter:   { damping: 15, stiffness: 180 },
  bounce:  { damping: 12, stiffness: 200 },
  gentle:  { damping: 20, stiffness: 120 },
  snappy:  { damping: 18, stiffness: 250 },
} as const;

export const EASING = {
  fadeUp: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
} as const;
```

### Konfigurasi Remotion Root

```tsx
// Root.tsx
import { Composition } from "remotion";
import { PrimeVideo } from "./PrimeVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PrimeVideo"
      component={PrimeVideo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Main Video Component (PrimeVideo.tsx)

```tsx
// PrimeVideo.tsx
import { AbsoluteFill, Series } from "remotion";
import { Scene01Hook } from "./scenes/Scene01Hook";
import { Scene02Problem } from "./scenes/Scene02Problem";
import { Scene03SolutionReveal } from "./scenes/Scene03SolutionReveal";
import { Scene04DashboardDemo } from "./scenes/Scene04DashboardDemo";
import { Scene05CopilotDemo } from "./scenes/Scene05CopilotDemo";
import { Scene06SchedulerDemo } from "./scenes/Scene06SchedulerDemo";
import { Scene07TechStack } from "./scenes/Scene07TechStack";
import { Scene08CTA } from "./scenes/Scene08CTA";

export const PrimeVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FFFFFF" }}>
      <Series>
        <Series.Sequence durationInFrames={300}>
          <Scene01Hook />
        </Series.Sequence>
        <Series.Sequence durationInFrames={450}>
          <Scene02Problem />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene03SolutionReveal />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene04DashboardDemo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene05CopilotDemo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene06SchedulerDemo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Scene07TechStack />
        </Series.Sequence>
        <Series.Sequence durationInFrames={450}>
          <Scene08CTA />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
```

### Catatan Teknis

- **Library yang direkomendasikan**:
  - `@remotion/transitions` — untuk crossfade antar scene via `<TransitionSeries>`
  - `@remotion/google-fonts` — untuk Inter dan JetBrains Mono
  - `@remotion/paths` — untuk animate garis SVG pada architecture flow diagram
  - `@remotion/motion-blur` — opsional, untuk elemen dengan gerakan cepat

- **Font loading**:
  ```ts
  import { loadFont } from "@remotion/google-fonts/Inter";
  import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
  loadFont();
  loadMono();
  ```

- **Screen recording hanya dibutuhkan di Scene 4** (Dashboard real-time). Scene 5 (Copilot) dan Scene 6 (Scheduler) menggunakan animated mockup murni — tidak perlu screen recording, lebih konsisten dan controllable.

- **Warna background**: Semua scene menggunakan `#FFFFFF` sebagai base. Jangan gunakan `opacity` pada background `AbsoluteFill` — gunakan warna solid penuh agar tidak ada transparansi yang tidak disengaja.

- **Transisi default antar scene**: Gunakan `<TransitionSeries>` dengan `fade()` transition, durasi 15 frame. Untuk Scene 7 → 8, pertimbangkan `slide()` dengan arah dari bawah.

- **Ukuran file**: Render ke format H.264 MP4 dengan CRF 23 dan resolusi 1920×1080 untuk menjaga ukuran ≤18 MB pada durasi 90 detik.

### Automated Screen Recording (Scene 4 Only)

```ts
// scripts/record-screens.ts
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3001";

async function recordDashboard() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "./public/recordings", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  // Set auth bypass (dev mode: SKIP_AUTH=true)
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000); // tunggu WebSocket connect

  // Scroll dari machine card sidebar → area gauge → tampilkan WARNING badge
  await page.waitForTimeout(1000);

  // Scroll ke gauge area
  await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
  await page.waitForTimeout(3000);

  // Scroll kembali ke machine card dengan status WARNING
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  await context.close(); // saves video
  await browser.close();
}

(async () => {
  await recordDashboard();
  console.log("✅ Recording saved to public/recordings/");
})();
```

```bash
# Setup dan jalankan
npm install playwright
npx playwright install chromium

# Pastikan frontend berjalan di localhost:3001 dengan simulator aktif
npx tsx scripts/record-screens.ts

# Render video
npx remotion render PrimeVideo out/prime-video.mp4 --codec=h264 --crf=23
```

> **Catatan untuk implementor**: Login dev menggunakan `NEXT_PUBLIC_SKIP_AUTH=true` — tidak perlu autentikasi manual. Pastikan simulator sedang berjalan (`POST /api/simulator/start`) agar data sensor real-time terlihat di dashboard. Rekam saat ada minimal satu mesin berstatus WARNING atau CRITICAL agar visual lebih dramatis.

---

## Assets Checklist

### Wajib Dibuat / Disiapkan

- [ ] **Logo/Wordmark "PRIME"** (SVG, versi hitam `#0F172A` untuk light background) — Scene 1 & 8
- [ ] **Screen recording dashboard** (~15 detik, 1280×800, MP4) — Scene 4 saja
- [ ] **Screenshot dashboard** (1280×800 PNG) untuk blur preview Scene 1

### Bisa Di-generate via Remotion (Tidak Perlu Asset Eksternal)

- [ ] Animated stat cards (Scene 2) — pure Remotion component
- [ ] Chat panel AI Copilot (Scene 5) — pure Remotion component
- [ ] Scheduler task board (Scene 6) — pure Remotion component
- [ ] Architecture flow diagram (Scene 7) — SVG inline
- [ ] Dot grid background texture — generated via canvas/SVG pattern
- [ ] Blob ornamen — generated via CSS/SVG radial gradient

### Opsional

- [ ] Ikon SVG: warning, wrench, clipboard, factory-silhouette (line icon style, warna `#4F46E5`)
- [ ] Background music: ambient clean electronic, ~90 detik, fade in Scene 1 / fade out Scene 8
- [ ] Voiceover rekaman (atau TTS draft dulu)
- [ ] Info credit lengkap: nama universitas, prodi, tahun ajaran

---

## 📸 Panduan Screenshot & Screen Recording

> Bagian ini merinci **tampilan apa saja yang perlu di-screenshot atau direkam** dari aplikasi PRIME yang berjalan, beserta kondisi ideal saat pengambilan, URL halaman, dan peruntukannya di video.

### Prasyarat Sebelum Ambil Screenshot

1. **Jalankan semua service** (sesuai README):
   ```bash
   # Terminal 1 — Infrastructure
   docker compose up postgres timescaledb redis ml-service -d

   # Terminal 2 — Backend
   cd backend && npm run dev

   # Terminal 3 — Frontend
   cd frontend && npm run dev
   # Buka: http://localhost:3001
   ```

2. **Jalankan Simulator** agar data real-time mengalir:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@lapis-ai.com","password":"Admin@Lapis123"}' \
     | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

   curl -X POST http://localhost:3000/api/simulator/start \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"start_date":"2025-07-23T18:00:00","tick_interval_seconds":2}'
   ```

3. **Kondisi ideal**: Tunggu hingga ada mesin berstatus **WARNING** dan **CRITICAL** (biasanya setelah 1–2 menit simulator berjalan). Ini membuat screenshot lebih dramatis dan informatif.

4. **Resolusi browser**: Set zoom browser ke **100%**. Untuk screenshot full-page, gunakan DevTools → `Ctrl+Shift+P` → "Capture full size screenshot".

---

### 🖼️ Daftar Screenshot yang Dibutuhkan

---

#### SS-01 — Dashboard Full Overview (WAJIB — Scene 1 & 4)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` |
| **Digunakan di** | Scene 1 (blur background), Scene 4 (laptop mockup) |
| **Format** | PNG + MP4 screen recording |
| **Resolusi** | 1920×1080 (full browser) atau 1280×800 (untuk mockup) |
| **Filename** | `dashboard-overview-full.png` |

**Yang harus terlihat:**
- ✅ Machine List Sidebar kiri — tampilkan minimal 5–8 mesin dengan status **bervariasi** (ada HEALTHY hijau, WARNING kuning, CRITICAL merah)
- ✅ Area sensor gauge 8 sensor di tengah/kanan — idealnya salah satu mesin dalam kondisi WARNING/CRITICAL sehingga gauge warnanya oranye/merah
- ✅ RUL Banner/VitalSign Banner di atas — tampilkan saat RUL pendek (< 5 hari) agar banner merah terlihat
- ✅ Header navbar + timestamp update terakhir
- ✅ **Jangan ada loading spinner** — tunggu sampai semua data terpasang

**Cara ambil:**
```
1. Buka http://localhost:3001/dashboard
2. Klik mesin yang berstatus WARNING atau CRITICAL di sidebar
3. Tunggu gauge sensor terupdate (2–3 detik)
4. Screenshot dengan F12 → DevTools → Ctrl+Shift+P → "Capture screenshot"
```

---

#### SS-02 — Machine Card Sidebar (WAJIB — Scene 4 callout)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` |
| **Digunakan di** | Scene 4 — highlight sidebar machine list |
| **Format** | PNG (crop area sidebar saja) |
| **Resolusi** | ~320×800px (lebar sidebar) |
| **Filename** | `sidebar-machine-list.png` |

**Yang harus terlihat:**
- ✅ Minimal 6 MachineCard terlihat dalam frame
- ✅ Ada variasi status: HEALTHY (hijau), WARNING (kuning), CRITICAL (merah) — idealnya minimal 1 CRITICAL dan 2 WARNING
- ✅ Badge status terbaca jelas
- ✅ Nama mesin (M-01, M-02, dst.) terlihat

**Cara ambil:**
```
Crop screenshot SS-01 di bagian sidebar kiri saja,
atau gunakan DevTools → pilih element MachineListSidebar → klik kanan → "Screenshot node"
```

---

#### SS-03 — Sensor Gauge Cluster (WAJIB — Scene 4 callout)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` (mesin berstatus WARNING/CRITICAL aktif) |
| **Digunakan di** | Scene 4 — showcase 8 sensor gauge real-time |
| **Format** | PNG |
| **Resolusi** | ~900×600px (area gauge saja) |
| **Filename** | `sensor-gauges-warning.png` |

**Yang harus terlihat:**
- ✅ 8 gauge sensor aktif: suhu, vibrasi, tekanan, RPM, kelembaban, dll
- ✅ Setidaknya 1–2 gauge dalam zona WARNING (warna kuning/oranye) atau CRITICAL (merah)
- ✅ Angka sensor terbaca jelas di tengah gauge
- ✅ Label sensor di bawah setiap gauge
- ✅ **Tidak ada loading state** — semua gauge terisi data

---

#### SS-04 — RUL / VitalSign Banner (SANGAT DISARANKAN — Scene 4)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` (mesin CRITICAL aktif) |
| **Digunakan di** | Scene 4 — callout "RUL Banner" |
| **Format** | PNG (crop area banner saja) |
| **Resolusi** | ~1200×120px (horizontal banner) |
| **Filename** | `rul-banner-critical.png` |

**Yang harus terlihat:**
- ✅ Banner RUL aktif dengan nilai rendah (< 3 hari) — warna merah/oranye
- ✅ Angka RUL terbaca: contoh "RUL: 1.59 hari"
- ✅ Status label: "CRITICAL" atau "WARNING"
- ✅ Timestamp prediksi terakhir (opsional)

**Cara kondisi ideal:**
```
Klik mesin yang paling kritis di sidebar (biasanya M-06 atau mesin dengan
status CRITICAL setelah simulator berjalan ~2 menit)
```

---

#### SS-05 — Anomaly Timeline (DISARANKAN — Scene 4)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` (scroll ke bawah) |
| **Digunakan di** | Scene 4 — background detail / callout anomaly |
| **Format** | PNG |
| **Resolusi** | ~1200×300px |
| **Filename** | `anomaly-timeline.png` |

**Yang harus terlihat:**
- ✅ Timeline horizontal dengan titik-titik anomali
- ✅ Ada marker WARNING (kuning) dan CRITICAL (merah)
- ✅ Timestamp event terlihat
- ✅ Minimal 5+ event dalam frame

---

#### SS-06 — AI Copilot / Copilot Hub (WAJIB — Scene 5 referensi)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/copilot-hub` |
| **Digunakan di** | Scene 5 — referensi desain untuk chat mockup |
| **Format** | PNG |
| **Resolusi** | 1920×1080 (full page) |
| **Filename** | `copilot-hub-full.png` |

**Yang harus terlihat:**
- ✅ Panel chat AI Copilot terbuka
- ✅ Contoh pertanyaan sudah diketikkan dan dijawab (jika NLP service aktif)
- ✅ Citation chips / citation cards terlihat di bawah jawaban
- ✅ SOP Document Panel (sidebar dokumen) jika tersedia
- ✅ Input field chat dengan placeholder terbaca

**Cara kondisi ideal:**
```
1. Pastikan NLP service aktif: curl http://localhost:8001/nlp/health
2. Ketik pertanyaan: "Apa saja anomali pada M-06?"
3. Tunggu jawaban muncul lengkap dengan citation
4. Screenshot keseluruhan panel
```

> 💡 **Jika NLP service belum aktif**: Cukup screenshot tampilan kosong UI Copilot Hub saja — akan digunakan sebagai referensi desain untuk membuat mockup animasi di Scene 5.

---

#### SS-07 — Citation Card / Chip Detail (DISARANKAN — Scene 5)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/copilot-hub` (setelah dapat jawaban) |
| **Digunakan di** | Scene 5 — detail citation chip animasi |
| **Format** | PNG (crop area citation saja) |
| **Resolusi** | ~800×150px |
| **Filename** | `copilot-citation-chips.png` |

**Yang harus terlihat:**
- ✅ 2–3 citation chip/card dengan nama dokumen PDF
- ✅ Ikon dokumen + nama file (contoh: `Laporan_M-06_November_2025.pdf`)
- ✅ Relevance score atau page number (jika ditampilkan)

---

#### SS-08 — Maintenance Scheduler — Task Board (WAJIB — Scene 6 referensi)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/scheduler` |
| **Digunakan di** | Scene 6 — referensi desain untuk scheduler mockup animasi |
| **Format** | PNG |
| **Resolusi** | 1920×1080 (full page) |
| **Filename** | `scheduler-taskboard-full.png` |

**Yang harus terlihat:**
- ✅ Daftar task maintenance yang sudah ada (minimal 3–5 task)
- ✅ Badge mesin (M-06, M-12, dll)
- ✅ Badge severity: CRITICAL (merah), WARNING (kuning)
- ✅ Kolom status task: PENDING, IN_PROGRESS, DONE (jika ada Kanban view)
- ✅ Tanggal jadwal per task

**Cara kondisi ideal:**
```
Setelah simulator berjalan dan ada mesin CRITICAL,
task maintenance seharusnya sudah auto-generate via WebSocket.
Refresh halaman scheduler dan screenshot.
```

---

#### SS-09 — Task Detail Card (DISARANKAN — Scene 6)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/scheduler` → klik salah satu task |
| **Digunakan di** | Scene 6 — detail individual task card |
| **Format** | PNG (crop 1 task card saja) |
| **Resolusi** | ~600×200px |
| **Filename** | `scheduler-task-critical.png` |

**Yang harus terlihat:**
- ✅ Satu task card CRITICAL terpilih/highlighted
- ✅ RUL value terlihat (contoh: "RUL: 1.59 hari") dalam font monospace
- ✅ Badge mesin + badge severity
- ✅ Judul task (contoh: "Inspeksi Bearing Segera")

---

#### SS-10 — Calendar View Scheduler (OPSIONAL)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/scheduler` (tab Calendar jika ada) |
| **Digunakan di** | Scene 6 — variasi visual scheduler |
| **Format** | PNG |
| **Filename** | `scheduler-calendar-view.png` |

**Yang harus terlihat:**
- ✅ Grid kalender dengan event maintenance terdistribusi
- ✅ Event berwarna sesuai severity

---

#### SS-11 — Admin Dashboard (OPSIONAL — Scene 7)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/admin` (perlu role ADMIN) |
| **Digunakan di** | Scene 7 — show system overview / stats |
| **Format** | PNG |
| **Filename** | `admin-dashboard-stats.png` |

**Yang harus terlihat:**
- ✅ Stat cards: total users, total machines, total predictions, dll
- ✅ User management table (sensor anonymized jika perlu)
- ✅ Document management tab (jika ada dokumen ter-index)

**Cara akses ADMIN:**
```
Login: admin@lapis-ai.com / Admin@Lapis123
(atau set NEXT_PUBLIC_MOCK_ROLE=ADMIN di frontend/.env.local)
```

---

#### REC-01 — Screen Recording Dashboard Real-time (WAJIB — Scene 4)

| Property | Detail |
|:---|:---|
| **URL** | `http://localhost:3001/dashboard` |
| **Digunakan di** | Scene 4 — video di dalam laptop mockup |
| **Format** | MP4 (H.264) atau WebM |
| **Resolusi rekam** | 1280×800 (crop browser window) |
| **Durasi** | 12–15 detik |
| **Filename** | `recordings/dashboard-realtime.mp4` |

**Alur rekaman (urutan adegan):**
```
[0–3 detik]   Tampilkan machine list sidebar — ada mesin CRITICAL terlihat
[3–6 detik]   Klik mesin WARNING/CRITICAL — gauge sensor update
[6–10 detik]  Zoom/scroll ke area sensor gauge yang oranye/merah
[10–15 detik] Kembali ke sidebar — tampilkan RUL banner merah di atas
```

**Tool rekam (pilih salah satu):**
- Windows: `Win + G` (Xbox Game Bar) → pilih area browser
- OBS Studio: Scene capture → window capture → pilih browser
- Browser built-in: DevTools → `Ctrl+Shift+P` → "Start recording"
- PowerShell / `ffmpeg`: jika ingin headless

---

### 📁 Struktur Folder Output Screenshot

Simpan semua file di dalam folder `public/` proyek Remotion kalian nanti:

```
remotion-prime/
└── public/
    ├── screenshots/
    │   ├── dashboard-overview-full.png      ← SS-01
    │   ├── sidebar-machine-list.png         ← SS-02
    │   ├── sensor-gauges-warning.png        ← SS-03
    │   ├── rul-banner-critical.png          ← SS-04
    │   ├── anomaly-timeline.png             ← SS-05
    │   ├── copilot-hub-full.png             ← SS-06
    │   ├── copilot-citation-chips.png       ← SS-07
    │   ├── scheduler-taskboard-full.png     ← SS-08
    │   ├── scheduler-task-critical.png      ← SS-09
    │   ├── scheduler-calendar-view.png      ← SS-10 (opsional)
    │   └── admin-dashboard-stats.png        ← SS-11 (opsional)
    └── recordings/
        └── dashboard-realtime.mp4           ← REC-01
```

---

### ✅ Prioritas Screenshot

| Prioritas | ID | Scene | Alasan |
|:---:|:---|:---|:---|
| 🔴 **Wajib** | SS-01 | Scene 1 + 4 | Background blur + laptop mockup |
| 🔴 **Wajib** | SS-08 | Scene 6 | Referensi desain scheduler mockup |
| 🔴 **Wajib** | REC-01 | Scene 4 | Video rekaman di dalam laptop frame |
| 🟡 **Disarankan** | SS-03 | Scene 4 | Callout gauge cluster |
| 🟡 **Disarankan** | SS-04 | Scene 4 | Callout RUL banner |
| 🟡 **Disarankan** | SS-06 | Scene 5 | Referensi desain chat panel |
| 🟡 **Disarankan** | SS-09 | Scene 6 | Detail task CRITICAL |
| 🟢 **Opsional** | SS-02 | Scene 4 | Crop sidebar untuk detail callout |
| 🟢 **Opsional** | SS-05 | Scene 4 | Anomaly timeline detail |
| 🟢 **Opsional** | SS-07 | Scene 5 | Citation chip closeup |
| 🟢 **Opsional** | SS-10 | Scene 6 | Calendar view variasi |
| 🟢 **Opsional** | SS-11 | Scene 7 | Admin stats overview |

> **Catatan**: Scene 5 (AI Copilot) dan Scene 6 (Scheduler) didesain sebagai **pure animated mockup** di Remotion — screenshot hanya dibutuhkan sebagai **referensi visual** bagi implementor agar mockup akurat menyerupai tampilan asli. Bukan untuk di-embed langsung sebagai `<Img>` di video.

---

*Storyboard ini merupakan dokumen referensi untuk implementasi video promosi PRIME menggunakan Remotion. Setiap scene dirancang agar dapat diimplementasikan secara independen sebagai komponen React. Update dokumen ini seiring perkembangan implementasi.*
