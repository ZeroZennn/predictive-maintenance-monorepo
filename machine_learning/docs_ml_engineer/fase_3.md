FASE 3: Deteksi Anomali (Penjaga Garis Depan)

Di fase ini, Anda sedang membangun "Sistem Alarm Dini". Perlu diingat, anomali belum tentu berarti mesin rusak total, tetapi itu berarti mesin bertingkah "tidak wajar". Mengapa kita butuh fase ini? Karena jika kita hanya menunggu label failure = 1 (rusak), itu sudah terlambat. Kita ingin sistem berteriak ketika getaran mesin mulai aneh, jauh sebelum mesin itu benar-benar mati.

Langkah 3.1: Persiapan Data (Unsupervised Setup)
    - Konsep: Deteksi anomali menggunakan pendekatan Unsupervised Learning (pembelajaran tanpa pengawasan). Artinya, algoritma ini tidak boleh melihat kolom failure. Ia harus belajar sendiri seperti apa bentuk data yang "normal" murni dari pola angka sensor.
    - Teknis (Python):
        - Pisahkan fitur (X) dan label (y). Simpan kolom failure di variabel terpisah, lalu buang (drop) kolom tersebut dari DataFrame X.
        - Hukum Wajib Normalisasi (Scaling): Ini bukan lagi sekadar saran, melainkan WAJIB. Simulasi membuktikan bahwa tanpa normalisasi, algoritma berbasis jarak akan mengalami kebutaan. Skala RPM (ribuan) akan "menelan" skala getaran (desimal). Gunakan StandardScaler atau MinMaxScaler dari sklearn.preprocessing agar semua sensor berada di rentang yang seragam.

Langkah 3.2: Mengkonfigurasi "Isolation Forest" & Mata Multidimensi
    - Konsep: Mengapa menggunakan Isolation Forest? Karena algoritma ini berfokus pada "mengisolasi keanehan" menggunakan pohon keputusan acak.
    - Kekuatan Mata Multidimensi AI: Simulasi membuktikan bahwa aturan IF-ELSE (misal: "Jika suhu > 85, mesin rusak") adalah metode usang. Isolation Forest bisa menemukan anomali yang nyempil di "tengah" area bersuhu normal karena ia melihat lonjakan di dimensi lain (RPM, Tekanan) secara bersamaan yang tak terlihat oleh mata manusia di grafik 2D.
    - Teknis (Python):
        - Panggil modulnya: from sklearn.ensemble import IsolationForest.
        - Atur parameter krusialnya: contamination. Ini adalah tebakan persentase data kotor/anomali. Jika Anda set contamination=0.01, Anda memberi tahu AI: "Saya yakin 1% dari total 100.000 baris data ini adalah anomali."
        - Atur n_estimators=100 (membuat 100 pohon pelacak agar hasilnya stabil).

Langkah 3.3: Pelatihan & Prediksi (Training & Inference)
    - Konsep: Membiarkan algoritma mengenali pola dan langsung memberikan stempel pada setiap baris data.
    - Teknis (Python):
        - Latih modelnya: model_if = IsolationForest(contamination=0.01).fit(X_scaled).
        - Lakukan prediksi: predictions = model_if.predict(X_scaled).
        - Catatan Penting: Output dari Isolation Forest bukan 1 dan 0. Ia mengeluarkan angka 1 untuk Inliers (Data Normal) dan -1 untuk Outliers (Anomali).

Langkah 3.4: Post-Processing & Logika "Suspek vs Vonis" (Rolling Alarm)
    - Konsep: Di dunia nyata, sensor bisa saja tersenggol debu atau mengalami korsleting selama 1 detik sehingga suhu terbaca ekstrem. Jika AI langsung membunyikan alarm tiap ada 1 angka anomali, teknisi akan jengkel karena terlalu banyak False Alarm.
    - Teknis (Python):
        - Ubah hasil prediksi -1 menjadi 1 (Anomali), dan hasil 1 menjadi 0 (Normal) agar lebih mudah diproses. Simpan di kolom baru bernama is_anomaly.
        - Trik Senior (Suspek vs Vonis): Algoritma HANYA bertugas menetapkan "Suspek" per baris data. Ia tidak bertugas membunyikan sirine. Bunyi sirine adalah tugas Aturan Bisnis.
        - Buat logika Rolling Window: df['is_rolling_anomaly'] = df['is_anomaly'].rolling(window=3).sum() >= 3.
        - Aturan Bisnis: Alarm ke dashboard (sesuai API Contract V2) baru akan bernilai true JIKA DAN HANYA JIKA anomali terdeteksi 3 jam berturut-turut. Ini memastikan kelainan tersebut persisten, bukan sekadar glitch.

Langkah 3.5: Evaluasi Deteksi Anomali & Validasi Fisika
    - Konsep: Karena ini unsupervised (tidak ada kunci jawaban pasti), bagaimana kita tahu modelnya bagus?
    - Teknis (Python): * Plot kembali grafik time-series Anda. Beri titik merah tebal pada rentang waktu di mana kolom is_rolling_anomaly == True.
    - Validasi Hukum Fisika (Sanity Check): Secara visual, titik-titik merah tersebut harus muncul mengerucut di area di mana grafik getaran/suhu mulai naik ekstrem sebelum hari-H kerusakan. Jika titik merah menyala saat grafik lurus-lurus saja dan mesin sehat, berarti nilai contamination Anda harus direvisi.

Dengan selesainya Fase 3 ini, sistem Anda sudah memiliki mata radar berlapis yang sangat peka sekaligus kebal terhadap False Alarm berkat logika "Suspek vs Vonis". Kolom anomali yang baru saja Anda hasilkan ini akan menjadi pelengkap data yang sangat berharga untuk Fase 4 dan Fase 5 nanti.

