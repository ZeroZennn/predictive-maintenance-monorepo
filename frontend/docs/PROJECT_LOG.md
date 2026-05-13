# PROJECT LOG: Lapis AI Predictive Maintenance System
**Role:** D (Frontend Engineer)
**Document Status:** Active / Living Document

Catatan historis perjalanan pengembangan frontend sistem *Lapis AI*, mulai dari tahap inisialisasi hingga fase saat ini. Dokumen ini dirancang sebagai *changelog* dan dokumentasi progres rekayasa teknis (*technical engineering*).

---

## [Phase 0] Foundation & Project Scaffold
**Status:** Selesai
**Fokus Utama:** Persiapan repositori dan kerangka dasar.
- Melakukan inisialisasi *Next.js 14* (App Router) dengan *TypeScript*, *ESLint*, dan *Tailwind CSS*.
- Membersihkan *boilerplate* bawaan Next.js dan merapikan struktur direktori: `src/app`, `src/components`, `src/hooks`, `src/stores`, `src/lib`, `src/types`, `src/config`.
- Menerapkan arsitektur *monorepo* sederhana dengan menempatkan folder `/frontend` di dalam root direktori.
- Menyusun konvensi *type* data (`types/`) dan variabel konfigurasi statis (`config/`) seperti daftar ke-8 parameter sensor (`SENSOR_CONFIG`) dan kumpulan ID mesin (`MACHINE_IDS`).

## [Phase 1] Design Token & Theme System
**Status:** Selesai
**Fokus Utama:** Implementasi estetika *Industrial Neumorphic-Dark Style*.
- Mengatur variabel CSS kustom tingkat root di `globals.css` (menyertakan token tema Lapis AI seperti `lapis-bg`, `lapis-card`, `lapis-neon`).
- Mengekstensi konfigurasi Tailwind (`tailwind.config.ts`) untuk memetakan variabel warna, membangun *drop-shadow* bercahaya yang unik (`glow-neon`, `glow-amber`, `glow-red`), serta menetapkan berbagai animasi dinamis (*pulse-critical*, *slide-in*, *fade-in*).
- Menjamin integrasi tampilan latar belakang *grid* global (`bg-prime.png`) ke seluruh permukaan rute antarmuka.

## [Phase 2] Layout Shell & RBAC Auth Guard
**Status:** Selesai
**Fokus Utama:** Keamanan navigasi dan struktur tata letak dasar.
- Merancang dan menyematkan *Edge Middleware* (`middleware.ts`) untuk menangani validasi *JSON Web Token (JWT)* berlapis dan kendali peran RBAC (seperti restriksi laman `/admin`).
- Menemukan dan memperbaiki *bug redirect loop* akibat proses *decode* basis-64 (base64url) dari *payload* JWT.
- Membangun cangkang kerangka aplikasi (`AppShell`) yang ditopang oleh `IconNavBar`, dirancang dengan model mengambang (*floating*), berukuran presisi, dan dilengkapi aksen gradien aktif *neon*.
- Menyediakan fasilitas *development bypass* melalui flag variabel lingkungan `NEXT_PUBLIC_SKIP_AUTH`.

## [Phase 3] Global State Architecture
**Status:** Selesai
**Fokus Utama:** Arsitektur manajemen data asinkron (*State Management*) dengan Zustand.
- Membangun empat partisi *store* global yang diisolasi agar responsif:
  - `machineStore`: Basis data lokal untuk menyimpan 20 konfigurasi mesin simulasi dan rekaman *sensor reading* secara struktural.
  - `copilotStore`: Mengontrol histori percakapan dan *state* AI asisten panel geser.
  - `uiStore`: Manajemen properti lapisan visual semacam ukuran *sidebar* dan pemuatan halaman.
  - `toastStore`: Mengendalikan antrean pesan dan notifikasi kritis secara konsisten.
- Menghadirkan beberapa lapis *custom hooks* semacam `useMachine`, `useCopilot`, dan `useToast` sebagai abstraksi konsumsi data.

## [Phase 4] WebSocket Engine & API Layer
**Status:** Selesai
**Fokus Utama:** Modul konektivitas jaringan, HTTP asinkron, dan rilis soket.
- Menyuntikkan fondasi klien telemetri WebSocket dengan wujud *Singleton Class*. Hal ini memastikan sistem *pub/sub* berada murni di luar siklus *render* antarmuka React.
- Menerapkan lapisan pengaman melalui skema algoritma *exponential backoff* jika sambungan memutus otomatis.
- Menyusun konstruksi berlapis (*abstraction layer*) spesifik dalam pengambilan API lewat modul Axios (*interceptors* otomatis menyematkan token *Bearer* dan mencegat respons galat 401).

## [Phase 5] Global Toast System
**Status:** Selesai
**Fokus Utama:** Notifikasi sistem umpan balik pengguna.
- Merakit komponen peringatan tunggal (*ToastCard*) bertenaga animasi `framer-motion`.
- Menyediakan baris kontainer notifikasi (`ToastContainer`) dengan mekanisme eliminasi otomatis (hitungan waktu mundur *timeout* 5 detik).
- Menghasilkan purwarupa komponen `PersistentAlertBar`, dirancang menetap jika peringatan menuntut penanganan mendesak.

## [Phase 6] Dashboard Atomic Components (Current)
**Status:** Sedang Berjalan (*In Progress*)
**Fokus Utama:** Iterasi teknis dan sentuhan detail untuk modul-modul fungsional Dasbor.
- **SensorGaugeChart**: Refaktor radikal dengan menanggalkan desain bundar lama menjadi kurva parameter semi-sirkular (*busur derajat 180*) bergaya *Neumorphic*. Dilengkapi kalkulasi trigonometri garis radial penunjuk (*pointer*) berbasis koordinat *SVG murni*.
- **MachineCard**: Menyesuaikan skala hierarki visual. Ilustrasi aset *render* mesin 3D diperbesar, tata letak teks direposisi (*rata kiri*), dan lapisan warna adaptif menyesuaikan status keterpilihan mesin aktif dan tidak aktif.
- **RULCircularGauge**: Dikonfigurasi secara spesifik untuk membelah kontainer ruang informasi utama (`RULBanner`).
- **AnomalyTimeline**: Implementasi lintasan rentang waktu (*horizontal bar*). Menghubungkan logika pemetaan posisi dari *mock data timestamp* persentase kordinat `left:` berbasis CSS.
  - *Perbaikan Khusus*: Mengintervensi kendala `overflow-hidden` pembungkus utama sehingga alat lapor *tooltip hover* dapat menjebol bingkai utama.
  - *Perbaikan Khusus*: Memutar vektor parameter *tooltip* untuk selalu tampil di ambang sisi kanan garis (*dot*), menghapus risiko kliping atas.
- **IconNavBar (Peningkatan)**: Revisi orientasi sumbu Y dan transisi pendar gradien eksklusif *active state* item.
- **MaintenanceKPIBar**: Dirancang ulang dan diimplementasikan secara komprehensif. Menghubungkan *surgical subscription* langsung dari `machineStore`. Layout diubah menjadi format *grid* 3x2 yang harmonis dengan kartu *VITAL SIGNS*, dilengkapi efek *Neumorphic glowing ring* interaktif berbasis proporsi persentase data (Confidence, RUL, dll).

---

*Log histori teknis ini akan berlanjut mengikuti linimasa penyelesaian fase proyek di iterasi berikutnya.*
