# 🎯 Rancangan Deck Presentasi PPT — PRIME Paper
**Judul Paper:** Hybrid Machine Learning and Deep Learning for Health Status Classification and Remaining Useful Life Prediction in Manufacturing

> **Format:** 5 Slide | Waktu presentasi yang disarankan: ±12–15 menit
> **Template yang direkomendasikan:** IEEE / Academic Dark Theme (biru tua + aksen merah/oranye)

---

## SLIDE 1 — COVER & LATAR BELAKANG MASALAH

### 🏷️ Judul Slide
**PRIME: Predictive Reliability & Intelligence Maintenance Engine**
*Hybrid ML+DL for Health Status Classification & RUL Prediction*

### 📐 Struktur Layout
- **Kiri (60%):** Teks/Visual Problem Statement
- **Kanan (40%):** Ilustrasi / Ikon industri (gambar mesin/pabrik / ikon sensor IoT)

### 📝 Isi Konten
**Headline Problem (font besar, bold):**
> *"Hanya 56 dari 100.000 data mesin yang merupakan failure event — 0.056%"*

**3 Bullet Problem:**
- 🚨 **Extreme Class Imbalance:** Distribusi HEALTHY 97.4% vs CRITICAL 1.4%
- ⏰ **Temporal Data Leakage:** Split data biasa merusak kausalitas waktu
- 💸 **Industrial Cost:** Downtime tak terencana = kerugian jutaan rupiah/jam

### 🖼️ Visual yang Disarankan
- **TIDAK perlu gambar eksternal** — Buat infografis sederhana berupa 3 icon card horizontal dengan angka dramatis: `100.000 Records`, `20 Machines`, `0.056% Failure`

### 🎤 Speaker Notes
> *"Bayangkan Anda mengelola pabrik dengan 20 mesin besar. Dari 100.000 jam operasional, hanya ada 56 momen kritis yang menandakan mesin akan rusak. Masalahnya: standar Machine Learning tidak dirancang untuk menangani ketidakseimbangan separah ini. Itulah mengapa kami mengembangkan PRIME — sebuah pipeline yang secara khusus dirancang untuk kondisi nyata dunia industri."*

---

## SLIDE 2 — METODOLOGI: PIPELINE PRIME

### 🏷️ Judul Slide
**Methodology: The PRIME 3-Layer Pipeline**

### 📐 Struktur Layout
- **Atas:** Judul + 3 kontribusi utama (headline chip/badge)
- **Tengah:** Diagram alir pipeline (gunakan TikZ / buat ulang di PowerPoint)
- **Bawah:** 3 kalimat singkat penjelasan tiap layer

### 📝 Isi Konten
**3 Kontribusi Utama (tampilkan sebagai 3 badge warna berbeda):**

| Badge | Nama | Deskripsi Singkat |
|---|---|---|
| 🔵 Layer 1 | **SSBS** | Temporal-aware undersampling |
| 🟠 Layer 2 | **Temporal Label Engineering** | HEALTHY / WARNING / CRITICAL |
| 🟢 Layer 3 | **Cascaded XGBoost + LSTM** | Efisiensi inferensi ~70% |

**Diagram Alir (reproduksi dari TikZ paper):**

```
[Raw Data 100K] → [EDA] → [Label Engineering] → [Feature Eng. 69 fitur]
     ↓
[SSBS Undersampling] → [Train/Val/Test Split] → [SMOTE (Train Only)]
     ↓
[XGBoost Classifier] → IF (WARNING/CRITICAL) → [LSTM RUL Predictor]
     ↓                        ↓ IF HEALTHY
[RUL Output (hari)]     [Skip LSTM → Hemat 70% waktu inferensi]
```

### 🖼️ Visual yang Disarankan
- **UTAMA:** Gunakan kembali diagram alur dari paper (Fig. 1 — TikZ pipeline). Export sebagai gambar PNG dari Overleaf PDF lalu paste ke slide.
- **OPSIONAL:** Tambahkan gambar `ssbs_diagram.png` dari `machine_learning/figures/` sebagai *inset* kecil di pojok kiri bawah.

### 🎤 Speaker Notes
> *"Pipeline PRIME terdiri dari tiga kontribusi teknis utama yang saling terhubung. Pertama, SSBS — kami tidak random mengambil data HEALTHY, melainkan memilih secara kronologis dua blok per mesin agar integritas temporal tetap terjaga. Kedua, kami tidak sekadar mengklasifikasikan 'rusak atau tidak', melainkan membagi menjadi tiga status operasional: HEALTHY, WARNING 48 jam sebelum rusak, dan CRITICAL 24 jam sebelum rusak. Ketiga, arsitektur cascade — LSTM hanya aktif jika XGBoost mendeteksi anomali, sehingga beban komputasi turun drastis 70% di kondisi normal."*

---

## SLIDE 3 — HASIL KLASIFIKASI (XGBoost)

### 🏷️ Judul Slide
**Results Part 1: Health Status Classification**
*"Zero Fatal Errors. 99.18% Threshold Precision."*

### 📐 Struktur Layout
- **Kiri (55%):** Tabel hasil + Threshold tuning highlight
- **Kanan (45%):** Confusion Matrix

### 📝 Isi Konten
**Tabel Perbandingan Model (ringkasan dari Table IXa & IXb):**

| Model | F1 Val | WARNING F1 | Fatal Error |
|---|---|---|---|
| Random Forest | 0.929 | 0.986 | 0 |
| **XGBoost V2** ✅ | **0.989** | **0.982** | **0** |
| LightGBM | 0.985 | 0.978 | 0 |

**Callout Box Threshold Tuning (sangat penting — highlight besar):**

```
❌ Threshold Default 0.50  →  954 False Alarms
✅ Threshold Optimal 0.60  →    1 False Alarm
                               WARNING Recall: 99.0%
```

### 🖼️ Visual yang Disarankan
- **WAJIB:** Gambar `confusion_matrix_xgb.png` dari folder `machine_learning/figures/`
- **OPSIONAL:** Gambar `learning_curve_clf.png` sebagai inset kecil untuk menunjukkan model tidak overfitting

### 🎤 Speaker Notes
> *"Ini adalah inti dari kontribusi klasifikasi kami. Ketiga model mencapai zero fatal error — tidak ada satu pun kondisi CRITICAL yang salah diklasifikasikan sebagai HEALTHY, karena kesalahan ini yang paling berbahaya secara industri. Namun perbedaan krusialnya ada di threshold tuning. Dengan default threshold 0.50, XGBoost menghasilkan 954 false alarm di set validasi — artinya operator pabrik akan menerima hampir 1000 peringatan palsu. Setelah kami kalibrasi ke 0.60, false alarm turun menjadi hanya 1, sementara recall WARNING tetap di 99%. Ini adalah penyesuaian kecil dengan dampak operasional yang sangat besar."*

---

## SLIDE 4 — HASIL PREDIKSI RUL (LSTM)

### 🏷️ Judul Slide
**Results Part 2: Remaining Useful Life Prediction**
*"98.04% prediksi akurat dalam ±1 hari"*

### 📐 Struktur Layout
- **Kiri (50%):** Scatter plot RUL actual vs predicted
- **Kanan (50%):** Tabel metrik + Zone analysis

### 📝 Isi Konten
**Tabel Perbandingan RUL Model (ringkasan dari Table XI):**

| Metric | XGBoost Reg | **LSTM V2** ✅ | GRU |
|---|---|---|---|
| MAE Test (hari) | 1.102 | **0.799** | 0.952 |
| Error ≤ 1 hari | 93.53% | **98.04%** | 97.80% |
| Error ≤ 3 hari | 94.92% | **98.04%** | 97.80% |

**Zone Analysis Callout (dari Table XII):**

```
WARNING Zone  → MAE = 0.10 hari  ← Near-Perfect 🎯
CRITICAL Zone → MAE = 2.03 hari  ← Tail-end outlier
─────────────────────────────────────────────────────
Overall MAE   = 0.799 hari
```

**Key Takeaway (font besar di pojok bawah):**
> *"LSTM V2 unggul 27.5% vs XGBoost Regressor dalam akurasi MAE"*

### 🖼️ Visual yang Disarankan
- **WAJIB:** Gambar `rul_actual_vs_pred.png` dari folder `machine_learning/figures/`
- **OPSIONAL:** Gambar `learning_curve_lstm.png` sebagai inset kecil untuk menunjukkan konvergensi stabil di epoch 184

### 🎤 Speaker Notes
> *"Untuk prediksi Remaining Useful Life, kami hanya mengaktifkan LSTM pada kondisi WARNING dan CRITICAL. Kenapa? Karena MAE pada kondisi HEALTHY adalah 13.77 hari — tidak berguna secara operasional. Fokus pada short-horizon prediction ini terbukti sangat efektif. Di zona WARNING — yaitu 24 hingga 48 jam sebelum failure — MAE kami hanya 0.10 hari atau sekitar 2.4 jam. Artinya operator mendapat jendela waktu yang sangat presisi untuk menjadwalkan intervensi. Perlu dicatat bahwa R² yang lebih rendah dibanding RMSE bukan cerminan kegagalan model, melainkan karakteristik dataset run-to-failure di mana outlier RUL secara alami mendeflasi nilai R²."*

---

## SLIDE 5 — KESIMPULAN & KONTRIBUSI

### 🏷️ Judul Slide
**Conclusion: PRIME — Production-Grade PdM Pipeline**

### 📐 Struktur Layout
- **Atas (30%):** 4 contribution cards horizontal
- **Tengah (40%):** Headline angka dramatis
- **Bawah (30%):** Future Work + Ucapan terima kasih

### 📝 Isi Konten
**4 Contribution Cards (tampilkan sebagai 4 kotak warna-warni):**

| # | Kontribusi | Hasil |
|---|---|---|
| 1️⃣ | **SSBS** | HEALTHY turun 97.4% → 87.1%, tanpa merusak kausalitas temporal |
| 2️⃣ | **3-Class Label Engineering + SCL** | Filter 49 noise WARNING, 0 CRITICAL missed |
| 3️⃣ | **XGBoost V2 (thr=0.60)** | F1=0.989, Fatal Error=0, False Alarm: 954 → 1 |
| 4️⃣ | **Cascaded XGBoost+LSTM** | MAE=0.799 hari, 98.04% error ≤1 hari, ~70% ↓ inferensi |

**Headline Angka (font sangat besar, bold, warna aksen):**

```
0       Zero Fatal Misclassification (CRITICAL → HEALTHY)
98.04%  Prediksi RUL akurat dalam ±1 hari
~70%    Penurunan beban inferensi real-time
```

**Future Work (3 bullet sederhana):**
- 🔬 Validasi pada dataset industri nyata (non-simulasi)
- 🔄 Integrasi Online Learning untuk adaptasi degradasi baru
- 🏭 Generalisasi ke multi-factory dengan mesin heterogen

### 🖼️ Visual yang Disarankan
- **TIDAK perlu gambar baru** — Tampilkan mini-thumbnail `confusion_matrix_xgb.png` dan `rul_actual_vs_pred.png` sebagai strip image kecil di bagian atas
- **OPSIONAL:** QR Code yang mengarah ke repository GitHub untuk audience yang ingin membaca selengkapnya

### 🎤 Speaker Notes
> *"Untuk menutup, PRIME adalah bukti bahwa tantangan terberat dalam Predictive Maintenance — data imbalance ekstrem dan temporal leakage — dapat diselesaikan secara sistematis. Kontribusi kami bukan sekadar memilih algoritma terbaik, melainkan membangun pipeline yang end-to-end: dari cara kita memilih data, merekayasa label, hingga cara kita mendeploy model secara kaskal untuk efisiensi nyata. Hasilnya: nol fatal error di klasifikasi, dan 98% prediksi RUL akurat dalam satu hari. Ke depan, kami berencana memvalidasi pipeline ini pada data industri nyata dan mengeksplorasi online learning agar sistem dapat beradaptasi secara real-time. Terima kasih — dengan senang hati kami menjawab pertanyaan."*

---

## 📋 Checklist Final Sebelum Presentasi

- [ ] Upload `confusion_matrix_xgb.png` ke slide 3 (dari `machine_learning/figures/`)
- [ ] Upload `rul_actual_vs_pred.png` ke slide 4 (dari `machine_learning/figures/`)
- [ ] Export TikZ pipeline diagram dari Overleaf PDF → PNG untuk slide 2
- [ ] Pastikan semua angka pada tabel konsisten dengan paper final
- [ ] Test durasi presentasi: target **12–15 menit** + 3–5 menit Q&A
- [ ] Gunakan template warna **biru tua / dark mode** agar grafik terlihat jelas di proyektor
