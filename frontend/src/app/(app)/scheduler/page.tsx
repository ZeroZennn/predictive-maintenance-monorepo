"use client";

import { useMaintenanceSocket } from "@/hooks";
import CalendarView, { MOCK_SCHEDULES } from "@/components/scheduler/CalendarView";
import { TaskDetailCard } from "@/components/scheduler";
import { AlertTriangle, CheckCircle } from "lucide-react";

export default function SchedulerPage() {
  // Init hook — fetch data + listen WebSocket
  useMaintenanceSocket();

  // Filter pending confirmation schedules for the Triage Action Center
  const pendingSchedules = MOCK_SCHEDULES.filter(
    (s) => s.status === "PENDING_CONFIRMATION"
  );

  return (
    <div className="flex h-full w-full bg-[#081819] overflow-hidden">
      {/* LEFT PANEL: Triage Action Center */}
      <div className="w-[420px] shrink-0 border-r border-white/5 bg-[#040C0D]/40 flex flex-col h-full backdrop-blur-md">
        {/* Panel Header */}
        <div className="p-6 border-b border-white/5 shrink-0 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-extrabold text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#F5A623]" /> Triage Center
            </h3>
            <span className="bg-yellow-500/20 text-[#F5A623] text-xs font-bold font-heading px-2.5 py-0.5 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(245,166,35,0.1)]">
              {pendingSchedules.length} Butuh Konfirmasi
            </span>
          </div>
          <p className="text-xs text-[#C3CCD1]/60">
            Jadwal perawatan prediktif dari model AI yang membutuhkan persetujuan manual segera.
          </p>
        </div>

        {/* Panel Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pendingSchedules.length > 0 ? (
            pendingSchedules.map((schedule) => (
              <TaskDetailCard key={schedule.id} task={schedule} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-[#C3CCD1]/40 border border-dashed border-white/5 rounded-2xl p-6">
              <CheckCircle size={32} className="text-[#5FDA0A] mb-2" />
              <span className="font-medium text-white">Semua Terkendali</span>
              <span className="text-xs mt-1 text-[#C3CCD1]/60">
                Tidak ada rekomendasi prediktif baru yang membutuhkan persetujuan.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Main Calendar View */}
      <div className="flex-1 h-full overflow-hidden relative">
        <CalendarView />
      </div>
    </div>
  );
}
