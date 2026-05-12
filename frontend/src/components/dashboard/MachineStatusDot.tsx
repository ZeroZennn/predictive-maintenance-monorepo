"use client";

import type { MachineStatus } from "@/types";
import { clsx } from "clsx";

interface MachineStatusDotProps {
  status: MachineStatus;
  size?: "sm" | "md" | "lg";
}

export default function MachineStatusDot({
  status,
  size = "md",
}: MachineStatusDotProps) {
  let sizeClasses = "w-2.5 h-2.5";
  if (size === "sm") sizeClasses = "w-2 h-2";
  if (size === "lg") sizeClasses = "w-3 h-3";

  return (
    <span
      className={clsx(
        "rounded-full inline-block shrink-0",
        sizeClasses,
        status === "HEALTHY" &&
          "bg-lapis-neon shadow-[0_0_6px_rgba(95,218,10,0.8)]",
        status === "WARNING" &&
          "bg-lapis-amber shadow-[0_0_6px_rgba(239,117,19,0.8)]",
        status === "CRITICAL" &&
          "bg-lapis-red shadow-[0_0_6px_rgba(255,59,59,0.8)] animate-pulse-critical"
      )}
    />
  );
}
