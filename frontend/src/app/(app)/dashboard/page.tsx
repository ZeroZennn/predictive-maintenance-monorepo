"use client";

// SEMENTARA — Smoke test sistem notifikasi.
// File ini akan diganti total saat Fase 7 (Dashboard).

import { useToastStore } from "@/stores";
import { useToast } from "@/hooks";

export default function DashboardPage() {
  const addAlert = useToastStore((state) => state.addAlert);
  const { persistentAlerts } = useToast();

  return (
    <div className="space-y-6">
      {/* SECTION 1 — Judul */}
      <div>
        <h1 className="text-2xl font-bold text-lapis-text">
          Real-Time Dashboard
        </h1>
        <p className="text-lapis-muted">Notification System Smoke Test</p>
      </div>

      {/* SECTION 2 — Tombol trigger alert */}
      <div className="flex gap-4">
        {/* Tombol CRITICAL */}
        <button
          onClick={() =>
            addAlert({
              machine_id: "M-01",
              severity: "CRITICAL",
              title: "⚠️ CRITICAL: M-01",
              message: "Suhu mesin melewati batas kritis: 95°C",
              timestamp: new Date().toISOString(),
            })
          }
          className="px-4 py-2 rounded-lg text-sm font-medium bg-lapis-red-dim text-lapis-red border border-lapis-red hover:shadow-glow-red transition-shadow"
        >
          Trigger CRITICAL
        </button>

        {/* Tombol WARNING */}
        <button
          onClick={() =>
            addAlert({
              machine_id: "M-05",
              severity: "WARNING",
              title: "⚡ WARNING: M-05",
              message: "Getaran mesin mendekati threshold: 5.8 mm/s",
              timestamp: new Date().toISOString(),
            })
          }
          className="px-4 py-2 rounded-lg text-sm font-medium bg-lapis-amber-dim text-lapis-amber border border-lapis-amber hover:shadow-glow-amber transition-shadow"
        >
          Trigger WARNING
        </button>

        {/* Tombol INFO */}
        <button
          onClick={() =>
            addAlert({
              machine_id: "M-10",
              severity: "INFO",
              title: "ℹ️ INFO: M-10",
              message: "Jadwal maintenance preventif dalam 3 hari",
              timestamp: new Date().toISOString(),
            })
          }
          className="px-4 py-2 rounded-lg text-sm font-medium bg-lapis-surface text-lapis-text border border-lapis-border hover:border-lapis-muted transition-colors"
        >
          Trigger INFO
        </button>
      </div>

      {/* SECTION 3 — Counter persistent alerts */}
      <p className="text-lapis-muted text-sm">
        Persistent alerts aktif:
        <span className="text-lapis-neon font-bold ml-1">
          {persistentAlerts.length}
        </span>
      </p>
    </div>
  );
}
