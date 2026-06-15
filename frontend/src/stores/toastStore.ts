import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToastAlert } from "@/types";

interface ToastStore {
  // State
  alerts: ToastAlert[];
  persistentAlerts: ToastAlert[];

  // Actions
  addAlert: (alert: Omit<ToastAlert, "id" | "isDismissed">) => void;
  dismissToast: (id: string) => void;
  dismissAllAlerts: () => void;
  resolveAlert: (id: string) => void;
  clearAllAlerts: () => void;

  // Selector
  getActiveAlerts: () => ToastAlert[];
}

export const useToastStore = create<ToastStore>()(
  persist(
    (set, get) => ({
      // State
      alerts: [],
  persistentAlerts: [],

  // Actions
  addAlert: (alert: Omit<ToastAlert, "id" | "isDismissed">) =>
    set((state) => {
      // Deduplicate: skip if same machine_id already has an active (non-dismissed) alert
      const isDuplicate = state.alerts.some(
        (a) => a.machine_id === alert.machine_id && !a.isDismissed
      );
      if (isDuplicate) return state;

      const newAlert: ToastAlert = {
        ...alert,
        id: "alert-" + Date.now(),
        isDismissed: false,
      };
      return { alerts: [...state.alerts, newAlert] };
    }),

  dismissToast: (id: string) =>
    set((state) => {
      const target = state.alerts.find((a) => a.id === id);
      if (!target) return state;

      const updatedAlerts = state.alerts.map((a) =>
        a.id === id ? { ...a, isDismissed: true } : a
      );

      // Promote CRITICAL and WARNING alerts to persistentAlerts on dismiss
      const shouldPersist =
        target.severity === "CRITICAL" || target.severity === "WARNING";
      const alreadyPersisted = state.persistentAlerts.some((a) => a.id === id);

      const updatedPersistent =
        shouldPersist && !alreadyPersisted
          ? [...state.persistentAlerts, { ...target, isDismissed: true }]
          : state.persistentAlerts;

      return { alerts: updatedAlerts, persistentAlerts: updatedPersistent };
    }),

  dismissAllAlerts: () =>
    set((state) => {
      let newPersistent = [...state.persistentAlerts];
      const updatedAlerts = state.alerts.map((a) => {
        if (!a.isDismissed && (a.severity === "CRITICAL" || a.severity === "WARNING")) {
          // Promote to persistent if not already there
          if (!newPersistent.some((p) => p.id === a.id)) {
            newPersistent.push({ ...a, isDismissed: true });
          }
        }
        return { ...a, isDismissed: true };
      });
      return { alerts: updatedAlerts, persistentAlerts: newPersistent };
    }),

  resolveAlert: (id: string) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
      persistentAlerts: state.persistentAlerts.filter((a) => a.id !== id),
    })),

  clearAllAlerts: () => set({ alerts: [], persistentAlerts: [] }),

      // Selector — reads live state via get()
      getActiveAlerts: () => get().alerts.filter((a) => !a.isDismissed),
    }),
    {
      name: "lapis-alert-history",
      // Hanya simpan history agar cache tidak membengkak dengan data active state sementara
      partialize: (state) => ({ persistentAlerts: state.persistentAlerts }),
    }
  )
);
