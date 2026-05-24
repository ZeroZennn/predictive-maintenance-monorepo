# Draf BAB IV - HASIL DAN PEMBAHASAN (Porsi Role D: Frontend Engineer)
*Proyek: Penggabungan Metode Machine Learning dan Retrieval-Augmented Generation untuk Optimasi Penjadwalan pada Pemeliharaan Prediktif Peralatan Industri Manufaktur (Sistem PRIME)*

---

## 4.2 Perancangan Sistem

Pada bagian ini, diuraikan perancangan arsitektur antarmuka pengguna (Frontend) yang dibangun untuk mendukung Sistem PRIME. Perancangan difokuskan pada penyediaan antarmuka yang responsif, interaktif secara *real-time*, dan aman secara akses (Role-Based Access Control). 

Secara arsitektur, sistem *frontend* dirancang menggunakan *framework* Next.js versi 14 dengan pendekatan *App Router*. Untuk memenuhi kebutuhan pembaruan data telemetri berfrekuensi tinggi dari peralatan industri, dirancang sebuah *WebSocket Engine* yang berjalan secara *singleton* di luar siklus perenderan *React*, guna meminimalkan beban komputasi. Manajemen *state* global dirancang menggunakan Zustand yang dibagi menjadi beberapa penyimpanan terisolasi (seperti *Machine Store*, *Copilot Store*, *UI Store*, dan *Toast Store*) agar manipulasi data dapat dilakukan tanpa memicu perenderan ulang secara keseluruhan. 

Sistem desain dan antarmuka dirancang berbasis pendekatan *Atomic Design* menggunakan utilitas Tailwind CSS yang dipadukan dengan variabel CSS murni (*CSS Custom Properties*) untuk pengaturan *theme* secara dinamis. Selain itu, perancangan keamanan rute antarmuka (*route guard*) diatur melalui Next.js *Edge Middleware* dengan sistem berlapis, untuk memastikan pemisahan akses operasional antara peran Teknisi dan Administrator.

## 4.3 Implementasi Sistem

Tahap implementasi antarmuka pengguna dibagi menjadi beberapa fase inkremental yang terstruktur:

**1. Implementasi Fondasi dan Sistem Desain (Fase 0 - 2)**
Implementasi diawali dengan inisialisasi lingkungan pengembangan menggunakan Next.js dan TypeScript. Konfigurasi desain visual sistem (palet warna, tipografi, dan animasi khusus seperti status kritis/peringatan) ditanamkan melalui Tailwind CSS. Pada fase ini juga diimplementasikan komponen kerangka tata letak utama (*App Shell*, *IconNavBar*) serta penerapan *Edge Middleware* untuk autentikasi dan validasi peran (RBAC).

**2. Implementasi Manajemen Data dan Integrasi Real-Time (Fase 3 - 4)**
Sistem manajemen status (Zustand) dan *Application Programming Interface* (API) dibangun pada lapisan ini. Kelas *WebSocket Manager* direalisasikan guna menangani koneksi berkelanjutan dengan *backend*. Seluruh data yang mengalir, baik dari *REST API* (menggunakan *interceptor* Axios) maupun dari transmisi data sensor *real-time*, diproses di lapisan ini sebelum disalurkan ke komponen visual.

**3. Implementasi Dasbor Utama dan Notifikasi (Fase 5 - 7)**
Pengembangan dilanjutkan dengan pembangunan berbagai komponen penyusun (*atomic components*) seperti grafik *gauge* sensor (dibangun menggunakan SVG murni untuk performa), kartu mesin, dan garis waktu anomali (*Anomaly Timeline*). Keseluruhan komponen tersebut digabungkan menjadi halaman Dasbor *Real-Time* yang dapat memperbarui indikator parameter kesehatan mesin (seperti peringatan maupun perkiraan sisa umur/RUL) secara langsung. Sistem notifikasi *toast* global juga disematkan dengan animasi menggunakan *Framer Motion*.

**4. Implementasi Modul Asisten AI Copilot (Fase 8 - 9)**
Untuk memfasilitasi interaksi pengguna dengan modul *Retrieval-Augmented Generation* (RAG), diimplementasikan komponen asisten virtual (AI Copilot). Antarmuka asisten ini direalisasikan dalam dua bentuk: panel mengambang (*Sliding Panel*) yang dapat diakses di seluruh halaman, serta halaman pusat kendali penuh (*AI Copilot Hub*) yang dilengkapi fungsionalitas riwayat interaksi dan rujukan (*citation chip*).

**5. Implementasi Modul Penjadwalan Pemeliharaan (Fase 10)**
Halaman penjadwalan (*Maintenance Scheduler*) diimplementasikan berupa papan tugas (*Task Board*) dengan pengelompokan tingkat urgensi (*Urgent*, *Soon*, *Scheduled*). Antarmuka ini dapat bereaksi secara otomatis untuk menampilkan tugas pemeliharaan baru berdasarkan flag anomali yang diterima secara interaktif dari *backend*.

**6. Implementasi Modul Panel Admin (Fase 11)**
Implementasi panel administratif dirancang dalam bentuk antarmuka bertab. Saat ini, tab Dasbor Admin, tab Manajemen Dokumen (dengan fitur seret dan lepas, serta bilah progres unggah), dan tab Manajemen Pengguna (beserta fungsionalitas mutasi data) telah selesai diimplementasikan. Untuk tab Manajemen *Logs* & Laporan saat ini berstatus **[Sedang dalam pengerjaan]**.

## 4.4 Pengujian

### 4.4.1 Deskripsi Pengujian
Pengujian antarmuka pengguna difokuskan pada tiga aspek utama: (1) Profiling Kinerja Perenderan menggunakan *React DevTools* untuk memastikan pembaruan *WebSocket* tidak memicu kebocoran memori atau perenderan massal, (2) Pengujian skor audit *Lighthouse* (metrik *Performance*, *Accessibility*, dan INP/*Interaction to Next Paint*), serta (3) Analisis bundel (*Bundle Analyzer*) untuk optimalisasi muatan aset. Saat ini, fase audit performa sistem secara utuh berstatus **[Sedang dalam pengerjaan]**.

### 4.4.2 Prosedur Pengujian
Prosedur pengujian kinerja direpresentasikan melalui skenario simulasi di mana sistem menerima ratusan sinyal pembaruan sensor secara simultan. *React Profiler* akan merekam beban komputasi setiap kartu mesin. Sementara untuk pengujian *Lighthouse*, pengujian dilakukan pada kondisi *production build* tanpa mode *bypass* autentikasi. Penyusunan prosedur pengujian lengkap saat ini **[Sedang dalam pengerjaan]**.

### 4.4.3 Data Hasil
Pengambilan metrik performa aktual (skor Lighthouse, INP latency, ukuran berkas per *chunk*) belum dilakukan karena sistem belum memasuki fase *Deployment Preparation* (Fase 15). Oleh karena itu, rekapitulasi data hasil pengujian saat ini **[Sedang dalam pengerjaan]**.

### 4.4.4 Analisis dan Evaluasi
Evaluasi tingkat responsivitas komponen SVG khusus, tingkat akurasi pemisahan *Role-Based Access Control*, serta stabilitas sistem dalam mempertahankan koneksi *WebSocket* dalam jangka waktu panjang masih dalam proses penyusunan. Analisis pengujian ini berstatus **[Sedang dalam pengerjaan]**.
