"use client";

import React from "react";
import { useToastStore } from "@/stores";
import { AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";

export default function AlertsHistoryPage() {
  const persistentAlerts = useToastStore((s) => s.persistentAlerts);

  // Sorting descending by ID (which contains timestamp)
  const sortedAlerts = [...persistentAlerts].reverse();

  return (
    <div className="flex-1 h-full p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Notification History</h1>
            <p className="text-lapis-muted">
              Riwayat semua notifikasi peringatan dan insiden mesin.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-lapis-surface rounded-lg border border-lapis-border">
            <Clock className="w-5 h-5 text-lapis-muted" />
            <span className="text-sm text-lapis-muted font-medium">
              Total: {sortedAlerts.length}
            </span>
          </div>
        </div>

        {sortedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-lapis-muted bg-lapis-surface border border-lapis-border rounded-xl">
            <CheckCircle className="w-12 h-12 mb-4 text-lapis-neon/50" />
            <p>Belum ada riwayat notifikasi.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-4 p-5 rounded-xl border border-lapis-border bg-lapis-surface/50 hover:bg-lapis-surface transition-colors"
              >
                <div className={`p-3 rounded-lg flex-shrink-0 ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-500/10 text-red-500"
                    : alert.severity === "WARNING"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : alert.severity === "SUCCESS"
                    ? "bg-lapis-neon/10 text-lapis-neon"
                    : "bg-blue-500/10 text-blue-500"
                }`}>
                  {alert.severity === "CRITICAL" || alert.severity === "WARNING" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : alert.severity === "SUCCESS" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-white">
                      {alert.title}
                    </h3>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#081819] text-lapis-muted border border-lapis-border">
                      {new Date(parseInt(alert.id.split('-')[1] || Date.now().toString())).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-lapis-muted">
                    {alert.message}
                  </p>
                  {alert.machine_id && (
                    <div className="mt-3 inline-block px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-white tracking-wider">
                      {alert.machine_id}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
