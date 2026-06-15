---
# PRIME — Speaker Notes untuk Presentasi ML Pipeline
**Total estimasi presentasi:** ~15-20 menit (13 bagian × ~1.5 menit)

## Cara Pakai
- Setiap fase punya: HOOK, TALKING POINTS, ANTISIPASI PERTANYAAN, TRANSISI
- HOOK dibaca di awal fase untuk menarik perhatian
- TALKING POINTS adalah inti penjelasan — boleh dibaca sambil menunjuk cell terkait
- ANTISIPASI PERTANYAAN: latihan jawaban jika dosen bertanya hal ini
- TRANSISI: kalimat penutup yang mengarah ke fase berikutnya

---

## FASE 0 — Environment Setup
**Notebook:** `notebooks/00_environment_check.ipynb`
**Estimasi waktu bicara:** 0.5 menit
**Cell yang ditunjuk:** Cell 1 & 2

### 🎤 HOOK (kalimat pembuka)
"Sebelum kita membahas model yang canggih, mari kita pastikan fondasinya kokoh. Ini adalah fase teknis housekeeping kita."

### 💬 TALKING POINTS
- (Cell 1 & 2) Saya mengunci `GLOBAL_SEED=42` untuk menjamin reprodusibilitas hasil eksperimen dari awal hingga akhir.
- Saya juga menerapkan struktur direktori enterprise-grade agar pipeline berjalan rapi dan terorganisir.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa output di Cell 2 menampilkan W_WARNING_HRS=72?**
A: Itu adalah hipotesis awal kami. Nanti di Fase 2, saya akan tunjukkan bagaimana temuan data empiris mengubah nilai ini secara resmi menjadi 48 jam.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Dengan environment yang sudah terkunci, mari kita lihat wujud asli dari data yang kita hadapi di Fase 1."

---

## FASE 1 — Data Ingestion
**Notebook:** `notebooks/fase_1_ingestion/01_data_ingestion.ipynb`
**Estimasi waktu bicara:** 1 menit
**Cell yang ditunjuk:** Cell 2 & 3

### 🎤 HOOK (kalimat pembuka)
"Sebelum masuk ke pemodelan, saya ingin tunjukkan tantangan terbesar di proyek ini ada di sini — dari 100,000 baris data, hanya 56 baris yang berlabel failure. Itu artinya 0.056 persen. Bayangkan mencari 56 jarum dalam 100,000 helai jerami."

### 💬 TALKING POINTS
- (Cell 1 & 3) Saya memuat 100,000 baris data operasional dari 20 mesin yang mencakup rentang waktu 208 hari.
- (Cell 3) Kualitas datanya punya integritas temporal sangat tinggi: nol gap waktu, nol duplikat, dan sempurna 5,000 baris per mesin.
- (Cell 2) Namun, imbalance klasifikasinya sangat ekstrem, yang akan menjadi motivasi utama teknik sampling kita nanti.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa menggunakan data dari public dataset, bukan data IoT asli dari pabrik?**
A: Untuk fase pembuktian konsep, public dataset memberikan ground truth yang jelas dan terstandardisasi. Pipeline ini dirancang agnostik sehingga siap langsung menerima format data IoT asli.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Meskipun integritas datanya sempurna, imbalancenya ekstrem. Bagaimana kita menemukan sinyal kerusakan di antara 99% data sehat? Jawabannya ada di Fase 2."

---

## FASE 2 — EDA Forensik
**Notebook:** `notebooks/fase_2_eda/02_eda_forensik.ipynb`
**Estimasi waktu bicara:** 2 menit
**Cell yang ditunjuk:** Cell 2 & 3

### 🎤 HOOK (kalimat pembuka)
"Bagaimana cara kita tahu kapan harus mulai khawatir terhadap mesin SEBELUM dia rusak total?"

### 💬 TALKING POINTS
- (Cell 2) Saya melakukan Failure Autopsy dengan melihat mundur 72 jam operasional pada 3 mesin representatif.
- (Cell 2) Temuannya konsisten lintas mesin: degradasi mulai terlihat di T-48 jam, dan eskalasi menjadi dramatis di T-24 jam. Ini murni keputusan berbasis data, yang mengubah hipotesis blueprint dari 72 jam ke 48 jam.
- (Cell 3) Melalui uji Cohen's D, saya mengidentifikasi 6 sensor prioritas tinggi dengan skor di atas 2.6 (seperti getaran dan tekanan) yang paling informatif membedakan kondisi sehat dan rusak.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa pilih 48 jam dan 24 jam, bukan angka lain?**
A: Angka tersebut bukan asumsi, melainkan hasil analisis visual dari Failure Autopsy di mana pola deviasi sensor mulai terlihat signifikan dan universal di beberapa mesin.

**Q: Apa itu Cohen's D dan kenapa penting?**
A: Cohen's D adalah effect size, mengukur seberapa jauh perbedaan distribusi pembacaan sensor saat mesin HEALTHY versus saat menjelang FAILURE. Makin besar nilainya, makin bagus sensor itu.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Dengan definisi 48 jam dan 24 jam ini, kita sekarang bisa memberikan 'label peringatan dini' pada data di Fase 3."

---

## FASE 3 — Label Engineering
**Notebook:** `notebooks/fase_3_label_engineering/03_label_engineering.ipynb`
**Estimasi waktu bicara:** 1 menit
**Cell yang ditunjuk:** Cell 1 & 2

### 🎤 HOOK (kalimat pembuka)
"Data asli cuma punya 2 label: sehat atau rusak. Tapi itu kurang—mesin butuh peringatan dini."

### 💬 TALKING POINTS
- (Cell 1) Saya menerapkan Temporal Backward-Labeling berdasarkan hasil Fase 2: menandai 48 jam sebelum rusak sebagai WARNING dan 24 jam sebagai CRITICAL.
- (Cell 2) Untuk mencegah noise menjadi false alarm, saya menambahkan Sensor Confirmation Layer dengan threshold P90, yang berhasil menurunkan 49 baris WARNING palsu.
- (Cell 2) Hasil akhir distribusinya adalah: HEALTHY 97.36%, WARNING 1.25%, dan CRITICAL 1.39%.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Apa itu Sensor Confirmation Layer dan kenapa perlu?**
A: Itu adalah filter validasi silang. Peringatan hanya dianggap sah jika setidaknya 2 dari 6 sensor utama melewati threshold persentil 90 dari kondisi sehat, gunanya untuk mencegah false warning akibat noise sesaat.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Label yang kuat butuh fitur yang kuat untuk dipelajari model. Di Fase 4, kita akan memperkaya data mentah ini."

---

## FASE 4 — Feature Engineering
**Notebook:** `notebooks/fase_4_feature_engineering/04_feature_engineering.ipynb`
**Estimasi waktu bicara:** 1.5 menit
**Cell yang ditunjuk:** Cell 1, 3, & 4

### 🎤 HOOK (kalimat pembuka)
"Dari 8 sensor mentah, kita ubah jadi 75 fitur yang 'bercerita' tentang tren, bukan cuma snapshot waktu tertentu."

### 💬 TALKING POINTS
- (Cell 1) Saya merekayasa 36 fitur rolling statistics untuk merekam variabilitas jangka pendek seperti fluktuasi getaran.
- (Cell 3) Saya juga mengekstrak 18 fitur lag untuk melihat nilai sensor beberapa jam sebelumnya, memberi model konteks temporal.
- (Cell 4) Tambahannya, saya membuat 4 rasio cross-sensor, 1 fitur degradation proxy dari jarak waktu maintenance log, dan beberapa NLP feature dasar.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa menambah begitu banyak fitur, bukannya berisiko overfitting karena terlalu rumit?**
A: Fitur ini sangat krusial karena ia merepresentasikan memori temporal. Model tidak bisa menangkap tren degradasi hanya dari satu baris data sesaat tanpa bantuan fitur rolling dan lag ini.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Semua 75 fitur ini harus kita bersihkan dan samakan skalanya sebelum masuk ke model, di sinilah Fase 5 masuk."

---

## FASE 5 — Preprocessing
**Notebook:** `notebooks/fase_5_preprocessing/05_preprocessing.ipynb`
**Estimasi waktu bicara:** 1 menit
**Cell yang ditunjuk:** Cell 3

### 🎤 HOOK (kalimat pembuka)
"Ini adalah fase pembersihan teknis biasa, tapi ada satu keputusan arsitektur di sini yang menyelamatkan integritas seluruh pipeline kita."

### 💬 TALKING POINTS
- (Cell 3) Saya menerapkan StandardScaler untuk standarisasi numerik, namun scaler ini di-fit HANYA pada data mesin training (M-01 hingga M-14).
- (Cell 3) Ini adalah pertahanan utama mencegah data leakage, memastikan model kita tidak mencuri pandang ke distribusi data dari mesin validasi atau test.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa menggunakan StandardScaler, bukan MinMaxScaler?**
A: Nilai outlier ekstrem pada periode menjelang kerusakan sangat informatif. StandardScaler mempertahankan jarak relatif outlier tersebut lebih baik dibanding MinMaxScaler yang akan memampatkan distribusinya.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Data sudah bersih, tapi masih ekstrem imbalance dengan rasio 97% lawan 3%. Mari kita tangani di Fase 6."

---

## FASE 6 — Imbalance Handling (SSBS)
**Notebook:** `notebooks/fase_6_imbalance/06_imbalance_handling.ipynb`
**Estimasi waktu bicara:** 1.5 menit
**Cell yang ditunjuk:** Cell 2 & 3

### 🎤 HOOK (kalimat pembuka)
"Kalau kita melakukan random sampling biasa, kita bisa merusak urutan waktu—padahal urutan waktu ini KUNCI utama untuk model belajar pola degradasi."

### 💬 TALKING POINTS
- (Cell 2) Saya merancang Stratified Sequential Block Sampling (SSBS) dengan mengambil 2 blok kronologis spesifik per mesin.
- (Cell 2) Ini secara natural menurunkan dominasi kelas HEALTHY dari 97.4% menjadi 87.09% TANPA merusak aliran waktu dan TANPA memakai SMOTE.
- (Cell 3) Penggunaan algoritma oversampling SMOTE sengaja saya tunda ke Fase 7 dan murni hanya untuk subset training.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa SMOTE tidak langsung diaplikasikan di sini?**
A: Untuk mencegah data leakage. Data sintetis dari SMOTE bisa menyebar dan membocorkan informasi ke set validasi atau test. Set evaluasi harus 100% natural, karenanya SMOTE dilakukan paska-splitting.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Tugas klasifikasi sudah kita atur pipelinenya. Tapi kita juga dituntut membuat satu target lagi: umur sisa mesin. Ini dikerjakan di Fase 6.5."

---

## FASE 6.5 — RUL Engineering
**Notebook:** `notebooks/fase_6_imbalance/06b_rul_engineering.ipynb`
**Estimasi waktu bicara:** 1 menit
**Cell yang ditunjuk:** Cell 1

### 🎤 HOOK (kalimat pembuka)
"Sekarang kita buat target variabel baru: secara presisi, berapa hari lagi mesin ini akan rusak?"

### 💬 TALKING POINTS
- (Cell 1) Saya merumuskan formula menghitung Remaining Useful Life (RUL) menjadi variabel `rul_days`.
- (Cell 1) Hasil perhitungannya konsisten: median RUL untuk baris berlabel WARNING adalah sekitar 2 hari, dan CRITICAL sekitar 1 hari. Sangat sesuai dengan window empiris yang kita kunci di Fase 2.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa ada outlier RUL hingga ratusan hari di zona CRITICAL?**
A: Itu merepresentasikan data dari log kegagalan paling akhir dari sebuah mesin, yang belum memiliki record kegagalan berikutnya. Secara operasional dataset ini sangat wajar terjadi.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Semua target sudah terdefinisi. Langkah terakhir sebelum modeling adalah membagi data di Fase 7."

---

## FASE 7 — Dataset Splitting
**Notebook:** `notebooks/fase_7_splitting/07_dataset_splitting.ipynb`
**Estimasi waktu bicara:** 1.5 menit
**Cell yang ditunjuk:** Cell 1 & 2

### 🎤 HOOK (kalimat pembuka)
"Machine-Based Split — ini bukanlah train-test split random biasa."

### 💬 TALKING POINTS
- (Cell 1) Split dataset kami didasarkan penuh pada identitas mesin: 14 mesin untuk train, 3 untuk validasi, dan 3 untuk test. TIDAK ADA overlap mesin sama sekali.
- (Cell 2) Barulah di sini SMOTE diaplikasikan EKSKLUSIF pada kumpulan data latih (X_train) saja, menyeimbangkan WARNING dan CRITICAL masing-masing menjadi 4000 sampel.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa pakai machine-based split, bukan temporal split waktu biasa?**
A: Sifat degradasi 'run-to-failure' terkonsentrasi di ujung timeline mesin. Kalau memakai temporal split biasa, kelas minoritas akan menumpuk di test set akhir, dan model training akan buta terhadap pola kerusakan.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Dengan perisai anti data leakage yang solid, mari kita saksikan pertarungan model klasifikasi status mesin di Track A."

---

## FASE 8 TRACK A — Classifier (08a/08b/08c)
**Notebook:** `notebooks/fase_8_modeling/08b_clf_xgboost.ipynb`
**Estimasi waktu bicara:** 2.5 menit
**Cell yang ditunjuk:** 08b Cell 1, 2, & 3

### 🎤 HOOK (kalimat pembuka)
"Tiga model bertanding, satu pemenang."

### 💬 TALKING POINTS
- Random Forest sebagai baseline mencetak F1 Val 0.9292. Namun mari lihat (08b Cell 1), iterasi awal XGBoost V1 GAGAL karena early stopping agresif dengan WARNING F1 cuma 0.2186. Ini bukti proses iterasi desain kami.
- (08b Cell 2) Namun, di XGBoost V2, kami menerapkan threshold tuning dari 0.50 ke 0.60, yang melambungkan WARNING F1 ke angka 0.9818 dengan fatal error absolut nol.
- PEMENANG untuk deteksi kategori status mesin adalah: XGBoost V2.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Apa itu threshold tuning dan kenapa harus 0.60?**
A: Secara default model menebak di probabilitas 0.50, yang menghasilkan 954 false alarm (alarm palsu). Dengan menaikkan keyakinan model menjadi 0.60, false alarm turun drastis menjadi hanya 1, sangat menyelamatkan efisiensi pabrik.

**Q: Kenapa F1 WARNING jadi metrik utama, bukan F1 Macro secara umum?**
A: False alarm di zona WARNING berbanding lurus dengan pemborosan biaya operasional. Selama fatal error (CRITICAL meleset jadi HEALTHY) terjamin nol, metrik WARNING F1 menjadi kunci kelayakan di industri nyata.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"XGBoost V2 sukses memberi tahu status mesin. Tapi berapa lama persisnya sisa umur sebelum mesin mati? Track B punya jawabannya."

---

## FASE 8 TRACK B — RUL Predictor (08d/08e/08f)
**Notebook:** `notebooks/fase_8_modeling/08e_rul_lstm.ipynb`
**Estimasi waktu bicara:** 2.5 menit
**Cell yang ditunjuk:** 08f Cell 2, 08e Cell 4 & 5

### 🎤 HOOK (kalimat pembuka)
"Sekarang kita bukan lagi memprediksi kategori peringatan, melainkan angka riil: berapa hari sisa napas mesin ini?"

### 💬 TALKING POINTS
- Scope arsitektur regresi ini HANYA memproses baris yang sudah di-flag WARNING dan CRITICAL. Kami tidak memprediksi RUL untuk status HEALTHY karena ketidakpastian jarak amannya secara praktis tidak terbatas (irreducible uncertainty).
- XGBoost Regressor mencapai MAE Test 1.10 hari. Sementara eksperimen GRU (08f Cell 2) parah karena gagal menggeneralisasi zona WARNING (MAE 1.91 hari).
- (08e Cell 5) PEMENANG mutlak adalah Deep Learning LSTM V2, mencetak MAE Test 0.7985 hari, di mana tingkat tebakan meleset maksimal 1 hari mencapai akurasi fantastis 98.04%.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa nilai R² LSTM sangat rendah (0.2594) padahal dibilang MAE-nya bagus?**
A: Metrik R² secara matematis sangat sensitif terhadap segelintir outlier nilai RUL ekstrem tinggi di pinggir distribusi. Secara operasional bagi pabrik, rata-rata selisih jam (MAE) dan toleransi Error ≤ 1 hari jauh lebih mencerminkan kualitas pengawasan harian.

**Q: Kenapa model GRU yang lebih ringan secara komputasi tidak dipilih?**
A: GRU kekurangan kapasitas representasi untuk menangkap kompleksitas pola degradasi transisi awal di zona WARNING. Kami memilih keandalan akurasi dari LSTM dibanding efisiensi minor GRU.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Dua jagoan terbaik sudah terpilih. Fase 9 adalah tempat kita mengesahkan kemenangan mereka secara formal."

---

## FASE 9 — Evaluation
**Notebook:** `notebooks/fase_9_evaluation/09_evaluation.ipynb`
**Estimasi waktu bicara:** 1 menit
**Cell yang ditunjuk:** Cell 2, 3, & 5

### 🎤 HOOK (kalimat pembuka)
"Ini momen keputusan resmi — model mana yang benar-benar dipakai dan dikunci ke server production?"

### 💬 TALKING POINTS
- (Cell 2 & 3) Evaluasi komparatif akhir secara formal membuktikan XGBoost dan LSTM memenangkan track mereka dengan zero data leakage.
- (Cell 5) Kami mengekspor semua hasil metrik dan visualisasi ini ke dalam sebuah Laporan HTML Standalone sebesar 461KB, dengan keputusan yang dikunci oleh timestamp sebagai dokumentasi serah terima sistem.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Kenapa repot men-generate report HTML custom bukannya menggunakan MLflow?**
A: Laporan HTML standalone memastikan hasil benchmark ini portabel, bisa dikirim ke email, dan dibaca oleh pemangku kepentingan manajemen tanpa harus paham atau meng-install environment tracking tools.

### 🔗 TRANSISI KE FASE BERIKUTNYA
"Model secanggih apapun tidak akan memberi uang jika hanya diam di Jupyter Notebook. Fase penutup akan merubahnya menjadi API riil."

---

## FASE 10 — Export & API
**Notebook:** `notebooks/fase_10_export/10_artifact_export.ipynb`
**Estimasi waktu bicara:** 1.5 menit
**Cell yang ditunjuk:** Cell 2 & 6

### 🎤 HOOK (kalimat pembuka)
"Model yang bagus saja belum cukup — ia harus ringkas, stabil, dan siap dipanggil oleh sistem eksternal manapun."

### 💬 TALKING POINTS
- (Cell 2) Kami membungkus seluruh logic pipeline fitur menjadi satu objek transformer pickle berukuran super ringan hanya 6KB, dipisah dari script utama untuk menghindari isu umum deserialisasi.
- (Cell 6) Kami menempatkannya di belakang FastAPI wrapper, dan memastikan 5 dari 5 skenario ekstrim smoke test berhasil merespons dengan prediksi seketika dalam hitungan milidetik.

### ❓ ANTISIPASI PERTANYAAN DOSEN
**Q: Bagaimana logika API mengatur kedua model yang berbeda tipe ini berjalan bersamaan?**
A: Kami menerapkan arsitektur *gated inference*. Model 1 (Classifier) selalu siaga memproses setiap paket data. Jika dan hanya jika outputnya berubah jadi WARNING atau CRITICAL, gerbang Model 2 (LSTM) baru diizinkan menyala untuk memprediksi sisa harinya.

---

## 🏁 RINGKASAN PENUTUP (Closing Statement)
"Sebagai penutup, sistem *Predictive Maintenance* ini kami rancang bukan sekadar eksperimen algoritma, melainkan sebuah software pipeline industri. Melalui proses 10 fase dari ekstraksi hingga menjadi microservice API, kita telah menghasilkan 2 model juara: XGBoost Classifier dengan zero fatal error dan alarm palsu nyaris nihil, ditambah arsitektur LSTM dengan kepastian prediksi umur mesin (RUL) hingga akurasi 98% di bawah deviasi 24 jam. Ini adalah bukti bahwa pemanfaatan data sensor IoT lewat metodologi Machine Learning terstruktur bisa menekan risiko downtime dan menaikkan efisiensi pabrik. Sistem cerdas ini stabil, teruji dari data leakage, dan 100% siap untuk di-deploy ke environment operasional."
