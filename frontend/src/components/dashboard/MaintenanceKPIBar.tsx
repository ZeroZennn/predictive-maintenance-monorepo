"use client";

import { useMachineStore } from "@/stores";
import {
  Activity,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Clock,
  Settings,
  AlignJustify,
} from "lucide-react";
import { clsx } from "clsx";

interface MaintenanceKPIBarProps {
  className?: string;
}

export default function MaintenanceKPIBar({
  className,
}: MaintenanceKPIBarProps) {
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId);
  const machine = useMachineStore((state) =>
    selectedMachineId ? state.machines[selectedMachineId] : undefined
  );

  if (!machine) {
    return (
      <div
        className={clsx(
          "h-[200px] rounded-xl bg-[#2B3739] animate-pulse",
          className
        )}
      />
    );
  }

  const getUrgencyColor = (level?: string | null) => {
    if (level === "IMMEDIATE" || level === "CRITICAL") return "text-[#EF4444]";
    if (level === "WARNING") return "text-[#F59E0B]";
    return "text-[#5FDA0A]"; // MONITOR
  };

  const kpis = [
    {
      label: "CONFIDENCE SCORE",
      value: `${((machine.confidence || 0) * 100).toFixed(1)}%`,
      icon: Activity,
      color: "text-[#5FDA0A]",
    },
    {
      label: "CURRENT URGENCY",
      value: machine.urgency_level || "UNKNOWN",
      icon: AlertTriangle,
      color: getUrgencyColor(machine.urgency_level),
    },
    {
      label: "ISSUES THIS WEEK",
      value: machine.issues_this_week || 0,
      icon: AlertCircle,
      color: (machine.issues_this_week || 0) > 0 ? "text-[#F59E0B]" : "text-gray-400",
    },
    {
      label: "DAYS SINCE LAST MAINT.",
      value: `${machine.days_since_last_maintenance || 0} Days`,
      icon: Calendar,
      color: "text-gray-400",
    },
    {
      label: "TOTAL DOWNTIME",
      value: `${machine.total_downtime_hours || 0} Hours`,
      icon: Clock,
      color: (machine.total_downtime_hours || 0) > 0 ? "text-[#EF4444]" : "text-gray-400",
    },
    {
      label: "MTBF",
      value: `${machine.mtbf_days || 0} Days`,
      icon: Settings,
      color: "text-blue-400",
    },
  ];

  return (
    <div
      className={clsx(
        "bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border-b-2 border-b-[#1E3D40] p-4 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1 px-1">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-b from-lapis-neon to-[#3A8A06]">
          <AlignJustify size={12} className="text-[#081819]" strokeWidth={3} />
        </div>
        <span className="text-sm font-bold text-white uppercase tracking-wider">
          MAINTENANCE KPIs
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-[#121A1A] border border-[#1E3D40] rounded-lg p-4 flex flex-col justify-center gap-2"
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  {kpi.label}
                </span>
              </div>
              <span className="text-xl font-bold text-white">{kpi.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
