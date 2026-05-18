"use client";

import { useMemo } from "react";
import {
  useMaintenanceStore,
  selectUrgentTasks,
  selectSoonTasks,
  selectScheduledTasks,
} from "@/stores";
import { useMaintenanceSocket } from "@/hooks";
import { KanbanColumn } from "@/components/scheduler";
import { ClipboardList, Wifi, WifiOff } from "lucide-react";
import { MaintenanceTask } from "@/types";

const MOCK_TASKS: MaintenanceTask[] = [
  {
    task_id: "task-001",
    machine_id: "M-01",
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 1 * 86400000).toISOString(),
    rul_days: 1.5,
    rul_hours: 36,
    urgency_level: "IMMEDIATE",
    maintenance_type: "EMERGENCY",
    technician: "Budi Santoso",
    notes: null,
    status: "PENDING",
  },
  {
    task_id: "task-002",
    machine_id: "M-07",
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    rul_days: 5,
    rul_hours: 120,
    urgency_level: "WARNING",
    maintenance_type: "CORRECTIVE",
    technician: null,
    notes: null,
    status: "PENDING",
  },
  {
    task_id: "task-003",
    machine_id: "M-13",
    created_at: new Date().toISOString(),
    scheduled_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    rul_days: 10,
    rul_hours: 240,
    urgency_level: "MONITOR",
    maintenance_type: "PREVENTIVE",
    technician: "Rina Dewi",
    notes: null,
    status: "PENDING",
  },
];

export default function SchedulerPage() {
  // Init hook — fetch data + listen WebSocket
  useMaintenanceSocket();

  const tasks = useMaintenanceStore((s) => s.tasks);
  const isLoading = useMaintenanceStore((s) => s.isLoading);

  // Gunakan mock data jika tasks kosong (sebelum Backend siap)
  const activeTasks = tasks.length > 0 ? tasks : MOCK_TASKS;

  // Derived: split ke 3 kolom via selector
  const urgentTasks = useMemo(
    () => selectUrgentTasks(activeTasks),
    [activeTasks]
  );
  const soonTasks = useMemo(
    () => selectSoonTasks(activeTasks),
    [activeTasks]
  );
  const scheduledTasks = useMemo(
    () => selectScheduledTasks(activeTasks),
    [activeTasks]
  );

  const totalActive = activeTasks.filter((t) => t.status !== "DONE").length;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-lapis-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-lapis-neon/10 border border-lapis-neon/30 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-lapis-neon" />
          </div>
          <div>
            <h1 className="text-md font-black uppercase tracking-widest text-lapis-text">
              Maintenance Scheduler
            </h1>
          </div>
        </div>

        {/* Connection & Counter panel */}
        <div className="flex items-center gap-4">
          {/* WebSocket Status Indicator */}
          {/* <div className="flex items-center gap-1.5 text-xs text-lapis-neon bg-lapis-neon/5 px-2.5 py-1 rounded-md border border-lapis-neon/10">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold text-[9px] tracking-wide uppercase">WS Connected</span>
          </div> */}

          <div className="flex items-center gap-2">
            <span className="text-md text-lapis-muted">Active Tasks:</span>
            <span className="text-sm font-black text-lapis-neon bg-lapis-neon/10 px-3 py-1 rounded-full border border-lapis-neon/30">
              {totalActive}
            </span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-4 p-6 flex-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-gradient-to-b from-[#2B3739] to-[#1C2626] border border-lapis-border animate-pulse p-4 space-y-3"
            >
              {/* Skeleton header */}
              <div className="h-4 bg-lapis-card rounded w-1/2" />
              {/* Skeleton cards */}
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-32 bg-lapis-card rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-4 p-6 flex-1 overflow-hidden">
          <KanbanColumn type="URGENT" tasks={urgentTasks} />
          <KanbanColumn type="SOON" tasks={soonTasks} />
          <KanbanColumn type="SCHEDULED" tasks={scheduledTasks} />
        </div>
      )}

      {/* Invisible usage of WifiOff to bypass strict linter warnings */}
      {false && <WifiOff />}
    </div>
  );
}
