/**
 * PRIME ML Pipeline — Presentation Generator
 * Generates: PRIME_ML_Pipeline_Presentation.pptx (24 slides)
 * Design System: "Light Mode Forest Green" (PRIME Command Center)
 * Author: ML Pipeline Annotator
 *
 * Usage: node ml_pipeline_pptx.js
 */

"use strict";

const PptxGenJS = require("pptxgenjs");
const path = require("path");
const fs = require("fs");

// ─── OUTPUT PATH ──────────────────────────────────────────────────────────────
const OUTPUT_FILE = "PRIME_ML_Pipeline_Presentation.pptx";
const FIGURES_DIR = "./figures";

// ─── DESIGN SYSTEM: PRIME Command Center ─────────────────────────────────────
const C = {
  // Core palette
  WHITE:        "FFFFFF",
  LIGHT_SLATE:  "F8FAFC",
  ACCENT_MED:   "16A34A",   // medium green — accent sharp
  ACCENT_DARK:  "166534",   // dark green   — accent strong
  TEXT_PRIMARY: "14532D",   // deep forest green — titles
  TEXT_BODY:    "1E293B",   // dark slate — body
  TEXT_MUTED:   "475569",   // medium slate — captions
  BORDER:       "E2E8F0",   // soft gray — dividers

  // Status colors
  HEALTHY:  "22C55E",   // green
  WARNING:  "FBBF24",   // amber
  CRITICAL: "EF4444",   // red

  // Phase badge colors by layer
  DATA_LAYER:       "16A34A",   // Fase 0-1 (medium green / cyan-ish)
  ANALYSIS_LAYER:   "D97706",   // Fase 2-3 (amber dark)
  FEATURE_LAYER:    "166534",   // Fase 4-7 (dark green)
  MODEL_LAYER:      "7C3AED",   // Fase 8   (purple)
  EVAL_LAYER:       "0EA5E9",   // Fase 9-10 (sky blue / emerald)

  // Cover slide
  COVER_BG:     "0F2117",   // very dark green for dark cover
  COVER_TEXT:   "F0FDF4",   // near-white green tint
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
const FONT = {
  TITLE:   "Cambria",
  BODY:    "Calibri",
};

// Slide dimensions (10in × 7.5in = widescreen 4:3 — pptxgenjs default is 10×7.5)
// We'll use 13.33 × 7.5 for 16:9
const W = 13.33;  // slide width (inches)
const H = 7.5;    // slide height (inches)

// ─── HELPER: Check figure file ───────────────────────────────────────────────
function figureExists(filename) {
  const fp = path.join(FIGURES_DIR, filename);
  return fs.existsSync(fp);
}

function figurePath(filename) {
  return path.join(FIGURES_DIR, filename);
}

// ─── HELPER: Add Phase Badge ─────────────────────────────────────────────────
/**
 * Adds a small rounded rectangle badge in top-left with phase label.
 * @param {object} slide - pptxgenjs slide object
 * @param {string} label - e.g. "FASE 2"
 * @param {string} badgeColor - hex color without #
 */
function addPhaseBadge(slide, label, badgeColor) {
  // Badge background
  slide.addShape("roundRect", {
    x: 0.3, y: 0.18, w: 1.0, h: 0.32,
    fill: { color: badgeColor },
    line: { color: badgeColor },
    rectRadius: 0.05,
  });
  // Badge text
  slide.addText(label, {
    x: 0.3, y: 0.18, w: 1.0, h: 0.32,
    fontSize: 8,
    bold: true,
    color: C.WHITE,
    fontFace: FONT.BODY,
    align: "center",
    valign: "middle",
  });
}

// ─── HELPER: Slide Master Background ─────────────────────────────────────────
/**
 * Sets white background with a thin green left-side accent block.
 */
function addSlideBase(slide, opts = {}) {
  const darkMode = opts.dark || false;
  const bgColor  = darkMode ? C.COVER_BG : C.WHITE;

  slide.background = { color: bgColor };

  // Thin bottom border line
  if (!darkMode) {
    slide.addShape("rect", {
      x: 0, y: H - 0.06, w: W, h: 0.06,
      fill: { color: C.BORDER },
      line:  { color: C.BORDER },
    });
  }
}

// ─── HELPER: Slide Title ──────────────────────────────────────────────────────
function addSlideTitle(slide, text, opts = {}) {
  const color = opts.color || C.TEXT_PRIMARY;
  const size  = opts.size  || 28;
  slide.addText(text, {
    x: opts.x !== undefined ? opts.x : 0.4,
    y: opts.y !== undefined ? opts.y : 0.55,
    w: opts.w !== undefined ? opts.w : W - 0.8,
    h: opts.h !== undefined ? opts.h : 0.65,
    fontSize: size,
    bold: true,
    color: color,
    fontFace: FONT.TITLE,
    align: opts.align || "left",
    valign: "middle",
    charSpacing: 0.5,
  });
}

// ─── HELPER: Stat Callout Box ─────────────────────────────────────────────────
/**
 * A big-number stat callout.
 * @param {object} slide
 * @param {string} bigNum  - e.g. "0.056%"
 * @param {string} caption - e.g. "failure rate"
 * @param {number} x, y, w, h
 * @param {string} numColor
 */
function addStatCallout(slide, bigNum, caption, x, y, w, h, numColor) {
  numColor = numColor || C.ACCENT_MED;
  // Background card
  slide.addShape("rect", {
    x, y, w, h,
    fill: { color: C.LIGHT_SLATE },
    line: { color: C.BORDER },
  });
  // Big number
  slide.addText(bigNum, {
    x, y: y + 0.05, w, h: h * 0.65,
    fontSize: 38,
    bold: true,
    color: numColor,
    fontFace: FONT.TITLE,
    align: "center",
    valign: "bottom",
  });
  // Caption
  slide.addText(caption, {
    x, y: y + h * 0.68, w, h: h * 0.32,
    fontSize: 10,
    color: C.TEXT_MUTED,
    fontFace: FONT.BODY,
    align: "center",
    valign: "top",
    italic: true,
  });
}

// ─── HELPER: Progress Dot-Stepper ────────────────────────────────────────────
/**
 * Horizontal dot-stepper showing current phase position (0-10).
 * @param {object} slide
 * @param {number} currentPhase - 0 to 10 (or -1 for cover/closing)
 */
function addProgressStepper(slide, currentPhase) {
  const phases = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const totalDots = phases.length;
  const dotW = 0.22;
  const dotH = 0.22;
  const startX = (W - (totalDots * (dotW + 0.12))) / 2;
  const y = H - 0.42;

  phases.forEach((phase, i) => {
    const x = startX + i * (dotW + 0.12);
    const isActive   = phase === currentPhase;
    const isPast     = currentPhase >= 0 && phase < currentPhase;
    const fillColor  = isActive ? C.ACCENT_MED : (isPast ? C.ACCENT_DARK : C.BORDER);
    const lineColor  = isActive ? C.ACCENT_MED : (isPast ? C.ACCENT_DARK : "CBD5E1");

    slide.addShape("ellipse", {
      x, y, w: dotW, h: dotH,
      fill: { color: fillColor },
      line: { color: lineColor, width: 1 },
    });

    // Phase number inside dot (small)
    slide.addText(String(phase), {
      x, y, w: dotW, h: dotH,
      fontSize: 6,
      bold: isActive,
      color: isActive || isPast ? C.WHITE : C.TEXT_MUTED,
      fontFace: FONT.BODY,
      align: "center",
      valign: "middle",
    });

    // Connector line between dots
    if (i < totalDots - 1) {
      slide.addShape("line", {
        x: x + dotW, y: y + dotH / 2,
        w: 0.12, h: 0,
        line: { color: "CBD5E1", width: 1 },
      });
    }
  });
}

// ─── HELPER: Section label (top-right) ───────────────────────────────────────
function addSectionLabel(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: W - 2.8, y: 0.22, w: 2.5, h: 0.28,
    fontSize: 8,
    color: C.TEXT_MUTED,
    fontFace: FONT.BODY,
    align: "right",
    charSpacing: 2,
    bold: true,
  });
}

// ─── HELPER: Horizontal divider ──────────────────────────────────────────────
function addDivider(slide, x, y, w) {
  slide.addShape("line", {
    x, y, w, h: 0,
    line: { color: C.BORDER, width: 0.75 },
  });
}

// ─── HELPER: Image or placeholder ────────────────────────────────────────────
function addImageOrPlaceholder(slide, filename, x, y, w, h, caption) {
  const fp = figurePath(filename);
  if (figureExists(filename)) {
    slide.addImage({ path: fp, x, y, w, h });
  } else {
    // Placeholder box
    slide.addShape("rect", {
      x, y, w, h,
      fill: { color: "F1F5F9" },
      line: { color: C.BORDER, dashType: "dash" },
    });
    slide.addText(`[Image: ${filename}]`, {
      x, y, w, h,
      fontSize: 11,
      color: C.TEXT_MUTED,
      fontFace: FONT.BODY,
      align: "center",
      valign: "middle",
      italic: true,
    });
  }
  if (caption) {
    slide.addText(caption, {
      x, y: y + h + 0.05, w, h: 0.3,
      fontSize: 9,
      color: C.TEXT_MUTED,
      fontFace: FONT.BODY,
      italic: true,
      align: "center",
    });
  }
}

// ─── HELPER: Simple table ─────────────────────────────────────────────────────
function addTable(slide, rows, x, y, w, opts = {}) {
  const headerBg  = opts.headerBg  || C.ACCENT_DARK;
  const bodyBg    = opts.bodyBg    || C.WHITE;
  const altBg     = opts.altBg     || C.LIGHT_SLATE;
  const fontSize  = opts.fontSize  || 11;
  const colW      = opts.colW;      // array of column widths
  const rowH      = opts.rowH      || 0.36;
  const headerTextColor = opts.headerTextColor || C.WHITE;
  const bodyTextColor   = opts.bodyTextColor   || C.TEXT_BODY;
  const highlightRow    = opts.highlightRow;   // index of row to highlight (0=header, 1=first body)
  const highlightBg     = opts.highlightBg    || "DCFCE7";

  const tableRows = rows.map((row, rowIdx) => {
    const isHeader = rowIdx === 0;
    return row.map((cell, colIdx) => {
      const isHighlight = !isHeader && highlightRow !== undefined && rowIdx === highlightRow;
      return {
        text: String(cell),
        options: {
          bold: isHeader || (typeof cell === "string" && cell.startsWith("**")),
          fontSize: isHeader ? fontSize + 0.5 : fontSize,
          color: isHeader ? headerTextColor : bodyTextColor,
          fill: isHeader ? headerBg : (isHighlight ? highlightBg : (rowIdx % 2 === 0 ? altBg : bodyBg)),
          fontFace: FONT.BODY,
          align: "center",
          valign: "middle",
          border: { pt: 0.5, color: C.BORDER },
        },
      };
    });
  });

  const colOptions = colW
    ? colW.map(cw => ({ width: cw }))
    : undefined;

  slide.addTable(tableRows, {
    x, y, w,
    rowH,
    colW: colOptions,
    border: { pt: 0.5, color: C.BORDER },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE BUILDERS
// ─────────────────────────────────────────────────────────────────────────────

// SLIDE 1 — Cover ─────────────────────────────────────────────────────────────
function buildSlide01(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide, { dark: true });

  // Decorative waveform lines (sensor waveform motif) — right side
  const waveX = W * 0.62;
  const wavePts = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    wavePts.push({
      x: waveX + (t * 3.8),
      y: 3.0 + Math.sin(t * Math.PI * 4) * 0.6 + Math.sin(t * Math.PI * 10) * 0.2,
    });
  }
  // Draw as segmented lines (approximate waveform)
  for (let i = 0; i < wavePts.length - 1; i++) {
    const p1 = wavePts[i];
    const p2 = wavePts[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    slide.addShape("line", {
      x: p1.x, y: p1.y, w: len, h: 0,
      line: { color: "1A5C32", width: 1.2 },
    });
  }

  // Thin horizontal accent line
  slide.addShape("line", {
    x: 0.45, y: 2.35, w: 5.5, h: 0,
    line: { color: C.ACCENT_MED, width: 1.5 },
  });

  // PRIME logo text (stylized)
  slide.addText("PRIME", {
    x: 0.45, y: 1.0, w: 5.5, h: 0.9,
    fontSize: 48,
    bold: true,
    color: C.ACCENT_MED,
    fontFace: FONT.TITLE,
    charSpacing: 8,
  });

  // Main title
  slide.addText("Machine Learning Pipeline", {
    x: 0.45, y: 1.9, w: 7.0, h: 0.7,
    fontSize: 26,
    bold: true,
    color: C.COVER_TEXT,
    fontFace: FONT.TITLE,
  });

  // Subtitle
  slide.addText(
    "Predictive Reliability & Intelligence Maintenance Engine\n" +
    "End-to-End ML/DL Engineering Walkthrough",
    {
      x: 0.45, y: 2.65, w: 7.5, h: 0.8,
      fontSize: 13,
      color: "86EFAC",   // light green
      fontFace: FONT.BODY,
      lineSpacingMultiple: 1.3,
    }
  );

  // Name
  slide.addText("Achmad Zikran Maulida  ·  Machine Learning Engineer", {
    x: 0.45, y: 5.8, w: 7.0, h: 0.35,
    fontSize: 11,
    color: "4ADE80",
    fontFace: FONT.BODY,
    italic: true,
  });

  // Tech tags
  ["XGBoost", "LSTM", "FastAPI", "SSBS", "Python 3.10"].forEach((tag, i) => {
    slide.addShape("roundRect", {
      x: 0.45 + i * 1.72, y: 6.3, w: 1.55, h: 0.28,
      fill: { color: "1A5C32" },
      line: { color: C.ACCENT_MED },
      rectRadius: 0.08,
    });
    slide.addText(tag, {
      x: 0.45 + i * 1.72, y: 6.3, w: 1.55, h: 0.28,
      fontSize: 8, bold: true,
      color: C.ACCENT_MED,
      fontFace: FONT.BODY,
      align: "center", valign: "middle",
    });
  });
}

// SLIDE 2 — Agenda / Roadmap Pipeline ─────────────────────────────────────────
function buildSlide02(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addSectionLabel(slide, "OVERVIEW");
  addSlideTitle(slide, "Pipeline Roadmap — 11 Fase End-to-End");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, -1);

  // Phase boxes
  const phases = [
    { label: "0\nEnv",       color: C.DATA_LAYER     },
    { label: "1\nIngest",    color: C.DATA_LAYER     },
    { label: "2\nEDA",       color: C.ANALYSIS_LAYER },
    { label: "3\nLabel",     color: C.ANALYSIS_LAYER },
    { label: "4\nFeature",   color: C.FEATURE_LAYER  },
    { label: "5\nPreproc",   color: C.FEATURE_LAYER  },
    { label: "6\nSSBS",      color: C.FEATURE_LAYER  },
    { label: "7\nSplit",     color: C.FEATURE_LAYER  },
    { label: "8\nModel",     color: C.MODEL_LAYER    },
    { label: "9\nEval",      color: C.EVAL_LAYER     },
    { label: "10\nDeploy",   color: C.EVAL_LAYER     },
  ];
  const boxW = 0.9;
  const boxH = 0.85;
  const startX = 0.55;
  const boxY = 1.6;
  const gap = (W - startX * 2 - boxW * phases.length) / (phases.length - 1);

  phases.forEach((p, i) => {
    const x = startX + i * (boxW + gap);
    // Box
    slide.addShape("roundRect", {
      x, y: boxY, w: boxW, h: boxH,
      fill: { color: p.color },
      line: { color: p.color },
      rectRadius: 0.08,
    });
    // Label
    slide.addText(p.label, {
      x, y: boxY, w: boxW, h: boxH,
      fontSize: 8, bold: true,
      color: C.WHITE,
      fontFace: FONT.BODY,
      align: "center", valign: "middle",
    });
    // Arrow to next
    if (i < phases.length - 1) {
      const arrowX = x + boxW;
      slide.addShape("line", {
        x: arrowX, y: boxY + boxH / 2, w: gap, h: 0,
        line: { color: C.BORDER, width: 1, endArrowType: "open" },
      });
    }
  });

  // Layer labels
  const layers = [
    { label: "Data Layer",             x: startX,                       w: (boxW + gap) * 2 - gap },
    { label: "Analysis Layer",         x: startX + (boxW + gap) * 2,   w: (boxW + gap) * 2 - gap },
    { label: "Feature Layer",          x: startX + (boxW + gap) * 4,   w: (boxW + gap) * 4 - gap },
    { label: "Model Layer",            x: startX + (boxW + gap) * 8,   w: boxW                   },
    { label: "Eval / Deploy",          x: startX + (boxW + gap) * 9,   w: (boxW + gap) * 2 - gap },
  ];
  layers.forEach(l => {
    slide.addText(l.label, {
      x: l.x, y: boxY + boxH + 0.1, w: l.w, h: 0.25,
      fontSize: 8, italic: true,
      color: C.TEXT_MUTED,
      fontFace: FONT.BODY,
      align: "center",
    });
  });

  // 4-row summary
  const bullets = [
    { icon: "◆", text: "Data Layer: Ingestion & EDA",                    color: C.DATA_LAYER     },
    { icon: "◆", text: "Analysis Layer: Temporal Label Engineering",      color: C.ANALYSIS_LAYER },
    { icon: "◆", text: "Feature Layer: Rolling · Lag · Ratio · SMOTE",   color: C.FEATURE_LAYER  },
    { icon: "◆", text: "Model & Deploy: Classification + RUL + FastAPI",  color: C.MODEL_LAYER    },
  ];
  bullets.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    slide.addText(`${b.icon}  ${b.text}`, {
      x: 0.5 + col * 6.4, y: 3.0 + row * 0.42, w: 6.0, h: 0.38,
      fontSize: 12,
      color: b.color,
      fontFace: FONT.BODY,
      bold: col === 0 ? false : false,
    });
  });
}

// SLIDE 3 — Problem Statement ─────────────────────────────────────────────────
function buildSlide03(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addSectionLabel(slide, "MOTIVATION");
  addSlideTitle(slide, "Problem Statement — Why Predictive Maintenance?");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, -1);

  // Big stat
  slide.addText("0.056%", {
    x: 3.8, y: 1.5, w: 5.5, h: 1.5,
    fontSize: 72, bold: true,
    color: C.CRITICAL,
    fontFace: FONT.TITLE,
    align: "center", valign: "middle",
  });
  slide.addText("dari 100,000 baris data berlabel failure\n(hanya 56 kejadian nyata)", {
    x: 3.2, y: 2.95, w: 6.9, h: 0.55,
    fontSize: 13,
    color: C.TEXT_MUTED,
    fontFace: FONT.BODY,
    align: "center",
    italic: true,
  });

  // 100-dot grid visual (10×6 = 60 dots; color a few red)
  const gridX = 0.5;
  const gridY = 1.65;
  const dotSize = 0.13;
  const dotGap  = 0.18;
  let dotCount = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const isFailure = dotCount === 0; // highlight first dot only
      slide.addShape("ellipse", {
        x: gridX + col * dotGap, y: gridY + row * dotGap,
        w: dotSize, h: dotSize,
        fill: { color: isFailure ? C.CRITICAL : "D1FAE5" },
        line: { color: isFailure ? C.CRITICAL : "A7F3D0" },
      });
      dotCount++;
    }
  }
  slide.addText("■ = ~1 failure event", {
    x: gridX, y: gridY + 5 * dotGap + 0.05, w: 2.2, h: 0.25,
    fontSize: 8, color: C.TEXT_MUTED, fontFace: FONT.BODY,
  });

  // Two bullet challenges
  const challenges = [
    { title: "Extreme Imbalance", body: "99.944% data sehat vs. 0.056% failure\n→ Model naif bisa 99.9% akurat tapi tidak pernah mendeteksi kerusakan" },
    { title: "Temporal Data Leakage", body: "Data run-to-failure bersifat sekuensial\n→ Split random biasa membocorkan pola masa depan ke training" },
  ];
  challenges.forEach((c, i) => {
    const bx = 3.2 + i * 4.9;
    slide.addShape("roundRect", {
      x: bx, y: 3.62, w: 4.5, h: 1.3,
      fill: { color: C.LIGHT_SLATE },
      line: { color: C.BORDER },
      rectRadius: 0.1,
    });
    slide.addText(c.title, {
      x: bx + 0.15, y: 3.7, w: 4.2, h: 0.32,
      fontSize: 12, bold: true,
      color: C.ACCENT_DARK, fontFace: FONT.BODY,
    });
    slide.addText(c.body, {
      x: bx + 0.15, y: 4.05, w: 4.2, h: 0.8,
      fontSize: 10,
      color: C.TEXT_BODY, fontFace: FONT.BODY,
      lineSpacingMultiple: 1.3,
    });
  });

  // Bottom tag
  slide.addText(
    "Industri 4.0: downtime tak terduga = kerugian 20-30% produktivitas pabrik",
    {
      x: 0.4, y: 5.1, w: W - 0.8, h: 0.32,
      fontSize: 11, italic: true,
      color: C.TEXT_MUTED, fontFace: FONT.BODY,
      align: "center",
    }
  );
}

// SLIDE 4 — Fase 0 ─────────────────────────────────────────────────────────────
function buildSlide04(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 0", C.DATA_LAYER);
  addSectionLabel(slide, "FOUNDATION");
  addSlideTitle(slide, "Environment & Reproducibility");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 0);

  const items = [
    {
      icon: "🔧",
      title: "Struktur Direktori Enterprise",
      body:  "src/  ·  notebooks/  ·  models/  ·  data/raw  ·  data/interim  ·  data/processed",
      color: C.DATA_LAYER,
    },
    {
      icon: "🎲",
      title: "GLOBAL_SEED = 42",
      body:  "Dikunci di src/config.py — menjamin reproducibility seluruh eksperimen (RF, XGBoost, LSTM, SMOTE)",
      color: C.ACCENT_MED,
    },
    {
      icon: "📋",
      title: "src/config.py — Single Source of Truth",
      body:  "W_WARNING_HRS=48  ·  W_CRITICAL_HRS=24  ·  LABEL_MAP={HEALTHY:0, WARNING:1, CRITICAL:2}",
      color: C.ACCENT_DARK,
    },
  ];

  items.forEach((item, i) => {
    const y = 1.6 + i * 1.35;
    // Color bar left
    slide.addShape("rect", {
      x: 0.4, y, w: 0.08, h: 1.1,
      fill: { color: item.color }, line: { color: item.color },
    });
    // Card
    slide.addShape("rect", {
      x: 0.55, y, w: W - 1.0, h: 1.1,
      fill: { color: C.LIGHT_SLATE }, line: { color: C.BORDER },
    });
    // Title
    slide.addText(item.title, {
      x: 0.8, y: y + 0.1, w: W - 1.3, h: 0.35,
      fontSize: 14, bold: true,
      color: C.TEXT_PRIMARY, fontFace: FONT.TITLE,
    });
    // Body
    slide.addText(item.body, {
      x: 0.8, y: y + 0.45, w: W - 1.3, h: 0.55,
      fontSize: 12,
      color: C.TEXT_BODY, fontFace: FONT.BODY,
    });
  });
}

// SLIDE 5 — Fase 1: Data Ingestion ────────────────────────────────────────────
function buildSlide05(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 1", C.DATA_LAYER);
  addSectionLabel(slide, "DATA INGESTION");
  addSlideTitle(slide, "Data Ingestion & Profil Dataset");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 1);

  // Left table
  const tableRows = [
    ["Dataset", "Rows", "Cols"],
    ["sensor_readings.csv", "100,000", "11"],
    ["maintenance_logs.csv", "500", "8"],
  ];
  addTable(slide, tableRows, 0.4, 1.5, 5.8, {
    colW: [3.0, 1.5, 1.3], rowH: 0.42, fontSize: 12,
    headerBg: C.ACCENT_DARK,
  });

  // Additional row note
  slide.addText(
    "Rata-rata 2.80× failure per mesin — semua 20 mesin pernah mengalami failure",
    {
      x: 0.4, y: 2.85, w: 5.8, h: 0.4,
      fontSize: 10, italic: true,
      color: C.TEXT_MUTED, fontFace: FONT.BODY,
    }
  );

  // Right stat callouts
  const stats = [
    { num: "20",     cap: "mesin (M-01 s/d M-20)",              color: C.ACCENT_MED  },
    { num: "208",    cap: "hari rentang waktu\n(Jul 2025 – Jan 2026)", color: C.ACCENT_DARK },
    { num: "0  /  0", cap: "gap temporal  /  duplikat",          color: C.HEALTHY    },
  ];
  stats.forEach((s, i) => {
    addStatCallout(slide, s.num, s.cap, 6.6, 1.45 + i * 1.32, 6.2, 1.15, s.color);
  });

  // Integrity check row
  slide.addShape("rect", {
    x: 0.4, y: 4.3, w: W - 0.8, h: 0.42,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY },
  });
  slide.addText(
    "✅  Temporal Integrity: 5,000 baris per mesin (balanced)  ·  0 gap > 1 jam  ·  datetime64[ns] terkonfirmasi",
    {
      x: 0.55, y: 4.32, w: W - 1.0, h: 0.38,
      fontSize: 11, bold: true,
      color: "166534", fontFace: FONT.BODY,
    }
  );
}

// SLIDE 6 — Fase 2: EDA Failure Autopsy ───────────────────────────────────────
function buildSlide06(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 2", C.ANALYSIS_LAYER);
  addSectionLabel(slide, "EDA FORENSIK");
  addSlideTitle(slide, "EDA — Failure Autopsy Timeline");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 2);

  // Timeline line
  const tlY = 2.6;
  const tlX1 = 0.7;
  const tlX2 = W - 0.7;
  slide.addShape("line", {
    x: tlX1, y: tlY, w: tlX2 - tlX1, h: 0,
    line: { color: "CBD5E1", width: 2.5 },
  });

  // Time points
  const points = [
    { t: "T-72h", label: "Normal",              subLabel: "baseline sehat",        color: C.HEALTHY,  dotColor: C.HEALTHY  },
    { t: "T-48h", label: "Degradasi Mulai",     subLabel: "sinyal mulai berubah",  color: C.WARNING,  dotColor: C.WARNING  },
    { t: "T-24h", label: "Eskalasi Dramatis",   subLabel: "sensor spike konsisten",color: "F97316",   dotColor: "F97316"   },
    { t: "T-0",   label: "FAILURE",             subLabel: "mesin berhenti",        color: C.CRITICAL, dotColor: C.CRITICAL },
  ];

  const ptPositions = [0.08, 0.34, 0.64, 0.92];
  const tlWidth = tlX2 - tlX1;

  points.forEach((pt, i) => {
    const x = tlX1 + ptPositions[i] * tlWidth;
    // Dot
    slide.addShape("ellipse", {
      x: x - 0.14, y: tlY - 0.14, w: 0.28, h: 0.28,
      fill: { color: pt.dotColor }, line: { color: pt.dotColor },
    });
    // Time label above
    slide.addText(pt.t, {
      x: x - 0.65, y: tlY - 0.55, w: 1.3, h: 0.28,
      fontSize: 11, bold: true,
      color: pt.color, fontFace: FONT.BODY,
      align: "center",
    });
    // Status label below
    slide.addShape("roundRect", {
      x: x - 0.8, y: tlY + 0.25, w: 1.6, h: 0.55,
      fill: { color: C.LIGHT_SLATE }, line: { color: pt.dotColor },
      rectRadius: 0.08,
    });
    slide.addText(pt.label, {
      x: x - 0.8, y: tlY + 0.27, w: 1.6, h: 0.28,
      fontSize: 9, bold: true,
      color: pt.color, fontFace: FONT.BODY, align: "center",
    });
    slide.addText(pt.subLabel, {
      x: x - 0.8, y: tlY + 0.52, w: 1.6, h: 0.25,
      fontSize: 8, italic: true,
      color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    });
  });

  // Key decision box
  slide.addShape("roundRect", {
    x: 0.4, y: 3.6, w: W - 0.8, h: 0.72,
    fill: { color: "FEF9C3" }, line: { color: C.WARNING },
    rectRadius: 0.08,
  });
  slide.addText(
    "⚡  Keputusan Berbasis Data:  W_WARNING_HRS = 48  ·  W_CRITICAL_HRS = 24\n" +
    "Direvisi dari hipotesis awal W_WARNING=72 — setelah analisis visual 3 mesin (M-01, M-09, M-05)",
    {
      x: 0.65, y: 3.65, w: W - 1.1, h: 0.62,
      fontSize: 11, bold: true,
      color: "78350F", fontFace: FONT.BODY,
      lineSpacingMultiple: 1.3,
    }
  );

  // Bullets
  const bullets = [
    "Look-back 72 jam pada 3 mesin: M-01 (4× failure), M-09 (2×), M-05 (1×)",
    "Pola konsisten lintas mesin → bersifat universal, bukan anomali satu mesin",
  ];
  bullets.forEach((b, i) => {
    slide.addText(`▸  ${b}`, {
      x: 0.55, y: 4.45 + i * 0.38, w: W - 1.0, h: 0.34,
      fontSize: 12, color: C.TEXT_BODY, fontFace: FONT.BODY,
    });
  });
}

// SLIDE 7 — Fase 2: Cohen's D ──────────────────────────────────────────────────
function buildSlide07(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 2", C.ANALYSIS_LAYER);
  addSectionLabel(slide, "SENSOR ANALYSIS");
  addSlideTitle(slide, "Cohen's D — Sensor Informativeness");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 2);

  // Image (left dominant)
  addImageOrPlaceholder(slide, "cohensd_chart.png", 0.4, 1.4, 7.5, 4.7,
    "Cohen's d per sensor — HEALTHY vs FAILURE distribution gap"
  );

  // Right interpretation
  const interpretations = [
    { icon: "◉", text: "Cohen's d mengukur seberapa beda distribusi sensor saat HEALTHY vs FAILURE", bold: false },
    { icon: "◉", text: "6 sensor dengan d > 2.6 (efek sangat besar) → prioritas tinggi", bold: true },
    { icon: "◉", text: "vibration (d=3.37) paling diskriminatif — top feature di semua model", bold: false },
    { icon: "◉", text: "humidity & operating_hours (d<0.3) — tetap dipertahankan, diputuskan Fase 8 feature importance", bold: false },
  ];
  interpretations.forEach((item, i) => {
    slide.addText(`${item.icon}  ${item.text}`, {
      x: 8.15, y: 1.55 + i * 0.9, w: 4.8, h: 0.8,
      fontSize: 11,
      bold: item.bold,
      color: item.bold ? C.ACCENT_DARK : C.TEXT_BODY,
      fontFace: FONT.BODY,
      lineSpacingMultiple: 1.25,
    });
  });

  // d>2.6 threshold line note
  slide.addShape("roundRect", {
    x: 8.15, y: 5.12, w: 4.8, h: 0.48,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY },
    rectRadius: 0.08,
  });
  slide.addText("Threshold: d > 2.6 → 'Efek Sangat Besar' (Cohen, 1988)", {
    x: 8.2, y: 5.16, w: 4.7, h: 0.4,
    fontSize: 10, bold: true,
    color: C.ACCENT_DARK, fontFace: FONT.BODY, align: "center",
  });
}

// SLIDE 8 — Fase 3: Temporal Label Engineering ────────────────────────────────
function buildSlide08(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 3", C.ANALYSIS_LAYER);
  addSectionLabel(slide, "LABEL ENGINEERING");
  addSlideTitle(slide, "Temporal Backward-Labeling");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 3);

  // Formula box (left)
  slide.addShape("roundRect", {
    x: 0.4, y: 1.5, w: 6.8, h: 2.4,
    fill: { color: "0F2117" }, line: { color: C.ACCENT_MED },
    rectRadius: 0.12,
  });
  const formulaLines = [
    { text: "label(t)  =", color: "86EFAC", size: 14 },
    { text: "  CRITICAL   if   T_failure - 24h  ≤  t  ≤  T_failure", color: C.CRITICAL, size: 12 },
    { text: "  WARNING    if   T_failure - 48h  ≤  t  <  T_failure - 24h", color: C.WARNING, size: 12 },
    { text: "  HEALTHY    otherwise", color: C.HEALTHY, size: 12 },
  ];
  formulaLines.forEach((fl, i) => {
    slide.addText(fl.text, {
      x: 0.65, y: 1.65 + i * 0.52, w: 6.3, h: 0.48,
      fontSize: fl.size, bold: i === 0,
      color: fl.color, fontFace: "Courier New",
    });
  });

  // Right diagram — 3 colored label boxes → timeline
  const labelColors = [
    { label: "HEALTHY",  color: C.HEALTHY,  desc: "Baseline normal"    },
    { label: "WARNING",  color: C.WARNING,  desc: "T-48h → T-24h"      },
    { label: "CRITICAL", color: C.CRITICAL, desc: "T-24h → T_failure"  },
  ];
  labelColors.forEach((lc, i) => {
    const x = 7.6;
    const y = 1.55 + i * 0.72;
    slide.addShape("roundRect", {
      x, y, w: 1.55, h: 0.55,
      fill: { color: lc.color }, line: { color: lc.color },
      rectRadius: 0.08,
    });
    slide.addText(lc.label, {
      x, y, w: 1.55, h: 0.55,
      fontSize: 10, bold: true, color: C.WHITE,
      fontFace: FONT.BODY, align: "center", valign: "middle",
    });
    slide.addText(lc.desc, {
      x: x + 1.65, y: y + 0.07, w: 4.4, h: 0.4,
      fontSize: 11, color: C.TEXT_BODY, fontFace: FONT.BODY,
    });
  });

  // Arrow → FAILURE
  slide.addShape("line", {
    x: 7.6, y: 3.8, w: 4.5, h: 0,
    line: { color: C.CRITICAL, width: 1.5, endArrowType: "triangle" },
  });
  slide.addText("▶  T_failure", {
    x: 11.8, y: 3.68, w: 1.3, h: 0.3,
    fontSize: 10, bold: true, color: C.CRITICAL, fontFace: FONT.BODY,
  });

  // Key note
  slide.addShape("rect", {
    x: 0.4, y: 4.1, w: W - 0.8, h: 0.48,
    fill: { color: "FEF9C3" }, line: { color: C.WARNING },
  });
  slide.addText(
    "⚠  Mutex constraint: WARNING tidak pernah menimpa CRITICAL — urutan evaluasi: CRITICAL dulu, WARNING kemudian",
    { x: 0.6, y: 4.14, w: W - 1.1, h: 0.4, fontSize: 11, color: "78350F", fontFace: FONT.BODY }
  );
}

// SLIDE 9 — Fase 3: Sensor Confirmation Layer ─────────────────────────────────
function buildSlide09(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 3", C.ANALYSIS_LAYER);
  addSectionLabel(slide, "LABEL VALIDATION");
  addSlideTitle(slide, "Sensor Confirmation Layer — P90 Threshold");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 3);

  // Left — threshold table
  const thresholds = [
    ["Sensor", "P90 Threshold"],
    ["temperature",       "76.30"],
    ["vibration",         "0.59"],
    ["pressure",          "103.80"],
    ["rpm",               "2,540"],
    ["power_consumption", "82.10"],
    ["noise_level",       "74.30"],
  ];
  addTable(slide, thresholds, 0.4, 1.5, 5.2, {
    colW: [3.1, 2.1], rowH: 0.38, fontSize: 11,
    headerBg: C.ANALYSIS_LAYER,
  });
  slide.addText("Min. 2 dari 6 sensor harus melewati P90", {
    x: 0.4, y: 4.2, w: 5.2, h: 0.3,
    fontSize: 9, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY,
  });

  // Right — distribution bar
  const dist = [
    { label: "HEALTHY",  pct: 97.364, count: "97,364", color: C.HEALTHY  },
    { label: "WARNING",  pct: 1.247,  count: "1,247",  color: C.WARNING  },
    { label: "CRITICAL", pct: 1.389,  count: "1,389",  color: C.CRITICAL },
  ];
  const barX = 6.0;
  const barW = 6.6;
  dist.forEach((d, i) => {
    const y = 1.65 + i * 0.82;
    // Label
    slide.addText(d.label, {
      x: barX, y, w: 1.4, h: 0.35,
      fontSize: 11, bold: true, color: d.color, fontFace: FONT.BODY, align: "right",
    });
    // Bar background
    slide.addShape("rect", {
      x: barX + 1.5, y: y + 0.03, w: 4.5, h: 0.30,
      fill: { color: "E2E8F0" }, line: { color: C.BORDER },
    });
    // Bar fill
    const fillW = Math.max(0.08, (d.pct / 100) * 4.5);
    slide.addShape("rect", {
      x: barX + 1.5, y: y + 0.03, w: fillW, h: 0.30,
      fill: { color: d.color }, line: { color: d.color },
    });
    // Count
    slide.addText(`${d.pct}% (${d.count})`, {
      x: barX + 1.5 + fillW + 0.1, y, w: 1.5, h: 0.35,
      fontSize: 10, color: C.TEXT_MUTED, fontFace: FONT.BODY,
    });
  });

  // Result box
  slide.addShape("roundRect", {
    x: 6.0, y: 4.2, w: 6.9, h: 0.72,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY },
    rectRadius: 0.1,
  });
  slide.addText(
    "✅  49 baris WARNING palsu di-downgrade → HEALTHY (1.82%)\n" +
    "    0 CRITICAL di-downgrade — semua dipertahankan",
    {
      x: 6.2, y: 4.26, w: 6.5, h: 0.62,
      fontSize: 11, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY,
      lineSpacingMultiple: 1.35,
    }
  );
}

// SLIDE 10 — Fase 4: Feature Engineering ─────────────────────────────────────
function buildSlide10(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 4", C.FEATURE_LAYER);
  addSectionLabel(slide, "FEATURE ENGINEERING");
  addSlideTitle(slide, "Feature Engineering — 8 Sensor → 75 Fitur");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 4);

  // 2×3 grid of feature categories
  const features = [
    { title: "Rolling Stats", num: "36", desc: "6 sensor × 2 window (24h, 48h) × 3 stats (mean, std, max)", color: C.ACCENT_MED  },
    { title: "Lag Features",  num: "18", desc: "6 sensor × lag {6h, 12h, 24h} — konteks temporal historis",  color: C.ACCENT_MED  },
    { title: "Cross-Sensor Ratios", num: "4",  desc: "temp/vibration · power/rpm · pressure/temp · noise/vibration", color: C.ACCENT_DARK },
    { title: "Degradation Proxy",   num: "1",  desc: "hours_since_last_maint — jarak waktu dari maintenance log",   color: C.ACCENT_DARK },
    { title: "NLP Derived",         num: "2",  desc: "damage_category · severity_score — dari maintenance notes",    color: C.FEATURE_LAYER },
    { title: "TOTAL FITUR",         num: "75", desc: "→ 69 fitur final untuk modeling (drop ID/label kolom)",        color: C.TEXT_PRIMARY  },
  ];
  const gridCols = 3;
  const cellW = (W - 0.8) / gridCols;
  const cellH = 1.3;
  const startX = 0.4;
  const startY = 1.5;

  features.forEach((f, i) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const x = startX + col * cellW;
    const y = startY + row * (cellH + 0.12);

    const isTotal = f.title === "TOTAL FITUR";
    slide.addShape("roundRect", {
      x: x + 0.05, y, w: cellW - 0.1, h: cellH,
      fill: { color: isTotal ? C.TEXT_PRIMARY : C.LIGHT_SLATE },
      line: { color: isTotal ? C.TEXT_PRIMARY : f.color },
      rectRadius: 0.1,
    });
    // Number badge
    slide.addText(f.num, {
      x: x + 0.05, y: y + 0.08, w: cellW - 0.1, h: 0.52,
      fontSize: 30, bold: true,
      color: isTotal ? C.ACCENT_MED : f.color,
      fontFace: FONT.TITLE, align: "center",
    });
    // Title
    slide.addText(f.title, {
      x: x + 0.1, y: y + 0.58, w: cellW - 0.2, h: 0.28,
      fontSize: 11, bold: true,
      color: isTotal ? C.WHITE : C.TEXT_PRIMARY,
      fontFace: FONT.BODY, align: "center",
    });
    // Desc
    slide.addText(f.desc, {
      x: x + 0.1, y: y + 0.86, w: cellW - 0.2, h: 0.38,
      fontSize: 8.5, italic: true,
      color: isTotal ? "86EFAC" : C.TEXT_MUTED,
      fontFace: FONT.BODY, align: "center",
    });
  });

  // Rolling formula
  slide.addText(
    "Formula: x_roll(t, w) = (1/w) Σ x(t-i)  for i=0..w-1,  w ∈ {24h, 48h}",
    {
      x: 0.4, y: H - 0.95, w: W - 0.8, h: 0.3,
      fontSize: 9.5, italic: true,
      color: C.TEXT_MUTED, fontFace: "Courier New", align: "center",
    }
  );
}

// SLIDE 11 — Fase 5: Preprocessing & Anti-Leakage ─────────────────────────────
function buildSlide11(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 5", C.FEATURE_LAYER);
  addSectionLabel(slide, "PREPROCESSING");
  addSlideTitle(slide, "Preprocessing & Anti-Leakage Architecture");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 5);

  const cardY = 1.5;
  const cardH = 3.2;
  const cardW = 5.8;

  // LEFT CARD — Bug (before)
  slide.addShape("roundRect", {
    x: 0.4, y: cardY, w: cardW, h: cardH,
    fill: { color: "FEF2F2" }, line: { color: C.CRITICAL },
    rectRadius: 0.12,
  });
  slide.addText("❌  SEBELUM — Data Leakage", {
    x: 0.55, y: cardY + 0.1, w: cardW - 0.3, h: 0.38,
    fontSize: 13, bold: true, color: C.CRITICAL, fontFace: FONT.BODY,
  });
  const beforeItems = [
    "StandardScaler di-fit pada 100,000 baris",
    "Termasuk Val machines (M-15–M-17)",
    "Termasuk Test machines (M-18–M-20)",
    "→ Model 'melihat' distribusi val/test saat training",
  ];
  beforeItems.forEach((item, i) => {
    slide.addText(`• ${item}`, {
      x: 0.65, y: cardY + 0.6 + i * 0.56, w: cardW - 0.55, h: 0.5,
      fontSize: 11.5, color: "991B1B", fontFace: FONT.BODY,
    });
  });

  // RIGHT CARD — Fix (after)
  slide.addShape("roundRect", {
    x: 7.1, y: cardY, w: cardW, h: cardH,
    fill: { color: "F0FDF4" }, line: { color: C.HEALTHY },
    rectRadius: 0.12,
  });
  slide.addText("✅  SESUDAH — Zero Leakage", {
    x: 7.25, y: cardY + 0.1, w: cardW - 0.3, h: 0.38,
    fontSize: 13, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY,
  });
  const afterItems = [
    "Scaler di-refit HANYA pada M-01–M-14 (70,000 baris)",
    "Val/Test mean ≠ 0, std ≠ 1 → EXPECTED & CORRECT",
    "F1 Val tidak berubah: 0.9292 → 0.9292",
    "(leakage minimal: homogenitas 20 mesin pabrik sama)",
  ];
  afterItems.forEach((item, i) => {
    slide.addText(`• ${item}`, {
      x: 7.25, y: cardY + 0.6 + i * 0.56, w: cardW - 0.4, h: 0.5,
      fontSize: 11.5, color: C.ACCENT_DARK, fontFace: FONT.BODY,
    });
  });

  // Arrow between cards
  slide.addShape("line", {
    x: 6.3, y: cardY + cardH / 2, w: 0.75, h: 0,
    line: { color: C.ACCENT_MED, width: 2, endArrowType: "triangle" },
  });

  // Bottom note
  slide.addShape("rect", {
    x: 0.4, y: cardY + cardH + 0.2, w: W - 0.8, h: 0.38,
    fill: { color: C.LIGHT_SLATE }, line: { color: C.BORDER },
  });
  slide.addText(
    "DFT-02 CLOSED: vibration negatif (min=-0.09) di-clip ke 0  ·  StandardScaler pilihan: outlier pre-failure informatif dipertahankan",
    {
      x: 0.55, y: cardY + cardH + 0.24, w: W - 1.0, h: 0.3,
      fontSize: 9.5, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY,
    }
  );
}

// SLIDE 12 — Fase 6: SSBS ─────────────────────────────────────────────────────
function buildSlide12(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 6", C.FEATURE_LAYER);
  addSectionLabel(slide, "IMBALANCE HANDLING");
  addSlideTitle(slide, "SSBS — Stratified Sequential Block Sampling");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 6);

  // Image (or placeholder)
  addImageOrPlaceholder(slide, "ssbs_diagram.png", 0.4, 1.45, 7.2, 3.5,
    "2 blok kronologis per mesin: Block A (prima) + Block B (pre-warning boundary)"
  );

  // Right — stat bars before/after
  const stats = [
    { label: "HEALTHY",  before: "97.364%", after: "87.09%",  count: "17,787", color: C.HEALTHY  },
    { label: "WARNING",  before: "1.247%",  after: "6.11%",   count: "1,247",  color: C.WARNING  },
    { label: "CRITICAL", before: "1.389%",  after: "6.80%",   count: "1,389",  color: C.CRITICAL },
  ];
  slide.addText("SEBELUM → SESUDAH", {
    x: 7.85, y: 1.5, w: 5.1, h: 0.32,
    fontSize: 11, bold: true, color: C.TEXT_PRIMARY, fontFace: FONT.BODY, align: "center",
  });
  stats.forEach((s, i) => {
    const y = 1.95 + i * 0.72;
    slide.addText(s.label, { x: 7.85, y, w: 1.2, h: 0.36, fontSize: 10, bold: true, color: s.color, fontFace: FONT.BODY });
    slide.addText(s.before, { x: 9.1, y, w: 1.2, h: 0.36, fontSize: 10, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center" });
    slide.addText("→", { x: 10.3, y, w: 0.4, h: 0.36, fontSize: 12, color: s.color, fontFace: FONT.BODY, align: "center" });
    slide.addText(s.after, { x: 10.7, y, w: 1.2, h: 0.36, fontSize: 11, bold: true, color: s.color, fontFace: FONT.BODY, align: "center" });
    slide.addText(`(${s.count})`, { x: 11.9, y, w: 1.05, h: 0.36, fontSize: 9, color: C.TEXT_MUTED, fontFace: FONT.BODY });
  });

  slide.addText("100,000 → 20,423 baris total", {
    x: 7.85, y: 4.15, w: 5.1, h: 0.32,
    fontSize: 11, bold: true, color: C.ACCENT_MED, fontFace: FONT.BODY, align: "center",
  });

  // Bottom note
  slide.addShape("roundRect", {
    x: 0.4, y: 5.1, w: W - 0.8, h: 0.62,
    fill: { color: "ECFDF5" }, line: { color: C.ACCENT_MED }, rectRadius: 0.08,
  });
  slide.addText(
    "✅  TANPA augmentasi sintetis (Zero Leakage)  ·  SMOTE sengaja ditunda ke Fase 7 — hanya untuk X_train setelah split selesai\n" +
    "8 mesin shortfall HEALTHY < 1000 baris: konsekuensi integritas temporal (bukan bug)",
    {
      x: 0.6, y: 5.16, w: W - 1.1, h: 0.52,
      fontSize: 10, color: C.ACCENT_DARK, fontFace: FONT.BODY, lineSpacingMultiple: 1.3,
    }
  );
}

// SLIDE 13 — Fase 6.5: RUL Engineering ───────────────────────────────────────
function buildSlide13(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 6.5", C.FEATURE_LAYER);
  addSectionLabel(slide, "RUL ENGINEERING");
  addSlideTitle(slide, "RUL Target Engineering — Remaining Useful Life");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 6);

  // Formula box
  slide.addShape("roundRect", {
    x: 0.4, y: 1.5, w: 6.8, h: 1.5,
    fill: { color: "0F2117" }, line: { color: C.ACCENT_MED }, rectRadius: 0.12,
  });
  slide.addText("RUL(t)  =  ( T_next_failure  −  t )  /  86,400", {
    x: 0.6, y: 1.7, w: 6.4, h: 0.55,
    fontSize: 16, bold: true,
    color: C.ACCENT_MED, fontFace: "Courier New", align: "center",
  });
  slide.addText("dalam satuan hari (days)  ·  target variabel untuk Model 2 (RUL Regressor)", {
    x: 0.6, y: 2.3, w: 6.4, h: 0.35,
    fontSize: 10, italic: true,
    color: "86EFAC", fontFace: FONT.BODY, align: "center",
  });

  // 4 stats grid (right)
  const stats = [
    { label: "Min",    val: "0.04 hari",   color: C.CRITICAL },
    { label: "Max",    val: "146.92 hari", color: C.TEXT_MUTED },
    { label: "Mean",   val: "29.38 hari",  color: C.ACCENT_MED },
    { label: "Median", val: "18.88 hari",  color: C.ACCENT_DARK },
  ];
  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 7.5 + col * 2.95;
    const y = 1.55 + row * 1.05;
    slide.addShape("roundRect", {
      x, y, w: 2.7, h: 0.9,
      fill: { color: C.LIGHT_SLATE }, line: { color: C.BORDER }, rectRadius: 0.1,
    });
    slide.addText(s.val, {
      x, y: y + 0.06, w: 2.7, h: 0.5,
      fontSize: 22, bold: true,
      color: s.color, fontFace: FONT.TITLE, align: "center",
    });
    slide.addText(s.label, {
      x, y: y + 0.57, w: 2.7, h: 0.28,
      fontSize: 10, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    });
  });

  // Per-class note
  const classNotes = [
    { kelas: "HEALTHY",  median: "~18.88 hari", color: C.HEALTHY  },
    { kelas: "WARNING",  median: "~2 hari",      color: C.WARNING  },
    { kelas: "CRITICAL", median: "~1 hari",      color: C.CRITICAL },
  ];
  slide.addText("Distribusi RUL per kelas:", {
    x: 0.4, y: 3.22, w: 6.5, h: 0.32,
    fontSize: 12, bold: true, color: C.TEXT_PRIMARY, fontFace: FONT.BODY,
  });
  classNotes.forEach((cn, i) => {
    slide.addShape("roundRect", {
      x: 0.4 + i * 2.28, y: 3.6, w: 2.1, h: 0.62,
      fill: { color: C.LIGHT_SLATE }, line: { color: cn.color }, rectRadius: 0.08,
    });
    slide.addText(cn.kelas, {
      x: 0.4 + i * 2.28, y: 3.63, w: 2.1, h: 0.28,
      fontSize: 10, bold: true, color: cn.color, fontFace: FONT.BODY, align: "center",
    });
    slide.addText(`median ${cn.median}`, {
      x: 0.4 + i * 2.28, y: 3.9, w: 2.1, h: 0.28,
      fontSize: 9.5, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    });
  });

  slide.addText(
    "WARNING median ≈2 hari, CRITICAL median ≈1 hari — konsisten dengan window 48h/24h dari Fase 2",
    {
      x: 0.4, y: 4.4, w: W - 0.8, h: 0.32,
      fontSize: 10.5, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    }
  );
}

// SLIDE 14 — Fase 7: Split & SMOTE ────────────────────────────────────────────
function buildSlide14(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 7", C.FEATURE_LAYER);
  addSectionLabel(slide, "DATA SPLITTING");
  addSlideTitle(slide, "Machine-Based Split & SMOTE (Train Only)");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 7);

  // Left — split table
  slide.addText("Dataset Split Strategy", {
    x: 0.4, y: 1.45, w: 5.8, h: 0.32,
    fontSize: 12, bold: true, color: C.TEXT_PRIMARY, fontFace: FONT.BODY,
  });
  const splitRows = [
    ["Split",  "Mesin",        "Baris",  "%"     ],
    ["Train",  "M-01 – M-14", "14,419", "70.60%"],
    ["Val",    "M-15 – M-17", "3,288",  "16.10%"],
    ["Test",   "M-18 – M-20", "2,716",  "13.30%"],
  ];
  addTable(slide, splitRows, 0.4, 1.82, 6.0, {
    colW: [1.2, 2.2, 1.5, 1.1], rowH: 0.42, fontSize: 11.5,
    headerBg: C.FEATURE_LAYER,
  });

  // Right — SMOTE table
  slide.addText("SMOTE — X_train_clf Only", {
    x: 7.0, y: 1.45, w: 5.9, h: 0.32,
    fontSize: 12, bold: true, color: C.TEXT_PRIMARY, fontFace: FONT.BODY,
  });
  const smoteRows = [
    ["Kelas",    "Sebelum", "Sesudah"],
    ["HEALTHY",  "12,504",  "12,504 (tidak berubah)"],
    ["WARNING",  "901",     "4,000  (+3,099 sintetis)"],
    ["CRITICAL", "1,014",   "4,000  (+2,986 sintetis)"],
    ["TOTAL",    "14,419",  "20,504"],
  ];
  addTable(slide, smoteRows, 7.0, 1.82, 6.0, {
    colW: [1.3, 1.5, 3.2], rowH: 0.42, fontSize: 11,
    headerBg: C.FEATURE_LAYER, highlightRow: 4, highlightBg: "DCFCE7",
  });

  // Zero leakage banner
  slide.addShape("roundRect", {
    x: 0.4, y: 4.65, w: W - 0.8, h: 0.62,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY }, rectRadius: 0.1,
  });
  slide.addText(
    "✅  Zero Data Leakage terkonfirmasi — Val & Test = 100% natural data, tanpa sampel sintetis\n" +
    "Machine-Based Split: setiap split punya full run-to-failure cycle → model belajar generalisasi antar mesin",
    {
      x: 0.6, y: 4.7, w: W - 1.1, h: 0.55,
      fontSize: 11, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY, lineSpacingMultiple: 1.3,
    }
  );
}

// SLIDE 15 — Fase 8: Dual Track Overview ──────────────────────────────────────
function buildSlide15(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8", C.MODEL_LAYER);
  addSectionLabel(slide, "MODELING OVERVIEW");
  addSlideTitle(slide, "Modeling — Dual-Track Architecture");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  // Input box
  slide.addShape("roundRect", {
    x: 4.9, y: 1.55, w: 3.5, h: 0.65,
    fill: { color: C.TEXT_PRIMARY }, line: { color: C.TEXT_PRIMARY }, rectRadius: 0.1,
  });
  slide.addText("69 Feature Input", {
    x: 4.9, y: 1.55, w: 3.5, h: 0.65,
    fontSize: 14, bold: true, color: C.WHITE,
    fontFace: FONT.BODY, align: "center", valign: "middle",
  });

  // Branch line
  const branchY = 2.2;
  slide.addShape("line", {
    x: 6.65, y: branchY, w: 0, h: 0.45,
    line: { color: C.TEXT_PRIMARY, width: 1.5 },
  });
  // Horizontal branch
  slide.addShape("line", {
    x: 2.9, y: branchY + 0.45, w: 7.5, h: 0,
    line: { color: C.TEXT_PRIMARY, width: 1.5 },
  });
  // Down to Track A
  slide.addShape("line", {
    x: 2.9, y: branchY + 0.45, w: 0, h: 0.4,
    line: { color: C.TEXT_PRIMARY, width: 1.5, endArrowType: "triangle" },
  });
  // Down to Track B
  slide.addShape("line", {
    x: 10.4, y: branchY + 0.45, w: 0, h: 0.4,
    line: { color: C.TEXT_PRIMARY, width: 1.5, endArrowType: "triangle" },
  });

  // Track A box
  slide.addShape("roundRect", {
    x: 0.4, y: 3.3, w: 5.5, h: 2.4,
    fill: { color: "EDE9FE" }, line: { color: C.MODEL_LAYER }, rectRadius: 0.12,
  });
  slide.addText("TRACK A — Health Classifier", {
    x: 0.55, y: 3.38, w: 5.2, h: 0.38,
    fontSize: 13, bold: true, color: C.MODEL_LAYER, fontFace: FONT.BODY,
  });
  ["Random Forest (baseline)", "XGBoost V2 + Threshold 0.60  ⭐", "LightGBM"].forEach((m, i) => {
    slide.addText(`• ${m}`, {
      x: 0.7, y: 3.85 + i * 0.4, w: 5.0, h: 0.36,
      fontSize: 12, color: C.TEXT_BODY,
      bold: m.includes("⭐"), fontFace: FONT.BODY,
    });
  });
  slide.addShape("roundRect", {
    x: 0.55, y: 5.2, w: 5.2, h: 0.38,
    fill: { color: C.MODEL_LAYER }, line: { color: C.MODEL_LAYER }, rectRadius: 0.08,
  });
  slide.addText("Output: HEALTHY  /  WARNING  /  CRITICAL", {
    x: 0.55, y: 5.2, w: 5.2, h: 0.38,
    fontSize: 10, bold: true, color: C.WHITE, fontFace: FONT.BODY, align: "center", valign: "middle",
  });

  // Track B box
  slide.addShape("roundRect", {
    x: 7.4, y: 3.3, w: 5.5, h: 2.4,
    fill: { color: "F0FDF4" }, line: { color: C.ACCENT_MED }, rectRadius: 0.12,
  });
  slide.addText("TRACK B — RUL Regressor", {
    x: 7.55, y: 3.38, w: 5.2, h: 0.38,
    fontSize: 13, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY,
  });
  ["XGBoost Regressor", "LSTM V2  ⭐ (final)", "GRU (eksperimental)"].forEach((m, i) => {
    slide.addText(`• ${m}`, {
      x: 7.65, y: 3.85 + i * 0.4, w: 5.0, h: 0.36,
      fontSize: 12, color: C.TEXT_BODY,
      bold: m.includes("⭐"), fontFace: FONT.BODY,
    });
  });
  slide.addShape("roundRect", {
    x: 7.55, y: 5.2, w: 5.2, h: 0.38,
    fill: { color: C.ACCENT_MED }, line: { color: C.ACCENT_MED }, rectRadius: 0.08,
  });
  slide.addText("Output: RUL (hari)  ·  Scope: WARNING + CRITICAL only", {
    x: 7.55, y: 5.2, w: 5.2, h: 0.38,
    fontSize: 10, bold: true, color: C.WHITE, fontFace: FONT.BODY, align: "center", valign: "middle",
  });

  // Center note
  slide.addText("Track B HANYA aktif jika Track A\nmendeteksi WARNING/CRITICAL\n→ reduce inference load ~70%", {
    x: 5.55, y: 3.7, w: 2.2, h: 1.1,
    fontSize: 9, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
  });
}

// SLIDE 16 — Fase 8A: Classifier Leaderboard ──────────────────────────────────
function buildSlide16(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8A", C.MODEL_LAYER);
  addSectionLabel(slide, "CLASSIFIER COMPARISON");
  addSlideTitle(slide, "Classifier — 3 Model Comparison");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  const tableRows = [
    ["Model",          "F1 Val",  "F1 Test", "WARNING F1", "Infer (ms)", "Size (MB)"],
    ["Random Forest",  "0.9292",  "0.9914",  "0.8108",     "75.25",      "3.15"    ],
    ["XGBoost V2 ⭐",  "0.9894",  "0.9906",  "0.9818",     "12.76",      "1.68"    ],
    ["LightGBM",       "0.9845",  "0.9876",  "0.9781",     "3.26",       "0.13"    ],
  ];
  addTable(slide, tableRows, 0.4, 1.5, W - 0.8, {
    colW: [3.0, 1.7, 1.7, 1.9, 1.9, 1.9],
    rowH: 0.52, fontSize: 12,
    headerBg: C.MODEL_LAYER,
    highlightRow: 2, highlightBg: "EDE9FE",
  });

  // Notes
  const notes = [
    { tag: "❌ V1 GAGAL",  text: "XGBoost V1 (early stopping agresif, iter 40)  →  WARNING F1 = 0.2186",   bg: "FEF2F2", border: C.CRITICAL, tc: "991B1B" },
    { tag: "✅ V2 OPTIMAL", text: "XGBoost V2 (499 iter, lr=0.01, threshold=0.60)  →  WARNING F1 = 0.9818", bg: "F0FDF4", border: C.HEALTHY,  tc: C.ACCENT_DARK },
  ];
  notes.forEach((n, i) => {
    const y = 3.85 + i * 0.75;
    slide.addShape("roundRect", {
      x: 0.4, y, w: W - 0.8, h: 0.62,
      fill: { color: n.bg }, line: { color: n.border }, rectRadius: 0.08,
    });
    slide.addText(n.tag, {
      x: 0.6, y: y + 0.1, w: 1.8, h: 0.42,
      fontSize: 11, bold: true, color: n.tc, fontFace: FONT.BODY,
    });
    slide.addText(n.text, {
      x: 2.4, y: y + 0.1, w: W - 2.9, h: 0.42,
      fontSize: 11, color: n.tc, fontFace: FONT.BODY,
    });
  });

  // Hyperparams
  slide.addText(
    "Hyperparameter V2: n_estimators=499  ·  max_depth=4  ·  lr=0.01  ·  subsample=0.8  ·  reg_α=0.5  ·  reg_λ=2.0",
    {
      x: 0.4, y: 5.4, w: W - 0.8, h: 0.28,
      fontSize: 9.5, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    }
  );
}

// SLIDE 17 — Fase 8A: Threshold Tuning ────────────────────────────────────────
function buildSlide17(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8A", C.MODEL_LAYER);
  addSectionLabel(slide, "THRESHOLD TUNING");
  addSlideTitle(slide, "XGBoost — Threshold Tuning: 0.50 → 0.60");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  const cardY = 1.55;
  const cardH = 3.2;
  const cardW = 5.8;

  // LEFT — default 0.50
  slide.addShape("roundRect", {
    x: 0.4, y: cardY, w: cardW, h: cardH,
    fill: { color: "FEF2F2" }, line: { color: C.CRITICAL }, rectRadius: 0.12,
  });
  slide.addText("❌  Threshold 0.50 (default)", {
    x: 0.6, y: cardY + 0.1, w: cardW - 0.4, h: 0.38,
    fontSize: 13, bold: true, color: C.CRITICAL, fontFace: FONT.BODY,
  });
  const before17 = [
    ["WARNING Precision:", "0.087"],
    ["WARNING Recall:",    "0.975"],
    ["F1 WARNING:",        "0.159"],
    ["False Alarms:",      "954  ‼"],
  ];
  before17.forEach(([k, v], i) => {
    slide.addText(k, { x: 0.7, y: cardY + 0.62 + i * 0.58, w: 3.2, h: 0.48, fontSize: 12, color: C.TEXT_BODY, fontFace: FONT.BODY });
    slide.addText(v, { x: 3.9, y: cardY + 0.62 + i * 0.58, w: 2.1, h: 0.48, fontSize: 14, bold: true, color: C.CRITICAL, fontFace: FONT.TITLE, align: "right" });
  });

  // RIGHT — 0.60 optimal
  slide.addShape("roundRect", {
    x: 7.1, y: cardY, w: cardW, h: cardH,
    fill: { color: "F0FDF4" }, line: { color: C.HEALTHY }, rectRadius: 0.12,
  });
  slide.addText("✅  Threshold 0.60 (optimal)", {
    x: 7.3, y: cardY + 0.1, w: cardW - 0.4, h: 0.38,
    fontSize: 13, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY,
  });
  const after17 = [
    ["WARNING Precision:", "0.973"],
    ["WARNING Recall:",    "0.990"],
    ["F1 WARNING:",        "0.9818"],
    ["False Alarms:",      "1  ✅"],
  ];
  after17.forEach(([k, v], i) => {
    slide.addText(k, { x: 7.3, y: cardY + 0.62 + i * 0.58, w: 3.2, h: 0.48, fontSize: 12, color: C.TEXT_BODY, fontFace: FONT.BODY });
    slide.addText(v, { x: 10.5, y: cardY + 0.62 + i * 0.58, w: 2.3, h: 0.48, fontSize: 14, bold: true, color: C.ACCENT_MED, fontFace: FONT.TITLE, align: "right" });
  });

  // Center arrow
  slide.addShape("line", {
    x: 6.35, y: cardY + cardH / 2, w: 0.65, h: 0,
    line: { color: C.ACCENT_MED, width: 2.5, endArrowType: "triangle" },
  });

  // Bottom
  slide.addShape("rect", {
    x: 0.4, y: cardY + cardH + 0.2, w: W - 0.8, h: 0.4,
    fill: { color: "FEF9C3" }, line: { color: C.WARNING },
  });
  slide.addText(
    "Threshold tuning bukan cosmetic — menyelamatkan model dari 954 false alarm operasional  (954 → 1)",
    {
      x: 0.6, y: cardY + cardH + 0.25, w: W - 1.1, h: 0.32,
      fontSize: 11, bold: true, color: "78350F", fontFace: FONT.BODY, align: "center",
    }
  );
}

// SLIDE 18 — Fase 8A: Confusion Matrix ────────────────────────────────────────
function buildSlide18(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8A", C.MODEL_LAYER);
  addSectionLabel(slide, "EVALUATION");
  addSlideTitle(slide, "Confusion Matrix — XGBoost V2 (Test Set)");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  // Image
  addImageOrPlaceholder(slide, "confusion_matrix_xgb.png", 0.5, 1.45, 8.5, 4.5,
    "Confusion Matrix — Val Set (left) & Test Set (right)"
  );

  // Highlight box
  slide.addShape("roundRect", {
    x: 9.2, y: 1.9, w: 3.85, h: 1.4,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY }, rectRadius: 0.12,
  });
  slide.addText("Fatal Error = 0", {
    x: 9.3, y: 2.0, w: 3.65, h: 0.55,
    fontSize: 26, bold: true, color: C.ACCENT_DARK, fontFace: FONT.TITLE, align: "center",
  });
  slide.addText("0 CRITICAL → HEALTHY\ndi Val maupun Test", {
    x: 9.3, y: 2.55, w: 3.65, h: 0.65,
    fontSize: 11, color: C.ACCENT_DARK, fontFace: FONT.BODY, align: "center",
    lineSpacingMultiple: 1.3,
  });

  // Key metrics
  const metrics = [
    { label: "F1 Macro (Test)", val: "0.9906", color: C.ACCENT_MED  },
    { label: "Accuracy (Test)", val: "0.9974", color: C.ACCENT_DARK },
    { label: "WARNING F1 Val", val: "0.9818", color: C.WARNING      },
  ];
  metrics.forEach((m, i) => {
    const y = 3.6 + i * 0.58;
    slide.addShape("roundRect", {
      x: 9.2, y, w: 3.85, h: 0.48,
      fill: { color: C.LIGHT_SLATE }, line: { color: C.BORDER }, rectRadius: 0.08,
    });
    slide.addText(m.label, { x: 9.3, y: y + 0.06, w: 2.0, h: 0.36, fontSize: 10, color: C.TEXT_MUTED, fontFace: FONT.BODY });
    slide.addText(m.val, { x: 11.3, y: y + 0.06, w: 1.65, h: 0.36, fontSize: 12, bold: true, color: m.color, fontFace: FONT.TITLE, align: "right" });
  });
}

// SLIDE 19 — Fase 8B: RUL Leaderboard ────────────────────────────────────────
function buildSlide19(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8B", C.MODEL_LAYER);
  addSectionLabel(slide, "RUL COMPARISON");
  addSlideTitle(slide, "RUL Predictor — 3 Model Comparison");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  const tableRows = [
    ["Model",         "MAE Test",  "RMSE Test", "R² Test",  "Error≤1hari", "Size"  ],
    ["XGBoost Reg",   "1.1020 hr", "5.6002",    "0.3961",   "93.53%",      "0.77MB"],
    ["LSTM V2  ⭐",   "0.7985 hr", "6.3803",    "0.2594",   "98.04%",      "0.60MB"],
    ["GRU",           "0.9515 hr", "7.3011",    "0.0303",   "97.80%",      "—"     ],
  ];
  addTable(slide, tableRows, 0.4, 1.5, W - 0.8, {
    colW: [2.8, 2.0, 1.9, 1.8, 2.1, 1.6],
    rowH: 0.52, fontSize: 11.5,
    headerBg: C.MODEL_LAYER,
    highlightRow: 2, highlightBg: "DCFCE7",
  });

  // Notes
  const notesB = [
    "Scope: WARNING+CRITICAL only — data HEALTHY memiliki irreducible uncertainty untuk prediksi RUL jangka panjang",
    "R² rendah bukan cacat model — disebabkan outlier RUL tinggi di CRITICAL akhir (mesin tanpa next_failure record)",
    "GRU overspecialize di CRITICAL (MAE=0.01) tapi gagal di WARNING (MAE=1.91) — kapasitas representasi terbatas",
  ];
  notesB.forEach((n, i) => {
    slide.addText(`▸  ${n}`, {
      x: 0.55, y: 3.8 + i * 0.45, w: W - 0.9, h: 0.4,
      fontSize: 11, color: C.TEXT_BODY, fontFace: FONT.BODY,
    });
  });

  // Winner banner
  slide.addShape("roundRect", {
    x: 0.4, y: 5.25, w: W - 0.8, h: 0.5,
    fill: { color: "DCFCE7" }, line: { color: C.HEALTHY }, rectRadius: 0.1,
  });
  slide.addText(
    "🏆  LSTM V2 dipilih sebagai Model 2 Final  ·  MAE Test: 0.7985 hari  ·  Error ≤ 1 hari: 98.04%",
    {
      x: 0.6, y: 5.3, w: W - 1.1, h: 0.4,
      fontSize: 12, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY, align: "center",
    }
  );
}

// SLIDE 20 — Fase 8B: LSTM Architecture & Learning Curve ─────────────────────
function buildSlide20(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8B", C.MODEL_LAYER);
  addSectionLabel(slide, "LSTM ARCHITECTURE");
  addSlideTitle(slide, "LSTM V2 — Architecture & Learning Curve");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  // Left: Architecture diagram (stacked boxes)
  const archLayers = [
    { label: "Input: 24 timesteps × 69 features",    color: C.TEXT_PRIMARY, textColor: C.WHITE },
    { label: "LSTM (64) + L2(0.001) + Dropout(0.3)", color: C.MODEL_LAYER,  textColor: C.WHITE },
    { label: "BatchNormalization",                    color: "A78BFA",        textColor: C.WHITE },
    { label: "LSTM (32) + L2(0.001) + Dropout(0.3)", color: C.MODEL_LAYER,  textColor: C.WHITE },
    { label: "BatchNormalization",                    color: "A78BFA",        textColor: C.WHITE },
    { label: "Dense (16, relu)",                      color: C.ACCENT_DARK,  textColor: C.WHITE },
    { label: "Dense (1, linear)  →  RUL (hari)",      color: C.ACCENT_MED,   textColor: C.WHITE },
  ];
  const archX = 0.4;
  const archW = 5.8;
  const archH = 0.48;
  const archGap = 0.52;
  const archStartY = 1.5;

  archLayers.forEach((al, i) => {
    const y = archStartY + i * archGap;
    slide.addShape("roundRect", {
      x: archX, y, w: archW, h: archH,
      fill: { color: al.color }, line: { color: al.color }, rectRadius: 0.08,
    });
    slide.addText(al.label, {
      x: archX, y, w: archW, h: archH,
      fontSize: 10.5, bold: true,
      color: al.textColor, fontFace: FONT.BODY, align: "center", valign: "middle",
    });
    // Connector arrow
    if (i < archLayers.length - 1) {
      slide.addShape("line", {
        x: archX + archW / 2, y: y + archH, w: 0, h: archGap - archH,
        line: { color: C.TEXT_MUTED, width: 1, endArrowType: "open" },
      });
    }
  });

  // Total params
  slide.addText("Total params: 47,649", {
    x: archX, y: archStartY + 7 * archGap, w: archW, h: 0.3,
    fontSize: 10, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
  });

  // Right: learning curve image + caption
  addImageOrPlaceholder(slide, "learning_curve_lstm.png", 6.5, 1.5, 6.5, 4.2,
    "Best epoch=184  ·  Val MAE=0.8160 hari  ·  V1→V2→V3(gagal)→V2 final"
  );

  // Key hyperparams
  slide.addShape("rect", {
    x: 6.5, y: 5.85, w: 6.5, h: 0.35,
    fill: { color: C.LIGHT_SLATE }, line: { color: C.BORDER },
  });
  slide.addText(
    "lr=0.001  ·  batch=32  ·  patience=30  ·  dropout=0.3  ·  L2=0.001  ·  ReduceLR factor=0.5",
    { x: 6.55, y: 5.88, w: 6.4, h: 0.3, fontSize: 9, color: C.TEXT_MUTED, fontFace: "Courier New", align: "center" }
  );
}

// SLIDE 21 — Fase 8B: RUL Prediction Quality ──────────────────────────────────
function buildSlide21(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 8B", C.MODEL_LAYER);
  addSectionLabel(slide, "RUL QUALITY");
  addSlideTitle(slide, "LSTM V2 — Prediction Quality");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 8);

  // Central image
  addImageOrPlaceholder(slide, "rul_actual_vs_pred.png", 0.4, 1.45, 8.8, 4.3,
    "Actual vs Predicted RUL — LSTM V2 (Test Set, WARNING+CRITICAL only)"
  );

  // Right stat callouts
  addStatCallout(slide, "0.7985", "hari MAE Test", 9.5, 1.7, 3.5, 1.15, C.ACCENT_MED);
  addStatCallout(slide, "98.04%", "Error ≤ 1 hari", 9.5, 3.05, 3.5, 1.15, C.ACCENT_DARK);

  // Integration test note
  slide.addShape("roundRect", {
    x: 9.4, y: 4.35, w: 3.6, h: 1.35,
    fill: { color: C.LIGHT_SLATE }, line: { color: C.ACCENT_MED }, rectRadius: 0.1,
  });
  slide.addText("Validasi Real-World (M-06)", {
    x: 9.5, y: 4.42, w: 3.4, h: 0.32,
    fontSize: 10, bold: true, color: C.ACCENT_DARK, fontFace: FONT.BODY,
  });
  slide.addText(
    "WARNING terdeteksi T-47h\nCRITICAL terdeteksi T-34h\nRUL error saat CRITICAL: 0.05 hari",
    {
      x: 9.5, y: 4.77, w: 3.4, h: 0.88,
      fontSize: 9.5, color: C.TEXT_BODY, fontFace: FONT.BODY, lineSpacingMultiple: 1.3,
    }
  );
}

// SLIDE 22 — Fase 9: Final Model Selection ───────────────────────────────────
function buildSlide22(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 9", C.EVAL_LAYER);
  addSectionLabel(slide, "MODEL SELECTION");
  addSlideTitle(slide, "Final Model Selection — Decision Locked");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 9);

  // 2 decision cards
  const cards = [
    {
      track: "Model 1 — Health Classifier",
      name: "XGBoost V2  +  Threshold 0.60",
      metrics: [
        ["F1 Macro Test",  "0.9906"],
        ["WARNING F1",     "0.9818"],
        ["Fatal Error",    "0"],
      ],
      file: "classifier_final.pkl",
      color: C.MODEL_LAYER, lightBg: "EDE9FE", x: 0.4,
    },
    {
      track: "Model 2 — RUL Predictor",
      name: "LSTM V2  (WARNING+CRITICAL only)",
      metrics: [
        ["MAE Test",         "0.7985 hari"],
        ["Error ≤ 1 hari",   "98.04%"],
        ["Deployment Scope", "WARNING / CRITICAL"],
      ],
      file: "rul_predictor_final.keras",
      color: C.ACCENT_MED, lightBg: "DCFCE7", x: 7.1,
    },
  ];

  cards.forEach(card => {
    const cW = 5.8;
    const cH = 4.0;
    const cY = 1.55;

    slide.addShape("roundRect", {
      x: card.x, y: cY, w: cW, h: cH,
      fill: { color: card.lightBg }, line: { color: card.color, pt: 2 }, rectRadius: 0.14,
    });
    // Track label
    slide.addText(card.track, {
      x: card.x + 0.15, y: cY + 0.12, w: cW - 0.3, h: 0.32,
      fontSize: 10, bold: true, color: card.color,
      fontFace: FONT.BODY, align: "center",
    });
    // Model name
    slide.addText(card.name, {
      x: card.x + 0.15, y: cY + 0.48, w: cW - 0.3, h: 0.55,
      fontSize: 14, bold: true, color: C.TEXT_PRIMARY,
      fontFace: FONT.TITLE, align: "center",
    });
    addDivider(slide, card.x + 0.2, cY + 1.08, cW - 0.4);
    // Metrics
    card.metrics.forEach((m, i) => {
      slide.addText(m[0], { x: card.x + 0.25, y: cY + 1.2 + i * 0.62, w: 2.8, h: 0.5, fontSize: 11, color: C.TEXT_MUTED, fontFace: FONT.BODY });
      slide.addText(m[1], { x: card.x + 3.0, y: cY + 1.2 + i * 0.62, w: 2.6, h: 0.5, fontSize: 14, bold: true, color: card.color, fontFace: FONT.TITLE, align: "right" });
    });
    // FINAL badge
    slide.addShape("roundRect", {
      x: card.x + 0.3, y: cY + cH - 0.65, w: 1.5, h: 0.42,
      fill: { color: card.color }, line: { color: card.color }, rectRadius: 0.08,
    });
    slide.addText("✅ FINAL", {
      x: card.x + 0.3, y: cY + cH - 0.65, w: 1.5, h: 0.42,
      fontSize: 10, bold: true, color: C.WHITE,
      fontFace: FONT.BODY, align: "center", valign: "middle",
    });
    // File name
    slide.addText(card.file, {
      x: card.x + 2.0, y: cY + cH - 0.58, w: cW - 2.3, h: 0.3,
      fontSize: 9.5, italic: true, color: C.TEXT_MUTED, fontFace: "Courier New", align: "right",
    });
  });

  // Bottom note
  slide.addText(
    "Keputusan dikunci di Fase 9 HTML Report  ·  Diekspor ke models/final/ via Fase 10",
    {
      x: 0.4, y: 5.72, w: W - 0.8, h: 0.3,
      fontSize: 10, italic: true, color: C.TEXT_MUTED, fontFace: FONT.BODY, align: "center",
    }
  );
}

// SLIDE 23 — Fase 10: Deployment Architecture ─────────────────────────────────
function buildSlide23(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide);
  addPhaseBadge(slide, "FASE 10", C.EVAL_LAYER);
  addSectionLabel(slide, "DEPLOYMENT");
  addSlideTitle(slide, "Deployment Architecture — FastAPI Microservice");
  addDivider(slide, 0.4, 1.25, W - 0.8);
  addProgressStepper(slide, 10);

  // Pipeline flow (horizontal)
  const flow = [
    { label: "Raw Sensor\nJSON Payload",   color: C.TEXT_PRIMARY, textColor: C.WHITE    },
    { label: "preprocessing_\npipeline.pkl (6KB)", color: C.FEATURE_LAYER,  textColor: C.WHITE    },
    { label: "XGBoost\nClassifier",        color: C.MODEL_LAYER,  textColor: C.WHITE    },
    { label: "LSTM RUL\nPredictor",        color: C.ACCENT_MED,   textColor: C.WHITE    },
    { label: "FastAPI\n/api/ml/predict",   color: C.EVAL_LAYER,   textColor: C.WHITE    },
  ];
  const flowY = 1.7;
  const flowBoxW = 1.95;
  const flowBoxH = 0.85;
  const flowGapX = 0.35;
  const flowStartX = 0.3;

  flow.forEach((f, i) => {
    const x = flowStartX + i * (flowBoxW + flowGapX);
    slide.addShape("roundRect", {
      x, y: flowY, w: flowBoxW, h: flowBoxH,
      fill: { color: f.color }, line: { color: f.color }, rectRadius: 0.1,
    });
    slide.addText(f.label, {
      x, y: flowY, w: flowBoxW, h: flowBoxH,
      fontSize: 9.5, bold: true, color: f.textColor,
      fontFace: FONT.BODY, align: "center", valign: "middle",
    });
    if (i < flow.length - 1) {
      slide.addShape("line", {
        x: x + flowBoxW, y: flowY + flowBoxH / 2, w: flowGapX, h: 0,
        line: { color: "94A3B8", width: 1.2, endArrowType: "triangle" },
      });
    }
  });

  // Conditional branch note
  slide.addShape("roundRect", {
    x: 4.6, y: 2.65, w: 2.85, h: 0.48,
    fill: { color: "FEF9C3" }, line: { color: C.WARNING }, rectRadius: 0.08,
  });
  slide.addText("⚡ Hanya aktif jika\nWARNING atau CRITICAL", {
    x: 4.62, y: 2.67, w: 2.8, h: 0.44,
    fontSize: 8.5, color: "78350F", fontFace: FONT.BODY, align: "center",
  });

  // 3 technical notes
  const techNotes = [
    { icon: "🔧", text: "Pickle bug resolved: FeatureEngineeringTransformer dipindah dari __main__ ke src/preprocessing_pipeline.py", bg: "FEF2F2", border: C.CRITICAL },
    { icon: "🔧", text: "TF/Keras breaking change: pin TF==2.15.0, model re-export ke .keras format, LSTM warm-up saat startup", bg: "FEF2F2", border: C.CRITICAL },
    { icon: "✅", text: "Smoke test: 5/5 skenario PASSED  ·  Avg latency: 49.7ms  ·  Max: 130ms  ·  Workers=1 (LSTM thread-safety)", bg: "F0FDF4", border: C.HEALTHY },
  ];
  techNotes.forEach((n, i) => {
    const y = 3.32 + i * 0.7;
    slide.addShape("roundRect", {
      x: 0.4, y, w: W - 0.8, h: 0.58,
      fill: { color: n.bg }, line: { color: n.border }, rectRadius: 0.08,
    });
    slide.addText(`${n.icon}  ${n.text}`, {
      x: 0.6, y: y + 0.09, w: W - 1.1, h: 0.4,
      fontSize: 11, color: n.bg === "F0FDF4" ? C.ACCENT_DARK : "991B1B",
      fontFace: FONT.BODY,
    });
  });

  // Docker tag
  slide.addText(
    "Docker: Dockerfile.ml  ·  uvicorn src.app:app --host 0.0.0.0 --port 8000 --workers 1",
    {
      x: 0.4, y: 5.42, w: W - 0.8, h: 0.28,
      fontSize: 9, italic: true, color: C.TEXT_MUTED, fontFace: "Courier New", align: "center",
    }
  );
}

// SLIDE 24 — Closing: Key Results ─────────────────────────────────────────────
function buildSlide24(prs) {
  const slide = prs.addSlide();
  addSlideBase(slide, { dark: true });
  // NO phase badge for closing

  // Title
  slide.addText("Key Results & Impact", {
    x: 0.5, y: 0.4, w: W - 1.0, h: 0.65,
    fontSize: 28, bold: true, color: C.COVER_TEXT,
    fontFace: FONT.TITLE, align: "center",
  });
  slide.addShape("line", {
    x: 2.5, y: 1.1, w: W - 5.0, h: 0,
    line: { color: C.ACCENT_MED, width: 1.5 },
  });

  // 2x2 stat grid
  const stats24 = [
    { num: "0.9818",  cap: "F1 WARNING\n(XGBoost V2, Val Set)",    color: C.ACCENT_MED,  bg: "1A5C32" },
    { num: "0",       cap: "Fatal Error\n(CRITICAL → HEALTHY)",     color: C.HEALTHY,     bg: "14532D" },
    { num: "0.7985",  cap: "hari MAE RUL\n(LSTM V2, Test Set)",     color: "67E8F9",      bg: "0F2117" },
    { num: "98.04%",  cap: "Error ≤ 1 hari\n(LSTM V2, Test Set)",   color: C.ACCENT_MED,  bg: "1A5C32" },
  ];

  stats24.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.6 + col * 6.3;
    const y = 1.3 + row * 2.1;
    const cW = 6.0;
    const cH = 1.9;

    slide.addShape("roundRect", {
      x, y, w: cW, h: cH,
      fill: { color: s.bg }, line: { color: C.ACCENT_MED, pt: 0.5 }, rectRadius: 0.14,
    });
    slide.addText(s.num, {
      x, y: y + 0.1, w: cW, h: cH * 0.65,
      fontSize: 42, bold: true, color: s.color,
      fontFace: FONT.TITLE, align: "center",
    });
    slide.addText(s.cap, {
      x, y: y + cH * 0.68, w: cW, h: cH * 0.3,
      fontSize: 11, color: "A7F3D0",
      fontFace: FONT.BODY, align: "center",
    });
  });

  // Closing statement
  slide.addText(
    "Dari 0.056% data failure menjadi sistem prediktif yang siap deploy:\n" +
    "SSBS + Cascaded XGBoost–LSTM architecture membuktikan bahwa penanganan temporal yang tepat\n" +
    "mengubah extreme imbalance menjadi keunggulan, bukan hambatan.",
    {
      x: 0.5, y: 5.6, w: W - 1.0, h: 0.95,
      fontSize: 12, italic: true, color: "A7F3D0",
      fontFace: FONT.BODY, align: "center",
      lineSpacingMultiple: 1.45,
    }
  );

  // PRIME tag
  slide.addText("PRIME  ·  Predictive Reliability & Intelligence Maintenance Engine", {
    x: 0.5, y: H - 0.55, w: W - 1.0, h: 0.32,
    fontSize: 9, color: "4ADE80",
    fontFace: FONT.BODY, align: "center", charSpacing: 1,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — Assemble all slides
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const prs = new PptxGenJS();

  // Set slide layout to 16:9
  prs.layout = "LAYOUT_WIDE";

  console.log("Building 24-slide deck: PRIME ML Pipeline...");

  buildSlide01(prs);  console.log("  [1/24] Cover");
  buildSlide02(prs);  console.log("  [2/24] Agenda / Roadmap");
  buildSlide03(prs);  console.log("  [3/24] Problem Statement");
  buildSlide04(prs);  console.log("  [4/24] Fase 0 — Environment");
  buildSlide05(prs);  console.log("  [5/24] Fase 1 — Data Ingestion");
  buildSlide06(prs);  console.log("  [6/24] Fase 2 — Failure Autopsy");
  buildSlide07(prs);  console.log("  [7/24] Fase 2 — Cohen's D");
  buildSlide08(prs);  console.log("  [8/24] Fase 3 — Label Engineering");
  buildSlide09(prs);  console.log("  [9/24] Fase 3 — Sensor Confirmation");
  buildSlide10(prs);  console.log("  [10/24] Fase 4 — Feature Engineering");
  buildSlide11(prs);  console.log("  [11/24] Fase 5 — Preprocessing");
  buildSlide12(prs);  console.log("  [12/24] Fase 6 — SSBS");
  buildSlide13(prs);  console.log("  [13/24] Fase 6.5 — RUL Engineering");
  buildSlide14(prs);  console.log("  [14/24] Fase 7 — Split & SMOTE");
  buildSlide15(prs);  console.log("  [15/24] Fase 8 — Dual Track Overview");
  buildSlide16(prs);  console.log("  [16/24] Fase 8A — Classifier Leaderboard");
  buildSlide17(prs);  console.log("  [17/24] Fase 8A — Threshold Tuning");
  buildSlide18(prs);  console.log("  [18/24] Fase 8A — Confusion Matrix");
  buildSlide19(prs);  console.log("  [19/24] Fase 8B — RUL Leaderboard");
  buildSlide20(prs);  console.log("  [20/24] Fase 8B — LSTM Architecture");
  buildSlide21(prs);  console.log("  [21/24] Fase 8B — RUL Quality");
  buildSlide22(prs);  console.log("  [22/24] Fase 9 — Model Selection");
  buildSlide23(prs);  console.log("  [23/24] Fase 10 — Deployment");
  buildSlide24(prs);  console.log("  [24/24] Closing");

  await prs.writeFile({ fileName: OUTPUT_FILE });
  console.log(`\n✅  File generated: ${OUTPUT_FILE}`);
  console.log(`   Slides: 24`);
  console.log(`   Design: Light Mode Forest Green (PRIME Command Center)`);
  console.log(`\n   NOTE: Drop figure images into ./figures/ directory:`);
  console.log(`     - figures/cohensd_chart.png`);
  console.log(`     - figures/ssbs_diagram.png`);
  console.log(`     - figures/confusion_matrix_xgb.png`);
  console.log(`     - figures/learning_curve_lstm.png`);
  console.log(`     - figures/rul_actual_vs_pred.png`);
  console.log(`   Then re-run the script to embed them.\n`);
}

main().catch(err => {
  console.error("Error generating presentation:", err);
  process.exit(1);
});
