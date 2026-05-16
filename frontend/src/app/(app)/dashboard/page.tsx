"use client";

import { useEffect } from "react";
import { SensorCard, MachineCard, RULCircularGauge, AnomalyTimeline, MaintenanceKPIBar, MachineListSidebar } from "@/components/dashboard";
import { SENSOR_CONFIG, MACHINE_IDS } from "@/config";
import { AlignJustify } from "lucide-react";
import { useMachineStore } from "@/stores";

export default function DashboardPage() {
  const selectedId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const setSelectedId = useMachineStore((state) => state.setSelectedMachine);

  useEffect(() => {
    if (!useMachineStore.getState().selectedMachineId) {
      setSelectedId("M-01");
    }
  }, [setSelectedId]);

  return (
    // Dua kolom utama: machine list + main content
    <div className="flex h-screen overflow-hidden">
      {/* KOLOM KIRI — Machine List Panel */}
      <MachineListSidebar />

      {/* KOLOM KANAN — Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Anomaly Timeline */}
        <AnomalyTimeline />

        {/* Main content area */}
        <div className="p-4 space-y-4">
          {/* RUL Banner */}
          <div className="bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border-b-2 border-b-[#1E3D40] shadow-lg p-3 flex items-center justify-between">
            {/* Kiri: Header + Inner Content */}
            <div className="flex-1 mr-4">
              {/* Header */}
              <div className="w-full flex items-center gap-2 mb-3 px-1">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-b from-lapis-neon to-[#3A8A06]">
                  <AlignJustify size={14} className="text-[#081819]" strokeWidth={3} />
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {selectedId} VITAL SIGNS
                </span>
              </div>

              {/* Inner Content */}
              <div className="bg-lapis-dark-gray rounded-lg p-4 border border-lapis-border/30">
                <p className="text-[22px] lg:text-[26px] font-bold text-white tracking-wide">
                  ESTIMATED RUL :
                  <span className="text-lapis-neon ml-2">362 DAYS</span>
                </p>
              </div>
            </div>

            {/* Kanan: Circular Gauge */}
            <div className="pr-2">
              <RULCircularGauge percentage={80} status="HEALTHY" size={80} />
            </div>
          </div>

          {/* 8 Sensor Gauge Grid */}
          <div className="grid grid-cols-4 gap-3">
            {SENSOR_CONFIG.map((config) => (
              <SensorCard
                key={config.key}
                machineId={selectedId}
                sensorConfig={config}
              />
            ))}
          </div>

          {/* Maintenance KPIs */}
          <MaintenanceKPIBar />
        </div>
      </div>
    </div>
  );
}
