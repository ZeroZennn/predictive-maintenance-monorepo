# 🎯 Deck Presentasi ML — PRIME Predictive Maintenance
**Judul:** Hybrid ML & Deep Learning untuk Klasifikasi Status Kesehatan Mesin & Prediksi Sisa Umur Mesin  
**Format:** 5 Slide | Kelompok: Lapis AI

---

## SLIDE 1 — COVER

### Judul Utama
**PRIME: Predictive Reliability & Intelligence Maintenance Engine**  
*Hybrid Machine Learning dan Deep Learning untuk Predictive Maintenance Industri*

### Sub-judul
> Hybrid ML+DL for Health Status Classification & Remaining Useful Life (RUL) Prediction

### Mata Kuliah
Mata Kuliah: Machine Learning  
Politeknik Negeri Jakarta — Teknik Informatika

### Elemen Visual
- Background: dark forest green (`#14532D`)
- Dekorasi: lingkaran aksen besar di sudut
- Badge: "Mata Kuliah Machine Learning"
- Nama kelompok di bagian bawah

### Speaker Notes
> "Selamat pagi. Hari ini kami mempresentasikan PRIME — sebuah pipeline end-to-end untuk Predictive Maintenance mesin industri menggunakan kombinasi Machine Learning klasik dan Deep Learning."

---

## SLIDE 2 — ANGGOTA TIM & PERAN

### Layout
- **Header:** "Tim Lapis AI — Anggota & Peran"
- **4 Kartu Anggota** (masing-masing berisi: frame foto, nama, NIM, peran)

### Data Anggota
| # | Nama | NIM | Email | Peran |
|---|---|---|---|---|
| 1 | Achmad Zikran Maulida | (isi NIM) | achmad.zikran.maulida.tik23@stu.pnj.ac.id | ML Engineer — Model Development & Pipeline |
| 2 | Amir Hamzah | (isi NIM) | amir.hamzah.tik23@stu.pnj.ac.id | ML Engineer — Feature Engineering & EDA |
| 3 | Aqsa Zamzami | (isi NIM) | aqsa.zamzami.tik23@stu.pnj.ac.id | ML Engineer — Evaluation & Deployment |
| 4 | Reynaldi Chandra Kirana | (isi NIM) | reynaldi.chandra.kirana.tik23@stu.pnj.ac.id | Backend Engineer — API & Integration |

### Instruksi Layout
- Setiap kartu: **frame kosong foto (placeholder)** di atas, nama + NIM di tengah, badge peran di bawah
- Background kartu: putih dengan border hijau
- Frame foto: rounded rectangle abu-abu terang, ukuran ~1.5×1.5 inch

### Speaker Notes
> "Kami adalah Tim Lapis AI dari Jurusan Teknik Informatika PNJ. Satu anggota kami fokus pada sisi Backend/API, sementara tiga lainnya fokus pada pengembangan pipeline Machine Learning."

---

## SLIDE 3 — STUDI KASUS: 2 PROBLEM ML

### Header Slide
**Dua Studi Kasus Utama: Definisi Problem Machine Learning**  
*Data: 100.000 baris sensor IoT dari 20 mesin industri (208 hari)*

### Statistik Dataset (Stat Cards — Row atas)
| Angka | Label |
|---|---|
| 20 | Mesin IoT |
| 100K | Baris Data |
| 0.056% | Failure Rate |
| 69 | Fitur Input |

### Studi Kasus 1 — Klasifikasi Status Kesehatan Mesin
**Tipe:** Multi-class Classification  
**Input:** Data sensor time-series (8 sensor, interval 1 jam, 69 fitur setelah feature engineering)  
**Output:** 3 Kelas Status
- `HEALTHY (0)` — Mesin beroperasi normal
- `WARNING (1)` — Degradasi terdeteksi (T-48h sebelum failure)
- `CRITICAL (2)` — Darurat, segera intervensi (T-24h sebelum failure)

**Label Engineering:**
- Window WARNING: 48 jam sebelum failure (dikunci dari Failure Autopsy EDA)
- Window CRITICAL: 24 jam sebelum failure
- Sensor Confirmation Layer: minimal 2 dari 6 sensor melebihi P90 threshold HEALTHY
- Distribusi label final: HEALTHY 97.36% → 87.09% (setelah SSBS), WARNING 6.11%, CRITICAL 6.80%

**Tantangan Utama:**
- Extreme Class Imbalance: hanya 56/100.000 data failure asli (0.056%)
- Temporal Data Leakage: split data biasa merusak kausalitas waktu
- Solusi: SSBS + Machine-Based Split + Train-Only SMOTE

---

### Studi Kasus 2 — Peramalan Sisa Umur Mesin (RUL Prediction)
**Tipe:** Regression  
**Input:** Sequence 24 timestep × 69 fitur (WARNING/CRITICAL zone only)  
**Output:** `rul_days` (float) — prediksi hari tersisa hingga failure

**Desain Arsitektur Cascade:**
- Model 2 HANYA aktif saat Model 1 mendeteksi WARNING atau CRITICAL
- Alasan: MAE HEALTHY = 13.77 hari (tidak informatif), MAE WARNING = 0.10 hari (sangat presisi)
- Efisiensi: ~70% penurunan beban inferensi karena HEALTHY >87% dari waktu operasional

**Target Variabel:**
- `rul_days`: direkayasa dari data historis (forward time-to-next-failure)
- Median WARNING: ~2 hari | Median CRITICAL: ~1 hari | Max: 146.92 hari

### Speaker Notes
> "Kami mendefinisikan dua problem ML yang saling berkaitan. Model pertama seperti 'dokter' yang mendiagnosis status mesin sekarang. Jika hasilnya WARNING atau CRITICAL, Model kedua baru aktif sebagai 'ahli prognosis' yang memprediksi berapa hari tersisa sebelum failure."

---

## SLIDE 4 — EVALUASI EKSPERIMEN: STUDI KASUS 1

### Header Slide
**Hasil Evaluasi: Klasifikasi Status Kesehatan Mesin**  
*Perbandingan 3 Algoritma — RF vs XGBoost vs LightGBM*

### Layout
- **Kiri (55%):** Tabel perbandingan + threshold tuning callout
- **Kanan (45%):** Confusion Matrix XGBoost

---

### Hyperparameter Comparison Table

| Parameter | Random Forest | XGBoost V2 ✅ | LightGBM |
|---|---|---|---|
| n_estimators | 300 | 499 (early stop) | 27 (early stop) |
| max_depth | 20 | 4 | — |
| learning_rate | — | 0.01 | 0.05 |
| subsample | — | 0.8 | — |
| reg_alpha | — | 0.5 | — |
| reg_lambda | — | 2.0 | — |
| class_weight | balanced | — | — |
| WARN threshold | 0.50 | **0.60** | 0.65 |
| Model size | 3.15 MB | 1.68 MB | 0.13 MB |

### Hasil Evaluasi (Test Set)

| Model | F1 Val | F1 Test | F1 WARNING | F1 CRITICAL | Accuracy | Fatal Error |
|---|---|---|---|---|---|---|
| Random Forest | 0.9292 | 0.9914 | 0.9856 | 0.9889 | 0.9978 | 0 |
| **XGBoost V2** ✅ | **0.9894** | 0.9906 | **0.9856** | **0.9866** | 0.9974 | **0** |
| LightGBM | 0.9845 | 0.9876 | 0.9781 | 0.9865 | 0.9956 | 0 |

**Model Terpilih: XGBoost V2** berdasarkan:
1. WARNING F1 Val = 0.9818 (tertinggi — metrik terpenting operasional)
2. Fatal Error = 0 (tidak ada CRITICAL salah diklasifikasi sebagai HEALTHY)
3. False Alarm terendah setelah threshold tuning

### Threshold Tuning Callout (XGBoost V2)

| Threshold | WARN Precision | WARN Recall | F1 WARNING | False Alarms |
|---|---|---|---|---|
| 0.50 (default) | 0.087 | 0.975 | 0.159 | **954** |
| **0.60 (optimal)** | **0.973** | **0.990** | **0.9818** | **1** |

> ❌ Threshold 0.50 → 954 False Alarms  
> ✅ Threshold 0.60 → 1 False Alarm, WARNING Recall 99.0%

### Visualisasi yang Digunakan
- **Confusion Matrix XGBoost V2** — `figures/confusion_matrix_xgb.png`
- **Learning Curve Classifier** (inset) — `figures/learning_curve_clf.png`

### Speaker Notes
> "Ketiga model mencapai zero fatal error — tidak ada CRITICAL yang salah diagnosa sebagai HEALTHY. Perbedaan krusialnya ada di false alarm. Dengan threshold default, XGBoost menghasilkan 954 peringatan palsu. Setelah kalibrasi ke 0.60, turun menjadi hanya 1, sementara WARNING Recall tetap 99%. Satu penyesuaian kecil dengan dampak operasional yang sangat besar."

---

## SLIDE 5 — EVALUASI EKSPERIMEN: STUDI KASUS 2

### Header Slide
**Hasil Evaluasi: Peramalan Sisa Umur Mesin (RUL)**  
*Perbandingan 3 Algoritma — XGBoost Regressor vs LSTM V2 vs GRU*

### Layout
- **Kiri (50%):** Tabel metrik + zone analysis
- **Kanan (50%):** Scatter Plot RUL Actual vs Predicted + Learning Curve LSTM

---

### Hyperparameter Comparison Table

| Parameter | XGBoost Reg | LSTM V2 ✅ | GRU |
|---|---|---|---|
| Arsitektur | Gradient Boosted Tree | 2-Layer LSTM | 2-Layer GRU |
| Layer 1 | n_est=1000, depth=4 | LSTM(64u) + L2(0.001) + Dropout(0.3) | GRU(48u) + L2(0.001) + Dropout(0.3) |
| Layer 2 | lr=0.01, subsample=0.8 | LSTM(32u) + L2(0.001) + Dropout(0.3) | GRU(24u) + L2(0.001) + Dropout(0.3) |
| Regularisasi | reg_α=0.3, reg_λ=1.5 | BatchNorm + ReduceLROnPlateau | BatchNorm |
| Total Params | — | **47,649** | ~27,000 |
| Optimizer | — | Adam lr=0.001 | Adam lr=0.001 |
| Sequence Input | — | 24 timestep × 69 fitur | 24 timestep × 69 fitur |
| Early Stopping | iter 497 | epoch 184/200 | epoch 151/300 |

### Hasil Evaluasi (Test Set — WARNING+CRITICAL Only)

| Model | MAE Val | MAE Test | RMSE Test | R² Test | Error ≤1 hari | Error ≤3 hari |
|---|---|---|---|---|---|---|
| XGBoost Reg | 1.7189 | 1.1020 | 5.6002 | 0.3961 | 93.53% | 94.92% |
| **LSTM V2** ✅ | **1.6461** | **0.7985** | 6.3803 | 0.2594 | **98.04%** | **98.04%** |
| GRU | 1.8618 | 0.9515 | 7.3011 | 0.0303 | 97.80% | 97.80% |

**Model Terpilih: LSTM V2** berdasarkan:
1. MAE Test terbaik: 0.7985 hari (unggul 27.5% vs XGBoost)
2. Error ≤ 1 hari: 98.04% vs 93.53% (+4.51 poin)
3. Bias mendekati 0 — prediksi tidak bias ke over/under estimate

### Zone Analysis LSTM V2 (Test Set)

| Zona | Sampel | MAE | Interpretasi |
|---|---|---|---|
| WARNING | 208 | **0.10 hari** | Near-perfect — sangat presisi |
| CRITICAL | 225 | 2.03 hari | Tail-end outlier (RUL tinggi di akhir window) |
| **Overall** | **433** | **0.7985 hari** | Business-grade accuracy |

### Highlight Kunci
- **98.04%** prediksi akurat dalam ±1 hari
- **MAE WARNING = 0.10 hari** (2.4 jam) — operator punya jendela waktu sangat presisi
- GRU terlalu overspecialize pada CRITICAL (MAE=0.014 hari) tapi buruk di WARNING (MAE=1.91 hari)
- R² lebih rendah bukan cacat model — karena outlier RUL tinggi di CRITICAL akhir

### Visualisasi yang Digunakan
- **RUL Actual vs Predicted** — `figures/rul_actual_vs_pred.png`
- **Learning Curve LSTM** (inset) — `figures/learning_curve_lstm.png`

### Speaker Notes
> "Untuk RUL, LSTM V2 unggul di metrik yang paling relevan secara bisnis: MAE dan Error dalam N hari. Di zona WARNING — 24 hingga 48 jam sebelum failure — MAE hanya 0.10 hari atau 2.4 jam. Operator mendapat jendela waktu yang sangat presisi untuk menjadwalkan intervensi. R² yang lebih rendah dari XGBoost bukan cerminan kegagalan — melainkan karakteristik dataset run-to-failure dengan outlier RUL tinggi di ujung window CRITICAL."

---

## 📋 Ringkasan Model Final

| Track | Model Final | File | Metrik Utama |
|---|---|---|---|
| Model 1 — Classifier | XGBoost V2 + Threshold 0.60 | `classifier_final.pkl` | F1 Val=0.9894, Fatal Error=0 |
| Model 2 — RUL Predictor | LSTM V2 (seq=24) | `rul_predictor_final.keras` | MAE Test=0.7985, Error≤1hari=98.04% |

## 📋 Checklist Sebelum Generate PPTX
- [ ] Konfirmasi NIM masing-masing anggota (slide 2)
- [ ] Siapkan foto anggota untuk dimasukkan ke frame placeholder
- [ ] Verifikasi path figures: `machine_learning/figures/confusion_matrix_xgb.png`
- [ ] Verifikasi path figures: `machine_learning/figures/rul_actual_vs_pred.png`
- [ ] Verifikasi path figures: `machine_learning/figures/learning_curve_clf.png`
- [ ] Verifikasi path figures: `machine_learning/figures/learning_curve_lstm.png`
