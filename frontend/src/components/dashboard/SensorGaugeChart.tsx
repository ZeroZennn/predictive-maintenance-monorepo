"use client";

import { useEffect, useState, useId } from "react";
import {
  useMotionValue,
  useTransform,
  animate,
  motion,
} from "framer-motion";
import type { SensorConfig } from "@/config";

interface SensorGaugeChartProps {
  config: SensorConfig;
  value: number;
  status: "HEALTHY" | "WARNING" | "CRITICAL";
}

const CX = 100;
const CY = 100;
const RADIUS = 70;
const START_ANGLE = -90;
const END_ANGLE = 90;

// 1. DATA-DRIVEN CONFIGURATION WITH HEADROOM
const sensorConfigs: Record<string, any> = {
  temperature: { min: 0, max: 105, warning: 76.3, critical: 91.30 }, // P95 Crit: 93.3 -> Max: 105
  vibration: { min: 0, max: 2.0, warning: 0.59, critical: 1.37 }, // P95 Crit: 1.48 -> Max: 2.0
  pressure: { min: 0, max: 125, warning: 103.8, critical: 109.9 }, // P95 Crit: 117.1 -> Max: 125
  rpm: { min: 0, max: 3500, warning: 2403, critical: 2791.66 }, // P95 Crit: 3117 -> Max: 3500
  power_consumption: { min: 0, max: 120, warning: 82.1, critical: 105.4 }, // P95 Crit: 107.8 -> Max: 120
  noise_level: { min: 0, max: 105, warning: 74.3, critical: 91.0 }, // P95 Crit: 92.9 -> Max: 105
  humidity: { min: 0, max: 80, warning: 56.75, critical: 65.3 },
  operating_hours: { min: 0, max: 4500, warning: 1534.25, critical: 3077.56 }
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
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

export default function SensorGaugeChart({
  config,
  value,
  status,
}: SensorGaugeChartProps) {
  const [isClient, setIsClient] = useState(false);
  const gradientId = useId();

  useEffect(() => {
    setIsClient(true);
  }, []);



  const CIRCUMFERENCE = Math.PI * RADIUS;

  // Mengambil config berdasarkan sensor type
  const sensorConf = sensorConfigs[config.key] || { min: 0, max: 100, warning: 60, critical: 80 };
  const { min, max } = sensorConf;

  // 2. KALKULASI PERSENTASE GRADIENT DINAMIS & SMOOTH FADE
  // Kalkulasi persentase threshold utama
  const warnPct = Math.min(100, Math.max(0, ((sensorConf.warning - min) / (max - min)) * 100));
  const critPct = Math.min(100, Math.max(0, ((sensorConf.critical - min) / (max - min)) * 100));

  // Rentangkan zona campuran (blend spread) secara paksa agar sangat smooth
  const safeGreenEnd = Math.max(0, warnPct - 30); // Mulai pudar perlahan 30% sebelum warning
  const blendYellow = Math.max(0, warnPct - 5);   // Transisi kuning muda 5% sebelum warning
  const blendOrange = critPct;                    // Oranye diletakkan di batas critical
  const blendRed = Math.min(100, critPct + 15);   // Merah pekat baru muncul 15% setelah critical

  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const clampedRatio = percentage / 100;
  const targetOffset = CIRCUMFERENCE * (1 - clampedRatio);

  const arcOffset = useMotionValue(CIRCUMFERENCE);

  useEffect(() => {
    animate(arcOffset, targetOffset, {
      duration: 0.8,
      ease: "easeOut",
    });
  }, [targetOffset, arcOffset]);

  const needleAngle = useTransform(
    arcOffset,
    [CIRCUMFERENCE, 0],
    [START_ANGLE, END_ANGLE]
  );

  const needleInnerX = useTransform(
    needleAngle,
    (angle) => polarToCartesian(CX, CY, RADIUS - 8, angle).x
  );
  const needleInnerY = useTransform(
    needleAngle,
    (angle) => polarToCartesian(CX, CY, RADIUS - 8, angle).y
  );
  const needleOuterX = useTransform(
    needleAngle,
    (angle) => polarToCartesian(CX, CY, RADIUS + 16, angle).x
  );
  const needleOuterY = useTransform(
    needleAngle,
    (angle) => polarToCartesian(CX, CY, RADIUS + 16, angle).y
  );

  if (!isClient) return <div className="h-[130px] w-full" />;

  const displayValue = typeof value === "number" ? value.toFixed(1) : "—";
  const displayUnit = config.unit === "°C" ? "°C" : config.unit;

  return (
    // 4. SIZING / UKURAN (w-full h-full flex justify-center items-center)
    <div className="w-full h-full flex flex-col justify-center items-center">
      {/* SVG Diperbesar max-w-[280px] */}
      <svg viewBox="0 0 200 130" className="w-full h-auto max-w-[280px]">
        <defs>
          {/* 3. SMOOTH GRADIENT LOGIC PADA SVG */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5FDA0A" /> {/* Hijau Asli Lapis AI */}
            <stop offset={`${safeGreenEnd}%`} stopColor="#5FDA0A" /> {/* Tahan hijau murni lebih lama */}
            <stop offset={`${blendYellow}%`} stopColor="#FBBF24" /> {/* Kuning Amber Lembut */}
            <stop offset={`${warnPct}%`} stopColor="#F59E0B" /> {/* Kuning Pekat di Warning */}
            <stop offset={`${blendOrange}%`} stopColor="#F97316" /> {/* Oranye di Critical */}
            <stop offset={`${blendRed}%`} stopColor="#EF4444" /> {/* Merah Menyala (Smooth) */}
            <stop offset="100%" stopColor="#DC2626" /> {/* Merah Gelap di ujung ekstrem */}
          </linearGradient>
        </defs>

        {/* Track arc (background) */}
        <path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="rgba(226, 240, 241, 0.1)"
          strokeWidth={16}
          strokeLinecap="butt"
        />

        {/* GLOW LAYER (Elemen Duplikat dengan Blur) */}
        <motion.path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={8}
          strokeLinecap="butt"
          strokeDasharray={CIRCUMFERENCE}
          className="blur-md opacity-50"
          style={{
            strokeDashoffset: arcOffset,
          }}
        />

        {/* MAIN INDICATOR BAR (Elemen Asli, Tajam dan Jelas) */}
        <motion.path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={`url(#${gradientId})`} // Menggunakan gradient
          strokeWidth={16}
          strokeLinecap="butt"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            strokeDashoffset: arcOffset,
          }}
        />

        {/* 7 Ticks inside */}
        {Array.from({ length: 7 }).map((_, i) => {
          const angle = START_ANGLE + (i / 6) * (END_ANGLE - START_ANGLE);
          const inner = polarToCartesian(CX, CY, RADIUS - 22, angle);
          const outer = polarToCartesian(CX, CY, RADIUS - 12, angle);
          return (
            <line
              key={i}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#6B8F92"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.6}
            />
          );
        })}

        {/* Needle (orange radial line) with micro-vibration */}
        <motion.g
          animate={{ rotate: [0, 0.8, -0.6, 1.0, -0.8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 0.12, // Sangat cepat
            ease: "linear",
            repeatType: "mirror"
          }}
          style={{ transformOrigin: "100px 100px" }}
        >
          <motion.line
            x1={needleInnerX}
            y1={needleInnerY}
            x2={needleOuterX}
            y2={needleOuterY}
            stroke="#FF8A00"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </motion.g>

        {/* Value Text */}
        <text
          x={CX}
          y={CY - 10}
          textAnchor="middle"
          fontSize={16}
          fontWeight="bold"
          fill="#FFFFFF"
        >
          {displayValue}
          {displayUnit}
        </text>

        {/* Label Text */}
        <text
          x={CX}
          y={CY + 18}
          textAnchor="middle"
          fontSize={12}
          fill="#E2F0F1"
        >
          {config.label}
        </text>
      </svg>
    </div>
  );
}
