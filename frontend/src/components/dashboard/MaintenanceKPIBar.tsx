"use client";

import { useMemo } from "react";
import { useMachineStore } from "@/stores";
import { KPIItem } from "@/components/dashboard";
import {
  Cpu,
  Calendar,
  Percent,
  Clock,
  AlertTriangle,
  DollarSign,
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

  const kpiData = useMemo(() => {
    if (!machine) return null;

    const confidence = (machine.confidence ?? 0) * 100;
    const rulHours = (machine.rul_days ?? 0) * 24;

    let confidenceColor = "text-lapis-red";
    if (confidence >= 80) confidenceColor = "text-lapis-neon";
    else if (confidence >= 50) confidenceColor = "text-lapis-amber";

    let rulColor = "text-lapis-red";
    if (rulHours > 720) rulColor = "text-lapis-neon";
    else if (rulHours >= 240) rulColor = "text-lapis-amber";

    return {
      confidence: {
        value: `${Math.round(confidence)}%`,
        color: confidenceColor,
        progress: confidence,
      },
      rul: {
        value: `${Math.round(rulHours)} Hours`,
        color: rulColor,
        progress: Math.min(100, Math.max(0, (rulHours / 1440) * 100)), // max 60 days
      },
    };
  }, [machine]);

  if (!kpiData) {
    return (
      <div
        className={clsx(
          "h-[200px] rounded-xl bg-lapis-surface animate-pulse",
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        "bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border-b-2 border-b-[#1E3D40] shadow-lg p-4 flex flex-col gap-3",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KPIItem
          icon={Cpu}
          label="Confidence Score"
          value={kpiData.confidence.value}
          ringColor={kpiData.confidence.color}
          progress={kpiData.confidence.progress}
        />
        <KPIItem
          icon={Calendar}
          label="Last Maintenance"
          value="29 April 2025"
          ringColor="text-lapis-muted"
          progress={100}
        />
        <KPIItem
          icon={Percent}
          label="Uptime Percentage"
          value="90%"
          ringColor="text-lapis-neon"
          progress={90}
        />
        <KPIItem
          icon={AlertTriangle}
          label="Issues per Week"
          value="8"
          ringColor="text-lapis-amber"
          progress={80}
        />
        <KPIItem
          icon={Clock}
          label="Remaining Operation Life"
          value={kpiData.rul.value}
          ringColor={kpiData.rul.color}
          progress={kpiData.rul.progress}
        />
        <KPIItem
          icon={DollarSign}
          label="Maintenance Costs"
          value="$0"
          ringColor="text-lapis-neon"
          progress={100}
        />
      </div>
    </div>
  );
}
