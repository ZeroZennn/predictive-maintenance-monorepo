"use client";

import { useMachineStore } from "@/stores";
import SensorGaugeChart from "./SensorGaugeChart";
import type { SensorConfig } from "@/config";
import { STATUS_CONFIG } from "@/config";
import type { MachineStatus } from "@/types";
import { clsx } from "clsx";
import { AlignJustify } from "lucide-react";

interface SensorCardProps {
  machineId: string;
  sensorConfig: SensorConfig;
}

export default function SensorCard({
  machineId,
  sensorConfig,
}: SensorCardProps) {
  // Hanya subscribe ke satu nilai sensor ini
  const sensorValue = useMachineStore(
    (state) =>
      state.machines[machineId]?.sensors[sensorConfig.key] ?? sensorConfig.min
  );

  // Hanya subscribe ke status mesin ini
  const machineStatus = useMachineStore(
    (state) => state.machines[machineId]?.status ?? "HEALTHY"
  );

  let statusBorderClass = "border-lapis-border";
  if (machineStatus === "WARNING") {
    statusBorderClass = "border-lapis-amber shadow-glow-amber";
  } else if (machineStatus === "CRITICAL") {
    statusBorderClass =
      "border-lapis-red shadow-glow-red animate-pulse-critical";
  }

  return (
    <div
      className={clsx(
        // Base card styles
        "bg-lapis-card rounded-xl border",
        "flex flex-col items-center",
        "p-3 gap-1",
        "transition-shadow duration-500",
        // Dynamic border berdasarkan status
        statusBorderClass
      )}
    >
      {/* Card Header */}
      <div className="w-full flex items-center gap-1.5 mb-1">
        <AlignJustify size={12} className="text-lapis-neon shrink-0" />
        <span className="text-[10px] font-semibold text-lapis-text uppercase tracking-widest truncate">
          {sensorConfig.label}
        </span>
      </div>

      {/* Gauge Chart */}
      <SensorGaugeChart
        config={sensorConfig}
        value={sensorValue}
        status={machineStatus}
      />
    </div>
  );
}
