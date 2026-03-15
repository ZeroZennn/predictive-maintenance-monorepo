FASE 5: Deep Learning (LSTM & GRU) untuk Meramal Sisa Umur (RUL)

Tujuan akhir dari fase ini adalah menghasilkan satu angka absolut yang sangat krusial bagi bisnis dan tim Frontend: "Remaining Useful Life (RUL) = X Hari/Jam".

Langkah 5.1: Rekayasa Target RUL (Menghitung Mundur Kematian)
    - Konsep: Algoritma regresi butuh target berupa angka kontinu. Anda harus membuat kolom baru bernama RUL untuk setiap mesin. Jika mesin M-01 mati pada jam ke-1000, maka pada jam ke-800, RUL-nya adalah 200.
    - Teknis (Python):
        - Kelompokkan data berdasarkan mesin: df.groupby('machine_id').
        - Cari indeks atau waktu maksimum saat failure == 1 untuk tiap mesin.
        - Lakukan hitung mundur (pengurangan) dari titik kerusakan tersebut ke setiap baris data sebelumnya.
        - Trik Senior (Piece-wise RUL): Mesin yang baru menyala (RUL = 200 hari) memiliki getaran yang sama persis dengan mesin yang RUL-nya 150 hari. AI akan bingung jika disuruh membedakan angka sejauh itu. Oleh karena itu, batasi nilai maksimal RUL (misal maksimal 30 hari). Jika RUL asli 200, potong menjadi 30. AI hanya perlu peka ketika RUL sudah berada di bawah 30 hari menuju kehancuran.

Langkah 5.2: Transformasi Data Menjadi Tensor 3D (Sliding Window)
    - Konsep: Ini adalah bagian paling sulit bagi pemula. Random Forest menerima input 2D (Baris x Fitur). Deep Learning (LSTM/GRU) WAJIB menerima input 3D: (Jumlah_Sampel, Langkah_Waktu, Jumlah_Fitur). Anda harus memotong data menjadi "jendela waktu" (window) yang bergeser.
    - Teknis (Python):
        - Hukum Anti-Kebocoran Waktu: Pastikan Anda membagi Train dan Test secara linear (waktu) SEBELUM membuat jendela 3D ini. Jika Anda memotong 3D lalu mengacaknya, AI akan menyontek masa depan!
        - Tentukan time_steps (misal = 24 jam). Artinya, untuk memprediksi RUL di jam ini, model akan melihat pergerakan noise_level, vibration, dan fitur lain selama 24 jam ke belakang secara berurutan.
        - Buat fungsi looping menggunakan numpy untuk menggeser jendela ini:
            - Ambil baris 1-24 -> Prediksi RUL baris 24.
            - Ambil baris 2-25 -> Prediksi RUL baris 25, dst.
        - Dimensi akhirnya akan terlihat seperti ini: (99000 sampel, 24 jam, 15 kolom fitur).

Langkah 5.3: Membangun Arsitektur Jaringan (Eksperimen LSTM vs GRU)
    - Konsep: Menyusun lapisan-lapisan (layers) neuron buatan. Sesuai instruksi Anda, kita akan membuat dua arsitektur untuk diadu. GRU (Gated Recurrent Unit) sering kali lebih cepat dilatih dan sama akuratnya dengan LSTM pada dataset tertentu karena memiliki struktur "gerbang" memori yang lebih sederhana.
    - Teknis (Python - TensorFlow/Keras):
        - Inisialisasi model: model = Sequential().
        - Opsi A (Arsitektur LSTM):
            - model.add(LSTM(units=64, return_sequences=True, input_shape=(24, 15)))
            - model.add(Dropout(0.2)) (Mencegah AI menghafal buta / Overfitting).
            - model.add(LSTM(units=32, return_sequences=False))
        - Opsi B (Arsitektur GRU - Eksperimen Anda):
            - model.add(GRU(units=64, return_sequences=True, input_shape=(24, 15)))
            - model.add(Dropout(0.2))
            - model.add(GRU(units=32, return_sequences=False))
        - Layer Output (Sama untuk keduanya): model.add(Dense(units=1)). Mengapa 1? Karena kita hanya ingin mengeluarkan 1 angka mutlak (Sisa Hari). Jangan gunakan activation function seperti Sigmoid karena ini masalah Regresi bebas.

Langkah 5.4: Training Model dengan "Rem Darurat"
    - Konsep: Melatih model berulang-ulang (epochs) hingga tebakannya mendekati kunci jawaban.
    - Teknis (Python):
        - Compile model Anda: model.compile(optimizer='adam', loss='mse', metrics=['mae']).
        - Trik Senior (Early Stopping): Proses training Deep Learning bisa memakan waktu berjam-jam. Gunakan fungsi EarlyStopping(monitor='val_loss', patience=5). Artinya, jika dalam 5 putaran berturut-turut nilai error (loss) tidak menurun, hentikan pelatihan seketika.
        - Mulai pelatihan (Lakukan untuk model LSTM dan GRU bergantian): history = model.fit(X_train_3D, y_train, epochs=50, batch_size=32, validation_data=(X_test_3D, y_test), callbacks=[early_stop]).

Langkah 5.5: Evaluasi Regresi & Ekspor Model API
    - Konsep: Membuktikan model mana (LSTM atau GRU) yang tebakan angkanya paling masuk akal secara bisnis untuk API Anda.
    - Teknis (Python):
        - Bandingkan MAE (Mean Absolute Error) dari kedua model. Jika MAE = 1.5, artinya tebakan AI Anda rata-rata hanya meleset 1.5 hari dari hari kerusakan aslinya. Pilih model dengan MAE terkecil di data Test!
        - Visualisasi Wajib: Buat grafik garis (line plot). Sumbu X adalah waktu, Sumbu Y adalah RUL. Plot garis RUL Asli (harus berbentuk tangga menurun dari 30 ke 0) dan garis RUL Prediksi AI. Semakin menempel garis AI pada garis asli, semakin genius model Anda.
        - Ekspor Pemenang: Simpan otak AI pemenang Anda ke dalam file: model.save('rul_lstm.h5') atau model.save('rul_gru.h5'). File inilah yang nanti akan dimuat oleh Backend (Role C) untuk mengisi ai_prediction.rul_days di format JSON real-time dashboard.

SELAMAT! Dengan selesainya 5 langkah ini, tugas Anda sebagai Pemilik Pipa Prediktif (Role A) dinyatakan SELESAI 100%. Anda telah berhasil mendesain arsitektur yang mengubah aliran data sensor dan teks mentah menjadi Detektor Anomali (Fase 3), Dokter Diagnosa (Fase 4), dan Peramal Waktu (Fase 5) tanpa cacat logika.
