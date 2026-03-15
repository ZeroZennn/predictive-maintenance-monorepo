FASE 1: Exploratory Data Analysis (EDA) & Pembersihan Data

Di fase ini, Anda bertindak sebagai "Detektif Data". Jangan buru-buru melatih model AI jika Anda belum kenal karakter data Anda. Penemuan di fase ini akan menentukan efisiensi memori server dan kualitas komputasi di fase berikutnya.

Langkah 1.1: Data Ingestion & Inspeksi Awal (Termasuk Cek Rasio Timpang)
    - Apa yang dilakukan: Memuat sensor_readings.csv ke dalam memori, memformat ulang waktu, dan melihat seberapa parah ketidakseimbangan (imbalance) antara mesin sehat dan rusak.
    - Teknis (Python):
        - Gunakan df = pd.read_csv('sensor_readings.csv').
        - Ubah tipe data kolom timestamp dari string (teks) menjadi format waktu sesungguhnya menggunakan pd.to_datetime(). Ini wajib agar data bisa diurutkan secara kronologis.
        - Set kolom timestamp menjadi index dari DataFrame Anda.
        - Cek Rasio Kelas: Gunakan perintah df['failure'].value_counts(normalize=True). Anda akan menemukan fakta bahwa kerusakan sangat langka (proporsi sehat bisa mencapai 99.9%). Ini adalah bukti empiris yang mewajibkan Anda menggunakan teknik SMOTE di Fase 4 nanti.

Langkah 1.2: Pembersihan Data (Data Cleaning) & Penghapusan Fitur Sampah (Feature Selection)
    - Apa yang dilakukan: Menangani data kotor (sensor mati/error sementara) dan membuang kolom yang membebani server tanpa memberikan nilai prediktif.
    - Teknis (Python):
        - Cek nilai kosong (Missing Values). Jika ada sensor fisik yang bolong 1-2 jam, gunakan metode interpolasi linier (df.interpolate()) untuk menebak angka di antara jam yang bolong secara halus.
        - Hapus outlier ekstrem yang tidak masuk akal secara fisika mesin (misal menggunakan metode Z-Score atau IQR untuk membuang lonjakan suhu 1000°C akibat glitch sensor).
        - Informasi Aturan dari Simulasi: Segera eksekusi df.drop(columns=['humidity', 'operating_hours']). Simulasi membuktikan kedua metrik ini memiliki korelasi absolut 0.00 terhadap kerusakan. Mempertahankannya hanya akan membuat AI bingung dan memakan RAM secara sia-sia.

Langkah 1.3: Visualisasi Degradasi & Validasi Hukum Fisika (Time-Series Plotting)
    - Apa yang dilakukan: Melihat bagaimana wujud grafik suhu dan getaran saat mesin bergerak dari status "Sehat" menuju "Rusak" (failure = 1), serta memvalidasi hukum fisika mesin Lapis AI.
    - Teknis (Python):
        - Gunakan matplotlib atau seaborn. Buat grafik garis (line chart). Sumbu X adalah waktu (berbulan-bulan), sumbu Y adalah nilai sensor.
        - Tandai titik di mana mesin rusak dengan garis vertikal merah.
        - Fakta Fisika Simulasi: Saat menganalisis plot tersebut, perhatikan bahwa lonjakan kerusakan (garis merah) selalu terkumpul dan berpusat pada area suhu ekstrem (>80°C). Suhu mendidih ini selalu didahului oleh lonjakan getaran (vibration) yang tajam beberapa hari sebelumnya. Pola rambatan inilah yang nantinya akan ditangkap oleh model LSTM.

Langkah 1.4: Analisis Korelasi (Sinkronisasi Orkestra Sensor)
    - Apa yang dilakukan: Mencari tahu hubungan antar-sensor untuk memastikan kelogisan data fisik yang terekam.
    - Teknis (Python): * Buat Heatmap Correlation (seaborn.heatmap()).
        - Temuan Sinkronisasi Hasil Simulasi: Anda akan melihat korelasi positif yang saling mengikat antara temperature, vibration, pressure, rpm, power_consumption, dan noise_level. Sensor-sensor ini bergerak bagaikan sebuah "orkestra" (saat tekanan naik, getaran naik, suara makin bising, dan mesin memanas). Pemahaman ini penting sebagai dasar pembentukan Rolling Statistics di Fase 2 nanti.

