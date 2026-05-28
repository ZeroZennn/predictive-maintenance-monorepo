# Penulisan Hasil dan Analisis Penelitian
Disusun oleh: Anggi Mardiyono
Jurusan TIK | PNJ

### STUDI KASUS
* Topik: Deteksi penyakit daun tomat menggunakan *CNN*
* Tujuan: Membandingkan performa *CNN* vs *Random Forest* (*RF*) dan memahami pengalaman pengguna aplikasi *AI*

---

## 1) HASIL (*RESULTS*)

### 1.1 *Setup* Singkat
* *Dataset*: 3 kelas (*Healthy*, *Early Blight*, *Late Blight*)
* *Split*: 70% *train*, 15% *val*, 15% *test*
* Model: *CNN* (TensorFlow/Keras)
* Model: *RF* (scikit-learn, fitur HOG)

### 1.2 *Output* Kuantitatif
**Tabel Performa**

| Model | *Accuracy* | *Precision* | *Recall* | *F1-score* |
|---|---|---|---|---|
| *CNN* | 92.40% | 91.80% | 92.10% | 91.90% |
| *RF* | 85.70% | 84.90% | 85.20% | 85.00% |

---

## 1) HASIL (*RESULTS*) (Lanjutan)

**Confusion Matrix (CNN – ringkas)**

| Actual \ Pred | *Healthy* | *Early* | *Late* |
|---|---|---|---|
| *Healthy* | 45 | 2 | 1 |
| *Early* | 3 | 42 | 2 |
| *Late* | 1 | 3 | 44 |

**Grafik**
* *Training vs Validation Accuracy*
* *Loss Curve*

> **👉 Inti hasil:**
> * *CNN* unggul ~7% dibanding *RF*
> * *Error* terbesar pada *Early* vs *Late Blight*

### 1.3 *Output* Kualitatif (*User Study*)
* Responden: 20 pengguna (petani & mahasiswa)
* Metode: wawancara semi-terstruktur

**Temuan:**
* 80%: aplikasi mudah digunakan
* 65%: butuh penjelasan hasil *AI*
* 40%: ingin fitur rekomendasi tindakan

---

## 2) ANALISIS (*ANALYSIS*)
Di bagian ini, Anda mengolah angka → makna statistik/logis.

### 2.1 Analisis Kuantitatif
**Contoh penulisan:**
*CNN* menunjukkan performa superior dengan akurasi 92.4%, dibandingkan *Random Forest* sebesar 85.7%. Peningkatan ini mengindikasikan kemampuan *CNN* dalam menangkap fitur spasial citra daun secara lebih efektif.

**Analisis lebih dalam:**
* *Precision* tinggi → *false positive* rendah
* *Recall* tinggi → model jarang *miss* penyakit
* *Confusion matrix* → kesalahan antar kelas mirip

> **👉 Insight:**
> * *CNN* cocok untuk *image-based AI*
> * *RF* kurang optimal tanpa *feature engineering* kuat

---

## 2) ANALISIS (*ANALYSIS*) (Lanjutan)

### 2.2 Analisis Kualitatif
Gunakan *coding* tematik:

| Tema | Deskripsi |
|---|---|
| *Usability* | Mudah digunakan |
| *Trust* | Kurang percaya hasil *AI* |
| *Feature Need* | Butuh rekomendasi |

**Contoh narasi:**
Hasil wawancara menunjukkan bahwa meskipun sistem memiliki tingkat akurasi tinggi, sebagian pengguna masih meragukan hasil prediksi karena kurangnya transparansi model.

> **👉 Insight:**
> * Akurasi tinggi ≠ kepercayaan pengguna tinggi
> * Perlu *explainable AI (XAI)*

---

## 3) DISKUSI (*DISCUSSION*)
Bagian ini menghubungkan hasil dengan teori, penelitian lain, dan implikasi.

### 3.1 Contoh Penulisan Diskusi
Hasil penelitian ini konsisten dengan studi sebelumnya yang menunjukkan bahwa *Convolutional Neural Networks* unggul dalam tugas klasifikasi citra dibandingkan metode tradisional seperti *Random Forest*. Hal ini disebabkan oleh kemampuan *CNN* dalam melakukan *automatic feature extraction*.

Namun demikian, temuan kualitatif menunjukkan adanya gap antara performa teknis dan persepsi pengguna. Meskipun model memiliki akurasi tinggi, pengguna masih membutuhkan interpretasi hasil yang lebih transparan.

### 3.2 Komponen Diskusi yang Wajib Ada
* Bandingkan dengan penelitian lain
* Jelaskan kenapa hasil terjadi
* Implikasi praktis
* Keterbatasan

**Contoh:**
Keterbatasan penelitian ini terletak pada ukuran *dataset* yang relatif kecil dan kurangnya variasi kondisi pencahayaan.

---

## 4) MENULISKAN DALAM *PAPER* INTERNASIONAL

### 4.1 *RESULTS* (Gaya Jurnal)
*The CNN model achieved an accuracy of 92.4%, outperforming the Random Forest model which achieved 85.7%*. *The confusion matrix indicates that most misclassifications occurred between Early Blight and Late Blight classes*.

> 👉 Jangan interpretasi terlalu banyak di sini (itu tugas *Discussion*)

### 4.2 *DISCUSSION* (Gaya Jurnal)
*The superior performance of CNN can be attributed to its ability to automatically extract spatial features from images*. *This finding aligns with prior studies in image-based disease detection*.

*However, qualitative findings reveal that users require more explainability from AI predictions, suggesting the need for integrating explainable AI techniques*.

### 4.3 INTEGRASI KUANTITATIF + KUALITATIF
**Dalam *paper*:**
*While quantitative results demonstrate high model accuracy, qualitative insights highlight usability challenges, indicating that system effectiveness should not be evaluated solely based on performance metrics*.

---

## 5) TEMPLATE SIAP PAKAI (HASIL–ANALISIS–DISKUSI)

**🔹 Template HASIL**
* Model X menghasilkan akurasi sebesar ___%. Berdasarkan *confusion matrix*, kesalahan terbesar terjadi pada kelas .
* Grafik menunjukkan bahwa model mengalami konvergensi pada *epoch* ke-.

**🔹 Template ANALISIS**
* Hasil ini menunjukkan bahwa metode X lebih unggul dibandingkan metode Y karena ___.
* Nilai *precision* dan *recall* yang tinggi mengindikasikan bahwa model mampu ___.

**🔹 Template DISKUSI**
* Temuan ini sejalan dengan penelitian sebelumnya oleh ___ yang menyatakan bahwa ___.
* Namun, perbedaan ditemukan pada ___ yang kemungkinan disebabkan oleh ___.

---

## 6) KESALAHAN UMUM MAHASISWA (WAJIB DIHINDARI)
* ❌ Hanya menampilkan hasil tanpa analisis
* ❌ Tidak membandingkan dengan penelitian lain
* ❌ Diskusi hanya mengulang hasil
* ❌ Tidak ada *insight* atau kontribusi

---

## 7) STRATEGI AGAR LAYAK JURNAL INTERNASIONAL
* Gunakan *dataset* publik (*benchmark*)
* Bandingkan ≥ 2 metode
* Sertakan evaluasi komprehensif
* Tambahkan *insight* (bukan hanya angka)

---

## KESIMPULAN PRAKTIS
**Alur berpikir yang benar:**
DATA → HASIL → ANALISIS → DISKUSI → KONTRIBUSI

---
Terima kasih
Semangat belajar... :)
*(Footer presentasi: Jurusan TIK | PNJ)*