FASE 2: Feature Engineering & Text Mining (Pabrik Fitur)

Ini adalah jantung dari akurasi Machine Learning. Data mentah (suhu 72°C per jam) kurang memberikan informasi tren. Anda harus meracik variabel baru (kolom turunan) agar AI bisa melihat "gambaran besar" dari kondisi mesin.

Pipeline A: Matematika Sensor (Feature Engineering)

Langkah 2A.1: Rolling Statistics (Jendela Berjalan)
    - Konsep: AI lebih peduli pada tren harian daripada lonjakan per jam.
    - Teknis (Python): Anda membuat kolom baru menggunakan fungsi rolling(window=24).
        - temp_mean_24h: Rata-rata suhu 24 jam ke belakang. (Menghaluskan grafik dari noise sesaat).
        - vib_std_24h: Standar deviasi getaran 24 jam ke belakang. (Jika nilai ini tiba-tiba besar, artinya mesin mulai bergetar tidak stabil).
        - pressure_max_24h: Nilai tekanan tertinggi dalam 24 jam terakhir.
    - Prioritas Sensor Kritis: Berdasarkan hasil simulasi ekstraksi otak AI di Fase 4, noise_level dan vibration adalah indikator paling mematikan. Wajib buat turunan statisnya juga (misal: noise_mean_24h).

Langkah 2A.2: Rate of Change (Kecepatan Perubahan)
    - Konsep: Suhu 80°C mungkin normal. Tapi jika suhu naik dari 60°C ke 80°C hanya dalam 10 menit, itu adalah indikasi kerusakan kritis.
    - Teknis (Python): Buat kolom turunan pertama (selisih) menggunakan fungsi diff() atau persentase perubahan menggunakan pct_change().

Langkah 2A.3: Ekstraksi Frekuensi (Fast Fourier Transform / FFT)
    - Konsep: Data vibration adalah gelombang acak. Kerusakan pada komponen yang berputar (seperti bearing) menghasilkan frekuensi "nada" tertentu yang tersembunyi.
    - Teknis (Python): Gunakan pustaka scipy.fft. Ambil data getaran per 24 jam, ubah dari domain waktu (time domain) ke domain frekuensi (frequency domain). Ambil 3 nilai frekuensi yang paling tinggi (peak frequency) lalu jadikan kolom data baru.

Pipeline B: Text Mining Log Teknisi (NLP Dasar)
    - Di sinilah Anda memproses maintenance_logs.csv secara independen sebelum digabungkan. AI itu "buta huruf", jadi catatan teknisi yang panjang WAJIB diekstrak menjadi format matematis.

Langkah 2B.1: Text Preprocessing (Pembersihan Teks)
    - Konsep: Membersihkan ketikan teknisi yang acak-acakan.
    - Teknis (Python): Gunakan fungsi string bawaan atau pustaka bahasa.
        - Case Folding: Ubah "Overheat!!" menjadi "overheat".
        - Punctuation Removal: Buang tanda seru, koma, titik.
        - Stopword Removal: Buang kata "di", "yang", "dan".

Langkah 2B.2: Keyword Extraction & Hukum Konteks
    - Konsep: Membuat aturan sederhana (rule-based) untuk membedakan jenis masalah, NAMUN dengan batasan konteks operasional pabrik.
    - Teknis (Python): Buat fungsi percabangan (if/else).
        - Jika teks mengandung kata ["panas", "overheat", "terbakar", “pendingin”] -> Kategori = Termal.
        - Jika teks mengandung kata [“belt”, "bearing", “bocor”, "aus", "patah", "gesek"] -> Kategori = Mekanikal.
        - Jika teks mengandung kata ["sensor", "short", "motor", “berhenti”] ->Kategori = Elektrikal.
        - Hukum Konteks (Filter Preventive): Membaca kata kunci saja tidak cukup! Anda WAJIB memberikan syarat untuk mengabaikan tipe Preventive (contoh: if keyword_match AND maintenance_type != 'Preventive'). Jika tidak difilter, model AI akan menjadi bodoh dan mengira perawatan rutin (seperti teknisi mengecek kabel) sebagai kerusakan fatal (False Positive).

Langkah 2B.3: Text Vectorization (Binerisasi)
    - Konsep: Mengubah kategori teks tadi menjadi angka yang bisa dikunyah model AI.
    - Teknis (Python): Anda akan menghasilkan 3 kolom baru di DataFrame log Anda.
        - is_thermal_issue = 1 (jika mesin itu bermasalah termal, sebaliknya 0).
        - is_mechanical_issue = 1 atau 0.
        - is_electrical_issue = 1 atau 0.

Pipeline C: Data Fusion (Penyatuan Dua Dunia)
    - Konsep: Menyatukan data angka sensor fisik (hasil Pipeline A) dengan data angka hasil terjemahan teks (hasil Pipeline B). Di sinilah kesalahan fatal sering terjadi jika tidak berhati-hati.
    - Teknis (Python):
        - Hukum Multi-Key Join (Anti-Ledakan Data): Lakukan penggabungan (merge/left join) WAJIB menggunakan DUA KUNCI sekaligus: machine_id DAN rentang waktu (timestamp / jam kejadian). Jika Anda hanya men-join berdasarkan ID mesin saja, data Anda akan meledak tak terkendali menjadi jutaan baris (Cartesian Product).
        - Penanganan Data Pasca-Join Rasional: 1. Nilai kosong (Missing Values) di kolom teknisi pasca-penggabungan adalah hal normal! Itu menandakan mesin sedang sehat beroperasi dan teknisi tidak ada jadwal perbaikan. Ini WAJIB diisi dengan angka 0 (df.fillna(0)). Jangan dihapus barisnya!
        2. Jika teknisi memasukkan 2 log di jam yang sama, buang duplikatnya (df.drop_duplicates()) agar AI tidak menghitung kerusakan dua kali lipat.

Hasil Akhir Fase 2:
    Sebuah dataset CSV/Pandas raksasa yang sudah siap 100%. Di dalamnya tidak hanya berisi suhu asli, tapi sudah ada rata-rata 24 jam, kecepatan perubahan suhu, frekuensi getaran, dan status riwayat penyakit dari teknisi (0/1). Model AI mana pun yang Anda berikan data matang ini pasti akan menghasilkan akurasi yang lebih logis.
