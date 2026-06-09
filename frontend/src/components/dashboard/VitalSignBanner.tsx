"use client";

import { AlignJustify } from "lucide-react";
import { useMachineStore } from "@/stores";
import CLFCircularGauge from "./CLFCircularGauge";

const statusConfig = {
  HEALTHY: { color: "text-[#5FDA0A]", stroke: "#5FDA0A", label: "Healthy" },
  WARNING: { color: "text-[#F59E0B]", stroke: "#F59E0B", label: "Warning" },
  CRITICAL: { color: "text-[#EF4444]", stroke: "#EF4444", label: "Critical" },
};

// [ALUR PRIME] FASE 4: Frontend Integration & Visualization (UI Rendering). Komponen ini mengambil hasil prediksi (seperti rul_days dan probabilitas Health Status) dari global store dan merendernya menjadi elemen UI/indikator visual di dashboard.
export default function VitalSignBanner() {
  const selectedId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const machine = useMachineStore((state) => state.machines[selectedId]);

  if (!machine) return null;

  const status = machine.status || "HEALTHY";
  const rul_days = machine?.rul_days || 0;
  const healthScore = machine?.health_score ?? 0;
  const probabilities = machine?.probabilities || { HEALTHY: 1, WARNING: 0, CRITICAL: 0 };
  const { HEALTHY, WARNING, CRITICAL } = probabilities;

  return (
    <div className="bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border-b-2 border-b-[#1E3D40] py-4 px-4 xl:py-6 xl:px-6 min-h-[120px] xl:min-h-[160px] flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
      {/* Kiri: Header + Inner Content */}
      <div className="flex-1 mr-0 md:mr-4 w-full">
        {/* Header */}
        <div className="w-full flex items-center gap-2 mb-3 px-1">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-b from-lapis-neon to-[#3A8A06]">
            <AlignJustify size={14} className="text-[#081819]" strokeWidth={3} />
          </div>
          <span className="text-lg font-bold text-white uppercase tracking-wider">
            {selectedId} VITAL SIGNS
          </span>
        </div>

        {/* Inner Content */}
        <div className="bg-lapis-dark-gray rounded-lg p-4 border border-lapis-border/30 font-heading">
          {machine?.sensors?.temperature === 0 ? (
            <span className="text-[#F59E0B] uppercase font-bold tracking-wide text-xl md:text-[20px] lg:text-[26px] 2xl:text-[26px]">
              ENGINE OFFLINE
            </span>
          ) : status === "HEALTHY" ? (
            <span className="text-[#5FDA0A] uppercase font-bold tracking-wide text-xl md:text-[20px] lg:text-[26px] 2xl:text-[36px]">
              Mesin dalam kondisi Prima
            </span>
          ) : (
            <div className="flex items-center gap-2 font-bold tracking-wide text-xl md:text-[20px] lg:text-[26px] 2xl:text-[26px] font-heading">
              <span className="text-white">ESTIMATED RUL :</span>
              <span className={statusConfig[status].color}>{Math.round(rul_days)} DAYS</span>
            </div>
          )}
        </div>
      </div>

      {/* Kanan: Circular Gauge & Probabilities */}
      <div className="flex items-center gap-6 xl:gap-10 pr-0 md:pr-4">
        <CLFCircularGauge percentage={healthScore} status={status} />

        {/* Probability Distribution */}
        <div className="flex flex-col justify-center gap-2 xl:gap-3 min-w-[130px] xl:min-w-[180px]">
          {/* Healthy */}
          <div>
            <div className="flex justify-between text-[10px] xl:text-[11px] text-gray-400 mb-1">
              <span className="font-medium">Healthy Prob</span>
              <span>{(HEALTHY * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="bg-[#5FDA0A] h-full" style={{ width: `${HEALTHY * 100}%` }} />
            </div>
          </div>

          {/* Warning */}
          <div>
            <div className="flex justify-between text-[10px] xl:text-[11px] text-gray-400 mb-1">
              <span className="font-medium">Warning Prob</span>
              <span>{(WARNING * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="bg-[#F59E0B] h-full" style={{ width: `${WARNING * 100}%` }} />
            </div>
          </div>

          {/* Critical */}
          <div>
            <div className="flex justify-between text-[10px] xl:text-[11px] text-gray-400 mb-1">
              <span className="font-medium">Critical Prob</span>
              <span>{(CRITICAL * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
              <div className="bg-[#EF4444] h-full" style={{ width: `${CRITICAL * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
