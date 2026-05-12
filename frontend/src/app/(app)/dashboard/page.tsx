"use client";

import { useState } from "react";
import { SensorCard, MachineCard, RULCircularGauge } from "@/components/dashboard";
import { SENSOR_CONFIG, MACHINE_IDS } from "@/config";
import { AlignJustify } from "lucide-react";

export default function DashboardPage() {
  const [selectedId, setSelectedId] = useState("M-01");

  return (
    // Dua kolom utama: machine list + main content
    <div className="flex h-screen overflow-hidden">
      {/* KOLOM KIRI — Machine List Panel */}
      <div
        className="w-52 shrink-0 
                      bg-transparent 
                      border-r border-lapis-border
                      flex flex-col
                      overflow-hidden
                      group relative"
      >
        {/* Tooltip hint scroll */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-lapis-surface/90 backdrop-blur text-lapis-text text-[10px] px-3 py-1.5 rounded-full border border-lapis-border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 whitespace-nowrap shadow-lg">
          ↓ Scroll untuk melihat mesin
        </div>
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
          {/* RUL Banner */}
          <div className="bg-gradient-to-b from-lapis-gray to-lapis-dark-gray rounded-xl border-b-2 border-b-[#1E3D40] shadow-lg p-3 flex items-center justify-between">
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
