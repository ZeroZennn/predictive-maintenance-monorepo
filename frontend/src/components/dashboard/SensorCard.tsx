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
        "bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border",
        "flex flex-col items-center",
        "p-3 gap-1",
        "transition-shadow duration-500",
        // Dynamic border berdasarkan status
        statusBorderClass
      )}
    >
      {/* Card Header */}
      <div className="w-full flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-b from-lapis-neon to-[#3A8A06]">
          <AlignJustify size={14} className="text-[#081819]" strokeWidth={3} />
        </div>
        <span className="text-sm font-medium text-white">
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
