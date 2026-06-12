# Speaker Notes: PRIME CRISP-DM Presentation

**Slide 1: Cover**
"Selamat pagi/siang semuanya. Hari ini saya akan mempresentasikan proyek PRIME (Predictive Reliability & Intelligence Maintenance Engine), sebuah sistem pemeliharaan prediktif (predictive maintenance) untuk industri manufaktur yang memanfaatkan model Machine Learning dan Deep Learning hibrida. Pendekatan ini didasarkan pada metodologi CRISP-DM standar industri."

**Slide 2: Agenda**
"Presentasi hari ini akan mengikuti enam fase metodologi CRISP-DM, yang memastikan pendekatan terstruktur dan komprehensif. Mulai dari pemahaman bisnis, eksplorasi data, persiapan data, pemodelan, evaluasi model, hingga akhirnya fase deployment yang menghasilkan API siap pakai dan terintegrasi."

**Slide 3: Gambaran Sistem PRIME**
"Secara keseluruhan, arsitektur sistem PRIME ini terdiri dari 4 modul utama: Mesin Prediktif ML, RAG hibrida, Ingesti Telemetri, dan Dashboard Frontend. Alur datanya mengalir dari sensor IoT, diproses di backend, dievaluasi oleh ML Service, dan hasilnya ditampilkan ke Dashboard. Pada presentasi ini, kita akan fokus penuh pada Modul A, yaitu ML Predictive Engine."

**Slide 4: Fase 1 - Business Understanding**
"Mari kita mulai dengan Fase 1: Pemahaman Bisnis (Business Understanding). Pada tahap ini kita mendefinisikan masalah, tujuan utama, dan kriteria kesuksesan yang ingin dicapai."

**Slide 5: Latar Belakang & Problem Statement**
"Di industri manufaktur, downtime mesin sangat merugikan. Pendekatan *Reactive* (tunggu rusak baru diperbaiki) menyebabkan downtime tiba-tiba, sedangkan *Preventive* (jadwal berkala) seringkali boros karena mengganti komponen yang masih sehat. Solusi dari PRIME adalah pemeliharaan *Predictive*. Dengan memanfaatkan data sensor IoT dan Machine Learning, kita bisa mendeteksi anomali sebelum kerusakan terjadi, memprediksi sisa umur mesin, dan mengoptimalkan keputusan perawatan."

**Slide 6: Tujuan Penelitian & Success Criteria**
"Kita memiliki dua tujuan utama dengan metrik sukses masing-masing:
Pertama, Model Klasifikasi untuk memprediksi status mesin (Sehat, Warning, Kritis) dengan target F1-Score minimal 0.90 dan Fatal Error bernilai nol.
Kedua, Model Regresi untuk memprediksi *Remaining Useful Life* (RUL) dengan target MAE kurang dari 3 hari. 
Seperti yang dapat kita lihat, aktualisasi kedua model berhasil melampaui kriteria sukses yang ditetapkan."

**Slide 7: Definisi Problem Machine Learning**
"Dari sisi teknis, permasalahan bisnis ini dipetakan ke dalam dua model Machine Learning. Model pertama adalah Multiclass Classification menggunakan data *time-series* dari 8 sensor. Model kedua adalah Regresi berbasis sekuensial (24 timestep) khusus untuk memprediksi sisa hari ketika mesin sudah berada di fase peringatan atau kritis. Tantangan utamanya adalah distribusi data, di mana persentase status rusak (*Failure*) sangat minim, hanya 0.056%."

**Slide 8: Fase 2 - Data Understanding**
"Kita berlanjut ke Fase 2: Data Understanding, di mana kita menganalisis struktur, kualitas, dan karakteristik dari dataset mentah."

**Slide 9: Sumber Data**
"Terdapat dua sumber data utama yang digunakan. Pertama, `sensor_readings.csv` berisi 100 ribu baris data historis dari 20 mesin yang melacak 8 metrik sensor seperti suhu, getaran, tekanan, dan rpm. Kedua, `maintenance_logs.csv` berisi catatan teknisi terkait aktivitas perawatan dan komponen yang diganti. Keduanya memiliki rentang pencatatan sekitar 208 hari."

**Slide 10: Data Quality & Sanity Check**
"Berdasarkan *Sanity Check*, data sensor utamanya sangat bersih, tidak ada nilai kosong (*missing value*) atau *gap* waktu. Namun, kami menemukan anomali seperti nilai getaran yang negatif (yang secara fisik tidak mungkin dan telah dikoreksi) serta sedikit nilai kosong di catatan perawatan. Tantangan paling signifikan di sini adalah ketidakseimbangan kelas (*Extreme Imbalance*), di mana hanya terdapat 56 baris kejadian rusak dari total 100 ribu data."

**Slide 11: EDA Forensik: Failure Autopsy**
"Kami melakukan semacam autopsi forensik untuk melihat perilaku sensor menjelang kerusakan mesin. Menggunakan *look-back window* 72 jam, kami menemukan pola yang konsisten: sinyal sensor mulai menyimpang 48 jam sebelum mesin rusak (fase WARNING) dan mengalami eskalasi dramatis pada 24 jam sebelum kerusakan (fase CRITICAL). Hasil ini menjadi acuan empiris kita, bukan sekadar asumsi."

**Slide 12: Analisis Statistik Sensor - Cohen's D**
"Kami juga mengukur daya pembeda antar fitur menggunakan uji statistik ukuran efek *Cohen's D*. Mayoritas metrik sensor (terutama getaran dan tekanan) menunjukkan efek yang 'Besar' (skor d > 2.5) antara kondisi sehat dan kondisi menjelang rusak. Dua fitur lainnya masuk kategori Sedang, sehingga diputuskan seluruh 8 sensor dipertahankan untuk fase berikutnya."

**Slide 13: Fase 3 - Data Preparation**
"Di Fase 3, kita mengubah data mentah ini agar optimal untuk dipelajari oleh model, mulai dari *label engineering* hingga penanganan *imbalance*."

**Slide 14: Temporal Label Engineering**
"Berdasarkan temuan autopsi forensik sebelumnya, kita merekayasa label secara temporal. Data lebih awal dari 48 jam dikategorikan sebagai *HEALTHY*. Periode T-48h hingga T-24h adalah *WARNING*, dan 24 jam terakhir adalah *CRITICAL*. Kami juga menambahkan *Sensor Confirmation Layer* menggunakan batas distribusi P90 untuk memvalidasi fase tersebut dan mencegah bias asumsi waktu semata."

**Slide 15: Feature Engineering: 8 Sensor -> 69 Fitur**
"Dari 8 sensor awal, kami melakukan ekspansi fitur secara signifikan menjadi total 69 fitur. Kami menambahkan *Rolling Statistics* (rata-rata, standar deviasi, dan maks dari periode 24 dan 48 jam), *Lag Features*, rasio antar sensor, hingga penanda keausan (*degradation proxy*) berdasarkan riwayat perawatan teknisi (*NLP Text Mining*)."

**Slide 16: RUL Target Engineering**
"Untuk model kedua, nilai target RUL (Remaining Useful Life) dihitung mundur dari waktu kerusakan secara riil (kalender). Secara eksplisit, prediksi RUL ini hanya diterapkan jika status mesin berada dalam zona WARNING atau CRITICAL. Mesin yang sehat belum cukup memiliki karakteristik eskalasi degradasi untuk diprediksi RUL jarak jauhnya dengan reliabel."

**Slide 17: Imbalance Handling: SSBS + SMOTE**
"Untuk menangani ketidakseimbangan kelas (imbalance), kami tidak sekadar melakukan SMOTE biasa yang bisa memicu kebocoran data (*data leakage*). Pertama, data disampel menggunakan *Stratified Sequential Block Sampling* (SSBS) agar urutan temporalnya tetap terjaga. Teknik sintesis data minoritas dengan SMOTE hanya diterapkan mutlak pada himpunan data latih (*training set*) setelah proses *split* dilakukan, menjamin validasi 100% natural."

**Slide 18: Data Splitting & Anti-Leakage**
"Proses pembagian data dilakukan berbasis pengelompokan mesin (*Machine-Based Split*). Ini berarti, himpunan latih (70%) diisi oleh mesin 1 hingga 14, sedangkan mesin sisanya diletakkan ke validasi dan tes. Strategi ini menyimulasikan skenario dunia nyata, memastikan bahwa model divalidasi pada 'mesin baru' yang riwayatnya tidak pernah dilihat sebelumnya. Checklist Anti-Leakage juga terpenuhi."

**Slide 19: Fase 4 - Modeling**
"Masuk ke Fase 4: Pemodelan. Fase ini dibagi menjadi Track A (untuk Klasifikasi Status Mesin) dan Track B (untuk Regresi RUL)."

**Slide 20: Strategi Eksperimen Modeling**
"Pada Track A (Klasifikasi), kami membandingkan algoritma berbasis *tree*: Random Forest, XGBoost, dan LightGBM. XGBoost terpilih karena fleksibilitasnya terhadap penyesuaian *threshold* dengan F1-score yang sangat tinggi. 
Pada Track B (RUL Predictor), kami membandingkan XGBoost Regressor dengan arsitektur Deep Learning (LSTM dan GRU). Jaringan LSTM v2 terpilih memberikan MAE terbaik, yakni error rata-rata 0.8 hari."

**Slide 21: Arsitektur XGBoost Regressor**
"Berikut adalah arsitektur hyperparameter yang dikonfigurasi pada XGBoost. Model menggunakan pendekatan optimasi *early stop* pada iterasi ke-499 untuk mencegah overfitting, dengan kedalaman maksimal yang dibatasi, serta learning rate kecil."

**Slide 22: Arsitektur LSTM V2**
"Pada prediksi RUL berbasis urutan waktu, kami mengembangkan arsitektur jaringan LSTM 2 Lapis (*2-Layer LSTM Stack*) yang menerima input rangkaian waktu 24 jam dengan 69 fitur tersebut. Regularisasi ganda dari L2 dan Dropout mencegah overfitting. Model dihentikan optimal (*early stop*) di epoch 184 dari total batasan 200 iterasi."

**Slide 23: Fase 5 - Evaluation**
"Selanjutnya adalah Evaluasi Model, yaitu mengukur sejauh mana performa dari model klasifikasi dan model regresi pada *unseen data* atau data tes."

**Slide 24: Evaluasi Model 1 - XGBoost Classifier**
"Untuk Model XGBoost Classifier, kita mencapai hasil fenomenal dengan F1 Test sebesar 0.9906. Hal paling krusial adalah angka *Fatal Error* atau kejadian status CRITICAL yang diprediksi salah sebagai HEALTHY berhasil ditekan hingga nol kasus. Ini dicapai setelah kami menyesuaikan *decision threshold*."

**Slide 25: Evaluasi Model 2 - LSTM RUL Predictor**
"Pada prediksi waktu sisa sebelum rusak, model LSTM V2 menghasilkan MAE Test sebesar 0.7985 hari. Sebanyak 98% kasus prediksi memiliki selisih waktu dari aslinya kurang dari 1 hari. Pada area CRITICAL, eror bahkan ditekan sangat presisi, yakni di angka sekian jam saja dari target aktual."

**Slide 26: Feature Importance & Validasi EDA**
"Kami melakukan validasi kembali pentingnya setiap fitur (*Feature Importance*) yang dipelajari model ke analisis forensik (EDA) di Fase 2. Hasilnya sangat konsisten; fitur pergerakan suhu (*temperature*) dan getaran (*vibration*) dalam rata-rata 48 jam berturut-turut menjadi fitur terpenting, persis dengan zona peringatan dini (WARNING) empiris yang kita kunci sebelumnya."

**Slide 27: Anti-Overfitting & Generalization Validation**
"Model-model ini telah lulus uji Ketahanan Ekstrem (*Generalization Test*) untuk memastikan performanya stabil pada mesin-mesin yang belum pernah dilihat di fase training. Selain akurasi tes, *Data Leakage Check*, Uji Distribusi (KS), hingga *Ablation Test* membuktikan model ini bukan sekadar menghafal (*overfitting*)."

**Slide 28: Fase 6 - Deployment**
"Fase terakhir dari siklus CRISP-DM adalah menerjunkan sistem ke produksi (Deployment), merangkumnya menjadi kontrak API siap pakai."

**Slide 29: Arsitektur Deployment**
"Model ini disajikan (deployed) sebagai layanan ML (ML Service) berbasis FastAPI yang menerima injeksi data sensor format JSON dari Backend, mengeksekusi rekayasa fitur (*feature engineering*), dan memberikan prediksi ke depan (Status, RUL, Urgency Level). Kecepatan proses setiap *request* (*inference SLA*) terjaga konsisten di bawah milidetik."

**Slide 30: Sensor Gauge Thresholds untuk Dashboard**
"Agar aplikasi front-end intuitif, kami merumuskan *Sensor Gauge Thresholds* berdasarkan distribusi P90 (peringatan) dan P95 (kritis) di mana tim Frontend bisa menggunakan batasan nilai aktual (min/max) untuk merancang animasi *gauge* (indikator jarum/lingkaran) antarmuka."

**Slide 31: Artifacts & Deliverables Final**
"Artefak siap pakai dari proyek ini diserahkan kepada tim secara terpadu. Termasuk pipeline pra-pemrosesan mandiri, skrip referensi utama (`inference.py`), parameter Model 1 (XGBoost) dan Model 2 (LSTM) serta dokumen skema API sebagai kontrak *Backend*."

**Slide 32: Kesimpulan**
"Sebagai ringkasan, PRIME telah mendemonstrasikan keandalan tinggi. Dengan Label Engineering yang akurat secara empiris (berdasarkan pola forensik) serta alur anti-kebocoran data kelas atas, performa metrik mencapai keberhasilan di atas rata-rata: nihil *fatal error* untuk klasifikasi status dan deviasi selisih hari sisa kerusakan (*RUL*) tidak lebih dari 0.8 hari."

**Slide 33: Terima Kasih**
"Demikian presentasi dari saya terkait sistem PRIME menggunakan CRISP-DM. Kami menggunakan referensi data standar NASA dan paper terkait metode SMOTE untuk penanganan imbalance. Kami membuka sesi tanya jawab jika ada hal-hal detail teknis atau integrasi yang ingin didiskusikan."
