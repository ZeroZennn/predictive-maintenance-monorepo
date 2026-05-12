"use client";

import type { MachineStatus } from "@/types";
import { STATUS_CONFIG } from "@/config";
import { clsx } from "clsx";

interface StatusBadgeProps {
  status: MachineStatus;
  size?: "sm" | "md";
  animated?: boolean;
}

export default function StatusBadge({
  status,
  size = "md",
  animated = false,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses =
    size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5",
        "rounded-full font-semibold",
        "border tracking-wide uppercase",
        config.colorClass,
        config.bgClass,
        config.borderClass,
        sizeClasses,
        animated && status === "CRITICAL" && "animate-pulse-critical"
      )}
    >
      <span
        className={clsx(
          "rounded-full",
          size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5",
          status === "HEALTHY" && "bg-lapis-neon",
          status === "WARNING" && "bg-lapis-amber",
          status === "CRITICAL" && "bg-lapis-red"
        )}
      />
      {config.label}
    </span>
  );
}
