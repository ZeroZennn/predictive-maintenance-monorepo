"use client";

import { useState } from "react";
import { SensorCard, MachineCard, RULCircularGauge } from "@/components/dashboard";
import { SENSOR_CONFIG, MACHINE_IDS } from "@/config";

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState("M-01");

  return (
    // Dua kolom utama: machine list + main content
    <div className="flex h-screen overflow-hidden">
      {/* KOLOM KIRI — Machine List Panel */}
      <div
        className="w-52 shrink-0 
                      bg-lapis-surface 
                      border-r border-lapis-border
                      flex flex-col
                      overflow-hidden"
      >
        {/* Filter dropdown placeholder */}
        <div className="p-3 border-b border-lapis-border">
          <div
            className="bg-lapis-card rounded-lg px-3 py-2
                          text-lapis-muted text-xs
                          border border-lapis-border"
          >
            All Machine ▾
          </div>
        </div>

        {/* Machine cards list — scrollable */}
        <div
          className="flex-1 overflow-y-auto p-2 
                        space-y-2"
        >
          {MACHINE_IDS.map((id) => (
            <MachineCard
              key={id}
              machineId={id}
              isActive={selectedId === id}
              onClick={setSelectedId}
            />
          ))}
        </div>
      </div>

      {/* KOLOM KANAN — Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Anomaly Timeline placeholder */}
        <div
          className="h-12 bg-lapis-surface 
                        border-b border-lapis-border
                        flex items-center px-4
                        text-lapis-muted text-xs
                        tracking-widest uppercase"
        >
          Anomaly Timeline — coming soon
        </div>

        {/* Main content area */}
        <div className="p-4 space-y-4">
          {/* RUL Banner placeholder */}
          <div
            className="bg-lapis-card rounded-xl 
                          border border-lapis-border p-4
                          flex items-center 
                          justify-between"
          >
            <div>
              <p
                className="text-lapis-muted text-xs 
                            uppercase tracking-widest"
              >
                {selectedId} Vital Signs
              </p>
              <p
                className="text-3xl font-bold 
                            text-lapis-text mt-1"
              >
                ESTIMATED RUL :
                <span className="text-lapis-neon ml-2">999 DAYS</span>
              </p>
            </div>

            <RULCircularGauge percentage={80} status="HEALTHY" size={100} />
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

          {/* Maintenance KPIs placeholder */}
          <div
            className="bg-lapis-card rounded-xl 
                          border border-lapis-border 
                          p-4"
          >
            <p
              className="text-lapis-muted text-xs 
                          uppercase tracking-widest"
            >
              Maintenance KPIs — coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
