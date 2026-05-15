Halo Amir,

Terkait pengembangan Lapis AI Fase 5, pipeline ML dan rancangan arsitektur Backend untuk *predictive maintenance* sudah disepakati. Secara garis besar, seluruh kalkulasi berat dan logika penjadwalan sudah di-*handle* oleh Backend (Reynaldi). Tugas utama di sisi Frontend sekarang adalah memastikan visualisasi data dan interaktivitas *real-time* berjalan mulus sesuai desain.

Berikut rincian data yang akan kamu terima dan ekspektasi di sisi Frontend:

**A. Fitur Dashboard Monitoring**

1. **8 Gauge Cards (Live Telemetry):** Kamu akan menerima *stream* data *real-time* via WebSocket dari Backend. Cukup *render* ke dalam komponen Gauge.  
2. **Health Status & Health Score:** Backend akan mengirimkan nilai *Health Score* (angka bulat 0–100) dan *Health Status* (HEALTHY/WARNING/CRITICAL). Cukup gunakan data ini untuk visualisasi *donut chart* atau indikator status.  
3. **RUL Days Banner:** Tampilkan angka RUL (Remaining Useful Life). **Penting:** Jika status mesin dari API menunjukkan indikator is\_active \= false (artinya mesin sehat), tolong sembunyikan angka estimasi rusaknya dan tampilkan *state* teks kondisional: "Mesin dalam kondisi prima".  
4. **Anomaly Timeline:** Backend akan menyediakan *endpoint* REST API yang mengembalikan *array of events* (perubahan status & sensor yang melewati batas). Cukup *render* ke dalam komponen *Timeline vertical* (diurutkan dari yang terbaru di atas).  
5. **Maintenance KPIs:** Seluruh data KPI (MTBF, Total Downtime, dll) akan disediakan matang oleh Backend. Kamu tinggal *mapping* ke *Card* KPI yang ada di UI.

**B. Maintenance Scheduler (Kanban Board)**

Logika penentuan jadwal semuanya ada di Backend. Fokus Frontend adalah sinkronisasi *state*:

* **Struktur Kolom Kanban:** Kita sepakat membaginya menjadi 3 kolom berdasarkan waktu:  
  * 🔴 **URGENT** (\< 3 hari)  
  * 🟡 **SOON** (3 – 7 hari)  
  * 🟢 **SCHEDULED** (\> 7 hari)  
* **WebSocket Listener:** Buat *listener* untuk event Socket.IO bernama new\_maintenance\_task. Jika event ini masuk, Kanban *board* harus *auto-update* tanpa perlu *refresh* halaman.  
* **Badge Type:** Gunakan nilai urgency\_level dari *payload* (EMERGENCY, CORRECTIVE, PREVENTIVE) untuk menentukan warna/ikon *badge* di masing-masing tiket Kanban.

Nanti bisa langsung kordinasi dengan Reynaldi terkait finalisasi *payload* di api\_contract. Beri tahu saya jika ada *state* UI yang butuh parameter tambahan dari model ML.

Thanks\!

Achmad Zikran Maulida

