"use client";

import { motion } from "framer-motion";
import type { MachineStatus } from "@/types";
import { STATUS_CONFIG } from "@/config";
import { clsx } from "clsx";

interface CLFCircularGaugeProps {
  percentage: number; // 0-100
  status: MachineStatus;
}

const statusConfig = {
  HEALTHY: { color: "text-[#5FDA0A]", stroke: "#5FDA0A", label: "Healthy" },
  WARNING: { color: "text-[#F59E0B]", stroke: "#F59E0B", label: "Warning" },
  CRITICAL: { color: "text-[#EF4444]", stroke: "#EF4444", label: "Critical" },
};

const glowColorMapping: Record<MachineStatus, string> = {
  HEALTHY: 'drop-shadow-[0_0_3px_#5FDA0A50]', // Hijau Asli, Opacity 50%
  WARNING: 'drop-shadow-[0_0_3px_#F59E0B60]', // Oranye, Opacity 60%
  CRITICAL: 'drop-shadow-[0_0_3px_#EF444470]', // Merah, Opacity 70%
};

export default function CLFCircularGauge({
  percentage,
  status,
}: CLFCircularGaugeProps) {
  const size = 140;
  const STROKE_WIDTH = 8;
  const CENTER = size / 2;
  const RADIUS = (size - STROKE_WIDTH * 2) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  const currentConfig = statusConfig[status] || statusConfig.HEALTHY;
  const arcColor = currentConfig.stroke;

  return (
    <div
      className="relative flex items-center justify-center w-24 h-24 xl:w-[140px] xl:h-[140px] shrink-0"
    >
      <svg viewBox={`0 0 ${size} ${size}`} className={clsx("w-full h-full -rotate-90", glowColorMapping[status] || "")}>
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
          className="font-bold leading-none text-white text-2xl xl:text-4xl"
        >
          {Math.round(percentage)}%
        </span>
        <span
          className="text-gray-400 font-medium text-[10px] xl:text-sm mt-0.5 xl:mt-1"
        >
          {currentConfig.label}
        </span>
      </div>
    </div>
  );
}
