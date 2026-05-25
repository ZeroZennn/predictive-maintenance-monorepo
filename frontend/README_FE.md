# PRIME Frontend Documentation

## 1. Struktur Folder Frontend
```text
frontend/
├── .env.local
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── (app)/        # Protected routes (Dashboard, Admin, dll)
│   │   │   ├── admin/
│   │   │   ├── admin-preview/
│   │   │   ├── copilot-hub/
│   │   │   ├── dashboard/
│   │   │   ├── dev/
│   │   │   └── scheduler/
│   │   ├── (auth)/       # Authentication routes
│   │   │   └── login/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx      # Landing page
│   ├── components/       # Reusable components
│   │   ├── admin/
│   │   ├── copilot/
│   │   ├── dashboard/
│   │   ├── landing/
│   │   ├── layout/
│   │   ├── providers/
│   │   ├── scheduler/
│   │   └── ui/
│   ├── config/
│   ├── hooks/
│   ├── lib/
│   │   └── websocket/    # WebSocket client & event handlers
│   ├── stores/           # Zustand state management
│   ├── types/
│   └── middleware.ts
└── tsconfig.json
```

## 2. Tech Stack Utama
- **Framework:** Next.js (v16.2.4) & React 19
- **State Management:** Zustand (v5)
- **Styling:** Tailwind CSS (v4) & Framer Motion
- **WebSocket Client:** Native `WebSocket` API (via custom `ws-manager.ts`)
- **Charting Library:** Recharts

## 3. Daftar Halaman (Pages) dan Status
| Halaman | Path | Keterangan / Status |
|---|---|---|
| **Landing Page** | `/` | Halaman utama publik |
| **Login** | `/login` | Autentikasi pengguna |
| **Dashboard** | `/dashboard` | Monitoring sensor real-time |
| **Scheduler** | `/scheduler` | Jadwal maintenance preventif/prediktif |
| **Admin** | `/admin` | Manajemen user dan pengaturan aplikasi |
| **Copilot Hub** | `/copilot-hub` | Asisten AI berbasis NLP |
| **Dev Tools** | `/dev` | Halaman utilitas pengembangan |

*(Status secara umum saat ini sedang dalam tahap Integrasi E2E - Frontend/Backend/ML)*

## 4. Komponen Utama Per Halaman
Berdasarkan struktur folder di `src/components/`:
- **Admin (`components/admin/`)**: Komponen untuk pengaturan pengguna, panel kontrol simulator, dll.
- **Copilot (`components/copilot/`)**: Interface chatbot AI, inject context UI.
- **Dashboard (`components/dashboard/`)**: Sensor gauge, timeline anomali, health badge, RUL banner, alert widget.
- **Landing (`components/landing/`)**: Hero section, fitur, footer untuk halaman publik.
- **Layout (`components/layout/`)**: Sidebar navigasi role-based, topbar, wrapper layout utama.
- **Scheduler (`components/scheduler/`)**: Komponen kalender, form penambahan jadwal manual, completion form.
- **UI (`components/ui/`)**: Reusable UI component (button, card, input, dialog, toast, dll).

## 5. Cara Menjalankan Frontend Lokal
1. Buka terminal di folder `frontend`.
2. Install dependencies (hanya pertama kali):
   ```bash
   npm install
   ```
3. Jalankan development server:
   ```bash
   npm run dev
   ```
4. Buka [http://localhost:3000](http://localhost:3000) di browser.

## 6. Environment Variables (`.env.local`)
Buat file `.env.local` di folder `frontend/` jika belum ada. Konfigurasi saat ini:
```env
# DEV BYPASS — Lewati autentikasi selama development
# WAJIB dihapus atau di-set false sebelum production build
NEXT_PUBLIC_SKIP_AUTH="true"

# Tambahan (Opsional) jika perlu koneksi ke backend/WebSocket:
# NEXT_PUBLIC_API_URL="http://localhost:8000"
# NEXT_PUBLIC_WS_URL="ws://localhost:8000/ws"
```

## 7. Naming Convention WebSocket Event Listener
Menggunakan konvensi UPPER_SNAKE_CASE untuk internal frontend events, dan snake_case untuk payload dari machine learning/backend. Definisi event ada di `src/lib/websocket/ws-events.ts`:

| Event Name | Keterangan |
|---|---|
| `MACHINE_UPDATE` | Diterima setiap ada data sensor baru |
| `CRITICAL_ALERT` | Diterima saat mesin masuk status CRITICAL |
| `WARNING_ALERT` | Diterima saat mesin masuk status WARNING |
| `STATUS_RESOLVED` | Diterima saat mesin kembali ke HEALTHY |
| `new_maintenance_task` | Diterima saat ML mendeteksi mesin butuh maintenance |
| `CONNECTION_ACK` | Konfirmasi koneksi berhasil dari backend |
