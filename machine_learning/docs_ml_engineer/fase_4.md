FASE 4: Failure Classification (Dokter Diagnosa)

Tujuan utama fase ini adalah membangun model (Random Forest) yang bisa membaca baris data saat ini dan langsung mengeluarkan diagnosis pasti untuk dikirim ke dashboard API: Apakah mesin ini Sehat (Healthy), Peringatan (Warning), atau Kritis (Critical/Akan rusak dalam 2 hari)?

Langkah 4.1: Rekayasa Label Target (Menciptakan Masa Depan)
    - Konsep: Di data asli sensor_readings.csv, Anda hanya punya kolom failure biner (0 = hidup, 1 = mati). Tapi dashboard butuh label Multi-class (Healthy, Warning, Critical). Anda harus "menciptakan" label ini dengan melihat ke belakang dari titik kerusakan.
    - Teknis (Python): * Anda harus menghitung jarak (dalam jam/hari) setiap baris menuju titik failure == 1 berikutnya untuk mesin tersebut. Gunakan kombinasi df.groupby('machine_id')['failure'].shift(-n).
        - Buat logika kategori (Fungsi If/Else di Pandas):
            - Jika jarak menuju kerusakan > 7 hari -> label = 0 (Healthy).
            - Jika jarak menuju kerusakan 3 hingga 7 hari -> label = 1 (Warning).
            - Jika jarak menuju kerusakan 0 hingga 2 hari -> label = 2 (Critical).
        - Hasilnya: Anda memiliki kolom target baru bernama status_label.

Langkah 4.2: Pembagian Data yang Haram Diacak (Time-Series Split)
    - Konsep: Ini adalah jebakan paling umum bagi pemula, yang sudah Anda buktikan sendiri di simulasi. Di data biasa, kita membagi data Train dan Test secara acak (Random Split). Di data Time-Series, mengacak data adalah dosa besar (disebut Data Leakage). Model tidak boleh meminjam "mesin waktu" menggunakan data bulan Agustus untuk menebak data bulan Juli.
    - Teknis (Python):
        - JANGAN gunakan train_test_split(shuffle=True) biasa.
        - Hukum Split Waktu: Gunakan pemisahan berdasarkan urutan waktu secara linear (shuffle=False), atau gunakan TimeSeriesSplit dari pustaka sklearn.model_selection. Pastikan 70% data terlama murni untuk belajar, dan 30% data terbaru murni untuk ujian lapangan.

Langkah 4.3: Operasi Penyelamatan Data (SMOTE)
    - Konsep (Class Imbalance): Dari 100.000 baris, mesin sehat mungkin berjumlah 99.000 baris, dan status kritis hanya 1.000 baris. Jika Anda langsung melatih model, AI akan menjadi "pemalas" (mengalami Accuracy Trap). Ia akan selalu menebak Sehat, mendapat akurasi 99%, tapi membiarkan pabrik meledak!
    - Teknis (Python): * Gunakan teknik SMOTE (Synthetic Minority Over-sampling Technique) dari pustaka imblearn.over_sampling. Algoritma ini akan menciptakan "data palsu sintetik" untuk kelas minoritas (Warning dan Critical) berdasarkan tetangga terdekatnya, sehingga jumlah soal ujiannya seimbang.
        - ATURAN EMAS: Terapkan fungsi smote.fit_resample(X_train, y_train) HANYA PADA DATA TRAINING. Jangan pernah melakukan SMOTE pada data Test, karena data Test harus dibiarkan timpang agar mencerminkan realita lapangan.

Langkah 4.4: Melatih Sang Dokter & Mengekstrak Otak AI
    - Konsep: Model ini akan memakan puluhan fitur yang sudah Anda buat di Fase 2 (Suhu rata-rata, FFT, Status Log Teknisi NLP, dll) ditambah sinyal suspek anomali dari Fase 3.
    - Teknis (Python):
        - Panggil model: from sklearn.ensemble import RandomForestClassifier. (Random Forest direkomendasikan karena sangat kuat menangani data tabular kompleks dan kebal terhadap skala angka).
        - Latih model dengan data yang sudah di-SMOTE: model_rf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42).fit(X_train_smote, y_train_smote).
        - Lakukan prediksi ke masa depan: y_pred = model_rf.predict(X_test).
        - Ekstraksi Otak AI: Panggil model_rf.feature_importances_. Anda akan membuktikan di Python bahwa sensor guncangan (vibration) dan kebisingan (noise_level) adalah indikator fisik dengan bobot paling mematikan yang mendahului kerusakan, bukan sekadar suhu.

Langkah 4.5: Evaluasi Diagnosa (Jangan Terkecoh Akurasi!)
    - Konsep: Dosen penguji dan manajemen Lapis AI akan mencari metrik ini. Akurasi 99% tidak ada artinya di sistem Predictive Maintenance. Yang paling penting adalah metrik Recall untuk kelas Critical. (Lebih baik sistem salah menebak mesin sehat menjadi kritis [False Alarm], daripada mesin kritis tertebak sehat dan meledak [False Negative]).
    - Teknis (Python):
        - Tampilkan Confusion Matrix (from sklearn.metrics import confusion_matrix). Ini menunjukkan berapa kali AI salah menebak label tertentu.
        - Cetak Classification Report (classification_report(y_test, y_pred)).
        - Target Evaluasi: Fokus matamu pada skor Recall untuk label 2 (Critical). Di simulasi, Anda berhasil mencapai ~80%. Jika di Python nilainya di atas 80%, selamat! Dokter AI Anda sudah sangat ahli mengenali gejala kerusakan fatal dan siap dikirim format JSON-nya ke Frontend melalui API Contract V2.

Melalui Fase 4 ini, peran Anda telah naik kelas menjadi arsitek model yang memahami konteks bisnis dan kebal terhadap jebakan statistika. Output dari fase ini secara langsung mengontrol warna lampu (Hijau, Kuning, Merah) pada dashboard sistem.

