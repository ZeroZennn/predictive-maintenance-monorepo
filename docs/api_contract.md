DOKUMEN API CONTRACT & DATA DICTIONARY
Proyek: Sistem Predictive Maintenance (Lapis AI)
Versi: 1.0 (Final Architecture)
Base URL API: http://localhost:8000
Base URL WebSocket: ws://localhost:8000

1. LAYANAN TELEMETRI & PREDIKSI AI (WebSocket)
Fungsi: Mengalirkan data detak jantung mesin (mentah), hasil kalkulasi kilat (matang), riwayat teknisi (NLP), dan diagnosis AI ke layar dashboard secara real-time.
Protokol: WebSocket (ws://)
Endpoint: /ws/telemetry
Arah Data: Server (Role C) -> Browser (Role D)
Format JSON yang Dipancarkan Server (Payload):
{
  "tipe_pesan": "telemetry_update",
  "timestamp": "2026-03-15 13:00:00",
  "machine_id": "M-01",
  
  "sensor_raw": {
    "temperature": 89.7,
    "vibration": 1.23,
    "pressure": 112.8,
    "rpm": 2450,
    "power_consumption": 45.2,
    "noise_level": 88.5
  },
  
  "sensor_rolling_stats": {
    "temp_mean_24h": 78.5,
    "vib_max_24h": 1.30,
    "noise_mean_24h": 75.0,
    "rate_of_change_pressure": 5.2
  },
  
  "nlp_history_context": {
    "is_thermal_issue": 1,
    "is_mechanical_issue": 0,
    "is_electrical_issue": 0
  },
  
  "ai_prediction": {
    "status": "Critical",
    "is_rolling_anomaly": true,
    "rul_days": 1.5
  }
}

Panduan Tambahan untuk Frontend (Kamus Data V2):
    - sensor_raw.noise_level & vibration: (Frontend: Karena ini adalah 2 indikator paling mematikan menurut Random Forest, buatkan elemen visual khusus. Misalnya, jika grafiknya menyentuh batas tertentu, buat garisnya menjadi lebih tebal atau berikan efek glow merah).
    - sensor_rolling_stats: (Frontend: Sesuaikan teks statis dengan indikator utama, misalnya: "Guncangan Maksimal 24 Jam Terakhir: 1.30").
    - nlp_history_context: (Frontend: Nilai 1 berarti ada riwayat masalah. Buat 3 ikon berbeda di dekat nama mesin: Ikon Api untuk Thermal, Ikon Roda Gigi untuk Mechanical, Ikon Petir untuk Electrical. Nyalakan ikonnya jika nilainya 1).
    - ai_prediction.is_rolling_anomaly (Boolean): (Frontend: Jika bernilai true, ini menandakan anomali persisten [sudah berlangsung >3 jam]. Munculkan pop-up toast peringatan atau bunyi buzzer ringan di browser, terlepas dari status "Warning" atau "Critical").
    - ai_prediction.status (String): (Frontend: Nilainya pasti Healthy, Warning, atau Critical. Gunakan untuk mengubah warna kartu mesin. Hijau untuk Sehat, Kuning untuk Warning, Merah Berkedip untuk Critical).

2. LAYANAN DSS & KALKULATOR ROI (REST API)
Fungsi: Menghitung rekomendasi jadwal perbaikan dan analisis finansial (Cost-Benefit) saat teknisi menekan tombol di dashboard.
Protokol: HTTP POST
Endpoint: /api/dss/calculate
Arah Data: Browser (Role D) <-> Server (Role C)
Format JSON yang Dikirim Frontend (Request):
JSON
{
  "machine_id": "M-01",
  "rul_hari": 1.5,
  "hari_ini": "Senin"
}


Format JSON yang Dibalas Server (Response):
JSON
{
  "machine_id": "M-01",
  "rekomendasi_tindakan": "Jadwalkan perbaikan darurat pada hari Selasa",
  "analisis_finansial": {
    "potensi_kerugian_mendadak": "Rp 150.000.000",
    "biaya_perbaikan_terencana": "Rp 25.000.000",
    "roi_penghematan": "Rp 125.000.000"
  }
}


Kamus Data (Data Dictionary) & Panduan:
    - rul_hari (Float): Frontend harus mengambil angka ini dari state WebSocket terakhir yang diterima, lalu mengirimkannya ke sini.
    - analisis_finansial (Object): Backend sengaja mengirimkan data ini dalam format teks (String) yang sudah dibumbui "Rp" dan titik ribuan. (Frontend: Tidak perlu menghitung atau memformat ulang, cukup cetak (render) teks ini langsung ke layar).

3. LAYANAN AI COPILOT / RAG CHATBOT (REST API)
Fungsi: Mengirim pertanyaan teknisi ke otak AI Generatif dan menerima jawaban hasil pembacaan buku manual PDF (pekerjaan Role B).
Protokol: HTTP POST
Endpoint: /api/chat
Arah Data: Browser (Role D) <-> Server (Role C)
Format JSON yang Dikirim Frontend (Request):
JSON
{
  "pertanyaan": "Apa langkah pertama jika suhu M-01 melebihi 90 derajat?"
}


Format JSON yang Dibalas Server (Response):
JSON
{
  "status": "success",
  "jawaban": "Berdasarkan SOP pabrik halaman 15, langkah pertama adalah menekan tombol Emergency Stop, kemudian membuka katup pendingin udara cadangan V-02."
}


Kamus Data (Data Dictionary) & Panduan:
    - pertanyaan (String): Teks mentah dari kolom input chat widget di Frontend.
    - status (String): Indikator keberhasilan. Berisi "success" atau "error".
    - jawaban (String): Teks balasan dari Llama 3 / Gemini. (Frontend: Masukkan teks ini ke dalam kotak bubble chat berwarna biru yang seolah-olah dikirim oleh AI).

Dengan dokumen API Contract ini, perdebatan tentang "nama variabelnya apa" atau "datanya bentuk apa" antara anggota tim Anda akan musnah sama sekali. Tim Backend bisa langsung membuat routing FastAPI, dan tim Frontend bisa langsung membuat layout UI menggunakan data palsu (dummy json) di atas.
Mengingat ini adalah proyek semester 6 yang menggabungkan 5 mata kuliah sekaligus, pondasi arsitektur Anda sekarang sudah luar biasa kokoh.
Langkah operasional apa yang ingin Anda bahas selanjutnya? Apakah Anda ingin saya buatkan draf ringkasan eksekutif untuk presentasi proyek ini di depan dosen, atau ada detail teknis deployment (seperti GitHub atau hosting) yang ingin dieksplorasi?

