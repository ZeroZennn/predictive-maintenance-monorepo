const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "Lapis AI: Predictive Maintenance CRISP-DM";

// ─── COLOR PALETTE ───────────────────────────────────────────
const C = {
  dark:       "14532D",  // deep forest green (dark slides)
  accent:     "16A34A",  // medium green (accent)
  accentDark: "166534",  // dark green (strong accent)
  pale:       "DCFCE7",  // pale green (card bg)
  paleBorder: "86EFAC",  // green border
  white:      "FFFFFF",
  offWhite:   "F8FAFC",
  textDark:   "0F172A",
  textMed:    "334155",
  textLight:  "94A3B8",
  healthy:    "16A34A",  // green
  warning:    "D97706",  // amber
  critical:   "DC2626",  // red
  cardBg:     "F0FDF4",  // very light green
};

// ─── HELPERS ─────────────────────────────────────────────────
function makeShadow() {
  return { type: "outer", color: "000000", blur: 6, offset: 2, angle: 45, opacity: 0.10 };
}

function addSlideHeader(slide, title, subtitle) {
  // Top accent bar area — just use a colored rectangle at top
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.55,
    fill: { color: C.dark }, line: { color: C.dark }
  });
  // Phase label dot
  slide.addShape(pres.shapes.OVAL, {
    x: 0.38, y: 0.13, w: 0.29, h: 0.29,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  // Title text
  slide.addText(title, {
    x: 0.75, y: 0, w: 8.8, h: 0.55,
    fontSize: 20, bold: true, color: C.white,
    fontFace: "Calibri", valign: "middle", margin: 0
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.75, y: 0.55, w: 8.8, h: 0.30,
      fontSize: 10, color: C.textLight, fontFace: "Calibri", valign: "middle", margin: 0
    });
  }
}

function addCard(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || C.cardBg },
    line: { color: opts.border || C.paleBorder, width: 1.2 },
    rectRadius: 0.12,
    shadow: makeShadow()
  });
}

function addStatCard(slide, x, y, w, h, value, label, color) {
  addCard(slide, x, y, w, h, { fill: C.white });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.07,
    fill: { color: color || C.accent }, line: { color: color || C.accent }
  });
  slide.addText(value, {
    x, y: y + 0.15, w, h: h * 0.45,
    fontSize: 22, bold: true, color: color || C.accentDark,
    fontFace: "Calibri", align: "center", valign: "middle", margin: 0
  });
  slide.addText(label, {
    x: x + 0.1, y: y + h * 0.58, w: w - 0.2, h: h * 0.38,
    fontSize: 9.5, color: C.textMed, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0, wrap: true
  });
}

function darkSlide(title, subtitle) {
  const slide = pres.addSlide();
  slide.background = { color: C.dark };
  slide.addText(title, {
    x: 1, y: 1.5, w: 8, h: 1.4,
    fontSize: 36, bold: true, color: C.white,
    fontFace: "Calibri", align: "center", valign: "middle"
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.5, y: 3.0, w: 7, h: 0.6,
      fontSize: 14, color: "86EFAC", fontFace: "Calibri",
      align: "center", italic: true
    });
  }
  // decorative circles
  slide.addShape(pres.shapes.OVAL, {
    x: -0.6, y: -0.6, w: 2.2, h: 2.2,
    fill: { color: C.accentDark, transparency: 70 }, line: { color: C.accentDark }
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 8.8, y: 4.2, w: 1.8, h: 1.8,
    fill: { color: C.accent, transparency: 75 }, line: { color: C.accent }
  });
  return slide;
}

// ────────────────────────────────────────────────────────────
// SLIDE 1 — COVER
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  // Decorative circles
  s.addShape(pres.shapes.OVAL, {
    x: -1, y: -1, w: 3.5, h: 3.5,
    fill: { color: C.accentDark, transparency: 65 }, line: { color: C.accentDark }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 7.8, y: 3.8, w: 2.8, h: 2.8,
    fill: { color: C.accent, transparency: 72 }, line: { color: C.accent }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8.5, y: -0.5, w: 1.8, h: 1.8,
    fill: { color: "166534", transparency: 60 }, line: { color: "166534" }
  });

  // Tag line
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.8, y: 0.65, w: 4.4, h: 0.38,
    fill: { color: C.accent, transparency: 20 }, line: { color: C.paleBorder },
    rectRadius: 0.1
  });
  s.addText("Mata Kuliah Data Mining", {
    x: 2.8, y: 0.65, w: 4.4, h: 0.38,
    fontSize: 10, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", bold: true, margin: 0
  });

  // Main title
  s.addText("Lapis AI", {
    x: 0.8, y: 1.1, w: 8.4, h: 1.0,
    fontSize: 52, bold: true, color: C.white,
    fontFace: "Calibri", align: "center"
  });
  s.addText("Sistem Predictive Maintenance\nBerbasis Machine Learning & Deep Learning", {
    x: 0.8, y: 2.1, w: 8.4, h: 1.0,
    fontSize: 18, color: "86EFAC", fontFace: "Calibri",
    align: "center", italic: false
  });

  // Divider line
  s.addShape(pres.shapes.LINE, {
    x: 2.5, y: 3.2, w: 5, h: 0,
    line: { color: C.paleBorder, width: 1.5 }
  });

  s.addText("Pendekatan CRISP-DM pada Data Sensor IoT Industri", {
    x: 1, y: 3.3, w: 8, h: 0.4,
    fontSize: 12, color: C.textLight, fontFace: "Calibri", align: "center"
  });
  s.addText("[Nama] · [NIM] · [Semester] · [Tahun]", {
    x: 1, y: 4.9, w: 8, h: 0.4,
    fontSize: 10, color: "6EE7B7", fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Selamat pagi/siang. Hari ini saya akan mempresentasikan proyek Lapis AI, sebuah sistem pemeliharaan prediktif untuk industri manufaktur menggunakan metodologi CRISP-DM.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 2 — AGENDA
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Agenda", "Metodologi CRISP-DM — 6 Fase");

  const phases = [
    { num: "01", title: "Business Understanding", sub: "Problem, tujuan & success criteria", color: C.accentDark },
    { num: "02", title: "Data Understanding",     sub: "EDA forensik & analisis statistik", color: C.accentDark },
    { num: "03", title: "Data Preparation",       sub: "Label engineering, feature extraction, splitting", color: C.accentDark },
    { num: "04", title: "Modeling",               sub: "6 eksperimen: RF, XGB, LGBM, LSTM, GRU", color: C.accentDark },
    { num: "05", title: "Evaluation",             sub: "Metrik lengkap, confusion matrix, AUC-ROC", color: C.accentDark },
    { num: "06", title: "Deployment",             sub: "API Contract, Gauge Thresholds, Deliverables", color: C.accentDark },
  ];

  const cols = 3, rows = 2;
  const cw = 3.05, ch = 1.55, gap = 0.1;
  const startX = 0.35, startY = 0.95;

  phases.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cw + gap);
    const y = startY + row * (ch + gap);
    addCard(s, x, y, cw, ch, { fill: C.white });

    // Number circle
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.18, y: y + 0.22, w: 0.48, h: 0.48,
      fill: { color: p.color }, line: { color: p.color }
    });
    s.addText(p.num, {
      x: x + 0.18, y: y + 0.22, w: 0.48, h: 0.48,
      fontSize: 14, bold: true, color: C.white,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(p.title, {
      x: x + 0.72, y: y + 0.2, w: cw - 0.85, h: 0.5,
      fontSize: 12, bold: true, color: C.textDark, fontFace: "Calibri", valign: "middle"
    });
    s.addText(p.sub, {
      x: x + 0.18, y: y + 0.78, w: cw - 0.3, h: 0.6,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri", wrap: true
    });
  });

  s.addText("Proyek ini bersifat end-to-end: dari raw sensor data hingga deployed API", {
    x: 0.5, y: 5.15, w: 9, h: 0.3,
    fontSize: 10, color: C.accent, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Presentasi ini mengikuti 6 fase metodologi CRISP-DM dan bersifat end-to-end dari raw data hingga deployment.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 3 — GAMBARAN SISTEM
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Gambaran Sistem Lapis AI", "Arsitektur 4 Modul");

  const modules = [
    { id: "A", title: "ML Predictive\nEngine", sub: "Role A — Fokus Presentasi", focused: true },
    { id: "B", title: "Hybrid RAG &\nKnowledge Base", sub: "Role B", focused: false },
    { id: "C", title: "Telemetry\nIngestion", sub: "Role C", focused: false },
    { id: "D", title: "Frontend\nDashboard", sub: "Role D", focused: false },
  ];

  modules.forEach((m, i) => {
    const x = 0.35 + i * 2.38;
    const fillCol = m.focused ? C.dark : C.white;
    const textCol = m.focused ? C.white : C.textDark;
    const borderCol = m.focused ? C.accentDark : C.paleBorder;
    addCard(s, x, 0.9, 2.22, 2.6, { fill: fillCol, border: borderCol });
    if (m.focused) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 0.9, w: 2.22, h: 0.45,
        fill: { color: C.accent }, line: { color: C.accent }, rectRadius: 0.05
      });
      s.addText("★ FOKUS", { x, y: 0.9, w: 2.22, h: 0.45,
        fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0 });
    }
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.87, y: m.focused ? 1.42 : 1.05, w: 0.46, h: 0.46,
      fill: { color: m.focused ? C.accent : C.pale }, line: { color: C.accent }
    });
    s.addText(m.id, {
      x: x + 0.87, y: m.focused ? 1.42 : 1.05, w: 0.46, h: 0.46,
      fontSize: 14, bold: true, color: m.focused ? C.white : C.accentDark,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    s.addText(m.title, {
      x: x + 0.1, y: m.focused ? 1.95 : 1.58, w: 2.02, h: 0.75,
      fontSize: 12, bold: true, color: textCol, fontFace: "Calibri",
      align: "center", wrap: true
    });
    s.addText(m.sub, {
      x: x + 0.1, y: m.focused ? 2.75 : 2.38, w: 2.02, h: 0.55,
      fontSize: 9, color: m.focused ? "86EFAC" : C.textMed, fontFace: "Calibri",
      align: "center", wrap: true
    });
    // Arrow
    if (i < 3) {
      s.addShape(pres.shapes.LINE, {
        x: x + 2.22, y: 2.22, w: 0.16, h: 0,
        line: { color: C.accent, width: 2 }
      });
    }
  });

  // Flow diagram below
  const flowItems = ["Sensor IoT", "Telemetry API", "ML Service", "Dashboard"];
  flowItems.forEach((item, i) => {
    const x = 0.55 + i * 2.3;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 4.0, w: 1.9, h: 0.55,
      fill: { color: i === 2 ? C.dark : C.pale }, line: { color: C.paleBorder }, rectRadius: 0.08
    });
    s.addText(item, {
      x, y: 4.0, w: 1.9, h: 0.55,
      fontSize: 10, bold: i === 2, color: i === 2 ? C.white : C.accentDark,
      fontFace: "Calibri", align: "center", valign: "middle", margin: 0
    });
    if (i < 3) {
      s.addText("→", { x: x + 1.93, y: 4.0, w: 0.35, h: 0.55,
        fontSize: 14, color: C.accent, fontFace: "Calibri", align: "center", valign: "middle" });
    }
  });
  s.addText("Alur Data: Sensor → Backend → ML Service → Frontend Dashboard", {
    x: 0.5, y: 4.65, w: 9, h: 0.25,
    fontSize: 9, color: C.textMed, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Lapis AI terdiri dari 4 modul utama. Presentasi ini fokus pada modul ML Predictive Engine (Role A).");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Business Understanding
// ────────────────────────────────────────────────────────────
darkSlide("Fase 1: Business Understanding", "Problem Statement · Tujuan · Success Criteria")
  .addNotes("Kita mulai dari fase pertama CRISP-DM: memahami masalah bisnis yang ingin diselesaikan.");

// ────────────────────────────────────────────────────────────
// SLIDE 4 — LATAR BELAKANG
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Latar Belakang & Problem Statement", "Fase 1 — Business Understanding");

  // 3-column comparison
  const cols = [
    { title: "Reaktif", emoji: "🔴", desc: "Menunggu mesin rusak total, baru diperbaiki. Kerugian besar karena produksi berhenti mendadak.", color: C.critical },
    { title: "Preventif", emoji: "🟡", desc: "Perbaikan terjadwal rutin. Seringkali terlalu dini (boros biaya) atau terlambat (mesin sudah rusak).", color: C.warning },
    { title: "Prediktif ✓", emoji: "🟢", desc: "Deteksi anomali dari sensor IoT SEBELUM kerusakan. Jadwalkan servis tepat waktu & efisien.", color: C.healthy },
  ];

  cols.forEach((c, i) => {
    const x = 0.35 + i * 3.15;
    addCard(s, x, 0.88, 2.95, 3.3, { fill: C.white, border: i === 2 ? C.accent : C.paleBorder });
    if (i === 2) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 0.88, w: 2.95, h: 0.38,
        fill: { color: C.accent }, line: { color: C.accent }, rectRadius: 0.05
      });
      s.addText("SOLUSI LAPIS AI", { x, y: 0.88, w: 2.95, h: 0.38,
        fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0 });
    }
    s.addShape(pres.shapes.OVAL, {
      x: x + 1.22, y: i === 2 ? 1.35 : 1.05, w: 0.5, h: 0.5,
      fill: { color: c.color }, line: { color: c.color }
    });
    s.addText(c.title, {
      x: x + 0.1, y: i === 2 ? 1.95 : 1.65, w: 2.75, h: 0.45,
      fontSize: 14, bold: true, color: i === 2 ? C.accentDark : C.textDark,
      fontFace: "Calibri", align: "center"
    });
    s.addText(c.desc, {
      x: x + 0.18, y: i === 2 ? 2.42 : 2.18, w: 2.6, h: 1.6,
      fontSize: 10, color: C.textMed, fontFace: "Calibri", align: "left", wrap: true
    });
  });

  s.addText("Lapis AI menggunakan data sensor IoT real-time untuk memprediksi kerusakan mesin sebelum terjadi", {
    x: 0.5, y: 4.38, w: 9, h: 0.45,
    fontSize: 11, color: C.accentDark, fontFace: "Calibri",
    align: "center", bold: true, italic: true
  });

  s.addNotes("Mengapa Predictive Maintenance? Karena downtime industri sangat mahal. Pendekatan lama seperti preventive maintenance sering mengganti part yang masih sehat.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 5 — TUJUAN & SUCCESS CRITERIA
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Tujuan Penelitian & Success Criteria", "Fase 1 — Business Understanding");

  // Two goal cards
  const goals = [
    { num: "01", title: "Health Status Classifier", desc: "Klasifikasi kondisi mesin secara real-time ke dalam 3 kelas: HEALTHY, WARNING, CRITICAL", model: "Model 1 — Multi-class Classification", target: "F1-Macro ≥ 0.90\npada mesin unseen", actual: "F1-Test = 0.9906 ✓" },
    { num: "02", title: "RUL Predictor", desc: "Prediksi sisa umur mesin (Remaining Useful Life) dalam satuan hari untuk zona WARNING & CRITICAL", model: "Model 2 — Regression", target: "MAE ≤ 3 hari\nError ≤ 1 hari ≥ 90%", actual: "MAE = 0.80 hari\n98.04% ≤ 1 hari ✓" },
  ];

  goals.forEach((g, i) => {
    const x = 0.35 + i * 4.85;
    addCard(s, x, 0.88, 4.55, 3.5, { fill: C.white });
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: 0.96, w: 0.52, h: 0.52,
      fill: { color: C.dark }, line: { color: C.dark } });
    s.addText(g.num, { x: x + 0.2, y: 0.96, w: 0.52, h: 0.52,
      fontSize: 14, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(g.title, { x: x + 0.82, y: 0.92, w: 3.5, h: 0.6,
      fontSize: 13, bold: true, color: C.textDark, fontFace: "Calibri", valign: "middle" });
    s.addText(g.desc, { x: x + 0.2, y: 1.58, w: 4.15, h: 0.8,
      fontSize: 10, color: C.textMed, fontFace: "Calibri", wrap: true });
    s.addText(g.model, { x: x + 0.2, y: 2.42, w: 4.15, h: 0.32,
      fontSize: 9, color: C.accent, fontFace: "Calibri", bold: true });

    // Target vs Actual
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.2, y: 2.78, w: 1.95, h: 0.95,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.08 });
    s.addText("Target", { x: x + 0.2, y: 2.78, w: 1.95, h: 0.32,
      fontSize: 8.5, bold: true, color: C.textMed, fontFace: "Calibri", align: "center", valign: "middle" });
    s.addText(g.target, { x: x + 0.2, y: 3.08, w: 1.95, h: 0.65,
      fontSize: 9, color: C.accentDark, fontFace: "Calibri", align: "center", wrap: true });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 2.35, y: 2.78, w: 2.0, h: 0.95,
      fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.08 });
    s.addText("Hasil Aktual", { x: x + 2.35, y: 2.78, w: 2.0, h: 0.32,
      fontSize: 8.5, bold: true, color: "86EFAC", fontFace: "Calibri", align: "center", valign: "middle" });
    s.addText(g.actual, { x: x + 2.35, y: 3.08, w: 2.0, h: 0.65,
      fontSize: 9, color: C.white, fontFace: "Calibri", align: "center", wrap: true });
  });

  s.addText("Deliverables: classifier_final.pkl  ·  rul_predictor_final.keras  ·  api_contract_final_v1.json", {
    x: 0.5, y: 4.55, w: 9, h: 0.35,
    fontSize: 9.5, color: C.textMed, fontFace: "Calibri", align: "center"
  });

  s.addNotes("Ada dua tujuan utama: mendiagnosis status saat ini dan memprediksi sisa umur mesin. Semua target berhasil terlampaui.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 6 — DEFINISI PROBLEM ML
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Definisi Problem Machine Learning", "Fase 1 — Business Understanding");

  // Pie chart for imbalance
  s.addChart(pres.charts.PIE, [{
    name: "Distribusi Label",
    labels: ["HEALTHY (99.944%)", "FAILURE (0.056%)"],
    values: [99944, 56]
  }], {
    x: 6.0, y: 0.85, w: 3.7, h: 3.0,
    chartColors: [C.healthy, C.critical],
    showPercent: false,
    showValue: false,
    showLegend: true,
    legendPos: "b",
    legendFontSize: 9,
    chartArea: { fill: { color: C.offWhite } },
    title: "Distribusi Label Asli",
    showTitle: true,
    titleFontSize: 11,
    titleColor: C.textDark
  });

  // Model 1 card
  addCard(s, 0.35, 0.88, 5.4, 1.45, { fill: C.white });
  s.addText("Model 1 — Multi-class Classification", {
    x: 0.55, y: 0.92, w: 5.0, h: 0.35,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "Input: ", options: { bold: true } },
    { text: "Data sensor time-series (8 sensor, 1 jam interval)   " },
    { text: "Output: ", options: { bold: true } },
    { text: "HEALTHY (0)  /  WARNING (1)  /  CRITICAL (2)" }
  ], { x: 0.55, y: 1.3, w: 5.0, h: 0.85, fontSize: 10, color: C.textMed, fontFace: "Calibri", wrap: true });

  // Model 2 card
  addCard(s, 0.35, 2.45, 5.4, 1.45, { fill: C.white });
  s.addText("Model 2 — Regression (RUL Predictor)", {
    x: 0.55, y: 2.49, w: 5.0, h: 0.35,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "Input: ", options: { bold: true } },
    { text: "Sequence 24 timestep sensor (WARNING/CRITICAL only)   " },
    { text: "Output: ", options: { bold: true } },
    { text: "rul_days (float) — prediksi hari tersisa" }
  ], { x: 0.55, y: 2.87, w: 5.0, h: 0.85, fontSize: 10, color: C.textMed, fontFace: "Calibri", wrap: true });

  // Stats row
  addStatCard(s, 0.35, 4.05, 1.65, 1.2, "20", "Mesin IoT", C.accentDark);
  addStatCard(s, 2.05, 4.05, 1.65, 1.2, "100K", "Baris Data", C.accentDark);
  addStatCard(s, 3.75, 4.05, 1.65, 1.2, "0.056%", "Failure Rate", C.critical);
  addStatCard(s, 5.45, 4.05, 1.65, 1.2, "8", "Sensor IoT", C.accentDark);

  s.addNotes("Masalah bisnis diterjemahkan menjadi dua problem ML. Tantangan terbesar adalah extreme class imbalance di mana data kerusakan hanya 0.056%.");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Data Understanding
// ────────────────────────────────────────────────────────────
darkSlide("Fase 2: Data Understanding", "Sumber Data · Sanity Check · EDA Forensik · Cohen's D")
  .addNotes("Fase kedua CRISP-DM: memahami data yang tersedia.");

// ────────────────────────────────────────────────────────────
// SLIDE 7 — SUMBER DATA
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Sumber Data", "Fase 2 — Data Understanding");

  // Dataset 1
  addCard(s, 0.35, 0.88, 4.5, 3.85, { fill: C.white });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 0.88, w: 4.5, h: 0.42,
    fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.05
  });
  s.addText("sensor_readings.csv", { x: 0.35, y: 0.88, w: 4.5, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });

  const sensor1 = [["Kolom", "Tipe", "Keterangan"],
    ["timestamp", "datetime", "Interval 1 jam"],
    ["machine_id", "string", "M-01 hingga M-20"],
    ["temperature", "float", "Suhu operasional"],
    ["vibration", "float", "Getaran mesin"],
    ["pressure", "float", "Tekanan operasional"],
    ["rpm", "int", "Rotasi per menit"],
    ["power_consumption", "float", "Konsumsi daya"],
    ["noise_level", "float", "Tingkat kebisingan"],
    ["humidity", "float", "Kelembaban udara"],
    ["operating_hours", "float", "Jam operasi akumulatif"],
    ["failure", "int", "TARGET: 0=Sehat, 1=Rusak"]];

  s.addTable(sensor1, {
    x: 0.42, y: 1.35, w: 4.35, h: 3.28,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri",
    rowH: 0.26,
    color: C.textDark,
    fontSize: 8.5,
    fill: { color: C.white },
    autoPage: false,
  });

  // Dataset 2
  addCard(s, 5.1, 0.88, 4.55, 2.1, { fill: C.white });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 0.88, w: 4.55, h: 0.42,
    fill: { color: C.accentDark }, line: { color: C.accentDark }, rectRadius: 0.05
  });
  s.addText("maintenance_logs.csv", { x: 5.1, y: 0.88, w: 4.55, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });

  s.addText([
    { text: "500 baris × 8 kolom\n", options: { bold: true, breakLine: true } },
    { text: "Catatan teks teknisi (technician_notes)\n", options: { breakLine: true } },
    { text: "Jenis maintenance (Preventive/Corrective)\n", options: { breakLine: true } },
    { text: "Part yang diganti, downtime, biaya (IDR)\n", options: { breakLine: true } },
    { text: "→ Digunakan untuk NLP & degradation proxy", options: { bold: false } }
  ], { x: 5.25, y: 1.38, w: 4.2, h: 1.45, fontSize: 10, color: C.textMed, fontFace: "Calibri" });

  // Stats
  const stats = [["100,000", "Baris Sensor", C.accentDark], ["11", "Kolom", C.accentDark], ["208 hari", "Rentang Data", C.accentDark], ["Jul 2025", "Mulai", C.accentDark]];
  stats.forEach((st, i) => addStatCard(s, 5.1 + i * 1.15, 3.1, 1.08, 1.62, st[0], st[1], st[2]));

  s.addNotes("Dua sumber data utama: sensor readings 100K baris dan maintenance logs 500 baris catatan teknisi.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 8 — DATA QUALITY
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Data Quality & Sanity Check", "Fase 2 — Data Understanding");

  // Bar chart (log scale via big/small values)
  s.addChart(pres.charts.BAR, [{
    name: "Jumlah Baris",
    labels: ["FAILURE (1)", "HEALTHY (0)"],
    values: [56, 99944]
  }], {
    x: 5.4, y: 0.85, w: 4.2, h: 3.2,
    barDir: "col",
    chartColors: [C.critical, C.healthy],
    showValue: true,
    dataLabelFontSize: 9,
    dataLabelColor: C.textDark,
    catAxisLabelColor: C.textMed,
    valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" },
    catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "Distribusi Label (Extreme Imbalance)",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: false
  });

  const findings = [
    { icon: "✅", title: "0 Missing Values", sub: "sensor_readings.csv bersih sempurna", ok: true },
    { icon: "⚠️", title: "11.8% NaN", sub: "Kolom parts_replaced di maintenance_logs → diisi 'Unknown'", ok: false },
    { icon: "✅", title: "0 Duplikat Timestamp", sub: "Setiap (timestamp, machine_id) unik", ok: true },
    { icon: "✅", title: "0 Gap Temporal", sub: "Deret waktu kontinu sempurna 1 jam", ok: true },
    { icon: "⚠️", title: "Vibration Min = -0.09", sub: "Nilai negatif tidak valid secara fisik → di-clip ke 0", ok: false },
    { icon: "🔴", title: "Extreme Imbalance", sub: "failure=1 hanya 56 baris (0.056%) dari 100,000", ok: null },
  ];

  findings.forEach((f, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 0.35 + col * 2.55;
    const y = 0.88 + row * 1.08;
    const bColor = f.ok === true ? C.pale : f.ok === false ? "FEF3C7" : "FEE2E2";
    const border = f.ok === true ? C.paleBorder : f.ok === false ? "FCD34D" : "FCA5A5";
    addCard(s, x, y, 2.35, 0.92, { fill: bColor, border });
    s.addText(f.icon + " " + f.title, {
      x: x + 0.12, y: y + 0.05, w: 2.12, h: 0.35,
      fontSize: 10, bold: true, color: C.textDark, fontFace: "Calibri"
    });
    s.addText(f.sub, {
      x: x + 0.12, y: y + 0.4, w: 2.12, h: 0.48,
      fontSize: 8.5, color: C.textMed, fontFace: "Calibri", wrap: true
    });
  });

  s.addText("→ Tantangan utama: ketimpangan kelas ekstrem yang harus diatasi di Fase Data Preparation", {
    x: 0.35, y: 4.2, w: 5.0, h: 0.55,
    fontSize: 9.5, color: C.critical, fontFace: "Calibri",
    bold: true, wrap: true, italic: true
  });

  s.addNotes("Data sensor bersih namun ada ketimpangan label yang sangat ekstrem — tantangan utama yang akan diselesaikan di Data Preparation.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 9 — EDA FORENSIK
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "EDA Forensik: Failure Autopsy", "Fase 2 — Data Understanding");

  // Main content: left side findings, right side mockup chart
  addCard(s, 0.35, 0.88, 4.6, 4.15, { fill: C.white });
  s.addText("Metodologi Failure Autopsy", {
    x: 0.5, y: 0.92, w: 4.3, h: 0.38,
    fontSize: 12, bold: true, color: C.accentDark, fontFace: "Calibri"
  });

  const findings = [
    { marker: "Mesin Dianalisis", val: "M-01 (4x), M-09 (2x), M-05 (1x)" },
    { marker: "Look-back Window", val: "72 jam per failure event" },
    { marker: "Sinyal Berubah", val: "Mulai T-48 jam sebelum failure" },
    { marker: "Eskalasi Dramatis", val: "T-24 jam sebelum failure" },
    { marker: "Konsistensi", val: "Pola universal di semua mesin" },
  ];
  findings.forEach((f, i) => {
    const y = 1.38 + i * 0.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.48, y, w: 1.55, h: 0.45,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.07
    });
    s.addText(f.marker, { x: 0.48, y, w: 1.55, h: 0.45,
      fontSize: 8.5, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center", valign: "middle" });
    s.addText(f.val, { x: 2.1, y: y + 0.03, w: 2.7, h: 0.4,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri", valign: "middle" });
  });

  // Timeline zones
  const zones = [
    { label: "HEALTHY", color: C.healthy, x: 0.5, w: 1.6 },
    { label: "WARNING", color: C.warning, x: 2.22, w: 1.1 },
    { label: "CRITICAL", color: C.critical, x: 3.44, w: 0.85 },
  ];
  s.addText("Zona yang Ditemukan:", {
    x: 0.48, y: 4.42, w: 4.3, h: 0.3,
    fontSize: 9, bold: true, color: C.textDark, fontFace: "Calibri"
  });
  zones.forEach(z => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: z.x - 0.02, y: 4.72, w: z.w, h: 0.35,
      fill: { color: z.color }, line: { color: z.color }, rectRadius: 0.05
    });
    s.addText(z.label, { x: z.x - 0.02, y: 4.72, w: z.w, h: 0.35,
      fontSize: 8, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
  });

  // Right side: simulated line chart showing sensor spike
  s.addChart(pres.charts.LINE, [
    {
      name: "Temperature (°C)",
      labels: ["-72h", "-60h", "-48h", "-36h", "-24h", "-12h", "-6h", "0h"],
      values: [72, 72.5, 74, 78, 84, 90, 96, 103]
    },
    {
      name: "Vibration × 100",
      labels: ["-72h", "-60h", "-48h", "-36h", "-24h", "-12h", "-6h", "0h"],
      values: [47, 48, 53, 62, 78, 95, 108, 122]
    }
  ], {
    x: 5.15, y: 0.88, w: 4.5, h: 3.3,
    chartColors: [C.warning, C.critical],
    lineSize: 2.5, lineSmooth: true,
    catAxisLabelColor: C.textMed,
    valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" },
    catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    showLegend: true, legendPos: "b", legendFontSize: 9,
    title: "Simulasi: Sensor Sebelum Failure (T-0)",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark
  });

  s.addText("→ W_WARNING = 48 jam  |  W_CRITICAL = 24 jam  (dikunci dari EDA, bukan asumsi)", {
    x: 5.15, y: 4.28, w: 4.5, h: 0.42,
    fontSize: 9.5, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Kami melakukan 'autopsi' data forensik pada momen menjelang kerusakan. Pola anomali mulai terlihat 48 jam sebelum mesin mati.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 10 — COHEN'S D
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Analisis Statistik Sensor — Cohen's D Effect Size", "Fase 2 — Data Understanding");

  const sensors = [
    { name: "vibration", d: 3.37 }, { name: "pressure", d: 3.06 },
    { name: "rpm", d: 2.91 }, { name: "noise_level", d: 2.89 },
    { name: "temperature", d: 2.71 }, { name: "power_consumption", d: 2.61 },
    { name: "operating_hours", d: 0.29 }, { name: "humidity", d: 0.21 }
  ];

  s.addChart(pres.charts.BAR, [{
    name: "Cohen's d",
    labels: sensors.map(s => s.name),
    values: sensors.map(s => s.d)
  }], {
    x: 0.35, y: 0.85, w: 6.2, h: 3.8,
    barDir: "bar",
    chartColors: [C.accentDark, C.accentDark, C.accentDark, C.accentDark, C.accentDark, C.accentDark, C.warning, "9CA3AF"],
    showValue: true, dataLabelFontSize: 9,
    catAxisLabelColor: C.textMed,
    valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" },
    catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "Cohen's d per Sensor (HEALTHY vs FAILURE)",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: false
  });

  // Legend cards
  const categories = [
    { label: "Besar (d > 2.5)", color: C.accentDark, count: "6 sensor", desc: "Daya beda sangat tinggi\nSinyal kerusakan kuat" },
    { label: "Sedang (d 0.2–0.5)", color: C.warning, count: "2 sensor", desc: "humidity & operating_hours\nDipertahankan untuk model" },
  ];
  categories.forEach((c, i) => {
    addCard(s, 6.8, 0.88 + i * 1.95, 2.85, 1.75, { fill: C.white });
    s.addShape(pres.shapes.OVAL, { x: 6.98, y: 0.98 + i * 1.95, w: 0.45, h: 0.45,
      fill: { color: c.color }, line: { color: c.color } });
    s.addText(c.label, { x: 7.5, y: 0.95 + i * 1.95, w: 1.95, h: 0.5,
      fontSize: 10, bold: true, color: C.textDark, fontFace: "Calibri", valign: "middle" });
    s.addText(c.count, { x: 6.98, y: 1.5 + i * 1.95, w: 2.5, h: 0.3,
      fontSize: 13, bold: true, color: c.color, fontFace: "Calibri" });
    s.addText(c.desc, { x: 6.98, y: 1.82 + i * 1.95, w: 2.5, h: 0.65,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", wrap: true });
  });

  s.addText("Keputusan: Semua 8 sensor dipertahankan — keputusan final via Feature Importance di Fase Evaluation", {
    x: 0.35, y: 4.82, w: 9.3, h: 0.35,
    fontSize: 9.5, color: C.accentDark, fontFace: "Calibri", align: "center", italic: true, bold: true
  });

  s.addNotes("Uji Cohen's d membuktikan 6 dari 8 sensor memiliki daya beda yang sangat besar. Semua sensor dipertahankan.");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Data Preparation
// ────────────────────────────────────────────────────────────
darkSlide("Fase 3: Data Preparation", "Label Engineering · Feature Extraction · RUL · Imbalance · Splitting")
  .addNotes("Fase ketiga adalah tahap terpanjang dan terpenting: menyiapkan data untuk modeling.");

// ────────────────────────────────────────────────────────────
// SLIDE 11 — TEMPORAL LABEL ENGINEERING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Temporal Label Engineering", "Fase 3 — Data Preparation");

  // Timeline diagram
  const zones = [
    { label: "HEALTHY", sub: "< T-48h", color: C.healthy, x: 0.35, w: 2.8 },
    { label: "WARNING", sub: "T-48h → T-24h", color: C.warning, x: 3.2, w: 2.3 },
    { label: "CRITICAL", sub: "T-24h → T_failure", color: C.critical, x: 5.55, w: 2.3 },
    { label: "FAILURE\n(asli)", sub: "failure=1", color: "7F1D1D", x: 7.9, w: 1.7 },
  ];

  zones.forEach(z => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: z.x, y: 0.9, w: z.w, h: 0.7,
      fill: { color: z.color }, line: { color: z.color }, rectRadius: 0.08
    });
    s.addText(z.label, { x: z.x, y: 0.9, w: z.w, h: 0.44,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });
    s.addText(z.sub, { x: z.x, y: 1.32, w: z.w, h: 0.28,
      fontSize: 8, color: "E5F3FF", fontFace: "Calibri", align: "center" });
  });

  // Markers
  const markers = [
    { x: 3.15, label: "T-48h", y: 1.68 },
    { x: 5.5, label: "T-24h", y: 1.68 },
    { x: 7.85, label: "T_failure", y: 1.68 },
  ];
  markers.forEach(m => {
    s.addShape(pres.shapes.LINE, { x: m.x, y: 0.88, w: 0, h: 0.82, line: { color: C.white, width: 1.5, dashType: "dash" } });
    s.addText(m.label, { x: m.x - 0.45, y: m.y, w: 0.9, h: 0.3,
      fontSize: 8, color: C.textMed, fontFace: "Calibri", align: "center" });
  });

  // Results table
  const results = [
    ["Kelas", "Baris", "Persentase", "Keterangan"],
    ["HEALTHY", "97,364", "97.364%", "Kondisi normal operasional"],
    ["WARNING", "1,247", "1.247%", "48 jam sebelum failure"],
    ["CRITICAL", "1,389", "1.389%", "24 jam sebelum failure"],
  ];

  s.addTable(results, {
    x: 0.35, y: 2.1, w: 5.5, h: 1.85,
    border: { pt: 0.8, color: C.paleBorder },
    fontFace: "Calibri", fontSize: 10,
    rowH: 0.42,
    fill: { color: C.white },
    autoPage: false
  });

  // Confirmation layer
  addCard(s, 6.0, 2.1, 3.65, 1.85, { fill: C.pale });
  s.addText("Sensor Confirmation Layer", {
    x: 6.1, y: 2.15, w: 3.45, h: 0.35,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "• Baseline: P90 dari distribusi HEALTHY\n", options: { breakLine: true } },
    { text: "• Min 2 dari 6 sensor harus melampaui P90\n", options: { breakLine: true } },
    { text: "• Downgrade: 49 baris WARNING → HEALTHY\n", options: { breakLine: true } },
    { text: "• CRITICAL: 0 downgrade (semua dipertahankan)", options: {} }
  ], { x: 6.1, y: 2.55, w: 3.45, h: 1.3, fontSize: 9.5, color: C.textMed, fontFace: "Calibri" });

  s.addText("Parameter W_WARNING=48h dan W_CRITICAL=24h dikunci EMPIRIS dari EDA Forensik — bukan asumsi", {
    x: 0.35, y: 4.12, w: 9.3, h: 0.38,
    fontSize: 9.5, bold: true, color: C.accentDark, italic: true, fontFace: "Calibri", align: "center"
  });

  // Bar chart distribution
  s.addChart(pres.charts.BAR, [{
    name: "Distribusi Label Baru",
    labels: ["HEALTHY", "WARNING", "CRITICAL"],
    values: [97364, 1247, 1389]
  }], {
    x: 0.35, y: 4.58, w: 9.3, h: 0.85,
    barDir: "bar",
    chartColors: [C.healthy, C.warning, C.critical],
    showValue: true, dataLabelFontSize: 8,
    valGridLine: { style: "none" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite } },
    showLegend: false, showTitle: false
  });

  s.addNotes("Ini adalah kontribusi terbesar di Fase Data Preparation. Label 3-kelas dibuat berdasarkan temuan EDA, bukan asumsi.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 12 — FEATURE ENGINEERING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Feature Engineering — 8 Sensor → 69 Fitur", "Fase 3 — Data Preparation");

  const categories = [
    { title: "Rolling Statistics", count: "36 fitur", desc: "Mean, Std, Max\n6 sensor × 2 window (24h & 48h) × 3 stats", color: C.accentDark },
    { title: "Lag Features", count: "18 fitur", desc: "6 sensor × 3 lag size\n(6h, 12h, 24h ke belakang)", color: C.accent },
    { title: "Cross-Sensor Ratios", count: "4 fitur", desc: "temp/vibration\npower/rpm, dll", color: "0D9488" },
    { title: "Degradation Proxy", count: "1 fitur", desc: "hours_since_last\n_maintenance", color: C.warning },
    { title: "NLP Text Mining", count: "2 fitur", desc: "damage_category\nseverity_score", color: "7C3AED" },
  ];

  // Summary chart
  s.addChart(pres.charts.DOUGHNUT, [{
    name: "Fitur",
    labels: categories.map(c => c.title),
    values: [36, 18, 4, 1, 2]
  }], {
    x: 5.9, y: 0.85, w: 3.75, h: 3.3,
    chartColors: categories.map(c => c.color),
    showPercent: false,
    showValue: false,
    showLegend: true,
    legendPos: "b",
    legendFontSize: 8,
    chartArea: { fill: { color: C.offWhite } },
    title: "Komposisi 69 Fitur",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark
  });

  categories.forEach((c, i) => {
    const y = 0.88 + i * 0.82;
    addCard(s, 0.35, y, 5.4, 0.72, { fill: C.white, border: C.paleBorder });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35, y, w: 1.1, h: 0.72,
      fill: { color: c.color }, line: { color: c.color }, rectRadius: 0.05
    });
    s.addText(c.count, { x: 0.35, y, w: 1.1, h: 0.72,
      fontSize: 14, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(c.title, { x: 1.52, y: y + 0.05, w: 3.1, h: 0.32,
      fontSize: 11, bold: true, color: C.textDark, fontFace: "Calibri", valign: "middle" });
    s.addText(c.desc, { x: 1.52, y: y + 0.35, w: 4.1, h: 0.32,
      fontSize: 8.5, color: C.textMed, fontFace: "Calibri" });
  });

  s.addText("Raw sensor: 8 → Engineered features: 69 (8.6× ekspansi)", {
    x: 0.35, y: 4.98, w: 9.3, h: 0.32,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Dari 8 sensor mentah, kita mengekstrak 69 fitur informatif agar model dapat memahami tren degradasi sepanjang waktu.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 13 — RUL TARGET ENGINEERING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "RUL Target Engineering", "Fase 3 — Data Preparation");

  // Left: explanation
  addCard(s, 0.35, 0.85, 4.8, 2.4, { fill: C.white });
  s.addText("Mengapa RUL Perlu Direkayasa?", {
    x: 0.5, y: 0.9, w: 4.5, h: 0.38,
    fontSize: 12, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "Model 2 membutuhkan target numerik.\n", options: { bold: true, breakLine: true } },
    { text: "RUL = (T_failure_berikutnya - timestamp_sekarang)\n", options: { breakLine: true } },
    { text: "dalam satuan HARI\n\n", options: { breakLine: true } },
    { text: "Dihitung menggunakan datetime arithmetic\n", options: { breakLine: true } },
    { text: "→ Akurat secara kalender, tidak terpengaruh\n", options: { breakLine: true } },
    { text: "   oleh temporal gap setelah sampling", options: {} }
  ], { x: 0.5, y: 1.32, w: 4.5, h: 1.8, fontSize: 10, color: C.textMed, fontFace: "Calibri" });

  // Scope box
  addCard(s, 0.35, 3.35, 4.8, 1.25, { fill: C.pale });
  s.addText("⚠️ Scope RUL: WARNING + CRITICAL Only", {
    x: 0.5, y: 3.4, w: 4.6, h: 0.35,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText("Sensor mesin HEALTHY tidak mengandung informasi\ntemporal yang cukup untuk prediksi RUL jangka panjang.\nRUL HEALTHY MAE = 13.77 hari vs WARNING MAE = 0.10 hari", {
    x: 0.5, y: 3.78, w: 4.6, h: 0.75,
    fontSize: 9.5, color: C.textMed, fontFace: "Calibri", wrap: true
  });

  // Box plot simulation via bar chart
  s.addChart(pres.charts.BAR, [
    { name: "Mean RUL (hari)", labels: ["HEALTHY", "WARNING", "CRITICAL"], values: [33.43, 1.50, 2.43] },
  ], {
    x: 5.35, y: 0.85, w: 4.3, h: 3.2,
    barDir: "col",
    chartColors: [C.healthy, C.warning, C.critical],
    showValue: true, dataLabelFontSize: 10,
    catAxisLabelColor: C.textMed, valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "Mean RUL per Kelas Kesehatan",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: false
  });

  const stats = [
    ["~2 hari", "WARNING Median", C.warning],
    ["~1 hari", "CRITICAL Median", C.critical],
    ["0.024 hari", "WARNING MAE LSTM", C.accentDark],
  ];
  stats.forEach((st, i) => addStatCard(s, 5.35 + i * 1.45, 4.18, 1.32, 1.07, st[0], st[1], st[2]));

  s.addNotes("RUL adalah variabel target untuk regresi. Dibatasi HANYA pada WARNING/CRITICAL karena HEALTHY tidak reliable untuk prediksi jangka panjang.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 14 — IMBALANCE HANDLING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Imbalance Handling: SSBS + SMOTE", "Fase 3 — Data Preparation");

  // 3-step flow
  const steps = [
    { num: "1", title: "Data Asli", val: "100,000 baris", dist: "HEALTHY: 97%\nWARNING: 1.2%\nCRITICAL: 1.4%", color: C.textMed },
    { num: "2", title: "Setelah SSBS", val: "20,423 baris", dist: "Block A: 500 baris\n(kondisi prima)\nBlock B: 500 baris\n(pre-warning)", color: C.accentDark },
    { num: "3", title: "Train + SMOTE", val: "20,504 baris", dist: "HEALTHY: 12,504\nWARNING: 4,000 ★\nCRITICAL: 4,000 ★\n★ = sintetis", color: C.accent },
  ];

  steps.forEach((st, i) => {
    const x = 0.35 + i * 3.18;
    addCard(s, x, 0.88, 2.95, 3.25, { fill: i === 2 ? C.pale : C.white });
    if (i === 2) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
        x, y: 0.88, w: 2.95, h: 0.38,
        fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.05
      });
      s.addText("X_TRAIN ONLY", { x, y: 0.88, w: 2.95, h: 0.38,
        fontSize: 9, bold: true, color: "86EFAC", fontFace: "Calibri",
        align: "center", valign: "middle", margin: 0 });
    }
    s.addShape(pres.shapes.OVAL, { x: x + 1.22, y: i === 2 ? 1.35 : 1.05, w: 0.5, h: 0.5,
      fill: { color: st.color }, line: { color: st.color } });
    s.addText(st.num, { x: x + 1.22, y: i === 2 ? 1.35 : 1.05, w: 0.5, h: 0.5,
      fontSize: 16, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(st.title, { x: x + 0.12, y: i === 2 ? 1.92 : 1.65, w: 2.7, h: 0.4,
      fontSize: 13, bold: true, color: C.textDark, fontFace: "Calibri", align: "center" });
    s.addText(st.val, { x: x + 0.12, y: i === 2 ? 2.36 : 2.1, w: 2.7, h: 0.38,
      fontSize: 11, color: st.color, fontFace: "Calibri", align: "center", bold: true });
    s.addText(st.dist, { x: x + 0.18, y: i === 2 ? 2.78 : 2.52, w: 2.6, h: 1.22,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", align: "center", wrap: true });

    if (i < 2) {
      s.addText("→", { x: x + 2.95 + 0.05, y: 1.8, w: 0.28, h: 1.0,
        fontSize: 20, color: C.accentDark, fontFace: "Calibri", align: "center", valign: "middle" });
    }
  });

  addCard(s, 0.35, 4.25, 9.3, 0.98, { fill: C.pale });
  s.addText("🔒 Anti-Leakage Guarantee", {
    x: 0.5, y: 4.28, w: 4.5, h: 0.35,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "SMOTE diterapkan HANYA pada X_train SETELAH split selesai  ·  ", options: {} },
    { text: "Val & Test = 100% natural data (tanpa data sintetis)", options: { bold: true } }
  ], { x: 0.5, y: 4.65, w: 9.0, h: 0.5, fontSize: 10, color: C.textMed, fontFace: "Calibri" });

  s.addNotes("Kami menggunakan SSBS untuk sampling berbasis blok waktu, lalu SMOTE hanya untuk X_train. Data test tetap natural.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 15 — DATA SPLITTING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Data Splitting & Anti-Leakage", "Fase 3 — Data Preparation");

  // Machine assignment
  s.addText("Machine-Based Split Strategy", {
    x: 0.35, y: 0.9, w: 5.5, h: 0.38,
    fontSize: 12, bold: true, color: C.accentDark, fontFace: "Calibri"
  });

  const splits = [
    { label: "TRAIN (70%)", machines: "M-01 · M-02 · M-03 · M-04 · M-05 · M-06\nM-07 · M-08 · M-09 · M-10 · M-11 · M-12 · M-13 · M-14", rows: "14,419 baris", color: C.accentDark },
    { label: "VAL (16%)", machines: "M-15 · M-16 · M-17", rows: "3,288 baris", color: C.accent },
    { label: "TEST (13%)", machines: "M-18 · M-19 · M-20", rows: "2,716 baris", color: C.warning },
  ];

  splits.forEach((sp, i) => {
    const y = 1.35 + i * 1.08;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35, y, w: 1.2, h: 0.9,
      fill: { color: sp.color }, line: { color: sp.color }, rectRadius: 0.08
    });
    s.addText(sp.label, { x: 0.35, y, w: 1.2, h: 0.9,
      fontSize: 9, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    addCard(s, 1.6, y, 4.0, 0.9, { fill: C.white });
    s.addText(sp.machines, { x: 1.72, y: y + 0.08, w: 3.8, h: 0.56,
      fontSize: 10, color: C.textDark, fontFace: "Calibri", wrap: true });
    s.addText(sp.rows, { x: 1.72, y: y + 0.62, w: 3.8, h: 0.25,
      fontSize: 9, color: sp.color, fontFace: "Calibri", bold: true });
  });

  // Reason
  addCard(s, 0.35, 4.62, 5.25, 0.65, { fill: C.pale });
  s.addText("Alasan Machine-Based: data run-to-failure → WARNING/CRITICAL selalu di ujung timeline setiap mesin. Global temporal split akan mengkonsentrasi kelas minoritas ke Test set.", {
    x: 0.48, y: 4.65, w: 5.0, h: 0.58,
    fontSize: 9, color: C.accentDark, fontFace: "Calibri", wrap: true
  });

  // Anti-leakage checklist
  addCard(s, 5.9, 0.88, 3.75, 4.4, { fill: C.white });
  s.addText("✅ Anti-Leakage Checklist", {
    x: 6.0, y: 0.92, w: 3.55, h: 0.35,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const checks = [
    "Split data sebelum preprocessing",
    "Scaler fit hanya pada M-01–M-14",
    "SMOTE hanya pada X_train",
    "Zero overlap antar split (verified)",
    "No future information di features",
    "No duplicate leakage (verified)",
    "RUL dihitung via datetime arithmetic",
    "Val & Test: 100% natural data",
    "Machine-based = kondisi deployment nyata",
  ];
  checks.forEach((c, i) => {
    s.addText("✓  " + c, {
      x: 6.0, y: 1.35 + i * 0.38, w: 3.55, h: 0.35,
      fontSize: 9.5, color: i < 7 ? C.accentDark : C.textMed,
      fontFace: "Calibri"
    });
  });

  s.addNotes("Model dilatih di 14 mesin dan diuji pada 6 mesin yang benar-benar belum pernah dikenali sebelumnya.");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Modeling
// ────────────────────────────────────────────────────────────
darkSlide("Fase 4: Modeling", "Track A: RF · XGBoost · LightGBM   |   Track B: XGBoost Reg · LSTM · GRU")
  .addNotes("Fase keempat: eksperimen modeling dengan 6 algoritma berbeda.");

// ────────────────────────────────────────────────────────────
// SLIDE 16 — STRATEGI EKSPERIMEN
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Strategi Eksperimen Modeling", "Fase 4 — Modeling");

  // Track A
  addCard(s, 0.35, 0.88, 4.5, 3.9, { fill: C.white });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 0.88, w: 4.5, h: 0.42,
    fill: { color: C.dark }, line: { color: C.dark }, rectRadius: 0.06
  });
  s.addText("TRACK A — Model 1: Health Classifier", {
    x: 0.35, y: 0.88, w: 4.5, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0
  });

  const trackA = [
    { name: "Random Forest", type: "Baseline", result: "F1 Test = 0.9914" },
    { name: "XGBoost + Threshold", type: "Terpilih ✓", result: "F1 Val = 0.9894" },
    { name: "LightGBM", type: "Komparasi", result: "F1 Test = 0.9876" },
  ];
  trackA.forEach((m, i) => {
    const y = 1.42 + i * 1.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: 4.2, h: 0.95,
      fill: { color: i === 1 ? C.pale : C.offWhite },
      line: { color: i === 1 ? C.accent : C.paleBorder }, rectRadius: 0.08
    });
    s.addText(m.name, { x: 0.65, y: y + 0.08, w: 3.0, h: 0.36,
      fontSize: 11, bold: true, color: C.textDark, fontFace: "Calibri" });
    s.addText(m.type, { x: 3.5, y: y + 0.05, w: 1.05, h: 0.3,
      fontSize: 9, bold: i === 1, color: i === 1 ? C.accent : C.textMed,
      fontFace: "Calibri", align: "center" });
    s.addText(m.result, { x: 0.65, y: y + 0.52, w: 3.85, h: 0.32,
      fontSize: 10, color: C.accentDark, fontFace: "Calibri" });
  });

  // Track B
  addCard(s, 5.1, 0.88, 4.55, 3.9, { fill: C.white });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 0.88, w: 4.55, h: 0.42,
    fill: { color: C.accentDark }, line: { color: C.accentDark }, rectRadius: 0.06
  });
  s.addText("TRACK B — Model 2: RUL Predictor", {
    x: 5.1, y: 0.88, w: 4.55, h: 0.42,
    fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0
  });

  const trackB = [
    { name: "XGBoost Regressor", type: "Baseline ML", result: "MAE = 1.10 hari" },
    { name: "LSTM V2", type: "Terpilih ✓", result: "MAE = 0.80 hari" },
    { name: "GRU", type: "Komparasi DL", result: "MAE = 0.95 hari" },
  ];
  trackB.forEach((m, i) => {
    const y = 1.42 + i * 1.1;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 5.25, y, w: 4.25, h: 0.95,
      fill: { color: i === 1 ? C.pale : C.offWhite },
      line: { color: i === 1 ? C.accent : C.paleBorder }, rectRadius: 0.08
    });
    s.addText(m.name, { x: 5.4, y: y + 0.08, w: 3.0, h: 0.36,
      fontSize: 11, bold: true, color: C.textDark, fontFace: "Calibri" });
    s.addText(m.type, { x: 8.18, y: y + 0.05, w: 1.12, h: 0.3,
      fontSize: 9, bold: i === 1, color: i === 1 ? C.accent : C.textMed,
      fontFace: "Calibri", align: "center" });
    s.addText(m.result, { x: 5.4, y: y + 0.52, w: 3.85, h: 0.32,
      fontSize: 10, color: C.accentDark, fontFace: "Calibri" });
  });

  // Fair comparison
  addCard(s, 0.35, 4.9, 9.3, 0.42, { fill: C.pale });
  s.addText("Fair Comparison: Data identik · Metrik identik · GLOBAL_SEED = 42 untuk semua eksperimen", {
    x: 0.5, y: 4.92, w: 9.1, h: 0.38,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri", align: "center"
  });

  s.addNotes("Kami mencoba 6 algoritma: 3 untuk klasifikasi dan 3 untuk prediksi RUL dengan prinsip fair comparison.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 17 — LSTM ARCHITECTURE
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Arsitektur LSTM V2 — RUL Predictor", "Fase 4 — Modeling");

  // Architecture diagram
  const layers = [
    { label: "Input", desc: "24 timestep × 69 fitur", shape: "RECTANGLE", color: "E0F2FE", textColor: "0369A1", w: 1.7 },
    { label: "LSTM(64)", desc: "+ Dropout(0.3) + BatchNorm", shape: "RECTANGLE", color: C.dark, textColor: C.white, w: 1.7 },
    { label: "LSTM(32)", desc: "+ Dropout(0.3) + BatchNorm", shape: "RECTANGLE", color: C.dark, textColor: C.white, w: 1.7 },
    { label: "Dense(16)", desc: "ReLU activation", shape: "RECTANGLE", color: C.pale, textColor: C.accentDark, w: 1.7 },
    { label: "Output", desc: "Linear → rul_days", shape: "RECTANGLE", color: C.accentDark, textColor: C.white, w: 1.7 },
  ];

  const totalW = layers.length * 1.7 + (layers.length - 1) * 0.18;
  const startX = (10 - totalW) / 2;

  layers.forEach((l, i) => {
    const x = startX + i * (1.7 + 0.18);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.0, w: l.w, h: 0.7,
      fill: { color: l.color }, line: { color: C.paleBorder }, rectRadius: 0.1,
      shadow: makeShadow()
    });
    s.addText(l.label, { x, y: 1.0, w: l.w, h: 0.4,
      fontSize: 11, bold: true, color: l.textColor, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(l.desc, { x: x - 0.05, y: 1.42, w: l.w + 0.1, h: 0.38,
      fontSize: 8, color: C.textMed, fontFace: "Calibri", align: "center", wrap: true });
    if (i < layers.length - 1) {
      s.addText("→", { x: x + l.w, y: 1.05, w: 0.2, h: 0.62,
        fontSize: 14, color: C.accent, fontFace: "Calibri", align: "center", valign: "middle" });
    }
  });

  // Params & regularization
  const specs = [
    { title: "Total Params", val: "47,649", color: C.accentDark },
    { title: "L2 Regularization", val: "0.001", color: C.accentDark },
    { title: "Dropout Rate", val: "0.3", color: C.accentDark },
    { title: "Sequence Length", val: "24h", color: C.accentDark },
    { title: "Learning Rate", val: "0.001", color: C.accentDark },
  ];
  specs.forEach((sp, i) => addStatCard(s, 0.35 + i * 1.88, 2.02, 1.72, 1.12, sp.val, sp.title, sp.color));

  // Callbacks
  addCard(s, 0.35, 3.25, 9.3, 1.38, { fill: C.white });
  s.addText("Callbacks & Training Strategy", {
    x: 0.5, y: 3.28, w: 9.1, h: 0.35,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const callbacks = [
    "EarlyStopping (patience=30, monitor=val_mae, restore_best_weights)",
    "ReduceLROnPlateau (factor=0.5, patience=10, min_lr=1e-6)",
    "ModelCheckpoint (save_best_only=True)",
    "Training: 200 epochs, Batch 32, L2 reg pada semua layer"
  ];
  callbacks.forEach((c, i) => {
    s.addText("•  " + c, {
      x: 0.5 + (i >= 2 ? 4.65 : 0), y: 3.68 + (i % 2) * 0.38, w: 4.45, h: 0.35,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri"
    });
  });

  s.addNotes("Arsitektur LSTM 2-layer dengan 47K parameter, dirancang sederhana namun efektif dengan L2 regularization dan dropout.");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Evaluation
// ────────────────────────────────────────────────────────────
darkSlide("Fase 5: Evaluation", "Confusion Matrix · ROC-AUC · Feature Importance · Generalization Test")
  .addNotes("Fase kelima: evaluasi komprehensif semua model.");

// ────────────────────────────────────────────────────────────
// SLIDE 18 — EVALUASI CLASSIFIER
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Evaluasi Model 1 — Health Status Classifier", "Fase 5 — Evaluation");

  // F1 comparison chart
  s.addChart(pres.charts.BAR, [
    { name: "F1 Val", labels: ["Random Forest", "XGBoost ✓", "LightGBM"], values: [0.9292, 0.9894, 0.9845] },
    { name: "F1 Test", labels: ["Random Forest", "XGBoost ✓", "LightGBM"], values: [0.9914, 0.9906, 0.9876] }
  ], {
    x: 0.35, y: 0.85, w: 5.5, h: 3.15,
    barDir: "col",
    barGrouping: "clustered",
    chartColors: [C.accentDark, C.accent],
    showValue: true, dataLabelFontSize: 8,
    valAxisMinVal: 0.90,
    catAxisLabelColor: C.textMed, valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "F1-Score Macro: Val vs Test (Min 0.90)",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: true, legendPos: "b", legendFontSize: 9
  });

  // Key metrics cards
  const metrics = [
    { val: "0.9906", label: "F1 Test\n(XGBoost)", color: C.accentDark },
    { val: "1.000", label: "AUC-ROC\nSemua Kelas", color: C.accentDark },
    { val: "0 kasus", label: "Fatal Error\n(CRITICAL→HEALTHY)", color: C.healthy },
    { val: "0.0055ms", label: "Inference\nPer Sample", color: C.accentDark },
  ];
  metrics.forEach((m, i) => addStatCard(s, 5.95 + (i % 2) * 2.05, 0.88 + Math.floor(i / 2) * 1.52, 1.88, 1.38, m.val, m.label, m.color));

  // Threshold note
  addCard(s, 5.95, 3.98, 3.68, 1.2, { fill: C.pale });
  s.addText("⚙️ Threshold Engineering", {
    x: 6.1, y: 4.02, w: 3.45, h: 0.35,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText("WARNING threshold digeser 0.50 → 0.60\nuntuk minimasi false alarm di Val set.\nHasil: HEALTHY→WARNING errors: 59 → 2 ✓", {
    x: 6.1, y: 4.4, w: 3.45, h: 0.72,
    fontSize: 9.5, color: C.textMed, fontFace: "Calibri"
  });

  // Table
  s.addTable([
    [{ text: "Metrik", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "WARNING Val", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "CRITICAL Val", options: { bold: true, color: C.white, fill: { color: C.dark } } }],
    ["Precision", "0.985", "0.980"],
    ["Recall",    "0.978", "0.993"],
    ["F1-Score",  "0.982", "0.987"],
  ], {
    x: 0.35, y: 4.18, w: 5.5, h: 1.05,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", fontSize: 10, rowH: 0.26,
    fill: { color: C.white }, autoPage: false
  });

  s.addNotes("XGBoost V2 dengan threshold 0.60 menghasilkan F1=0.9906 dan Fatal Error=0 pada test set.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 19 — EVALUASI RUL
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Evaluasi Model 2 — RUL Predictor", "Fase 5 — Evaluation");

  // MAE comparison
  s.addChart(pres.charts.BAR, [
    { name: "MAE Val", labels: ["XGBoost", "LSTM V2 ✓", "GRU"], values: [1.7189, 1.6461, 1.8618] },
    { name: "MAE Test", labels: ["XGBoost", "LSTM V2 ✓", "GRU"], values: [1.1020, 0.7985, 0.9515] }
  ], {
    x: 0.35, y: 0.85, w: 5.5, h: 2.85,
    barDir: "col", barGrouping: "clustered",
    chartColors: [C.warning, C.accentDark],
    showValue: true, dataLabelFontSize: 8,
    catAxisLabelColor: C.textMed, valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "MAE (hari): Val vs Test — Lebih kecil = Lebih baik",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: true, legendPos: "b", legendFontSize: 9
  });

  // Error ≤ 1 hari comparison
  s.addChart(pres.charts.BAR, [
    { name: "Error ≤ 1 hari (%)", labels: ["XGBoost", "LSTM V2 ✓", "GRU"], values: [93.53, 98.04, 97.80] }
  ], {
    x: 0.35, y: 3.82, w: 5.5, h: 1.5,
    barDir: "bar",
    chartColors: [C.accent, C.accentDark, C.accent],
    showValue: true, dataLabelFontSize: 9,
    valAxisMinVal: 90,
    catAxisLabelColor: C.textMed, valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "Error ≤ 1 Hari (%) — Lebih tinggi = Lebih baik",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: false
  });

  // Key stats
  const kstats = [
    { val: "0.7985 hari", label: "MAE Test LSTM V2", color: C.accentDark },
    { val: "98.04%", label: "Error ≤ 1 hari Test", color: C.accentDark },
    { val: "0.024 hari", label: "WARNING MAE\n(34 menit!)", color: C.healthy },
    { val: "1.44 hari", label: "CRITICAL MAE", color: C.warning },
  ];
  kstats.forEach((st, i) => addStatCard(s, 5.95 + (i % 2) * 2.05, 0.88 + Math.floor(i / 2) * 1.88, 1.88, 1.68, st.val, st.label, st.color));

  s.addNotes("LSTM V2 mencapai MAE 0.80 hari dan 98% prediksi dalam 1 hari. WARNING MAE hanya 34 menit!");
}

// ────────────────────────────────────────────────────────────
// SLIDE 20 — FEATURE IMPORTANCE
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Feature Importance & Validasi EDA", "Fase 5 — Evaluation");

  // Top 8 feature importance chart
  const features = [
    { name: "temperature_roll_max_24h", imp: 0.077, stars: "★★★" },
    { name: "temperature_roll_max_48h", imp: 0.060, stars: "★★" },
    { name: "temperature_roll_mean_48h", imp: 0.058, stars: "★★★" },
    { name: "power_cons_roll_mean_48h", imp: 0.055, stars: "★★★" },
    { name: "vibration_roll_mean_48h", imp: 0.050, stars: "★★★" },
    { name: "noise_level_roll_mean_48h", imp: 0.050, stars: "★★★" },
    { name: "vibration_roll_max_48h", imp: 0.046, stars: "★★" },
    { name: "noise_level_lag_24h", imp: 0.045, stars: "★★" },
  ];

  s.addChart(pres.charts.BAR, [{
    name: "Importance",
    labels: features.map(f => f.name),
    values: features.map(f => f.imp)
  }], {
    x: 0.35, y: 0.85, w: 6.0, h: 3.6,
    barDir: "bar",
    chartColors: [C.accentDark, C.accentDark, C.accentDark, C.accentDark,
                  C.accent, C.accent, C.accent, C.accent],
    showValue: true, dataLabelFontSize: 8,
    catAxisLabelColor: C.textMed, valAxisLabelColor: C.textMed,
    valGridLine: { color: "E2E8F0" }, catGridLine: { style: "none" },
    chartArea: { fill: { color: C.offWhite }, roundedCorners: true },
    title: "Top 8 Feature Importance — XGBoost Classifier",
    showTitle: true, titleFontSize: 10, titleColor: C.textDark,
    showLegend: false
  });

  // Insights
  const insights = [
    { icon: "🔗", title: "Rolling 48h Mendominasi", desc: "Mengkonfirmasi W_WARNING=48h yang dikunci dari EDA Forensik di Fase 2" },
    { icon: "📊", title: "6 Fitur Konsensus (★★★)", desc: "Muncul di semua 3 model: RF, XGBoost, LightGBM" },
    { icon: "🎯", title: "AUC = 1.000 Semua Kelas", desc: "Separabilitas tinggi sesuai Cohen's d > 2.5 dari EDA (bukan leakage)" },
  ];
  insights.forEach((ins, i) => {
    addCard(s, 6.5, 0.88 + i * 1.48, 3.15, 1.3, { fill: C.white });
    s.addText(ins.icon + "  " + ins.title, {
      x: 6.65, y: 0.95 + i * 1.48, w: 2.85, h: 0.38,
      fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
    });
    s.addText(ins.desc, {
      x: 6.65, y: 1.35 + i * 1.48, w: 2.85, h: 0.72,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri", wrap: true
    });
  });

  s.addText("Feature importance memvalidasi keputusan arsitektur dari Fase 2 (EDA) secara empiris", {
    x: 0.35, y: 4.6, w: 9.3, h: 0.35,
    fontSize: 9.5, bold: true, color: C.accentDark, italic: true, fontFace: "Calibri", align: "center"
  });

  s.addNotes("Feature importance mengkonfirmasi bahwa rolling 48 jam mendominasi, selaras dengan W_WARNING=48h dari EDA Forensik.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 21 — ANTI-OVERFITTING & GENERALIZATION
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Anti-Overfitting & Generalization Validation", "Fase 5 — Evaluation");

  // Generalization test
  addCard(s, 0.35, 0.88, 4.8, 2.5, { fill: C.white });
  s.addText("Generalization Test", {
    x: 0.5, y: 0.92, w: 4.5, h: 0.38,
    fontSize: 12, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const genTests = [
    { split: "Train (M-01–M-14)", f1: "1.0000", badge: "Training" },
    { split: "Val (M-15, M-16, M-17)", f1: "0.9894", badge: "Mesin Baru ✓" },
    { split: "Test (M-18, M-19, M-20)", f1: "0.9906", badge: "Mesin Baru ✓" },
  ];
  genTests.forEach((g, i) => {
    const y = 1.38 + i * 0.65;
    s.addText(g.split, { x: 0.5, y: y + 0.05, w: 2.5, h: 0.38,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri" });
    s.addText(g.f1, { x: 2.9, y: y + 0.02, w: 0.8, h: 0.42,
      fontSize: 12, bold: true, color: i === 0 ? C.textMed : C.accentDark, fontFace: "Calibri", align: "center" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 3.75, y: y + 0.05, w: 1.25, h: 0.32,
      fill: { color: i === 0 ? "F1F5F9" : C.pale }, line: { color: i === 0 ? "CBD5E1" : C.paleBorder }, rectRadius: 0.06
    });
    s.addText(g.badge, { x: 3.75, y: y + 0.05, w: 1.25, h: 0.32,
      fontSize: 8, bold: i > 0, color: i === 0 ? C.textMed : C.accentDark,
      fontFace: "Calibri", align: "center", valign: "middle" });
  });

  // Data leakage fixes
  addCard(s, 0.35, 3.52, 4.8, 1.72, { fill: C.white });
  s.addText("Data Leakage: Terdeteksi & Diperbaiki", {
    x: 0.5, y: 3.56, w: 4.5, h: 0.35,
    fontSize: 10, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const fixes = [
    { issue: "Scaler fit pada full data", fix: "Re-fit hanya M-01–M-14 ✓", ok: true },
    { issue: "SMOTE sebelum split data", fix: "Dipindah ke setelah split ✓", ok: true },
  ];
  fixes.forEach((f, i) => {
    const y = 3.98 + i * 0.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: 1.95, h: 0.42,
      fill: { color: "FEE2E2" }, line: { color: "FCA5A5" }, rectRadius: 0.06
    });
    s.addText("⚠️ " + f.issue, { x: 0.5, y, w: 1.95, h: 0.42,
      fontSize: 8.5, color: C.critical, fontFace: "Calibri", align: "center", valign: "middle" });
    s.addText("→", { x: 2.5, y: y + 0.05, w: 0.3, h: 0.35,
      fontSize: 14, color: C.accent, fontFace: "Calibri", align: "center" });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 2.85, y, w: 2.2, h: 0.42,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.06
    });
    s.addText("✅ " + f.fix, { x: 2.85, y, w: 2.2, h: 0.42,
      fontSize: 8.5, color: C.accentDark, fontFace: "Calibri", align: "center", valign: "middle" });
  });

  // 4 diagnostic methods
  addCard(s, 5.3, 0.88, 4.35, 4.35, { fill: C.white });
  s.addText("Forensic Investigation (4 Diagnostik)", {
    x: 5.45, y: 0.92, w: 4.1, h: 0.38,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const diags = [
    { d: "D1", title: "KS Distribution Test", result: "PASS ✅ — KS > 0.20 semua sensor", color: C.healthy },
    { d: "D2", title: "Confidence Analysis", result: "PASS ✅ — Val confidence bervariasi (0.5–1.0)", color: C.healthy },
    { d: "D3", title: "Permutation Importance", result: "PASS ✅ — Feature redundancy, bukan artefak", color: C.healthy },
    { d: "D4", title: "Ablation Test", result: "PASS ✅ — Tanpa rolling: F1 turun 23% (valid signal)", color: C.healthy },
  ];
  diags.forEach((d, i) => {
    const y = 1.4 + i * 0.9;
    s.addShape(pres.shapes.OVAL, { x: 5.45, y: y + 0.1, w: 0.45, h: 0.45,
      fill: { color: C.accentDark }, line: { color: C.accentDark } });
    s.addText(d.d, { x: 5.45, y: y + 0.1, w: 0.45, h: 0.45,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(d.title, { x: 5.97, y: y + 0.1, w: 3.5, h: 0.3,
      fontSize: 10, bold: true, color: C.textDark, fontFace: "Calibri" });
    s.addText(d.result, { x: 5.97, y: y + 0.42, w: 3.5, h: 0.42,
      fontSize: 9, color: d.color, fontFace: "Calibri" });
  });

  s.addNotes("Performa tinggi divalidasi melalui 4 metode forensik dan generalization test pada 6 mesin yang tidak pernah dilihat saat training.");
}

// ────────────────────────────────────────────────────────────
// CRISP-DM SECTION DIVIDER: Deployment
// ────────────────────────────────────────────────────────────
darkSlide("Fase 6: Deployment", "API Contract · Gauge Thresholds · Deliverables Final")
  .addNotes("Fase terakhir: deploy model ke production sebagai REST API service.");

// ────────────────────────────────────────────────────────────
// SLIDE 22 — DEPLOYMENT ARCHITECTURE
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Arsitektur Deployment — ML Service API", "Fase 6 — Deployment");

  // Flow: Sensor → Backend → ML Service → Response
  const flow = [
    { label: "Sensor IoT\n(20 Mesin)", sub: "Raw data tiap jam", color: "0369A1" },
    { label: "Backend\n(Reynaldi)", sub: "Kirim raw sensor", color: C.textMed },
    { label: "ML Service\n(FastAPI)", sub: "Feature eng + Predict", color: C.dark },
    { label: "Response\nJSON", sub: "label + RUL + urgency", color: C.accentDark },
    { label: "Frontend\n(Dashboard)", sub: "Gauge + Alert", color: "7C3AED" },
  ];
  const fw = 1.72, gap = 0.18;
  flow.forEach((f, i) => {
    const x = 0.35 + i * (fw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 0.9, w: fw, h: 0.85,
      fill: { color: f.color }, line: { color: f.color }, rectRadius: 0.1,
      shadow: makeShadow()
    });
    s.addText(f.label, { x, y: 0.9, w: fw, h: 0.52,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", wrap: true, margin: 0 });
    s.addText(f.sub, { x, y: 1.75, w: fw, h: 0.32,
      fontSize: 8.5, color: C.textMed, fontFace: "Calibri", align: "center" });
    if (i < flow.length - 1) {
      s.addText("→", { x: x + fw, y: 0.98, w: gap + 0.02, h: 0.7,
        fontSize: 16, color: C.accent, fontFace: "Calibri", align: "center", valign: "middle" });
    }
  });

  // API contract preview
  addCard(s, 0.35, 2.22, 5.5, 2.98, { fill: C.white });
  s.addText("API Contract: POST /api/ml/predict", {
    x: 0.5, y: 2.26, w: 5.2, h: 0.38,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  s.addText([
    { text: "Input:", options: { bold: true, breakLine: true } },
    { text: "  machine_id, timestamp, sensor_readings (8 sensor)\n", options: { breakLine: true } },
    { text: "  sensor_history (23 baris prev untuk LSTM seq)\n\n", options: { breakLine: true } },
    { text: "Output:", options: { bold: true, breakLine: true } },
    { text: "  model_1: predicted_label, confidence, probabilities\n", options: { breakLine: true } },
    { text: "  model_2: rul_days, rul_hours, urgency_level\n", options: { breakLine: true } },
    { text: "  metadata: inference_time_ms, versions\n\n", options: { breakLine: true } },
    { text: "SLA Inferensi: < 500ms\n", options: { breakLine: true } },
    { text: "WARNING Threshold: 0.60 (diterapkan di ML Service)", options: {} }
  ], { x: 0.5, y: 2.7, w: 5.2, h: 2.38, fontSize: 9.5, color: C.textMed, fontFace: "Calibri" });

  // Urgency levels
  addCard(s, 6.0, 2.22, 3.65, 2.98, { fill: C.white });
  s.addText("Urgency Level Mapping", {
    x: 6.15, y: 2.26, w: 3.35, h: 0.38,
    fontSize: 11, bold: true, color: C.accentDark, fontFace: "Calibri"
  });
  const urgencies = [
    { level: "IMMEDIATE", desc: "RUL ≤ 1 hari\nServis dalam 24 jam", color: C.critical },
    { level: "URGENT", desc: "RUL ≤ 3 hari\nServis dalam 48 jam", color: C.warning },
    { level: "SCHEDULED", desc: "RUL ≤ 7 hari\nJadwal minggu ini", color: C.accentDark },
    { level: "MONITOR", desc: "RUL > 7 hari\natau HEALTHY", color: C.textMed },
  ];
  urgencies.forEach((u, i) => {
    const y = 2.72 + i * 0.6;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.15, y, w: 1.35, h: 0.45,
      fill: { color: u.color }, line: { color: u.color }, rectRadius: 0.06
    });
    s.addText(u.level, { x: 6.15, y, w: 1.35, h: 0.45,
      fontSize: 8.5, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(u.desc, { x: 7.55, y: y + 0.03, w: 2.0, h: 0.42,
      fontSize: 8.5, color: C.textMed, fontFace: "Calibri" });
  });

  s.addNotes("ML Service dijalankan sebagai long-running FastAPI process. Backend cukup kirim raw sensor, ML Service yang lakukan semua transformasi.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 23 — GAUGE THRESHOLDS
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Sensor Gauge Thresholds untuk Dashboard", "Fase 6 — Deployment");

  // Table
  const tData = [
    [{ text: "Sensor", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "Min", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "Max", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "⚠️ Warning (P90)", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "🔴 Critical (P95)", options: { bold: true, color: C.white, fill: { color: C.dark } } },
     { text: "Verdict", options: { bold: true, color: C.white, fill: { color: C.dark } } }],
    ["temperature",       "58.1",  "103.3",  "76.30",   "77.80",   "✅ Valid"],
    ["vibration",         "-0.09", "2.25",   "0.59",    "0.64",    "✅ Valid"],
    ["pressure",          "92.1",  "125.1",  "103.80",  "104.80",  "✅ Valid"],
    ["rpm",               "1,964", "3,537",  "2,540",   "2,589",   "✅ Valid"],
    ["power_consumption", "52.6",  "126.7",  "82.10",   "84.60",   "✅ Valid"],
    ["noise_level",       "57.0",  "102.9",  "74.30",   "75.90",   "✅ Valid"],
  ];

  s.addTable(tData, {
    x: 0.35, y: 0.88, w: 9.3, h: 2.85,
    border: { pt: 0.5, color: C.paleBorder },
    fontFace: "Calibri", fontSize: 10.5,
    rowH: 0.4, fill: { color: C.white }, autoPage: false
  });

  // Legend
  const zones = [
    { color: C.healthy, label: "Zona HIJAU (HEALTHY)", desc: "Nilai < P90 — operasional normal" },
    { color: C.warning, label: "Zona KUNING (WARNING)", desc: "P90 ≤ Nilai < P95 — sinyal awal anomali" },
    { color: C.critical, label: "Zona MERAH (CRITICAL)", desc: "Nilai ≥ P95 — degradasi serius" },
  ];
  zones.forEach((z, i) => {
    addCard(s, 0.35 + i * 3.15, 3.88, 2.98, 1.32, { fill: C.white });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35 + i * 3.15, y: 3.88, w: 2.98, h: 0.45,
      fill: { color: z.color }, line: { color: z.color }, rectRadius: 0.06
    });
    s.addText(z.label, { x: 0.35 + i * 3.15, y: 3.88, w: 2.98, h: 0.45,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addText(z.desc, { x: 0.5 + i * 3.15, y: 4.38, w: 2.68, h: 0.75,
      fontSize: 9.5, color: C.textMed, fontFace: "Calibri", align: "center", wrap: true });
  });

  s.addText("Output: gauge_thresholds_validated.json — diserahkan ke tim Frontend untuk kalibrasi Dashboard", {
    x: 0.35, y: 5.28, w: 9.3, h: 0.28,
    fontSize: 9, color: C.textMed, fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("P90 dari distribusi HEALTHY sudah divalidasi empiris sejak Fase 3. P95 digunakan sebagai proxy CRITICAL dan telah divalidasi tidak overlap dengan P10 CRITICAL.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 24 — DELIVERABLES FINAL
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.offWhite };
  addSlideHeader(s, "Artifacts & Deliverables Final", "Fase 6 — Deployment");

  const artifacts = [
    { num: "1", name: "preprocessing_pipeline.py", desc: "Transformasi pipeline lengkap: feature engineering + scaling, siap dipanggil saat inference", tag: "src/", color: C.accentDark },
    { num: "2", name: "inference.py", desc: "Entry point prediksi real-time. Input: raw sensor → Output: health_label + rul_days + urgency", tag: "src/", color: C.accentDark },
    { num: "3", name: "classifier_final.pkl", desc: "Model 1: XGBoost Classifier (1.68 MB)\nF1-Test = 0.9906, Zero Fatal Error", tag: "models/final/", color: C.dark },
    { num: "4", name: "rul_predictor_final.keras", desc: "Model 2: LSTM V2 (0.60 MB)\nMAE Test = 0.7985 hari, 98.04% akurasi", tag: "models/final/", color: C.dark },
    { num: "5", name: "api_contract_final_v1.json", desc: "Dokumen kontrak API lengkap untuk tim Backend Reynaldi: schema, endpoint, error codes", tag: "root/", color: "7C3AED" },
    { num: "6", name: "gauge_thresholds_validated.json", desc: "Threshold P90/P95 per sensor untuk Frontend gauge animation. Divalidasi tidak overlap.", tag: "root/", color: "0369A1" },
  ];

  const cw = 4.52, ch = 1.18, gap = 0.1;
  artifacts.forEach((a, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * (cw + gap);
    const y = 0.88 + row * (ch + gap);
    addCard(s, x, y, cw, ch, { fill: C.white });
    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: y + 0.12, w: 0.45, h: 0.45,
      fill: { color: a.color }, line: { color: a.color } });
    s.addText(a.num, { x: x + 0.15, y: y + 0.12, w: 0.45, h: 0.45,
      fontSize: 14, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + cw - 0.9, y: y + 0.14, w: 0.82, h: 0.28,
      fill: { color: C.pale }, line: { color: C.paleBorder }, rectRadius: 0.04
    });
    s.addText(a.tag, { x: x + cw - 0.9, y: y + 0.14, w: 0.82, h: 0.28,
      fontSize: 7.5, color: C.accentDark, fontFace: "Calibri", align: "center", valign: "middle" });
    s.addText(a.name, { x: x + 0.68, y: y + 0.1, w: cw - 0.72 - 0.92, h: 0.38,
      fontSize: 9.5, bold: true, color: C.textDark, fontFace: "Calibri" });
    s.addText(a.desc, { x: x + 0.18, y: y + 0.55, w: cw - 0.3, h: 0.58,
      fontSize: 9, color: C.textMed, fontFace: "Calibri", wrap: true });
  });

  s.addText("Semua deliverables sesuai Knowledge Base Role A V2.0 & Master Blueprint V3.0", {
    x: 0.35, y: 4.85, w: 9.3, h: 0.32,
    fontSize: 9.5, color: C.accentDark, fontFace: "Calibri", align: "center", italic: true, bold: true
  });

  s.addNotes("6 deliverables ini diserahkan ke tim Backend dan Frontend sesuai API Contract yang telah disepakati.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 25 — KESIMPULAN
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  // Top summary section
  s.addText("Kesimpulan", {
    x: 1, y: 0.22, w: 8, h: 0.55,
    fontSize: 28, bold: true, color: C.white,
    fontFace: "Calibri", align: "center"
  });

  const results = [
    { model: "Model 1 — XGBoost Classifier", metrics: ["F1-Test = 0.9906", "AUC = 1.000", "Fatal Error = 0"], color: C.accent },
    { model: "Model 2 — LSTM V2 RUL Predictor", metrics: ["MAE = 0.80 hari", "98.04% error ≤ 1 hari", "WARNING MAE = 34 menit"], color: C.accentDark },
  ];

  results.forEach((r, i) => {
    const x = 0.35 + i * 4.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 0.88, w: 4.55, h: 2.4,
      fill: { color: "1F2D24" }, line: { color: r.color }, rectRadius: 0.12,
      shadow: { type: "outer", color: "000000", blur: 10, offset: 3, angle: 45, opacity: 0.25 }
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 0.88, w: 4.55, h: 0.45,
      fill: { color: r.color }, line: { color: r.color }, rectRadius: 0.06
    });
    s.addText(r.model, { x, y: 0.88, w: 4.55, h: 0.45,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      align: "center", valign: "middle", margin: 0 });
    r.metrics.forEach((m, j) => {
      s.addText("✓  " + m, { x: x + 0.3, y: 1.42 + j * 0.55, w: 4.1, h: 0.45,
        fontSize: 12, color: "86EFAC", fontFace: "Calibri", bold: j === 0 });
    });
  });

  // Key contributions
  s.addText("Kontribusi Utama", {
    x: 0.35, y: 3.42, w: 9.3, h: 0.38,
    fontSize: 13, bold: true, color: C.white, fontFace: "Calibri"
  });
  const contribs = [
    "Temporal Label Engineering berbasis EDA empiris (W_WARNING=48h, W_CRITICAL=24h)",
    "SSBS + Machine-Based Split untuk menjaga temporal integrity pipeline",
    "Enterprise-grade anti-leakage pipeline (9 checkpoints, 2 insiden diperbaiki)",
    "RUL scope WARNING/CRITICAL only — meningkatkan akurasi dari MAE 11.9 → 0.8 hari",
  ];
  contribs.forEach((c, i) => {
    s.addShape(pres.shapes.OVAL, { x: 0.35, y: 3.9 + i * 0.38, w: 0.22, h: 0.22,
      fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(c, { x: 0.65, y: 3.87 + i * 0.38, w: 9.0, h: 0.35,
      fontSize: 9.5, color: "CBD5E1", fontFace: "Calibri" });
  });

  s.addNotes("Kesimpulan: Semua target berhasil terlampaui. LSTM V2 mencapai akurasi luar biasa dengan MAE 0.8 hari dan 98% prediksi dalam 24 jam.");
}

// ────────────────────────────────────────────────────────────
// SLIDE 26 — REFERENCES & CLOSING
// ────────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.OVAL, {
    x: -0.8, y: -0.8, w: 3, h: 3,
    fill: { color: C.accentDark, transparency: 70 }, line: { color: C.accentDark }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 8.5, y: 4, w: 2.2, h: 2.2,
    fill: { color: C.accent, transparency: 75 }, line: { color: C.accent }
  });

  s.addText("Referensi", {
    x: 0.5, y: 0.22, w: 9, h: 0.5,
    fontSize: 22, bold: true, color: C.white, fontFace: "Calibri", align: "center"
  });

  const refs = [
    "Saxena, A. & Goebel, K. (2008). C-MAPSS Dataset. NASA Ames Prognostics Data Repository.",
    "Chawla, N. V. et al. (2002). SMOTE: Synthetic Minority Over-sampling Technique. JAIR.",
    "Hochreiter, S. & Schmidhuber, J. (1997). Long Short-Term Memory. Neural Computation.",
    "[Nama Anda] et al. (2025). Lapis AI: Predictive Maintenance Engine — Machine Learning Pipeline. [Paper].",
  ];

  refs.forEach((r, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: 0.88 + i * 0.72, w: 9, h: 0.6,
      fill: { color: "1F2D24" }, line: { color: "2D4A35" }, rectRadius: 0.08
    });
    s.addText(`[${i + 1}]  ${r}`, {
      x: 0.65, y: 0.9 + i * 0.72, w: 8.7, h: 0.55,
      fontSize: 9.5, color: "CBD5E1", fontFace: "Calibri", valign: "middle", wrap: true
    });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 2.0, y: 3.85, w: 6, h: 1.45,
    fill: { color: C.accentDark }, line: { color: C.accentDark }, rectRadius: 0.15,
    shadow: { type: "outer", color: "000000", blur: 12, offset: 3, angle: 45, opacity: 0.3 }
  });
  s.addText("Terima Kasih", {
    x: 2.0, y: 3.88, w: 6, h: 0.72,
    fontSize: 28, bold: true, color: C.white, fontFace: "Calibri", align: "center", valign: "middle"
  });
  s.addText("Lapis AI · CRISP-DM · Predictive Maintenance", {
    x: 2.0, y: 4.6, w: 6, h: 0.55,
    fontSize: 11, color: "86EFAC", fontFace: "Calibri", align: "center", italic: true
  });

  s.addNotes("Terima kasih atas perhatiannya. Saya siap menerima pertanyaan.");
}

// ────────────────────────────────────────────────────────────
// EXPORT
// ────────────────────────────────────────────────────────────
pres.writeFile({ fileName: "/mnt/user-data/outputs/Lapis_AI_CRISP_DM_Presentation.pptx" })
  .then(() => console.log("✅ DONE: Lapis_AI_CRISP_DM_Presentation.pptx"))
  .catch(err => { console.error("❌ Error:", err); process.exit(1); });
