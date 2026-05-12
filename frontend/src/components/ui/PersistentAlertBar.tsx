"use client";

import { AlertTriangle, AlertOctagon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks";
import type { ToastSeverity } from "@/types";

// =============================================================================
// PersistentAlertBar
// Permanently visible below the Header while unresolved CRITICAL/WARNING alerts
// exist. Resolving an alert removes it from persistentAlerts.
// =============================================================================

const MAX_VISIBLE = 3;

function getHighestSeverity(
  severities: ToastSeverity[]
): "CRITICAL" | "WARNING" {
  return severities.includes("CRITICAL") ? "CRITICAL" : "WARNING";
}

export default function PersistentAlertBar() {
  const { persistentAlerts, resolveAlert } = useToast();

  if (persistentAlerts.length === 0) return null;

  const highestSeverity = getHighestSeverity(
    persistentAlerts.map((a) => a.severity)
  );

  const isCritical = highestSeverity === "CRITICAL";
  const barBgClass = isCritical
    ? "bg-lapis-red-dim border-b border-lapis-red"
    : "bg-lapis-amber-dim border-b border-lapis-amber";

  const visibleAlerts = persistentAlerts.slice(0, MAX_VISIBLE);
  const overflowCount = persistentAlerts.length - MAX_VISIBLE;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full overflow-hidden"
      >
        <div className={`${barBgClass} px-6 py-2 flex flex-col gap-1`}>
          {visibleAlerts.map((alert) => {
            const Icon =
              alert.severity === "CRITICAL" ? AlertOctagon : AlertTriangle;
            const iconClass =
              alert.severity === "CRITICAL"
                ? "text-lapis-red shrink-0"
                : "text-lapis-amber shrink-0";

            return (
              <div
                key={alert.id}
                className="flex items-center gap-3"
              >
                <Icon size={14} className={iconClass} />
                <span className="text-xs font-medium flex-1 truncate text-lapis-text">
                  {alert.title} — {alert.message}
                </span>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="text-lapis-muted hover:text-lapis-text transition-colors shrink-0"
                  aria-label="Resolve alert"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {overflowCount > 0 && (
            <p className="text-xs text-lapis-muted pl-5">
              +{overflowCount} lainnya
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
