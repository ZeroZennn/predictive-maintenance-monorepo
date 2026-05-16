"use client";

import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface KPIItemProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  valueColor?: string; // default: "text-white"
  progress?: number;   // 0-100
  ringColor?: string;  // e.g. text-lapis-neon
}

export default function KPIItem({
  icon: Icon,
  label,
  value,
  valueColor = "text-white",
  progress = 100,
  ringColor = "text-lapis-muted",
}: KPIItemProps) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-3 w-full bg-lapis-dark-gray p-3.5 rounded-xl border border-lapis-border shadow-inner">
      {/* Icon container with SVG ring */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
        {/* Background track */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="24" 
            cy="24" 
            r={radius} 
            className="stroke-[#1E292A]" 
            strokeWidth="3.5" 
            fill="none" 
          />
          <circle
            cx="24" 
            cy="24" 
            r={radius}
            className={clsx("stroke-current transition-all duration-1000 ease-out", ringColor)}
            strokeWidth="3.5" 
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        {/* Inner Icon */}
        <div className="relative z-10 w-8 h-8 flex items-center justify-center">
           <Icon size={18} className={ringColor} />
        </div>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-lapis-muted tracking-wide uppercase font-medium leading-tight truncate">
          {label}
        </p>
        <p
          className={clsx(
            "font-bold text-lg leading-tight mt-1 truncate tracking-tight",
            valueColor
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
