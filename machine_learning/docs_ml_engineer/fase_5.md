FASE 5: Deep Learning (LSTM) & Gated RUL untuk Meramal Sisa Umur
Tujuan akhir dari fase ini adalah menghasilkan satu angka absolut: "Remaining Useful Life (RUL) = X Hari/Jam". Kita menggunakan arsitektur Pipeline Sekuensial: LSTM tidak bekerja sendirian, melainkan menunggu aba-aba dari Anomaly Detector (Fase 3).

Langkah 5.1: Rekayasa Target RUL (Menghitung Mundur Kematian)
    - Konsep: Algoritma regresi butuh target berupa angka kontinu. Anda harus membuat kolom baru bernama RUL untuk setiap mesin. Jika mesin M-01 mati pada jam ke-1000, maka pada jam ke-800, RUL-nya adalah 200.
    - Teknis (Python): 1. Kelompokkan data: df.groupby('machine_id').
    2. Cari indeks saat failure == 1 untuk tiap mesin.
    3. Lakukan hitung mundur (pengurangan) dari titik tersebut ke baris sebelumnya.
    - Trik Senior (Piece-wise RUL): AI akan bingung membedakan getaran mesin yang RUL-nya 200 hari vs 150 hari (karena keduanya sama-sama sehat). Batasi nilai maksimal RUL di angka 30 hari (720 jam). Gunakan np.clip(). AI hanya perlu peka ketika RUL sudah di bawah 30 hari menuju kehancuran.

Langkah 5.2: Integrasi Sinyal Anomali (Gated RUL)
    - Konsep: Kita memiliki rasio data krisis yang sangat ekstrem (hanya 0.28%). Memaksa LSTM mencari pola kerusakan di lautan data sehat akan menghasilkan Flatline (tebakan garis datar). Kita butuh sinyal dari Model Fase 3.
    - Teknis (Python): Masukkan output dari Isolation Forest (misal kolom is_rolling_anomaly atau is_anomaly) ke dalam dataset ini sebagai salah satu fitur (X).
    - Trik Senior: Sinyal anomali ini bertindak sebagai "gerbang". Saat AI melihat is_anomaly == 1, bobot LSTM akan otomatis bereaksi keras untuk segera menurunkan garis prediksi RUL-nya.

Langkah 5.3: Pembersihan Forensik & Normalisasi (Pra-Tensor)
    - Konsep: Jaringan Saraf Tiruan (Deep Learning) akan hancur jika menerima data kosong (NaN) atau data dengan skala yang timpang (RPM bernilai ribuan vs Getaran bernilai desimal).
    - Teknis (Python):
        - Eksekusi df.dropna() untuk membuang ~460 baris awal yang bernilai NaN akibat perhitungan Rolling 24h di Fase 2.
        - Pisahkan fitur (X) dan target (y).
        - Eksekusi MinMaxScaler(feature_range=(0,1)) pada seluruh kolom fitur (X) agar skalanya setara.

Langkah 5.4: Transformasi Data Menjadi Tensor 3D (Sliding Window)
    - Konsep: Model LSTM WAJIB menerima input 3D: (Jumlah_Sampel, Langkah_Waktu, Jumlah_Fitur). Anda harus memotong data menjadi "jendela waktu" yang bergeser.
    - Teknis (Python): 
        1. Tentukan time_steps = 24 (jam).
        2. Buat fungsi looping Numpy untuk menggeser jendela: Ambil baris 1-24 $\rightarrow$ Prediksi RUL baris 24.
    - Hukum Anti-Kebocoran Waktu: Pastikan Anda membagi Train dan Test secara kronologis (berdasarkan waktu/machine_id) SEBELUM membuat jendela 3D. JANGAN PERNAH memakai train_test_split(shuffle=True).

Langkah 5.5: Membangun Arsitektur Jaringan & Training Khusus
    - Konsep: Menyusun lapisan memory yang mampu mengingat tren historis 24 jam ke belakang, dan melatihnya dengan fokus pada masa-masa krisis.
    - Teknis (Python - Keras):
        1. model.add(LSTM(units=64, return_sequences=True, input_shape=(24, jumlah_fitur)))
        2. model.add(Dropout(0.2))
        3. model.add(LSTM(units=32, return_sequences=False))
        4. model.add(Dense(units=1)) (Tanpa activation function karena regresi).
        5. Compile: optimizer='adam', loss='mse', metrics=['mae'].
    - Trik Senior (Solusi Imbalance): Saat menjalankan model.fit(), hitung sample weights di mana baris data dengan RUL rendah (mendekati 0) diberikan bobot penalti lebih besar. Ini memaksa AI fokus belajar dari 0.28% data krisis tersebut. Gunakan juga EarlyStopping(patience=5).

Langkah 5.6: Evaluasi Regresi & Visualisasi "Detik Kematian"
    - Konsep: Membuktikan bahwa tebakan angka LSTM menukik tajam seiring rusaknya mesin.
    - Teknis (Python): Hitung MAE dan RMSE. Lakukan Plotting garis biru (Asli) dan merah (Prediksi AI). Ekspor model menggunakan model.save('rul_lstm.h5').
    - Hukum Visualisasi: Jangan mem-plot 200 baris pertama di data Test karena mesinnya masih muda. Arahkan slicing grafik ke akhir data jelang mesin mati, contohnya: plt.plot(y_test_seq[-800:]).

