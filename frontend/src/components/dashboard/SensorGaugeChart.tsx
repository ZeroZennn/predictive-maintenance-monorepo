"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  let glowColor = "rgba(95, 218, 10, 0.4)";
  let arcGradient = "url(#healthyGradient)";

  if (status === "WARNING") {
    glowColor = "rgba(239, 117, 19, 0.4)";
    arcGradient = "url(#warningGradient)";
  } else if (status === "CRITICAL") {
    glowColor = "rgba(255, 59, 59, 0.4)";
    arcGradient = "url(#criticalGradient)";
  }

  const CIRCUMFERENCE = Math.PI * RADIUS;

  const clampedRatio = Math.max(
    0,
    Math.min(1, (value - config.min) / (config.max - config.min))
  );
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
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 200 130" className="w-full max-w-[220px]">
        <defs>
          <linearGradient id="healthyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3A8A06" />
            <stop offset="100%" stopColor="#5FDA0A" />
          </linearGradient>
          <linearGradient id="warningGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A84C00" />
            <stop offset="100%" stopColor="#EF7513" />
          </linearGradient>
          <linearGradient id="criticalGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A80000" />
            <stop offset="100%" stopColor="#FF3B3B" />
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

        {/* Value arc (colored, animated, glowing) */}
        <motion.path
          d={describeArc(CX, CY, RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={arcGradient}
          strokeWidth={16}
          strokeLinecap="butt"
          strokeDasharray={CIRCUMFERENCE}
          style={{
            strokeDashoffset: arcOffset,
            filter: `drop-shadow(0px 0px 8px ${glowColor})`,
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

        {/* Needle (orange radial line) */}
        <motion.line
          x1={needleInnerX}
          y1={needleInnerY}
          x2={needleOuterX}
          y2={needleOuterY}
          stroke="#FF8A00"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Value Text */}
        <text
          x={CX}
          y={CY - 10}
          textAnchor="middle"
          fontSize={14}
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
          fontSize={14}
          fill="#E2F0F1"
        >
          {config.label}
        </text>
      </svg>
    </div>
  );
}
