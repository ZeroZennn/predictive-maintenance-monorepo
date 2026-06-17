# 🎬 Video Storyboard: Exigen — Predict Before It Breaks

## Meta

| Property | Value |
|---|---|
| Durasi Total | ~90 detik (2700 frames) |
| Aspect Ratio | 16:9 |
| FPS | 30 |
| Resolusi | 1920 × 1080 |
| Total Scenes | 8 |
| Voiceover | Ya (Bahasa Indonesia) |
| Platform Target | YouTube, Web, Presentasi PBL |

---

## Brand & Style Guide

- **Color Palette**:
  - Background Primary: `#0A0A0F` (near-black)
  - Background Secondary: `#111118` (dark card)
  - Accent Primary: `#6366F1` (indigo/violet)
  - Accent Glow: `#818CF8` (lighter indigo, untuk glow effect)
  - Accent Green: `#22C55E` (status aman)
  - Accent Amber: `#F59E0B` (status warning)
  - Accent Red: `#EF4444` (status kritis)
  - Text Primary: `#F8FAFC` (white)
  - Text Secondary: `#94A3B8` (slate muted)
  - Border/Divider: `#1E293B` (subtle slate)

- **Font**:
  - Heading: **Inter** (weight 700-800, Google Fonts)
  - Body: **Inter** (weight 400-500)
  - Monospace/Data: **JetBrains Mono** (untuk angka, kode, data stats)

- **Visual Style**: Dark premium dengan subtle gradient glow. Background gelap solid, elemen UI punya subtle border `1px solid rgba(99,102,241,0.2)` dan soft glow/shadow indigo di belakang card penting. Partikel/grain halus di background untuk depth.

- **Animasi Style**:
  - Entrance: `spring({ damping: 15, stiffness: 180 })` untuk elemen utama
  - Text reveal: Fade up dengan stagger 0.1s per kata
  - Transisi antar scene: Crossfade 15 frames dengan slight zoom (scale 1.0 → 1.02)
  - Data/angka: Counting animation untuk statistik
  - Glow pulse: `interpolate` sinusoidal pada opacity shadow (0.3 → 0.6 → 0.3)

---

## Scene Breakdown

---

### Scene 1: The Problem — Hook
**Durasi**: 10 detik (frame 0 – frame 299)
**Tujuan**: Hook audience dengan masalah yang relatable — aset rusak mendadak, kerugian, chaos.

#### Visual
- Background: `#0A0A0F` solid dengan subtle radial gradient merah gelap di center (menandakan "bahaya")
- Elemen utama: Ikon-ikon aset industrial (AC, lampu, genset, pompa) tersebar di layar, masing-masing dalam card kecil semi-transparan
- Di tengah muncul teks headline besar
- Satu per satu ikon aset berubah warna ke merah dan muncul ❌ di atasnya (visual "kerusakan mendadak")
- Layout: Center-focused, ikon tersebar radial di sekitar teks

#### Animasi
- **Entrance (frame 0–30)**: Background fade in, ikon aset muncul satu-satu dengan stagger `spring` dari opacity 0 → 1 + scale 0.8 → 1
- **During (frame 30–240)**: Setelah semua ikon muncul, satu per satu berubah merah dengan "crack" shake effect kecil (translateX ±3px rapid). Setiap kali satu "rusak", ada flash merah subtle di background
- **Exit (frame 240–299)**: Semua elemen fade out, background gradient merah intensify sesaat lalu fade to black

#### Teks On-Screen
```
[heading, 48px, bold, center]
"Aset Rusak Tanpa Peringatan?"

[subheading, 24px, muncul setelah 3 detik]
"Downtime. Kerugian. Komplain Bertubi-tubi."
```

#### Voiceover Script
> "Bayangkan — AC kantor mati di tengah hari kerja. Genset gagal nyala saat listrik padam. Aset rusak mendadak tanpa peringatan, dan tim maintenance selalu terlambat merespons."
> Estimasi durasi baca: 9 detik

#### Assets Needed
- [ ] Ikon SVG: AC, lampu, genset, pompa air, elevator (simple line icon style, warna putih)
- [ ] Sound effect: subtle glitch/static noise saat ikon "rusak"

---

### Scene 2: The Real Question
**Durasi**: 8 detik (frame 300 – frame 539)
**Tujuan**: Transisi — ajukan pertanyaan retoris, bangun curiosity sebelum reveal solusi.

#### Visual
- Background: `#0A0A0F` clean
- Di center muncul satu baris teks besar dengan efek glow indigo
- Di bawah teks, muncul garis timeline horizontal subtle dengan titik-titik (representing asset lifecycle) — beberapa titik sudah merah (lewat masa pakai)
- Layout: Center, minimal, fokus ke tipografi

#### Animasi
- **Entrance (frame 300–330)**: Teks utama fade-up dari bawah (translateY 40 → 0, opacity 0 → 1) dengan spring
- **During (frame 330–480)**: Glow indigo di belakang teks pulse perlahan (opacity 0.4 → 0.7 → 0.4). Timeline dots muncul satu-satu dari kiri ke kanan
- **Exit (frame 480–539)**: Teks scale up sedikit (1.0 → 1.05) lalu fade out. Timeline dissolve

#### Teks On-Screen
```
[heading, 52px, bold, center, glow indigo]
"Bagaimana Jika Kita Bisa Tahu Sebelumnya?"
```

#### Voiceover Script
> "Bagaimana kalau kita bisa memprediksi kapan sebuah aset akan mencapai akhir masa pakainya — sebelum kerusakan terjadi?"
> Estimasi durasi baca: 7 detik

#### Assets Needed
- [ ] Tidak ada asset eksternal — pure code/SVG

---

### Scene 3: Logo Reveal — Introducing Exigen
**Durasi**: 8 detik (frame 540 – frame 779)
**Tujuan**: Reveal brand — logo + nama + tagline. Momen "wow" visual.

#### Visual
- Background: `#0A0A0F` → subtle radial gradient indigo muncul perlahan dari center
- Logo Exigen muncul di center dengan glow effect
- Di bawah logo, nama "EXIGEN" dalam font besar tracking wide
- Di bawahnya lagi, tagline
- Particle burst halus (titik-titik kecil indigo) menyebar dari center saat logo muncul
- Layout: Dead center, symmetrical

#### Animasi
- **Entrance (frame 540–580)**: Logo scale dari 0 → 1 dengan `spring({ damping: 12, stiffness: 200 })`. Bersamaan, particle burst menyebar outward. Radial glow indigo fade in
- **During (frame 580–720)**: Logo idle dengan subtle glow pulse. Teks "EXIGEN" muncul letter-by-letter dengan stagger 2 frame. Tagline fade in 0.5 detik setelah nama lengkap
- **Exit (frame 720–779)**: Semua elemen tetap visible, background glow sedikit redup → transisi smooth ke scene berikutnya

#### Teks On-Screen
```
[logo, center]
{Exigen Logo}

[heading, 56px, bold, letter-spacing 8px, center]
"EXIGEN"

[subheading, 22px, weight 400, text-secondary color]
"Predictive Asset Maintenance"
```

#### Voiceover Script
> "Perkenalkan Exigen — sistem prediktif yang menghitung sisa umur pakai aset menggunakan machine learning."
> Estimasi durasi baca: 7 detik

#### Assets Needed
- [ ] Logo Exigen (SVG, versi light/white untuk dark background)
- [ ] Sound effect: subtle whoosh + soft synth hit saat logo muncul

---

### Scene 4: How It Works — RUL Concept
**Durasi**: 14 detik (frame 780 – frame 1199)
**Tujuan**: Jelaskan konsep inti Exigen — RUL (Remaining Useful Life) secara visual dan simpel.

#### Visual
- Background: `#0A0A0F`
- Kiri layar: Diagram visual yang menunjukkan konsep RUL
  - Horizontal bar menggambarkan "Total Predicted Lifetime" (warna indigo gradient)
  - Bagian kiri bar sudah terisi (warna slate/dim) = "Umur Saat Ini"
  - Bagian kanan bar masih terang = "Sisa Umur (RUL)"
  - Di atas bar, label angka: misal "Total: 1825 hari" → "Umur: 1460 hari" → "RUL: 365 hari"
- Kanan layar: Penjelasan step-by-step (muncul bertahap)
  1. "Data historis penggantian + data komplain" (dengan ikon database)
  2. "Model ML prediksi total lifetime" (dengan ikon brain/neural)
  3. "RUL = Total Lifetime − Umur Sekarang" (dengan ikon calculator)
- Layout: 55% kiri (diagram), 45% kanan (penjelasan), vertical center

#### Animasi
- **Entrance (frame 780–830)**: Bar diagram slide in dari kiri. Label "Total Predicted Lifetime" fade in
- **During (frame 830–1100)**:
  - Frame 830–900: Bagian "Umur Saat Ini" terisi secara animated (wipe left-to-right) dengan warna dim slate. Angka counting up dari 0 → 1460
  - Frame 900–970: Bagian "RUL" highlight dengan warna indigo terang + glow. Angka counting: 365 hari. Di kanan, step 1 muncul (fade up)
  - Frame 970–1040: Step 2 muncul di kanan. Ikon brain pulse
  - Frame 1040–1100: Step 3 muncul di kanan. Formula "RUL = Total − Umur" highlight
- **Exit (frame 1100–1199)**: Diagram kiri zoom in sedikit ke bagian RUL, lalu crossfade ke scene 5

#### Teks On-Screen
```
[heading kiri, 36px, bold]
"Remaining Useful Life"

[bar labels, monospace, 20px]
"Total: 1.825 hari"
"Umur: 1.460 hari"
"RUL: 365 hari"

[kanan, step items, 20px]
"① Data komplain & histori penggantian"
"② ML prediksi total lifetime aset"
"③ RUL = Total Lifetime − Umur Sekarang"
```

#### Voiceover Script
> "Exigen mengumpulkan data historis penggantian dan data komplain dari pengguna. Model machine learning kemudian memprediksi total lifetime setiap aset. Remaining Useful Life — atau sisa umur pakai — dihitung dari selisih prediksi total lifetime dikurangi umur aset saat ini. Sesimpel itu."
> Estimasi durasi baca: 13 detik

#### Assets Needed
- [ ] Ikon SVG: database, brain/neural network, calculator
- [ ] Tidak perlu screenshot — pure animated diagram

---

### Scene 5: Dashboard Overview — Laptop Scroll
**Durasi**: 14 detik (frame 1200 – frame 1619)
**Tujuan**: Showcase tampilan dashboard utama Exigen dengan rekaman layar live di dalam laptop mockup.

#### Visual
- Background: `#0A0A0F`
- Center layar: **Laptop mockup** (MacBook-style frame, dark bezel, rounded corners) berisi **screen recording video** dashboard Exigen yang sedang di-scroll
- Video menunjukkan: buka dashboard → scroll lihat summary cards → scroll ke tabel aset → hover/klik sesuatu → lihat status warna
- Di sisi kiri/kanan laptop, **floating callout cards** muncul dan menghilang sesuai bagian yang sedang terlihat di video
- Layout: Laptop mockup 65% lebar layar, center. Callouts floating di sisi kiri & kanan

#### Animasi
- **Entrance (frame 1200–1260)**: Laptop mockup slide up + fade in dengan spring. Shadow indigo glow muncul di bawah laptop
- **During (frame 1260–1520)** — **Video plays inside mockup**:
  - Frame 1260–1340: Video menunjukkan summary cards area. Callout kiri muncul: "Ringkasan kondisi aset real-time"
  - Frame 1340–1420: Video scroll ke tabel. Callout kiri fade out, callout kanan muncul: "RUL terhitung otomatis per aset"
  - Frame 1420–1520: Video scroll ke status warna. Callout baru: "Prioritas berdasarkan urgensi"
- **Exit (frame 1520–1619)**: Callouts fade out. Laptop mockup scale down sedikit (1.0 → 0.95) + fade out

#### Teknis Implementation
```tsx
import { OffthreadVideo } from "remotion";

// Video screen recording di-embed dalam laptop frame
<LaptopMockup>
  <OffthreadVideo
    src={staticFile("recordings/dashboard-scroll.mp4")}
    startFrom={0}  // trim kalau perlu
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</LaptopMockup>
```

**Cara rekam**: Buka dashboard Exigen di browser → resize window ke ~1280x800 → pakai OBS / built-in screen recorder / Loom → scroll perlahan dari atas ke bawah selama ~15 detik. Gak perlu perfect, bisa di-trim di Remotion pakai `startFrom` dan `endAt`.

#### Teks On-Screen
```
[callout cards, 18px, bg #111118 + border indigo glow, rounded 12px, padding 16px]
① "Ringkasan kondisi aset real-time"
② "RUL terhitung otomatis per aset"
③ "Prioritas berdasarkan urgensi"
```

#### Voiceover Script
> "Dashboard Exigen memberikan gambaran lengkap kondisi seluruh aset. Setiap aset memiliki nilai RUL yang dihitung otomatis — mulai dari yang masih aman hingga yang sudah nol hari, artinya prediksi lifetime-nya sudah terlampaui dan butuh perhatian segera."
> Estimasi durasi baca: 13 detik

#### Assets Needed
- [ ] **Screen recording: Dashboard scroll** (~15 detik, resolusi 1280×800 atau lebih, format MP4/WebM)

---

### Scene 6: Complaint Flow & Asset Tracking
**Durasi**: 12 detik (frame 1620 – frame 1979)
**Tujuan**: Tunjukkan alur kerja — dari guest submit komplain sampai teknisi menangani. Pakai device mockup dengan screen recording.

#### Visual
- Background: `#0A0A0F`
- Layout split tiga tahap, muncul bertahap kiri → kanan:
  - **Kiri: Phone mockup (iPhone-style frame)** — screen recording HP mengisi form komplain guest, scroll, ketik, tap submit
  - **Tengah: Animated arrow/flow line** — garis dashed indigo yang "mengalir" dari phone ke laptop
  - **Kanan: Laptop mockup** — screen recording panel admin: tiket baru muncul di list, klik masuk ke detail
- Di bawah ketiga elemen, label step
- Di ujung kanan, small badge: brain + teks "Data → ML Model"

#### Animasi
- **Entrance (frame 1620–1680)**: Phone mockup slide in dari kiri + fade in. Video mulai play
- **During (frame 1680–1900)**:
  - Frame 1680–1760: Phone video: user scroll form, isi field, tap submit. Label "Guest Lapor" fade in
  - Frame 1760–1800: Animated dashed line mengalir dari phone ke kanan. Arrow pulses indigo
  - Frame 1800–1880: Laptop mockup fade in + video play: list tiket, klik tiket baru, lihat detail. Label "Teknisi Handle" fade in
  - Frame 1880–1900: Badge "Data → ML" muncul di ujung kanan dengan bounce
- **Exit (frame 1900–1979)**: Semua elemen fade out bersamaan

#### Teknis Implementation
```tsx
// Phone mockup dengan screen recording form komplain
<PhoneMockup>
  <OffthreadVideo
    src={staticFile("recordings/complaint-form-mobile.mp4")}
    startFrom={0}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</PhoneMockup>

// Laptop mockup dengan screen recording panel admin
<LaptopMockup>
  <OffthreadVideo
    src={staticFile("recordings/admin-tiket.mp4")}
    startFrom={0}
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
  />
</LaptopMockup>
```

**Cara rekam**:
1. **Form komplain (mobile)**: Buka Chrome DevTools → responsive mode 390×844 (iPhone) → buka halaman form → rekam layar sambil isi form + submit. ~10 detik.
2. **Panel admin (desktop)**: Buka panel admin → resize ~1280×800 → rekam: buka list tiket, klik salah satu, lihat detail. ~10 detik.

#### Teks On-Screen
```
[step labels, 16px, bold, di bawah masing-masing device]
"① Guest Lapor"          "② Tiket Masuk & Ditangani"

[badge kanan, 14px, monospace, bg indigo/20%]
"Data → ML Model 🧠"

[subtext, 14px, text-secondary, di bawah semua]
"Setiap laporan memperkaya akurasi prediksi"
```

#### Voiceover Script
> "Alur kerjanya sederhana. Siapa pun bisa melaporkan kerusakan lewat HP tanpa perlu login. Laporan langsung menjadi tiket yang ditangani teknisi. Dan setiap data komplain otomatis memperkaya model prediksi — semakin banyak data, semakin akurat."
> Estimasi durasi baca: 12 detik

#### Assets Needed
- [ ] **Screen recording: Form komplain mobile** (~10 detik, resolusi 390×844 atau seukuran iPhone, MP4)
- [ ] **Screen recording: Panel admin tiket** (~10 detik, resolusi 1280×800, MP4)
- [ ] Ikon SVG: brain/neural network

---

### Scene 7: Key Highlights — Stats & Value Proposition
**Durasi**: 10 detik (frame 1980 – frame 2279)
**Tujuan**: Highlight nilai utama Exigen dengan angka dan poin kunci — bikin impactful.

#### Visual
- Background: `#0A0A0F` dengan subtle grid pattern (garis-garis tipis `#1E293B`)
- Tiga card besar tersusun horizontal di center, masing-masing berisi angka + deskripsi:
  - Card 1: Ikon chart-up + "Prediksi RUL" + "Machine learning berbasis data nyata"
  - Card 2: Ikon shield-check + "Zero Downtime Goal" + "Tangani aset sebelum gagal"
  - Card 3: Ikon users + "Guest Reporting" + "Siapa saja bisa lapor tanpa akun"
- Setiap card punya border subtle + glow indigo saat di-highlight
- Layout: 3 column equal width, horizontal center, vertical center

#### Animasi
- **Entrance (frame 1980–2020)**: Grid background fade in
- **During (frame 2020–2200)**:
  - Frame 2020–2080: Card 1 slide up + fade in. Ikon muncul dengan bounce. Glow indigo on
  - Frame 2080–2140: Card 2 slide up (stagger 10 frame). Glow shift ke card 2
  - Frame 2140–2200: Card 3 slide up. Glow shift ke card 3
- **Exit (frame 2200–2279)**: Semua card glow simultaneously → crossfade to final scene

#### Teks On-Screen
```
[card heading, monospace, 28px, bold, indigo]
"Prediksi RUL"        |  "Zero Downtime"       |  "Guest Report"

[card body, 16px, text-secondary]
"ML dari data nyata"  |  "Tangani sebelum gagal" |  "Lapor tanpa akun"
```

#### Voiceover Script
> "Exigen dibangun dengan tiga prinsip utama: prediksi berbasis data nyata menggunakan machine learning, tujuan zero downtime dengan penanganan proaktif, dan aksesibilitas — siapa pun bisa melaporkan masalah tanpa perlu membuat akun."
> Estimasi durasi baca: 10 detik

#### Assets Needed
- [ ] Ikon SVG: chart-trending-up, shield-check, users/people

---

### Scene 8: Closing — Logo & Project Credit
**Durasi**: 14 detik (frame 2280 – frame 2699)
**Tujuan**: Penutup elegan — logo, nama produk, credit tim PBL.

#### Visual
- Background: `#0A0A0F` → radial gradient indigo perlahan muncul (sama seperti Scene 3 tapi lebih subtle)
- Center: Logo Exigen (ukuran besar)
- Di bawah logo: "EXIGEN" + tagline
- Setelah 5 detik, teks berubah ke credit: "Project Based Learning — [Nama Universitas/Prodi/Tahun]" dan/atau nama anggota tim
- Particle ambient halus di background (titik-titik float perlahan ke atas)
- Layout: Dead center, clean

#### Animasi
- **Entrance (frame 2280–2340)**: Logo fade in + scale dari 0.95 → 1.0. Radial glow indigo muncul perlahan. Particles mulai float
- **During (frame 2340–2520)**: Logo dan teks "EXIGEN" + tagline idle. Glow pulse halus. Ambient particles drift upward
- **During (frame 2520–2620)**: Teks tagline crossfade menjadi credit PBL. Smooth transition, posisi sama
- **Exit (frame 2620–2699)**: Semua elemen perlahan fade out. Background gelap total di frame terakhir

#### Teks On-Screen
```
[logo, center]
{Exigen Logo}

[heading, 48px, bold, letter-spacing 6px]
"EXIGEN"

[tagline, 20px, text-secondary, italic]
"Predict Before It Breaks."

[credit, 18px, text-secondary, muncul di detik ke-8]
"Project Based Learning"
"[Nama Universitas / Prodi / Tahun Ajaran]"
```

#### Voiceover Script
> "Exigen — prediksi sebelum kerusakan terjadi."
> *(silence 3 detik untuk credit)*
> Estimasi durasi baca: 3 detik (sisanya silence/musik)

#### Assets Needed
- [ ] Logo Exigen (SVG, sama seperti Scene 3)
- [ ] Info credit: nama universitas, prodi, tahun ajaran, nama tim (diisi oleh user)
- [ ] Background music: ambient electronic / cinematic subtle — fade out di akhir

---

## Timeline Overview

| # | Scene | Durasi | Frame Range | Voiceover Summary |
|---|-------|--------|-------------|-------------------|
| 1 | The Problem — Hook | 10s | 0–299 | Masalah aset rusak mendadak tanpa peringatan |
| 2 | The Real Question | 8s | 300–539 | Bagaimana jika bisa tahu sebelumnya? |
| 3 | Logo Reveal — Exigen | 8s | 540–779 | Perkenalkan Exigen, sistem prediktif ML |
| 4 | How It Works — RUL | 14s | 780–1199 | Penjelasan konsep RUL secara visual |
| 5 | Dashboard Overview | 14s | 1200–1619 | Showcase UI dashboard + fitur utama |
| 6 | Complaint Flow | 12s | 1620–1979 | Alur guest komplain → tiket → ML |
| 7 | Key Highlights | 10s | 1980–2279 | 3 value proposition utama |
| 8 | Closing & Credit | 14s | 2280–2699 | Logo, tagline, credit PBL |
| | **TOTAL** | **90s** | **2700 frames** | |

---

## Remotion Implementation Notes

### Struktur Komponen yang Direkomendasikan
```
src/
├── Root.tsx                          # Composition setup
├── ExigenVideo.tsx                   # Main video component (sequences all scenes)
├── scenes/
│   ├── Scene01Problem.tsx            # Hook — aset rusak
│   ├── Scene02Question.tsx           # Pertanyaan retoris
│   ├── Scene03LogoReveal.tsx         # Logo Exigen reveal
│   ├── Scene04HowItWorks.tsx         # Konsep RUL
│   ├── Scene05Dashboard.tsx          # Dashboard showcase
│   ├── Scene06ComplaintFlow.tsx       # Alur kerja komplain
│   ├── Scene07Highlights.tsx         # Value proposition cards
│   └── Scene08Closing.tsx            # Logo + credit
├── components/
│   ├── AnimatedText.tsx              # Reusable fade-up text
│   ├── GlowCard.tsx                  # Card dengan border glow effect
│   ├── LaptopMockup.tsx             # MacBook-style frame + video container
│   ├── PhoneMockup.tsx              # iPhone-style frame + video container
│   ├── FlowLine.tsx                 # Animated dashed line antar device
│   ├── RULBar.tsx                    # Animated RUL bar diagram
│   ├── ParticleBackground.tsx        # Ambient floating particles
│   ├── HighlightBox.tsx             # Animated highlight overlay pada screenshot
│   └── CountingNumber.tsx            # Angka counting animation
├── styles/
│   └── theme.ts                      # Colors, fonts, spacing constants
scripts/
│   └── record-screens.ts            # Playwright headless recorder
public/
├── recordings/                       # Output dari Playwright (auto-generated)
│   ├── dashboard-scroll.webm
│   ├── complaint-form-mobile.webm
│   └── admin-tiket.webm
└── assets/
    ├── logo.svg                      # Logo Exigen
    └── icons/                        # Ikon SVG (ac, lampu, genset, dll)
```

### Konfigurasi Remotion
```tsx
// Root.tsx
import { Composition } from "remotion";
import { ExigenVideo } from "./ExigenVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ExigenVideo"
      component={ExigenVideo}
      durationInFrames={2700}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
```

### Catatan Teknis

- **Library yang direkomendasikan**:
  - `@remotion/transitions` — untuk crossfade antar scene via `<TransitionSeries>`
  - `@remotion/motion-blur` — opsional, untuk motion blur pada elemen cepat
  - `@remotion/paths` — jika perlu animate SVG paths (garis penghubung flow diagram)

- **Spring config yang konsisten** — definisikan di `theme.ts`:
  ```ts
  export const SPRING_ENTER = { damping: 15, stiffness: 180 };
  export const SPRING_BOUNCE = { damping: 12, stiffness: 200 };
  export const SPRING_GENTLE = { damping: 20, stiffness: 120 };
  ```

- **Screen recording sebagai video** — gunakan `<OffthreadVideo>` dari `remotion` untuk embed rekaman layar di dalam device mockup. Lebih ringan dari `<Video>` karena render off-thread:
  ```tsx
  import { OffthreadVideo, staticFile } from "remotion";
  
  <OffthreadVideo
    src={staticFile("recordings/dashboard-scroll.mp4")}
    startFrom={30}   // skip 1 detik pertama
    endAt={480}       // potong di 16 detik
    volume={0}        // mute, karena audio pakai voiceover terpisah
  />
  ```

- **Font loading** — gunakan `@remotion/google-fonts`:
  ```ts
  import { loadFont } from "@remotion/google-fonts/Inter";
  import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
  loadFont();
  loadMono();
  ```

- **Screenshot handling** — semua screenshot diimport sebagai `staticFile()`:
  ```ts
  import { staticFile } from "remotion";
  const dashboardImg = staticFile("screenshots/dashboard.png");
  ```

- **Audio/Musik** — tambahkan background music ambient menggunakan `<Audio>` component. Fade in di Scene 1, volume rendah selama voiceover, fade out di Scene 8. Voiceover sebagai track terpisah yang bisa direkam lalu di-sync per scene menggunakan `<Sequence>`.

### Automated Screen Recording (Headless)

Semua screen recording bisa di-automate pakai **Playwright** tanpa perlu rekam manual. Buat script `record-screens.ts` yang jalan sebelum render Remotion.

```bash
# Install
npm install playwright
npx playwright install chromium
```

```ts
// scripts/record-screens.ts
import { chromium } from "playwright";

const BASE_URL = "https://exigen.tempdev.my.id";

async function recordDashboard() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "./public/recordings", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  // Login sebagai technician/admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "ADMIN_EMAIL");
  await page.fill('input[name="password"]', "ADMIN_PASSWORD");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard**");

  // Scroll perlahan dari atas ke bawah
  await page.waitForTimeout(1000);
  await autoScroll(page, { distance: 3, interval: 30, maxScrolls: 300 });
  await page.waitForTimeout(1000);

  await context.close(); // saves video
  await browser.close();
}

async function recordComplaintForm() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone-size
    recordVideo: { dir: "./public/recordings", size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  // Scroll ke form komplain
  await page.locator("#komplain").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Isi form perlahan (simulasi user typing)
  await page.fill('input[name="asset_name"]', "AC Split 2 PK", { timeout: 0 });
  await page.waitForTimeout(300);
  await page.fill('input[name="location"]', "Gedung A, Lantai 3, Zona B");
  await page.waitForTimeout(300);
  // ... isi field lainnya sesuai form yang ada
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
}

async function recordAdminTickets() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: "./public/recordings", size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  // Login admin
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "ADMIN_EMAIL");
  await page.fill('input[name="password"]', "ADMIN_PASSWORD");
  await page.click('button[type="submit"]');

  // Navigasi ke halaman tiket
  await page.goto(`${BASE_URL}/tickets`); // sesuaikan URL
  await page.waitForTimeout(1000);
  await autoScroll(page, { distance: 2, interval: 40, maxScrolls: 100 });

  // Klik salah satu tiket
  await page.locator("table tbody tr").first().click();
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
}

// Helper: smooth scroll
async function autoScroll(
  page: any,
  opts: { distance: number; interval: number; maxScrolls: number }
) {
  for (let i = 0; i < opts.maxScrolls; i++) {
    await page.evaluate((d: number) => window.scrollBy(0, d), opts.distance);
    await page.waitForTimeout(opts.interval);
  }
}

// Run semua
(async () => {
  await recordDashboard();
  await recordComplaintForm();
  await recordAdminTickets();
  console.log("✅ All recordings saved to public/recordings/");
})();
```

```bash
# Jalankan sebelum render
npx tsx scripts/record-screens.ts
npx remotion render ExigenVideo out/exigen-video.mp4
```

> **Catatan untuk AI implementor**: Sesuaikan selector (`input[name="..."]`, URL path, dll) dengan DOM aktual Exigen. Buka `${BASE_URL}` dulu via Playwright, inspect element, lalu adjust script. Credential admin bisa pakai env variable. Jika ada elemen yang butuh waktu loading, tambahkan `waitForSelector` sebelum interact.

- [ ] Logo Exigen (SVG, versi putih)
- [ ] ~~Screen recording manual~~ → **Otomatis via Playwright script** (lihat section di atas)
  - `public/recordings/dashboard-scroll.webm` — auto-generated
  - `public/recordings/complaint-form-mobile.webm` — auto-generated
  - `public/recordings/admin-tiket.webm` — auto-generated
- [ ] Credential login admin/teknisi (set di env variable untuk script Playwright)
- [ ] Rekaman voiceover (atau pakai TTS service dulu untuk draft)
- [ ] Background music (royalty-free ambient/electronic, ~90 detik)
- [ ] Info credit PBL (universitas, prodi, tahun, nama tim)
