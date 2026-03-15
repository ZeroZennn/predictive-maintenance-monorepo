Pengetahuan Berdasarkan Simulasi di RapidMiner/Ai Studio


🏆 FASE 1: EXPLORATORY DATA ANALYSIS (EDA)
Anda telah membuktikan bahwa membuang data yang salah sama pentingnya dengan memproses data yang benar.

Pengetahuan Absolut:
    - Rasio Data Timpang (Imbalanced Class): Kerusakan mesin sangat langka dibandingkan kondisi sehat. Ini adalah akar masalah yang mewajibkan penggunaan algoritma penyeimbang di akhir fase.
    - Pembuangan "Fitur Sampah" (Feature Selection): Sensor humidity dan operating_hours memiliki korelasi nyaris nol terhadap kerusakan. Mempertahankannya hanya akan menambah beban komputasi server.
    - Hukum Fisika Kegagalan: Mayoritas kerusakan secara visual terkumpul di area suhu ekstrem (>80°C) yang selalu didahului oleh lonjakan getaran.

    💻 Catatan Implementasi Coding (Python):
    - Gunakan df.drop(columns=['humidity', 'operating_hours']) sedini mungkin.
    - Gunakan df['failure'].value_counts(normalize=True) untuk membuktikan kepada manajemen betapa timpangnya data tersebut (misal: 99.9% vs 0.1%).

🏆 FASE 2: FEATURE ENGINEERING & TEXT MINING
Anda berevolusi menjadi "Arsitek Data" yang berhasil menyelamatkan sistem dari logical bug dan ledakan database.
Pengetahuan Absolut:
    - Translasi NLP ke Biner: Catatan teknisi ("Sensor panas", "Korsleting") WAJIB diekstrak menjadi kolom angka (1/0) seperti is_thermal_issue agar AI yang "buta huruf" bisa menghitungnya.
    - Filter Konteks (Abaikan Preventive): Jangan hanya buta mencari kata kunci. Perawatan rutin (maintenance_type == "Preventive") BUKANLAH kerusakan. Jika ikut dihitung, model akan penuh False Positive.
    - Hukum Multi-Key Join: Saat menggabungkan tabel sensor dan log teknisi, WAJIB menggunakan dua kunci: machine_id DAN timestamp. Jika hanya memakai ID, data akan meledak menjadi jutaan baris (Cartesian Product).
    - Penanganan Kekosongan (Missing Values): Data log yang kosong (NaN) pasca-join adalah tanda mesin sehat. WAJIB diisi dengan angka 0, BUKAN dihapus barisnya.

    💻 Catatan Implementasi Coding (Python):
    - Gunakan .str.contains('panas|suhu', case=False, na=False) dikombinasikan dengan kondisi != 'Preventive' menggunakan numpy.where().
    - Gunakan pd.merge(df_sensor, df_log, on=['machine_id', 'timestamp'], how='left').
    - Segera eksekusi df.fillna(0) setelah proses merge selesai.

🏆 FASE 3: DETEKSI ANOMALI (UNSUPERVISED)
Anda merancang "Sistem Radar Dini" yang bisa melihat apa yang tidak bisa dilihat oleh aturan IF-ELSE tradisional.
Pengetahuan Absolut:
    - Kekuatan Mata Multidimensi: AI bisa mendeteksi anomali yang tersembunyi di tengah suhu normal, karena AI melihat lonjakan di dimensi lain (seperti Tekanan atau Konsumsi Daya) secara bersamaan.
    - Hukum Wajib Normalisasi (Scaling): Algoritma pencari anomali (berbasis jarak spasial) sangat buta jika tidak di-skala. RPM yang bernilai ribuan akan selalu "menelan" sensor getaran yang bernilai desimal.
    - Konsep "Suspek" vs "Vonis": Algoritma Isolation Forest HANYA bertugas menetapkan status "Suspek/Anomali" per baris. Ia tidak boleh langsung membunyikan sirine.
    - Aturan Bisnis (Rolling Alarm): Untuk membasmi False Alarm akibat sensor glitch (rusak 1 detik), alarm nyata baru boleh menyala jika AI berteriak anomali selama 3 jam berturut-turut.

    💻 Catatan Implementasi Coding (Python):
    - WAJIB gunakan StandardScaler() atau MinMaxScaler() dari sklearn.preprocessing sebelum data masuk ke model anomali.
    - Terapkan trik Rolling Window: df['is_anomaly'].rolling(window=3).sum() >= 3 untuk memicu alarm yang sesungguhnya.

🏆 FASE 4: FAILURE CLASSIFICATION (SUPERVISED)
Anda mendidik AI untuk menjadi "Dokter Spesialis" dan menghindari jebakan akurasi palsu dari data yang tidak seimbang.
Pengetahuan Absolut:
    - Ilusi Akurasi (The Accuracy Trap): Haram hukumnya percaya pada skor Akurasi 99% jika data Anda timpang. Model pemalas akan selalu menebak "Sehat" dan mendapat nilai tinggi, tapi membiarkan pabrik meledak. Metrik utama penentu keberhasilan adalah Recall (kemampuan menangkap semua kerusakan asli).
    - SMOTE sebagai Penyelamat: WAJIB menciptakan data sintetik untuk kelas kerusakan agar seimbang. Namun ingat, SMOTE HANYA boleh diterapkan pada data Training (belajar), tidak boleh pada data Test (ujian lapangan).
    - Anti-Menyontek Masa Depan (No Data Leakage): Di data waktu (Time-Series), WAJIB menggunakan metode Linear Split (potong berdasarkan urutan waktu). Jangan pernah mengacak data secara acak (shuffled), karena AI akan belajar dari masa depan untuk menebak masa lalu.
    - Anatomi Kerusakan (Feature Importance): Hasil bedah otak Random Forest membuktikan bahwa Guncangan (vibration), Kebisingan (noise_level), dan Tekanan (pressure) adalah indikator fisik paling mematikan bagi mesin, disusul oleh riwayat log teknisi.

    💻 Catatan Implementasi Coding (Python):
    - Pembuatan 3 Label (Tantangan Baru): Gunakan df.groupby('machine_id')['failure'].shift(-n) untuk melihat ke masa depan dan membuat label klasifikasi Healthy, Warning (3-7 hari sebelum mati), dan Critical (0-2 hari sebelum mati).
    - Jangan gunakan train_test_split(shuffle=True). Ganti parameter menjadi shuffle=False atau gunakan TimeSeriesSplit.
    Panggil model.feature_importances_ setelah training untuk mengekstrak ranking sensor tanpa terpengaruh bias algoritma tradisional.

Dengan Knowledge Base ini, Anda tidak perlu lagi meraba-raba logika saat menghadapi error di code editor. Anda sudah tahu alasan di balik setiap baris kode yang akan Anda tulis.
