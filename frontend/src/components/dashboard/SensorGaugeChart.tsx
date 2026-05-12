"use client";

import { useEffect } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  motion,
} from "framer-motion";
import type { SensorConfig } from "@/config";

// =============================================================================
// PROPS
// =============================================================================

interface SensorGaugeChartProps {
  config: SensorConfig;
  value: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
}

// =============================================================================
// KONSTANTA INTERNAL
// =============================================================================

const SIZE = 160;
const CX = 80;
const CY = 90;
const RADIUS = 60;
const START_ANGLE = -210;
const END_ANGLE = 30;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function valueToAngle(value: number, min: number, max: number) {
  const ratio = (value - min) / (max - min);
  const clamped = Math.max(0, Math.min(1, ratio));
  return START_ANGLE + clamped * (END_ANGLE - START_ANGLE);
}

// =============================================================================
// KOMPONEN UTAMA
// =============================================================================

export default function SensorGaugeChart({
  config,
  value,
  status,
}: SensorGaugeChartProps) {
  // --- Penentuan Warna ---
  let arcColor = "#5FDA0A";
  let needleColor = "#EF7513";

  if (status === "WARNING") {
    arcColor = "#EF7513";
    needleColor = "#EF7513";
  } else if (status === "CRITICAL") {
    arcColor = "#FF3B3B";
    needleColor = "#FF3B3B";
  }

  // --- Animasi Jarum ---
  const initialAngle = valueToAngle(value, config.min, config.max);
  const motionValue = useMotionValue(initialAngle);

  useEffect(() => {
    const newAngle = valueToAngle(value, config.min, config.max);
    animate(motionValue, newAngle, {
      duration: 0.6,
      ease: "easeOut",
    });
  }, [value, config.min, config.max, motionValue]);

  const needleX = useTransform(motionValue, (angle) => {
    return polarToCartesian(CX, CY, 45, angle).x;
  });
  
  const needleY = useTransform(motionValue, (angle) => {
    return polarToCartesian(CX, CY, 45, angle).y;
  });

  // --- Render ---
  return (
    <div className="flex flex-col items-center">
      {/* BAGIAN 1 — SVG gauge */}
      <svg viewBox="0 0 160 110" className="w-full max-w-[160px]">
        {/* Layer 1 — Track arc (background) */}
        <path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="#1E3D40"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* Layer 2 — Value arc (colored, panjang sesuai nilai) */}
        <path
          d={describeArc(
            CX, CY,
            RADIUS,
            START_ANGLE,
            valueToAngle(value, config.min, config.max)
          )}
          fill="none"
          stroke={arcColor}
          strokeWidth={10}
          strokeLinecap="round"
        />

        {/* Layer 3 — Tick marks (5 buah, equally spaced) */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = START_ANGLE + (i / 4) * (END_ANGLE - START_ANGLE);
          const inner = polarToCartesian(CX, CY, RADIUS - 8, angle);
          const outer = polarToCartesian(CX, CY, RADIUS + 2, angle);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#6B8F92"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Layer 4 — Needle (animated motion line) */}
        <motion.line
          x1={CX}
          y1={CY}
          x2={needleX}
          y2={needleY}
          stroke={needleColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        {/* Layer 5 — Center dot */}
        <circle cx={CX} cy={CY} r={4} fill={needleColor} />

        {/* Layer 6 — Value text (tengah) */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontSize={18}
          fontWeight="bold"
          fill="#E2F0F1"
        >
          {typeof value === "number" ? value.toFixed(1) : "—"}
        </text>

        {/* Layer 7 — Unit text */}
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fontSize={9}
          fill="#6B8F92"
        >
          {config.unit}
        </text>
      </svg>

      {/* BAGIAN 2 — Label di bawah SVG */}
      <p className="text-xs text-lapis-muted text-center mt-1 font-medium tracking-wide">
        {config.label}
      </p>
    </div>
  );
}
