# RANCANGAN DECK — PRIME ML Pipeline (Fase 0–10 + Deployment)
**Tujuan:** Slide deck presentasi lengkap untuk mata kuliah Machine Learning,
membahas seluruh pipeline ML/DL dari environment setup hingga deployment.
**Berbeda dari deck CRISP-DM:** Deck ini terstruktur per FASE TEKNIS pipeline
(bukan siklus CRISP-DM generik), dengan detail metodologi, formula, dan
hasil eksperimen di setiap fase.

---

## 1. DESIGN SYSTEM

### Palet Warna — "PRIME Command Center"
Terinspirasi dari UI dashboard PRIME dengan pendekatan *light-mode* yang bersih (menggunakan aksen forest green dan status semantik) — menjaga keterbacaan tinggi dan brand consistency antara produk dan presentasi akademik.

| Role | Hex | Penggunaan |
|---|---|---|
| **Primary (dominant 60%)** | `#FFFFFF` (pure white) | Background semua slide |
| **Secondary** | `#F8FAFC` (light slate) | Card/panel background |
| **Accent (sharp)** | `#16A34A` (medium green) | Highlight angka kunci, garis diagram, judul aktif |
| **Accent (strong)** | `#166534` (dark green) | Penekanan metrik penting, shape/elemen sekunder |
| **Text primary** | `#14532D` (deep forest green) | Judul slide dan header utama |
| **Text body** | `#1E293B` (dark slate) | Body text (agar nyaman dibaca dalam waktu lama) |
| **Text muted** | `#475569` (medium slate) | Caption, label sumbu |
| **Status: Healthy** | `#22C55E` (green) | Label HEALTHY, hasil baik |
| **Status: Warning** | `#FBBF24` (amber) | Label WARNING, catatan perhatian |
| **Status: Critical** | `#EF4444` (red) | Label CRITICAL, masalah/bug yang ditemukan |

### Tipografi
| Elemen | Font | Ukuran |
|---|---|---|
| Slide title | Cambria Bold | 32-36pt |
| Section label (kecil di pojok) | Calibri | 12pt, uppercase, letter-spacing |
| Body text | Calibri | 14-16pt |
| Angka besar (stat callout) | Cambria Bold | 54-64pt |
| Caption figure | Calibri Italic | 10-11pt, warna muted |

### Motif Visual Konsisten
- **Phase badge**: setiap slide fase punya badge bulat kecil di kiri atas
  berisi nomor fase (mis. "FASE 2") dengan warna sesuai grup layer:
  - Data Layer (Fase 0-1): medium green (`#16A34A`)
  - Analysis Layer (Fase 2-3): amber
  - Feature Layer (Fase 4-7): dark green (`#166534`)
  - Model Layer (Fase 8): ungu `#A78BFA`
  - Evaluation/Deployment (Fase 9-10): emerald/hijau terang
- **Progress indicator**: dot-stepper horizontal di bagian bawah slide
  menunjukkan posisi fase saat ini dari total 11 fase (0-10)
- Tidak menggunakan accent stripe/garis bawah judul (sesuai prinsip
  anti-pola AI-generated)

---

## 2. STRUKTUR DECK — OVERVIEW (24 SLIDES)

| # | Judul Slide | Layout | Fase |
|---|---|---|---|
| 1 | Cover | Title (dark, big) | — |
| 2 | Agenda / Roadmap Pipeline | Diagram horizontal 11 fase | — |
| 3 | Problem Statement | Stat callout besar (0.056%) | — |
| 4 | Fase 0 — Environment & Reproducibility | Icon + text rows | 0 |
| 5 | Fase 1 — Data Ingestion & Profil Dataset | Tabel + stat | 1 |
| 6 | Fase 2 — EDA: Failure Autopsy | Diagram timeline | 2 |
| 7 | Fase 2 — Cohen's D Sensor Analysis | Image (cohensd_chart.png) | 2 |
| 8 | Fase 3 — Temporal Label Engineering | Diagram + formula | 3 |
| 9 | Fase 3 — Sensor Confirmation Layer | Tabel threshold + hasil | 3 |
| 10 | Fase 4 — Feature Engineering | 2x3 grid kategori fitur | 4 |
| 11 | Fase 5 — Preprocessing & Anti-Leakage | Before/after diagram | 5 |
| 12 | Fase 6 — SSBS Imbalance Handling | Image (ssbs_diagram.png) | 6 |
| 13 | Fase 6.5 — RUL Target Engineering | Formula + distribusi | 6.5 |
| 14 | Fase 7 — Machine-Based Split & SMOTE | Tabel split + SMOTE before/after | 7 |
| 15 | Fase 8 — Modeling Overview (Dual Track) | Diagram cabang 2 track | 8 |
| 16 | Fase 8A — Classifier: 3 Model Comparison | Tabel leaderboard | 8 |
| 17 | Fase 8A — XGBoost Threshold Tuning | Before/after comparison | 8 |
| 18 | Fase 8A — Confusion Matrix XGBoost | Image (confusion_matrix_xgb.png) | 8 |
| 19 | Fase 8B — RUL Predictor: 3 Model Comparison | Tabel leaderboard | 8 |
| 20 | Fase 8B — LSTM V2 Architecture & Learning Curve | Diagram + image | 8 |
| 21 | Fase 8B — RUL Prediction Quality | Image (rul_actual_vs_pred.png) | 8 |
| 22 | Fase 9 — Final Model Selection | Side-by-side decision card | 9 |
| 23 | Fase 10 — Deployment Architecture | Diagram pipeline produksi | 10 |
| 24 | Closing — Key Results & Impact | Stat grid besar | — |

---

## 3. DETAIL SLIDE-BY-SLIDE

### SLIDE 1 — Cover
**Layout:** Dark full-bleed, judul besar di tengah-kiri
- Judul: **"PRIME Machine Learning Pipeline"**
- Subjudul: "Predictive Reliability & Intelligence Maintenance Engine — End-to-End ML/DL Engineering Walkthrough"
- Nama: Achmad Zikran Maulida — Machine Learning Engineer
- Visual: motif garis tipis menyerupai sensor waveform di sisi kanan
  (dekoratif, bukan accent stripe — bentuk bebas/organik)

---

### SLIDE 2 — Agenda / Roadmap Pipeline
**Layout:** Diagram horizontal 11 kotak kecil (Fase 0 → Fase 10), connected
dengan panah tipis. Setiap kotak diberi warna sesuai grup layer (lihat
Design System). Di bawah diagram, 4 baris ringkasan:
- "Data Layer: Ingestion & EDA"
- "Label & Feature Layer: Temporal Engineering"
- "Model Layer: Classification + RUL Regression"
- "Deployment Layer: API & Production"

---

### SLIDE 3 — Problem Statement
**Layout:** Stat callout dominan
- Angka besar di tengah: **"0.056%"** (warna critical/red, font 64pt)
- Caption di bawah: "56 dari 100,000 baris data berlabel failure"
- Dua bullet pendukung di kiri-kanan:
  - "Industri 4.0: downtime tak terduga = kerugian 20-30% produktivitas"
  - "Tantangan: extreme imbalance + temporal data leakage"
- Visual kecil: ilustrasi 100 kotak grid kecil, hanya beberapa terwarnai
  merah (representasi visual rasio 0.056%)

---

### SLIDE 4 — Fase 0: Environment & Reproducibility
**Phase badge:** FASE 0 (cyan)
**Layout:** Icon + text rows (3 baris)
- 🔧 **Struktur direktori enterprise** — `src/`, `notebooks/`, `models/`, `data/`
- 🎲 **GLOBAL_SEED = 42** — semua eksperimen reproducible
- 📋 **`src/config.py`** — single source of truth untuk semua parameter
  (W_WARNING_HRS, W_CRITICAL_HRS, LABEL_MAP, dll.)

---

### SLIDE 5 — Fase 1: Data Ingestion & Profil Dataset
**Phase badge:** FASE 1 (cyan)
**Layout:** Tabel kiri + 3 stat callout kanan

Tabel:
| Dataset | Rows | Cols |
|---|---|---|
| sensor_readings.csv | 100,000 | 11 |
| maintenance_logs.csv | 500 | 8 |

Stat callouts kanan:
- **20** mesin (M-01 s/d M-20)
- **208 hari** rentang waktu (1 Jul 2025 – 25 Jan 2026)
- **0** gap temporal, **0** duplikat timestamp

Catatan kecil di bawah: "Rata-rata 2.80x failure per mesin — semua 20 mesin
pernah mengalami failure"

---

### SLIDE 6 — Fase 2: EDA — Failure Autopsy
**Phase badge:** FASE 2 (amber)
**Layout:** Diagram timeline horizontal (custom shape, bukan image)

Timeline dari kiri ke kanan:
```
[T-72h] ──── [T-48h] ──────── [T-24h] ──────── [T-0: FAILURE]
 normal      degradasi mulai   eskalasi          mesin rusak
 (hijau)     terdeteksi        dramatis          (merah)
             (kuning)          (oranye)
```
Bullet di bawah timeline:
- "Look-back 72 jam pada 3 mesin: M-01 (4x), M-09 (2x), M-05 (1x)"
- "Pola konsisten di ketiga mesin → bersifat universal"
- "**Keputusan:** W_WARNING_HRS=48 (revisi dari hipotesis awal 72)"

---

### SLIDE 7 — Fase 2: Cohen's D Sensor Analysis
**Phase badge:** FASE 2 (amber)
**Layout:** Image dominan (kiri) + interpretasi (kanan)
- **Image:** `figures/cohensd_chart.png`
- Teks kanan:
  - "Cohen's $d$ mengukur seberapa beda distribusi sensor saat HEALTHY
    vs FAILURE"
  - "6 sensor dengan $d > 2.6$ (efek besar) → prioritas tinggi"
  - "vibration ($d$=3.37) paling diskriminatif"
  - "humidity & operating_hours ($d$<0.3) tetap dipertahankan untuk
    Fase 8 feature importance"

---

### SLIDE 8 — Fase 3: Temporal Label Engineering
**Phase badge:** FASE 3 (amber)
**Layout:** Formula box (kiri) + diagram label mapping (kanan)

Formula (LaTeX-style rendered as image atau text box dengan font Cambria
italic untuk simbol):
```
label(t) =
  CRITICAL  if  T_failure - 24h ≤ t ≤ T_failure
  WARNING   if  T_failure - 48h ≤ t < T_failure - 24h
  HEALTHY   otherwise
```

Diagram kanan: 3 kotak warna (hijau/kuning/merah) berlabel HEALTHY/
WARNING/CRITICAL dengan panah menunjuk garis waktu menuju "FAILURE"

---

### SLIDE 9 — Fase 3: Sensor Confirmation Layer
**Phase badge:** FASE 3 (amber)
**Layout:** Tabel threshold (kiri) + hasil distribusi (kanan, donut/bar)

Tabel P90 Threshold:
| Sensor | P90 |
|---|---|
| temperature | 76.30 |
| vibration | 0.59 |
| pressure | 103.80 |
| rpm | 2,540 |
| power_consumption | 82.10 |
| noise_level | 74.30 |

Kanan — Distribusi label final (bar horizontal):
- HEALTHY: 97.364% (97,364 baris)
- WARNING: 1.247% (1,247 baris)
- CRITICAL: 1.389% (1,389 baris)

Caption bawah: "Sensor Confirmation Layer (min. 2 dari 6 sensor melewati
P90) menurunkan 49 baris WARNING palsu (1.82%) → 0 downgrade di CRITICAL"

---

### SLIDE 10 — Fase 4: Feature Engineering
**Phase badge:** FASE 4 (hijau)
**Layout:** Grid 2x3, masing-masing kotak = 1 kategori fitur

| Rolling Stats (36) | Lag Features (18) | Cross-Sensor Ratios (4) |
|---|---|---|
| 6 sensor × 2 window × 3 stats | lag {1,6,24}h | temp/vib, pressure/rpm, dll |

| Degradation Proxy (1) | NLP Derived (2) | **TOTAL: 75 kolom** |
|---|---|---|
| hours_since_last_maint | damage_category, severity_score | (→ 69 fitur final setelah drop ID/label) |

Formula rolling (kecil, di bawah grid):
```
x_roll(t,w) = (1/w) Σ x(t-i),  i=0..w-1,  w ∈ {24h, 48h}
```

---

### SLIDE 11 — Fase 5: Preprocessing & Anti-Leakage
**Phase badge:** FASE 5 (hijau)
**Layout:** Diagram "before/after" 2 kolom

Kiri (❌ Sebelum — Bug ditemukan):
- StandardScaler di-fit pada 100,000 baris (semua 20 mesin)
- Termasuk Val & Test machines (M-15–M-20)
- → **Data Leakage**

Kanan (✅ Sesudah — Fixed):
- Scaler di-refit HANYA pada M-01–M-14 (70,000 baris)
- Val/Test mean≠0, std≠1 → **EXPECTED & CORRECT**
- Dampak performa: F1 Val 0.9292→0.9292 (tidak berubah,
  leakage minimal karena homogenitas mesin)

Bottom note: "DFT-02 fixed: vibration negatif di-clip ke 0"

---

### SLIDE 12 — Fase 6: SSBS Imbalance Handling
**Phase badge:** FASE 6 (hijau)
**Layout:** Image dominan + stat bar

- **Image:** `figures/ssbs_diagram.png`
- Stat bar di bawah (before → after):
  - HEALTHY: 97.364% → **87.09%** (17,787 baris)
  - WARNING: 1.247% → 6.11% (1,247 baris, tidak berubah)
  - CRITICAL: 1.389% → 6.80% (1,389 baris, tidak berubah)
  - Total: 100,000 → **20,423 baris**

Caption: "2 blok kronologis per mesin (prima + pre-warning), safety
buffer 24 jam — TANPA augmentasi sintetis (zero leakage)"

---

### SLIDE 13 — Fase 6.5: RUL Target Engineering
**Phase badge:** FASE 6.5 (hijau)
**Layout:** Formula box (kiri) + stat distribusi (kanan)

Formula:
```
RUL(t) = (T_next_failure - t) / 86400   [dalam hari]
```

Stat kanan (4 angka kecil dalam grid 2x2):
- Min: **0.04** hari
- Max: **146.92** hari
- Mean: **29.38** hari
- Median: **18.88** hari

Bottom note: "WARNING median ≈2 hari, CRITICAL median ≈1 hari —
konsisten dengan window 48h/24h dari Fase 2"

---

### SLIDE 14 — Fase 7: Machine-Based Split & SMOTE
**Phase badge:** FASE 7 (hijau)
**Layout:** 2 tabel berdampingan

Tabel kiri — Split:
| Split | Mesin | Baris | % |
|---|---|---|---|
| Train | M-01–M-14 | 14,419 | 70.60% |
| Val | M-15–M-17 | 3,288 | 16.10% |
| Test | M-18–M-20 | 2,716 | 13.30% |

Tabel kanan — SMOTE (Train only):
| Kelas | Sebelum | Sesudah |
|---|---|---|
| HEALTHY | 12,504 | 12,504 |
| WARNING | 901 | **4,000** |
| CRITICAL | 1,014 | **4,000** |

Bottom note: "Val & Test = 100% natural. Zero Data Leakage ✅
terkonfirmasi"

---

### SLIDE 15 — Fase 8: Modeling Overview (Dual Track)
**Phase badge:** FASE 8 (ungu)
**Layout:** Diagram cabang — 1 input, split jadi 2 track

```
              [69 Features Input]
                      │
        ┌─────────────┴─────────────┐
        ▼                            ▼
  TRACK A: Classifier          TRACK B: RUL Regressor
  (RF / XGBoost / LightGBM)    (XGBoost Reg / LSTM / GRU)
  Output: HEALTHY/WARNING/      Output: RUL dalam hari
          CRITICAL              Scope: WARNING+CRITICAL only
```

Catatan kanan-bawah: "Track B HANYA aktif jika Track A mendeteksi
WARNING/CRITICAL → reduce inference load ~70%"

---

### SLIDE 16 — Fase 8A: Classifier — 3 Model Comparison
**Phase badge:** FASE 8 (ungu)
**Layout:** Tabel leaderboard, baris pemenang di-highlight cyan

| Model | F1 Val | F1 Test | WARNING F1 | Infer(ms) | Size(MB) |
|---|---|---|---|---|---|
| Random Forest | 0.9292 | 0.9914 | 0.8108 | 75.25 | 3.15 |
| **XGBoost V2** | **0.9894** | 0.9906 | **0.9818** | 12.76 | 1.68 |
| LightGBM | 0.9845 | 0.9876 | 0.9781 | 3.26 | 0.13 |

Catatan bawah:
- "XGBoost V1 (early stopping agresif, iter 40) → WARNING F1=0.2186 ❌"
- "XGBoost V2 (parameter di-tuning) → WARNING F1=0.9818 ✅"
- Hyperparameter V2: n_estimators=499, max_depth=4, lr=0.01,
  subsample=0.8, reg_alpha=0.5, reg_lambda=2.0

---

### SLIDE 17 — Fase 8A: XGBoost Threshold Tuning
**Phase badge:** FASE 8 (ungu)
**Layout:** Before/after comparison, 2 kartu besar berdampingan

Kartu kiri (❌ Threshold 0.50 — default):
- WARNING Precision: 0.087
- WARNING Recall: 0.975
- F1 WARNING: 0.159
- **False Alarms: 954**

Kartu kanan (✅ Threshold 0.60 — optimal):
- WARNING Precision: 0.973
- WARNING Recall: 0.990
- F1 WARNING: **0.9818**
- **False Alarms: 1**

Bottom: "Threshold tuning bukan cosmetic — ini yang menyelamatkan model
dari 954 false alarm operasional"

---

### SLIDE 18 — Fase 8A: Confusion Matrix XGBoost
**Phase badge:** FASE 8 (ungu)
**Layout:** Image dominan tengah + 1 highlight stat

- **Image:** `figures/confusion_matrix_xgb.png`
- Highlight box di bawah image:
  "**Fatal Error = 0** — Tidak ada CRITICAL yang terklasifikasi sebagai
  HEALTHY, di Validation maupun Test"

---

### SLIDE 19 — Fase 8B: RUL Predictor — 3 Model Comparison
**Phase badge:** FASE 8 (ungu)
**Layout:** Tabel leaderboard, baris pemenang di-highlight cyan

| Model | MAE Test (hari) | RMSE Test | R² Test | Error≤1d | Size |
|---|---|---|---|---|---|
| XGBoost Reg | 1.1020 | 5.6002 | **0.3961** | 93.53% | 0.77MB |
| **LSTM V2** | **0.7985** | 6.3803 | 0.2594 | **98.04%** | 0.60MB |
| GRU | 0.9515 | 7.3011 | 0.0303 | 97.80% | — |

Catatan bawah:
- "Scope: WARNING+CRITICAL only — sensor HEALTHY tidak informatif
  untuk RUL jangka panjang"
- "R² rendah karena outlier RUL tinggi di CRITICAL akhir — bukan
  indikator kualitas model untuk prediksi jangka pendek"

---

### SLIDE 20 — Fase 8B: LSTM V2 Architecture & Learning Curve
**Phase badge:** FASE 8 (ungu)
**Layout:** Diagram arsitektur (kiri) + image learning curve (kanan)

Diagram arsitektur kiri (kotak vertikal bertumpuk):
```
Input (24 timesteps × 69 features)
        │
LSTM(64) + L2(0.001) + Dropout(0.3)
        │
   BatchNormalization
        │
LSTM(32) + L2(0.001) + Dropout(0.3)
        │
   BatchNormalization
        │
   Dense(16, relu)
        │
   Dense(1, linear)  → RUL (hari)

Total params: 47,649
```

Kanan: **Image** `figures/learning_curve_lstm.png`
Caption: "Best epoch=184, Val MAE=0.8160 hari — convergen tanpa
overfitting meski Val set hanya 264 sampel"

---

### SLIDE 21 — Fase 8B: RUL Prediction Quality
**Phase badge:** FASE 8 (ungu)
**Layout:** Image dominan + 2 stat callout kecil di sisi

- **Image:** `figures/rul_actual_vs_pred.png`
- Stat callout kiri-bawah: "MAE = 0.7985 hari"
- Stat callout kanan-bawah: "Error≤1 hari = 98.04%"

Tambahan (opsional, jika ada ruang): box kecil "Validasi Real-World
(Integration Test): M-06 — WARNING terdeteksi T-47h, CRITICAL T-34h
sebelum failure aktual. RUL error saat CRITICAL hanya 0.05 hari."

---

### SLIDE 22 — Fase 9: Final Model Selection
**Phase badge:** FASE 9 (cyan terang)
**Layout:** 2 kartu keputusan besar berdampingan, dengan "stempel"
visual (badge bulat "✅ FINAL")

Kartu 1 — Model 1:
- **XGBoost V2 + Threshold 0.60**
- F1 Macro Test: 0.9906
- WARNING F1: 0.9818
- Fatal Error: 0

Kartu 2 — Model 2:
- **LSTM V2**
- MAE Test: 0.7985 hari
- Error≤1 hari: 98.04%
- Scope: WARNING/CRITICAL only

Bottom: "Keputusan dikunci — diekspor sebagai
`classifier_final.pkl` & `rul_predictor_final.h5`"

---

### SLIDE 23 — Fase 10: Deployment Architecture
**Phase badge:** FASE 10 (cyan terang)
**Layout:** Diagram pipeline produksi (horizontal flow)

```
[Raw Sensor JSON] → [preprocessing_pipeline.pkl]
   → [XGBoost Classifier] → HEALTHY/WARNING/CRITICAL
        │ (jika WARNING/CRITICAL)
        ▼
   [LSTM RUL Predictor] → RUL (hari)
        │
        ▼
   [FastAPI /api/ml/predict] → Backend
```

Bottom — 3 catatan teknis kecil (ikon + 1 baris):
- 🔧 "Pickle bug: class dipindah dari `__main__` ke modul proper"
- 🔧 "TF/Keras breaking change: pin TF==2.15.0, model re-export ke .h5"
- ✅ "Smoke test: 5/5 skenario passed, response <130ms"

---

### SLIDE 24 — Closing: Key Results & Impact
**Phase badge:** none (closing slide, full dark)
**Layout:** Grid 2x2 stat besar di tengah

| | |
|---|---|
| **0.9818** F1 WARNING | **0** Fatal Error |
| **0.7985 hari** MAE RUL | **98.04%** Error≤1 hari |

Bottom: 1 kalimat penutup —
"Dari 0.056% data failure menjadi sistem prediktif yang siap deploy:
SSBS + cascaded XGBoost-LSTM architecture membuktikan bahwa penanganan
temporal yang tepat mengubah extreme imbalance menjadi keunggulan,
bukan hambatan."

---

## 4. ASSET CHECKLIST

| Asset | Status | Sumber |
|---|---|---|
| `figures/cohensd_chart.png` | ✅ Sudah dibuat | figure_export.ipynb Cell 2 |
| `figures/ssbs_diagram.png` | ✅ Sudah dibuat | figure_export.ipynb Cell 3 |
| `figures/confusion_matrix_xgb.png` | ✅ Sudah dibuat | figure_export.ipynb Cell 5 |
| `figures/learning_curve_lstm.png` | ⚠️ Cek Cell 7/8 | figure_export.ipynb |
| `figures/rul_actual_vs_pred.png` | ✅ Sudah dibuat | figure_export.ipynb Cell 6 |
| `figures/learning_curve_clf.png` | ✅ Sudah dibuat (tidak dipakai di deck ini, opsional Slide 16) | figure_export.ipynb Cell 7 |
| Diagram TikZ (Slide 2, 6, 8, 11, 12, 15, 23) | 🆕 Native shapes di pptxgenjs | dibuat langsung di .js |

---

## 5. CATATAN UNTUK TAHAP 2 (.js Generation)

Untuk menjaga konsistensi dengan workflow `crisp_dm_pptx.js` yang sudah
ada, mohon siapkan/upload:

1. **`crisp_dm_pptx.js`** — agar struktur kode (helper function untuk
   slide master, font config, color constants) bisa di-reuse/extend,
   bukan ditulis ulang dari nol
2. **`PRIME_CRISP_DM_Presentation.pdf`** (opsional) — untuk cek apakah
   ada elemen branding (logo PRIME, font khusus) yang perlu dipertahankan

Setelah kedua file tersedia, generation script `ml_pipeline_pptx.js`
akan:
- Reuse helper functions (slide master, addTitle, addStatBox, dll.)
  dari `crisp_dm_pptx.js`
- Terapkan palet warna baru "PRIME Command Center" di atas
- Generate 24 slide sesuai rancangan ini
- Embed 5 PNG dari `figures/` + diagram native (TikZ-equivalent
  shapes di pptxgenjs)

**Status:** Rancangan ini siap direview. Setelah approved, lanjut ke
generation script (Tahap 2).
