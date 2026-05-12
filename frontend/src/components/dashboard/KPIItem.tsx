"use client";

import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface KPIItemProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  valueColor?: string; // default: "text-lapis-text"
}

export default function KPIItem({
  icon: Icon,
  label,
  value,
  valueColor = "text-lapis-text",
}: KPIItemProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon container */}
      <div className="w-9 h-9 rounded-full border border-lapis-border flex items-center justify-center shrink-0 bg-lapis-surface">
        <Icon size={16} className="text-lapis-muted" />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="text-[10px] text-lapis-muted leading-tight truncate">
          {label}
        </p>
        <p
          className={clsx(
            "font-bold text-sm leading-tight mt-0.5",
            valueColor
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
