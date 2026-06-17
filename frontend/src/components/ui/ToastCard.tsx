"use client";

import { motion } from "framer-motion";
import { X, AlertTriangle, AlertOctagon, Info, CheckCircle } from "lucide-react";
import type { ToastAlert } from "@/types";

// =============================================================================
// Props
// =============================================================================

interface ToastCardProps {
  alert: ToastAlert;
  onDismiss: (id: string) => void;
}

// =============================================================================
// Severity mapping
// =============================================================================

const severityConfig = {
  CRITICAL: {
    Icon: AlertOctagon,
    borderClass: "border-lapis-red",
    iconColorClass: "text-lapis-red",
    bgClass: "bg-lapis-red-dim",
    titleColorClass: "text-lapis-red",
    shadowClass: "shadow-glow-red",
  },
  WARNING: {
    Icon: AlertTriangle,
    borderClass: "border-lapis-amber",
    iconColorClass: "text-lapis-amber",
    bgClass: "bg-lapis-amber-dim",
    titleColorClass: "text-lapis-amber",
    shadowClass: "",
  },
  INFO: {
    Icon: Info,
    borderClass: "border-lapis-border",
    iconColorClass: "text-lapis-muted",
    bgClass: "bg-lapis-surface",
    titleColorClass: "text-lapis-text",
    shadowClass: "",
  },
  SUCCESS: {
    Icon: CheckCircle,
    borderClass: "border-green-500/50",
    iconColorClass: "text-green-400",
    bgClass: "bg-green-500/10",
    titleColorClass: "text-green-400",
    shadowClass: "",
  },
} as const;

// =============================================================================
// Component
// =============================================================================

export default function ToastCard({ alert, onDismiss }: ToastCardProps) {
  const {
    Icon,
    borderClass,
    iconColorClass,
    bgClass,
    titleColorClass,
    shadowClass,
  } = severityConfig[alert.severity];

  const formattedTime = new Date(alert.timestamp).toLocaleTimeString("id-ID");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={[
        "w-80 rounded-xl border p-4",
        "flex items-start gap-3",
        "pointer-events-auto",
        borderClass,
        bgClass,
        // shadowClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* BAGIAN 1 — Icon */}
      <div className="mt-0.5 shrink-0">
        <Icon size={18} className={iconColorClass} />
      </div>

      {/* BAGIAN 2 — Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm ${titleColorClass}`}>
          {alert.title}
        </p>
        <p className="text-xs text-lapis-muted mt-0.5 leading-relaxed">
          {alert.message}
        </p>
        <p className="text-xs text-lapis-muted mt-1 opacity-60">
          {formattedTime}
        </p>
      </div>

      {/* BAGIAN 3 — Dismiss button */}
      <button
        onClick={() => onDismiss(alert.id)}
        className="shrink-0 text-lapis-muted hover:text-lapis-text transition-colors mt-0.5"
        aria-label="Dismiss alert"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
