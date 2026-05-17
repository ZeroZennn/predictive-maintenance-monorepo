"use client";

import { useToastStore } from "@/stores";
import type { ToastAlert } from "@/types";

// =============================================================================
// HOOK: useToast
// Subscribe ke alerts dan persistentAlerts dari toastStore
// =============================================================================

export function useToast() {
  const alerts = useToastStore((state) => state.alerts);
  const persistentAlerts = useToastStore((state) => state.persistentAlerts);

  const addAlert = useToastStore((state) => state.addAlert);
  const dismissToast = useToastStore((state) => state.dismissToast);
  const resolveAlert = useToastStore((state) => state.resolveAlert);

  const activeToasts: ToastAlert[] = alerts.filter((a) => !a.isDismissed);
  const hasCriticalAlert = activeToasts.some((a) => a.severity === "CRITICAL");

  return {
    activeToasts,
    persistentAlerts,
    hasCriticalAlert,
    addAlert,
    dismissToast,
    resolveAlert,
  };
}
