/**
 * ml_5slides_pptx.js
 * Generator PPTX 5 Slide — PRIME: Predictive Maintenance ML Presentation
 *
 * Referensi konten: ml_presentation_5slides.md
 * Jalankan: node ml_5slides_pptx.js
 * Output : ML_Presentation_PRIME.pptx
 *
 * Dependensi: npm install pptxgenjs
 */

const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "PRIME — ML Predictive Maintenance Presentation";

// ─── PATH GAMBAR ──────────────────────────────────────────────
const FIGURES = path.resolve(__dirname, "../figures");
const IMG_CONF_MAT  = path.join(FIGURES, "confusion_matrix_xgb.png");
const IMG_LEARN_CLF = path.join(FIGURES, "learning_curve_clf.png");
const IMG_RUL_PRED  = path.join(FIGURES, "rul_actual_vs_pred.png");
const IMG_LEARN_LSTM= path.join(FIGURES, "learning_curve_lstm.png");

// ─── PALET WARNA ─────────────────────────────────────────────
const C = {
  dark:       "14532D",  // forest green gelap (background utama)
  accent:     "16A34A",  // hijau medium (aksen)
  accentDark: "166534",  // hijau tua kuat
  pale:       "DCFCE7",  // hijau muda (card background)
  paleBorder: "86EFAC",  // hijau border
  white:      "FFFFFF",
  offWhite:   "F8FAFC",
  textDark:   "0F172A",
  textMed:    "334155",
  textLight:  "94A3B8",
  healthy:    "16A34A",
  warning:    "D97706",
  critical:   "DC2626",
  cardBg:     "F0FDF4",
  grayFrame:  "CBD5E1",  // abu-abu untuk frame foto placeholder
};

// ─── HELPERS ─────────────────────────────────────────────────
function shadow() {
  return { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.10 };
}

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.cardBg },
    line: { color: opts.border || C.paleBorder, width: 1.2 },
    rectRadius: 0.12,
    shadow: shadow()
  });
}

function addHeader(slide, title, subtitle) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.55,
    fill: { color: C.dark }, line: { color: C.dark }
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 0.38, y: 0.13, w: 0.29, h: 0.29,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  slide.addText(title, {
    x: 0.75, y: 0, w: 8.8, h: 0.55,
    fontSize: 18, bold: true, color: C.white,
    fontFace: "Calibri", valign: "middle", margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.75, y: 0.55, w: 8.8, h: 0.28,
      fontSize: 9.5, color: C.textLight, fontFace: "Calibri", valign: "middle", margin: 0
    });
  }
}

function addStatCard(slide, x, y, w, h, value, label, color) {
  addCard(slide, x, y, w, h, { fill: C.white });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.06,
    fill: { color: color || C.accent }, line: { color: color || C.accent }
  });
  slide.addText(value, {
    x, y: y + 0.12, w, h: h * 0.46,
    fontSize: 22, bold: true, color: color || C.accentDark,
    fontFace: "Calibri", align: "center", valign: "middle", margin: 0
  });
  slide.addText(label, {
    x: x + 0.08, y: y + h * 0.6, w: w - 0.16, h: h * 0.36,
    fontSize: 9, color: C.textMed, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0, wrap: true
  });
}

// ════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  // Lingkaran dekoratif
  s.addShape(pres.shapes.OVAL, {
    x: -1.2, y: -1.2, w: 4, h: 4,
    fill: { color: C.accentDark, transparency: 65 }, line: { color: C.accentDark }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 7.6, y: 3.6, w: 3.2, h: 3.2,
    fill: { color: C.accent, transparency: 72 }, line: { color: C.accent }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8.4, y: -0.6, w: 2, h: 2,
    fill: { color: "166534", transparency: 60 }, line: { color: "166534" }
  });

  // Badge mata kuliah
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.6, y: 0.6, w: 4.8, h: 0.4,
    fill: { color: C.accent, transparency: 20 }, line: { color: C.paleBorder }, rectRadius: 0.1
  });
  s.addText("Mata Kuliah Machine Learning — Politeknik Negeri Jakarta", {
    x: 2.6, y: 0.6, w: 4.8, h: 0.4,
    fontSize: 9.5, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", bold: true, margin: 0
  });

  // Judul utama
  s.addText("PRIME", {
    x: 0.8, y: 1.05, w: 8.4, h: 1.1,
    fontSize: 60, bold: true, color: C.white,
    fontFace: "Calibri", align: "center"
  });
  s.addText("Predictive Reliability & Intelligence Maintenance Engine", {
    x: 0.8, y: 2.15, w: 8.4, h: 0.6,
    fontSize: 16, color: "86EFAC", fontFace: "Calibri", align: "center", italic: false
  });

  // Garis pembatas
  s.addShape(pres.shapes.LINE, {
    x: 2.0, y: 2.9, w: 6, h: 0,
    line: { color: C.paleBorder, width: 1.5 }
  });

  s.addText("Hybrid Machine Learning & Deep Learning untuk Predictive Maintenance Industri", {
    x: 1, y: 3.0, w: 8, h: 0.4,
    fontSize: 12, color: C.textLight, fontFace: "Calibri", align: "center"
  });
  s.addText("Health Status Classification  ·  Remaining Useful Life Prediction", {
    x: 1, y: 3.42, w: 8, h: 0.35,
    fontSize: 11, color: "6EE7B7", fontFace: "Calibri", align: "center", italic: true
  });

  // Lapis AI badge di bawah
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 3.8, y: 4.75, w: 2.4, h: 0.42,
    fill: { color: C.accentDark, transparency: 30 }, line: { color: C.paleBorder }, rectRadius: 0.08
  });
  s.addText("Tim Lapis AI — 2026", {
    x: 3.8, y: 4.75, w: 2.4, h: 0.42,
    fontSize: 10, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
  });

  s.addNotes("Selamat pagi. Hari ini kami mempresentasikan PRIME — sebuah pipeline end-to-end untuk Predictive Maintenance mesin industri menggunakan kombinasi Machine Learning klasik dan Deep Learning.");
}

// ════════════════════════════════════════════════════════════════
// SLIDE 2 — ANGGOTA TIM & PERAN
// ════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addHeader(s, "Tim Lapis AI — Anggota & Peran", "Jurusan Teknik Informatika · Politeknik Negeri Jakarta");

  const members = [
    { name: "Achmad Zikran Maulida", nim: "________", role: "ML Engineer", sub: "Model Development & Pipeline" },
    { name: "Amir Hamzah",          nim: "________", role: "ML Engineer", sub: "Feature Engineering & EDA" },
    { name: "Aqsa Zamzami",         nim: "________", role: "ML Engineer", sub: "Evaluation & Deployment" },
    { name: "Reynaldi Chandra K.",  nim: "________", role: "Backend Engineer", sub: "API & Integration" },
  ];

  const cardW = 2.18;
  const cardH = 3.6;
  const startX = 0.35;
  const startY = 0.88;

  members.forEach((m, i) => {
    const x = startX + i * (cardW + 0.08);

    // Kartu anggota
    addCard(s, x, startY, cardW, cardH, { fill: C.white });

    // Accent strip atas
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: startY, w: cardW, h: 0.32,
      fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.06
    });
    // Nomor urut
    s.addText(String(i + 1), {
      x, y: startY, w: cardW, h: 0.32,
      fontSize: 11, bold: true, color: "86EFAC",
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });

    // === FRAME FOTO PLACEHOLDER ===
    // Background frame
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.34, y: startY + 0.42, w: 1.5, h: 1.5,
      fill: { color: C.grayFrame, transparency: 30 },
      line: { color: C.grayFrame, width: 1.5 },
      rectRadius: 0.1
    });
    // Ikon orang (lingkaran kepala)
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.79, y: startY + 0.60, w: 0.6, h: 0.6,
      fill: { color: C.textLight, transparency: 40 }, line: { color: C.textLight }
    });
    // Badan placeholder
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.64, y: startY + 1.22, w: 0.9, h: 0.58,
      fill: { color: C.textLight, transparency: 40 }, line: { color: C.textLight }, rectRadius: 0.08
    });
    // Teks "Foto"
    s.addText("Foto", {
      x: x + 0.34, y: startY + 1.78, w: 1.5, h: 0.22,
      fontSize: 8, color: C.textLight, fontFace: "Calibri", align: "center", italic: true
    });

    // Nama anggota
    s.addText(m.name, {
      x: x + 0.1, y: startY + 2.05, w: cardW - 0.2, h: 0.52,
      fontSize: 10.5, bold: true, color: C.textDark, fontFace: "Calibri",
      align: "center", wrap: true
    });
    // NIM
    s.addText("NIM: " + m.nim, {
      x: x + 0.1, y: startY + 2.58, w: cardW - 0.2, h: 0.28,
      fontSize: 8.5, color: C.textMed, fontFace: "Calibri", align: "center"
    });

    // Badge peran
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.18, y: startY + 2.9, w: cardW - 0.36, h: 0.42,
      fill: { color: i === 3 ? C.accentDark : C.accent },
      line: { color: i === 3 ? C.accentDark : C.accent }, rectRadius: 0.08
    });
    s.addText(m.role, {
      x: x + 0.18, y: startY + 2.9, w: cardW - 0.36, h: 0.42,
      fontSize: 9.5, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    // Sub-peran
    s.addText(m.sub, {
      x: x + 0.1, y: startY + 3.36, w: cardW - 0.2, h: 0.2,
      fontSize: 7.5, color: C.textMed, fontFace: "Calibri", align: "center"
    });
  });

  // Institusi footer
  s.addText("Jurusan Teknik Informatika dan Komputer, Program Studi Teknik Informatika · Politeknik Negeri Jakarta", {
    x: 0.5, y: 5.1, w: 9, h: 0.28,
    fontSize: 8.5, color: C.textMed, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Tim Lapis AI terdiri dari 4 anggota dari Jurusan Teknik Informatika PNJ. Satu anggota fokus pada sisi Backend/API, tiga lainnya pada pengembangan pipeline Machine Learning.");
}

// ════════════════════════════════════════════════════════════════
// SLIDE 3 — STUDI KASUS: 2 PROBLEM ML
// ════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addHeader(s, "Dua Studi Kasus: Definisi Problem Machine Learning", "Data: 100.000 baris sensor IoT · 20 Mesin Industri · 208 Hari Operasional");

  // ── Stat cards (baris atas)
  const stats = [
    ["20",     "Mesin IoT",   C.accentDark],
    ["100K",   "Baris Data",  C.accentDark],
    ["0.056%", "Failure Rate",C.critical],
    ["69",     "Fitur Input", C.accentDark],
  ];
  stats.forEach(([val, lbl, col], i) => {
    addStatCard(s, 0.35 + i * 2.35, 0.88, 2.18, 0.95, val, lbl, col);
  });

  // ── Studi Kasus 1 — Klasifikasi
  addCard(s, 0.35, 2.0, 4.55, 3.2, { fill: C.white });
  // Header kartu
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 2.0, w: 4.55, h: 0.4,
    fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.07
  });
  s.addText("Studi Kasus 1 — Klasifikasi Status Kesehatan Mesin", {
    x: 0.35, y: 2.0, w: 4.55, h: 0.4,
    fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0
  });

  // Tipe & IO
  s.addText("Tipe: Multi-class Classification  |  Input: 69 fitur sensor + time-series", {
    x: 0.48, y: 2.44, w: 4.28, h: 0.3,
    fontSize: 8.5, color: C.textMed, fontFace: "Calibri"
  });

  // 3 Kelas output
  const classes = [
    { label: "HEALTHY (0)", sub: "Mesin beroperasi normal", color: C.healthy },
    { label: "WARNING (1)", sub: "Degradasi: T-48h sebelum failure", color: C.warning },
    { label: "CRITICAL (2)", sub: "Darurat: T-24h sebelum failure", color: C.critical },
  ];
  classes.forEach((c, i) => {
    const y = 2.78 + i * 0.56;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.48, y, w: 1.55, h: 0.42,
      fill: { color: c.color }, line: { color: c.color }, rectRadius: 0.07
    });
    s.addText(c.label, {
      x: 0.48, y, w: 1.55, h: 0.42,
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText(c.sub, {
      x: 2.1, y: y + 0.04, w: 2.65, h: 0.35,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", valign: "middle"
    });
  });

  // Tantangan
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.48, y: 4.52, w: 4.28, h: 0.56,
    fill: { color: "FEE2E2" }, line: { color: "FCA5A5" }, rectRadius: 0.07
  });
  s.addText("⚠ Tantangan: Extreme Imbalance (0.056% failure) → Solusi: SSBS + Machine-Based Split + Train-Only SMOTE", {
    x: 0.55, y: 4.55, w: 4.15, h: 0.52,
    fontSize: 8.5, color: C.critical, fontFace: "Calibri", wrap: true, bold: true
  });

  // ── Studi Kasus 2 — RUL
  addCard(s, 5.1, 2.0, 4.55, 3.2, { fill: C.white });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 2.0, w: 4.55, h: 0.4,
    fill: { color: C.accentDark }, line: { color: C.accentDark }, rectRadius: 0.07
  });
  s.addText("Studi Kasus 2 — Peramalan Sisa Umur Mesin (RUL)", {
    x: 5.1, y: 2.0, w: 4.55, h: 0.4,
    fontSize: 10.5, bold: true, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0
  });

  s.addText("Tipe: Regression  |  Input: Sequence 24 timestep × 69 fitur (WARNING/CRITICAL only)", {
    x: 5.22, y: 2.44, w: 4.28, h: 0.3,
    fontSize: 8.5, color: C.textMed, fontFace: "Calibri"
  });

  // Output card
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.22, y: 2.78, w: 4.28, h: 0.6,
    fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.07
  });
  s.addText([
    { text: "Output: ", options: { bold: true } },
    { text: "rul_days (float) — jumlah hari tersisa hingga failure" }
  ], {
    x: 5.3, y: 2.85, w: 4.12, h: 0.46,
    fontSize: 9.5, color: C.accentDark, fontFace: "Calibri", wrap: true
  });

  // Cascade Architecture
  const cascItems = [
    { label: "Model 1", sub: "Semua data sensor\n(real-time, setiap tick)", color: C.dark },
    { label: "→", sub: "", color: null },
    { label: "WARN/CRIT?", sub: "Jika Ya ↓\nJika HEALTHY: skip", color: C.warning },
    { label: "→", sub: "", color: null },
    { label: "Model 2", sub: "Prediksi rul_days\n(LSTM aktif)", color: C.accentDark },
  ];

  const cxBase = 5.22;
  let cx = cxBase;
  cascItems.forEach((item, i) => {
    if (item.color === null) {
      s.addText("→", {
        x: cx, y: 3.46, w: 0.28, h: 0.55,
        fontSize: 14, color: C.accent, fontFace: "Calibri",
        align: "center", valign: "middle"
      });
      cx += 0.3;
    } else {
      const bw = i === 0 ? 1.1 : i === 2 ? 1.05 : 1.05;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x: cx, y: 3.46, w: bw, h: 0.55,
        fill: { color: item.color }, line: { color: item.color }, rectRadius: 0.07
      });
      s.addText(item.label, {
        x: cx, y: 3.46, w: bw, h: 0.28,
        fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0
      });
      if (item.sub) {
        s.addText(item.sub, {
          x: cx, y: 3.72, w: bw, h: 0.28,
          fontSize: 7, color: "D1FAE5", fontFace: "Calibri", align: "center", wrap: true
        });
      }
      cx += bw + 0.3;
    }
  });

  // Target variabel
  const zones = [
    { z: "WARNING", mae: "~2 hari", color: C.warning },
    { z: "CRITICAL", mae: "~1 hari", color: C.critical },
  ];
  zones.forEach((z, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.22 + i * 2.15, y: 4.18, w: 2.0, h: 0.52,
      fill: { color: z.color, transparency: 15 }, line: { color: z.color }, rectRadius: 0.07
    });
    s.addText(z.z + " — Median RUL: " + z.mae, {
      x: 5.22 + i * 2.15, y: 4.18, w: 2.0, h: 0.52,
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", wrap: true, margin: 0
    });
  });

  s.addText("↑ Cascade: Model 2 hemat ~70% beban inferensi (HEALTHY >87% waktu operasional)", {
    x: 5.22, y: 4.76, w: 4.28, h: 0.4,
    fontSize: 8.5, color: C.accentDark, fontFace: "Calibri", bold: true, italic: true
  });

  s.addNotes("Model pertama seperti 'dokter' yang mendiagnosis status mesin sekarang. Jika hasilnya WARNING atau CRITICAL, Model kedua baru aktif sebagai 'ahli prognosis' yang memprediksi berapa hari tersisa sebelum failure. Desain cascade ini hemat 70% beban komputasi.");
}

// ════════════════════════════════════════════════════════════════
// SLIDE 4 — EVALUASI: STUDI KASUS 1 (KLASIFIKASI)
// ════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addHeader(s, "Hasil Evaluasi: Klasifikasi Status Kesehatan Mesin", "Perbandingan 3 Algoritma — Random Forest vs XGBoost V2 vs LightGBM");

  // ── Tabel Hyperparameter
  addCard(s, 0.35, 0.88, 5.35, 1.55, { fill: C.white });
  s.addText("Hyperparameter Utama", {
    x: 0.48, y: 0.92, w: 5.1, h: 0.3,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const hpRows = [
    ["Parameter",      "Random Forest",  "XGBoost V2",     "LightGBM"],
    ["n_estimators",   "300",            "499 (early stop)","27 (early stop)"],
    ["max_depth",      "20",             "4",               "—"],
    ["learning_rate",  "—",              "0.01",            "0.05"],
    ["reg_α / reg_λ",  "—",              "0.5 / 2.0",       "—"],
    ["class_weight",   "balanced",       "—",               "—"],
    ["WARN threshold", "0.50",           "0.60 ★",          "0.65"],
    ["Model size",     "3.15 MB",        "1.68 MB",         "0.13 MB"],
  ];
  s.addTable(hpRows, {
    x: 0.42, y: 1.24, w: 5.22, h: 1.1,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", rowH: 0.13,
    color: C.textDark, fontSize: 8,
    fill: { color: C.white },
    autoPage: false,
  });

  // ── Tabel Hasil Evaluasi
  addCard(s, 0.35, 2.52, 5.35, 1.55, { fill: C.white });
  s.addText("Hasil Evaluasi — Test Set", {
    x: 0.48, y: 2.56, w: 5.1, h: 0.3,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const evalRows = [
    ["Model",            "F1 Val",  "F1 Test", "F1 WARNING", "F1 CRITICAL", "Acc Test", "Fatal Err"],
    ["Random Forest",    "0.9292",  "0.9914",  "0.9856",     "0.9889",      "0.9978",   "0"],
    ["XGBoost V2 ✅",   "0.9894★", "0.9906",  "0.9856",     "0.9866",      "0.9974",   "0"],
    ["LightGBM",         "0.9845",  "0.9876",  "0.9781",     "0.9865",      "0.9956",   "0"],
  ];
  s.addTable(evalRows, {
    x: 0.42, y: 2.88, w: 5.22, h: 1.1,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", rowH: 0.25,
    color: C.textDark, fontSize: 8,
    fill: { color: C.white },
    autoPage: false,
  });

  // ── Threshold Tuning Callout
  addCard(s, 0.35, 4.16, 5.35, 1.0, { fill: "FEF9EE", border: C.warning });
  s.addText("⚡ Threshold Tuning XGBoost V2 (Validation Set)", {
    x: 0.48, y: 4.2, w: 5.1, h: 0.28,
    fontSize: 9.5, bold: true, color: C.warning, fontFace: "Calibri"
  });
  const thrRows = [
    ["Threshold",       "WARN Precision", "WARN Recall", "F1 WARNING", "False Alarms"],
    ["0.50 (default)",  "0.087",          "0.975",       "0.159",      "954 ❌"],
    ["0.60 (optimal) ✅","0.973",         "0.990",       "0.9818",     "1 ✅"],
  ];
  s.addTable(thrRows, {
    x: 0.42, y: 4.50, w: 5.22, h: 0.62,
    border: { pt: 0.5, color: "FCD34D" },
    fontFace: "Calibri", rowH: 0.19,
    color: C.textDark, fontSize: 8.5,
    fill: { color: "FFFBEB" },
    autoPage: false,
  });

  // ── Confusion Matrix (gambar)
  addCard(s, 5.9, 0.88, 3.75, 3.5, { fill: C.white });
  s.addText("Confusion Matrix — XGBoost V2", {
    x: 5.95, y: 0.92, w: 3.6, h: 0.3,
    fontSize: 9.5, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center"
  });
  try {
    s.addImage({
      path: IMG_CONF_MAT,
      x: 5.95, y: 1.24, w: 3.65, h: 2.95
    });
  } catch {
    // Fallback jika file tidak ditemukan
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.95, y: 1.24, w: 3.65, h: 2.95,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.1
    });
    s.addText("[ Confusion Matrix XGBoost V2 ]\nfigures/confusion_matrix_xgb.png", {
      x: 5.95, y: 2.2, w: 3.65, h: 1.0,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", align: "center", italic: true, wrap: true
    });
  }

  // Learning curve inset
  addCard(s, 5.9, 4.45, 3.75, 0.72, { fill: C.white });
  try {
    s.addImage({
      path: IMG_LEARN_CLF,
      x: 5.95, y: 4.48, w: 3.65, h: 0.66
    });
  } catch {
    s.addText("[ Learning Curve Classifier — figures/learning_curve_clf.png ]", {
      x: 5.95, y: 4.48, w: 3.65, h: 0.66,
      fontSize: 8, color: C.textMed, fontFace: "Calibri", align: "center", italic: true
    });
  }

  s.addNotes("Ketiga model mencapai zero fatal error — tidak ada CRITICAL yang salah diagnosa sebagai HEALTHY. Perbedaan krusialnya ada di false alarm. Dengan threshold default 0.50, XGBoost menghasilkan 954 peringatan palsu. Setelah kalibrasi ke 0.60, turun menjadi hanya 1, sementara WARNING Recall tetap 99%.");
}

// ════════════════════════════════════════════════════════════════
// SLIDE 5 — EVALUASI: STUDI KASUS 2 (RUL PREDICTION)
// ════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addHeader(s, "Hasil Evaluasi: Peramalan Sisa Umur Mesin (RUL)", "Perbandingan 3 Algoritma — XGBoost Reg vs LSTM V2 vs GRU · WARNING+CRITICAL Only");

  // ── Tabel Hyperparameter Model 2
  addCard(s, 0.35, 0.88, 5.35, 1.62, { fill: C.white });
  s.addText("Arsitektur & Hyperparameter Utama", {
    x: 0.48, y: 0.92, w: 5.1, h: 0.28,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const hp2Rows = [
    ["Parameter",       "XGBoost Reg",              "LSTM V2",                   "GRU"],
    ["Arsitektur",      "Gradient Boosted Tree",     "2-Layer LSTM Stack",        "2-Layer GRU Stack"],
    ["Layer 1",         "n_est=1000, depth=4",       "LSTM(64u)+Dropout(0.3)",   "GRU(48u)+Dropout(0.3)"],
    ["Layer 2",         "lr=0.01, sub=0.8",          "LSTM(32u)+Dropout(0.3)",   "GRU(24u)+Dropout(0.3)"],
    ["Reg / BN",        "α=0.3, λ=1.5",              "L2(0.001)+BatchNorm",       "L2(0.001)+BatchNorm"],
    ["Total Params",    "—",                         "47,649",                    "~27,000"],
    ["Optimizer",       "objective=reg:sqerr",       "Adam lr=0.001",             "Adam lr=0.001"],
    ["Seq Input",       "tabular (no seq)",          "24 timestep × 69 fitur",    "24 timestep × 69 fitur"],
    ["Stop Epoch",      "iter 497/1000",             "epoch 184/200 ★",           "epoch 151/300"],
  ];
  s.addTable(hp2Rows, {
    x: 0.42, y: 1.22, w: 5.22, h: 1.22,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", rowH: 0.13,
    color: C.textDark, fontSize: 7.5,
    fill: { color: C.white },
    autoPage: false,
  });

  // ── Tabel Hasil Evaluasi
  addCard(s, 0.35, 2.58, 5.35, 1.25, { fill: C.white });
  s.addText("Hasil Evaluasi — Test Set (WARNING+CRITICAL Only)", {
    x: 0.48, y: 2.62, w: 5.1, h: 0.28,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const eval2Rows = [
    ["Model",             "MAE Val",  "MAE Test",   "RMSE",   "R²",    "E≤1hari",  "E≤3hari"],
    ["XGBoost Reg",       "1.7189",   "1.1020",     "5.6002", "0.3961","93.53%",   "94.92%"],
    ["LSTM V2 ✅",       "1.6461",   "0.7985 ★",   "6.3803", "0.2594","98.04%★",  "98.04%★"],
    ["GRU",               "1.8618",   "0.9515",     "7.3011", "0.0303","97.80%",   "97.80%"],
  ];
  s.addTable(eval2Rows, {
    x: 0.42, y: 2.92, w: 5.22, h: 0.88,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", rowH: 0.21,
    color: C.textDark, fontSize: 8,
    fill: { color: C.white },
    autoPage: false,
  });

  // ── Zone Analysis Callout
  addCard(s, 0.35, 3.9, 5.35, 1.28, { fill: "F0FDF4", border: C.paleBorder });
  s.addText("📍 Zone Analysis — LSTM V2 (Test Set)", {
    x: 0.48, y: 3.94, w: 5.1, h: 0.28,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const zoneItems = [
    { z: "WARNING Zone", n: "208 sampel", mae: "0.10 hari", note: "Near-perfect — presisi tinggi", color: C.warning },
    { z: "CRITICAL Zone", n: "225 sampel", mae: "2.03 hari", note: "Tail-end outlier (RUL tinggi)", color: C.critical },
    { z: "Overall", n: "433 sampel", mae: "0.7985 hari", note: "Business-grade accuracy ★", color: C.accentDark },
  ];
  zoneItems.forEach((z, i) => {
    const x = 0.45 + i * 1.76;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.26, w: 1.65, h: 0.8,
      fill: { color: z.color, transparency: i === 2 ? 0 : 18 },
      line: { color: z.color }, rectRadius: 0.08
    });
    s.addText(z.z, {
      x, y: 4.26, w: 1.65, h: 0.28,
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0
    });
    s.addText("MAE = " + z.mae, {
      x, y: 4.52, w: 1.65, h: 0.28,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle"
    });
    s.addText(z.note, {
      x, y: 4.8, w: 1.65, h: 0.22,
      fontSize: 7, color: "D1FAE5", fontFace: "Calibri", align: "center"
    });
  });

  // ── Gambar RUL Actual vs Predicted
  addCard(s, 5.9, 0.88, 3.75, 3.28, { fill: C.white });
  s.addText("RUL Actual vs Predicted — LSTM V2", {
    x: 5.95, y: 0.92, w: 3.6, h: 0.28,
    fontSize: 9.5, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center"
  });
  try {
    s.addImage({
      path: IMG_RUL_PRED,
      x: 5.95, y: 1.22, w: 3.65, h: 2.82
    });
  } catch {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.95, y: 1.22, w: 3.65, h: 2.82,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.1
    });
    s.addText("[ RUL Actual vs Predicted ]\nfigures/rul_actual_vs_pred.png", {
      x: 5.95, y: 2.3, w: 3.65, h: 0.8,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", align: "center", italic: true, wrap: true
    });
  }

  // Learning Curve LSTM (inset)
  addCard(s, 5.9, 4.24, 3.75, 0.95, { fill: C.white });
  s.addText("Learning Curve LSTM V2 — Konvergen epoch 184", {
    x: 5.95, y: 4.27, w: 3.6, h: 0.24,
    fontSize: 8.5, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center"
  });
  try {
    s.addImage({
      path: IMG_LEARN_LSTM,
      x: 5.95, y: 4.52, w: 3.65, h: 0.65
    });
  } catch {
    s.addText("[ figures/learning_curve_lstm.png ]", {
      x: 5.95, y: 4.52, w: 3.65, h: 0.65,
      fontSize: 8, color: C.textMed, fontFace: "Calibri", align: "center", italic: true
    });
  }

  // Key insight note
  s.addText("★ LSTM V2 unggul 27.5% vs XGBoost dalam MAE  ·  R² rendah bukan cacat — sensitivitas outlier RUL tinggi", {
    x: 0.35, y: 5.22, w: 9.3, h: 0.3,
    fontSize: 8.5, color: C.accentDark, fontFace: "Calibri",
    align: "center", bold: true, italic: true
  });

  s.addNotes("LSTM V2 unggul di metrik yang paling relevan bisnis: MAE dan Error dalam N hari. Di zona WARNING — 24 hingga 48 jam sebelum failure — MAE hanya 0.10 hari atau 2.4 jam. Operator mendapat jendela waktu yang sangat presisi. R² yang lebih rendah dari XGBoost bukan cerminan kegagalan karena RMSE dan R² sensitif terhadap outlier RUL tinggi di CRITICAL akhir.");
}

// ─── GENERATE FILE ───────────────────────────────────────────
const outputFile = path.resolve(__dirname, "ML_Presentation_PRIME.pptx");
pres.writeFile({ fileName: outputFile })
  .then(() => {
    console.log("✅ PPTX berhasil dibuat:", outputFile);
  })
  .catch(err => {
    console.error("❌ Error:", err);
  });
