"use client";

import { useEffect } from "react";
import { SensorCard, AnomalyTimeline, MaintenanceKPIBar, MachineListSidebar, VitalSignBanner } from "@/components/dashboard";
import { SENSOR_CONFIG } from "@/config";
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
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
      {/* KOLOM KIRI — Machine List Panel */}
      <MachineListSidebar />

      {/* KOLOM KANAN — Main Content */}
      <div className="flex-1 w-full md:w-auto flex-grow overflow-y-auto">
        <div className="w-full pb-20 md:pb-0">
          {/* Anomaly Timeline */}
          <AnomalyTimeline />

          {/* Main content area */}
          <div className="p-4 space-y-4">
            {/* RUL Banner */}
            <VitalSignBanner />

            {/* 8 Sensor Gauge Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </div>
  );
}
