### **KNOWLEDGE BASE MODUL ROLE A: MACHINE LEARNING ENGINEER (Pemilik Pipa Prediktif)**

**Versi:** 2.0 (Aligned with Master Blueprint V3.0)

**1\. Latar Belakang Proyek (Lapis AI)** Industri manufaktur dan logistik saat ini masih mengalami kerugian besar akibat downtime peralatan yang tidak terduga. Pendekatan maintenance tradisional (preventive) yang mengandalkan jadwal tetap seringkali tidak efisien bisa terlalu dini sehingga membuang biaya, atau terlambat saat kerusakan sudah terlanjur terjadi. Dengan adanya sensor IoT yang terpasang pada mesin, data operasional kini dapat dimanfaatkan untuk memprediksi kapan mesin akan mengalami kegagalan. Oleh karena itu, Lapis AI dibangun untuk mengubah data mentah tersebut menjadi wawasan prediktif, sehingga perusahaan dapat melakukan maintenance tepat pada waktunya.

**2\. Deskripsi Peran (Role A)** Anda adalah "Otak Prediktif" dari sistem ini. Dunia Anda murni berkutat pada Jupyter Notebook, eksperimen algoritma, dan akurasi model matematis. Anda sama sekali tidak mengurus urusan database server, API, antarmuka web, atau Chatbot LLM. Fokus Anda adalah menghasilkan artefak model yang cerdas dan kebal terhadap *Data Leakage*.

**3\. Tujuan Utama Machine Learning Engineer** Membangun sistem pemodelan prediktif hibrida menggunakan Deep Learning dan Machine Learning untuk:

* **Model 1 (Health Status Classifier):** Mengklasifikasikan status kesehatan mesin secara *real-time* ke dalam 3 kelas menggunakan algoritma *ensemble* berdasarkan data sensor time-series.  
* **\[Model 2 (RUL Predictor):** Memprediksi sisa umur pakai mesin (Remaining Useful Life / RUL) secara numerik menggunakan model berbasis *sequence*.

**4\. Tantangan Khusus: Rekayasa Target & Pencegahan Data Leakage** Data mentah yang tersedia memiliki label target yang sangat terbatas, yaitu binomial (0= mesin sehat, 1= failure / rusak). Tujuan strategis Anda adalah merancang mekanisme logis untuk:

1. **Temporal Backward-Labeling:** Mengubah label biner tersebut menjadi klasifikasi multi-kelas menggunakan *look-back window* dengan batasan waktu spesifik:  
   * Healthy (Sehat)  
   * Warning (Peringatan Dini) \-\> (*W\_WARNING\_HRS \= 48 jam sebelum rusak*)  
   * Critical (Kritis/Mendekati Ajal) \-\> (*W\_CRITICAL\_HRS \= 24 jam sebelum rusak*)  
2. **Imbalance Handling (SSBS):** Menangani dominasi kelas *Healthy* menggunakan metode *Stratified Sequential Block Sampling* (SSBS) untuk mengambil blok waktu tanpa merusak urutan historis.  
3. **Zero Data Leakage:** Memastikan augmentasi data sintetis (SMOTE) **HANYA** diaplikasikan pada data *Training* setelah proses pembagian data yang mempertahankan urutan waktu (*time-aware split*). Data *Validation* dan *Test* harus murni.

**5\. Batasan Ruang Lingkup (Input & Output)**

* **Sumber Data (Input):**  
  * sensor\_readings.csv (Data time-series dari berbagai mesin).  
  * maintenance\_logs.csv (Catatan teks historis dari teknisi).  
* **Deliverables (Output Akhir):**  
  * Script preprocessing Python untuk mengubah data mentah menjadi format siap prediksi (dikemas dalam satu objek Pipeline).  
  * File model AI yang sudah dilatih (format .pkl dan .h5/.keras).  
  * **\[UPDATE V3.0\]** Kontrak API (JSON) final sebagai jembatan komunikasi dengan tim Backend (Bukan langsung ke Frontend, melainkan agar Backend Reynaldi bisa mengorkestrasi pemanggilan model Anda).