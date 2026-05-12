"use client";

import { motion } from "framer-motion";
import type { MachineStatus } from "@/types";
import { STATUS_CONFIG } from "@/config";
import { clsx } from "clsx";

interface RULCircularGaugeProps {
  percentage: number; // 0-100
  status: MachineStatus;
  size?: number; // default: 100
}

export default function RULCircularGauge({
  percentage,
  status,
  size = 100,
}: RULCircularGaugeProps) {
  const STROKE_WIDTH = 8;
  const CENTER = size / 2;
  const RADIUS = (size - STROKE_WIDTH * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  let arcColor = "#5FDA0A";
  if (status === "WARNING") arcColor = "#EF7513";
  else if (status === "CRITICAL") arcColor = "#FF3B3B";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track circle (background) */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#1E3D40"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Progress arc (animated) */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={arcColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={clsx(
            "font-bold leading-none",
            size >= 100 ? "text-xl" : "text-base",
            STATUS_CONFIG[status].colorClass
          )}
        >
          {Math.round(percentage)}%
        </span>
        <span className="text-[10px] text-lapis-muted mt-0.5 font-medium">
          {STATUS_CONFIG[status].label}
        </span>
      </div>
    </div>
  );
}
