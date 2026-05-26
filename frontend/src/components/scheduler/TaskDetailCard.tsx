"use client";

import { useState } from "react";
import { MaintenanceSchedule } from "@/types";
import { Wrench, CheckCircle, Calendar, Bot, Cpu, BarChart2, Zap, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import CompletionModal from "./SchedulerModals";
import { useToastStore } from "@/stores";

interface TaskDetailCardProps {
  task: MaintenanceSchedule;
}

const getCardColorTheme = (type: string) => {
  switch (type) {
    case "EMERGENCY":
      return {
        wrapper: "border-red-500/20 bg-red-500/[0.02]",
        badge: "bg-red-500/10 text-red-500 border border-red-500/20",
        metric: "text-red-500",
        // CTA Baru: Tinted Red (Sangat Sopan, Tidak Merah Terang)
        ctaButton: "bg-red-950/40 border border-red-500/50 text-red-100 hover:bg-red-900/60 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.05)]",
      };
    case "CORRECTIVE":
      return {
        wrapper: "border-yellow-500/20 bg-yellow-500/[0.02]",
        badge: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
        metric: "text-yellow-500",
        // CTA Baru: Tinted Yellow (Kalem)
        ctaButton: "bg-yellow-950/50 border border-yellow-500/50 text-yellow-100 hover:bg-yellow-900/60 transition-colors shadow-[0_0_20px_rgba(245,166,35,0.05)]",
      };
    case "PREVENTIVE":
    default:
      return {
        wrapper: "border-[#5FDA0A]/20 bg-[#5FDA0A]/[0.02]",
        badge: "bg-[#5FDA0A]/10 text-[#5FDA0A] border border-[#5FDA0A]/20",
        metric: "text-[#5FDA0A]",
        // CTA Baru: Sticking to Green for Preventive cards, but Tinted style
        ctaButton: "bg-green-950/50 border border-green-500/50 text-green-100 hover:bg-green-900/60 transition-colors shadow-[0_0_20px_rgba(95,218,10,0.05)]",
      };
  }
};

export default function TaskDetailCard({ task }: TaskDetailCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const addAlert = useToastStore((state) => state.addAlert);

  const isPredictive = task.status === "PENDING_CONFIRMATION";
  const isScheduled = task.status === "SCHEDULED";
  const isCompleted = task.status === "COMPLETED";

  const formattedDate = format(new Date(task.scheduled_date), "dd MMMM yyyy, HH:mm", {
    locale: idLocale,
  });

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleConfirmClick = () => setIsModalOpen(true);

  const handleModalSubmit = (completionData: {
    actual_date: string;
    actual_duration_hrs: number;
    part_replaced: string;
    cost_idr: number;
    completion_notes: string;
  }) => {
    console.log("Saving Maintenance Completion to database:", {
      id: task.id,
      machine_id: task.machine_id,
      status: "COMPLETED",
      ...completionData,
    });
    
    addAlert({
      machine_id: task.machine_id,
      severity: "INFO",
      title: "Penyelesaian Disimpan",
      message: `Penyelesaian perawatan untuk ${task.machine_id} berhasil dikonfirmasi. (Biaya: ${formatRupiah(completionData.cost_idr)})`,
      timestamp: new Date().toISOString()
    });
  };

  const theme = getCardColorTheme(task.type);

  // ─── Variant A: PREDICTIVE (PENDING_CONFIRMATION) ───
  if (isPredictive) {
    return (
      <>
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${theme.wrapper}`}>
          {/* Header: Machine ID + Source Badge */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">Mesin</p>
              <p className={`font-heading text-2xl font-black ${theme.metric}`}>{task.machine_id}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 pt-0.5">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${theme.badge}`}>
                {task.type}
              </span>
              <span className="text-[10px] font-bold bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                <Bot size={9} /> PREDICTIVE
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={13} className="shrink-0" />
            <span>{formattedDate}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* ML Metrics Panel */}
          <div className="grid grid-cols-3 gap-2">
            {/* RUL */}
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <Cpu size={13} className="mx-auto text-gray-500 mb-1.5" />
              <p className={`font-heading text-base font-black leading-none ${theme.metric}`}>
                {task.rul_at_creation != null ? task.rul_at_creation : "—"}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 font-medium">Hari RUL</p>
            </div>
            {/* Confidence */}
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <BarChart2 size={13} className="mx-auto text-gray-500 mb-1.5" />
              <p className="font-heading text-base font-black leading-none text-white/90">
                {task.ml_confidence != null ? `${task.ml_confidence}` : "—"}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 font-medium">% Conf.</p>
            </div>
            {/* Urgency */}
            <div className="bg-white/[0.03] rounded-xl p-3 text-center border border-white/5">
              <Zap size={13} className="mx-auto text-gray-500 mb-1.5" />
              <p className={`font-heading text-[11px] font-black leading-tight ${theme.metric}`}>
                {task.urgency_level ?? "—"}
              </p>
              <p className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 font-medium">Urgency</p>
            </div>
          </div>

          {/* Notes */}
          {task.notes && (
            <p className="text-xs italic text-gray-500 bg-white/[0.03] border border-white/5 p-2.5 rounded-lg">
              &ldquo;{task.notes}&rdquo;
            </p>
          )}

          {/* BUTTONS */}
          <div className="mt-4 pt-2 relative z-10">
            <button
              onClick={handleConfirmClick}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-heading font-bold text-sm cursor-pointer ${theme.ctaButton}`}
            >
              <CheckCircle size={16} /> Konfirmasi
            </button>
          </div>
        </div>

        <CompletionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          machineId={task.machine_id}
        />
      </>
    );
  }

  // ─── Variant B: MANUAL (SCHEDULED) ───
  if (isScheduled) {
    return (
      <>
        <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${theme.wrapper}`}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-0.5">Mesin</p>
              <p className={`font-heading text-2xl font-black ${theme.metric}`}>{task.machine_id}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 pt-0.5">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${theme.badge}`}>
                {task.type}
              </span>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
                MANUAL
              </span>
            </div>
          </div>

          {/* Date & Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Calendar size={13} className="shrink-0" />
              <span>{formattedDate}</span>
            </div>
            {task.estimated_duration_hrs != null && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Wrench size={13} className="shrink-0" />
                <span>Est. Durasi: {task.estimated_duration_hrs} Jam</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {task.notes && (
            <>
              <div className="border-t border-white/5" />
              <p className="text-xs italic text-gray-500 bg-white/[0.03] border border-white/5 p-2.5 rounded-lg">
                &ldquo;{task.notes}&rdquo;
              </p>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button className="flex-1 py-2.5 font-heading text-sm font-medium text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={handleConfirmClick}
              className="flex-1 py-2.5 font-heading text-sm font-bold text-[#081819] bg-[#5FDA0A] hover:bg-[#5FDA0A]/90 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={15} /> Mark Selesai
            </button>
          </div>
        </div>

        <CompletionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleModalSubmit}
          machineId={task.machine_id}
        />
      </>
    );
  }

  // ─── Variant C: COMPLETED (History) ───
  if (isCompleted) {
    return (
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3 opacity-50 hover:opacity-90 transition-opacity">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-0.5">Mesin</p>
            <p className="font-heading text-2xl font-black text-gray-400">{task.machine_id}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20 px-2.5 py-1 rounded-full uppercase">
              {task.type}
            </span>
            <span className="text-[10px] font-bold bg-white/5 text-gray-500 border border-white/10 px-2.5 py-1 rounded-full uppercase">
              COMPLETED
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Completion Info */}
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar size={12} className="shrink-0 text-gray-600" />
            <span>
              Realisasi:{" "}
              <span className="text-gray-300">
                {task.actual_date
                  ? format(new Date(task.actual_date), "dd MMMM yyyy", { locale: idLocale })
                  : formattedDate}
              </span>
            </span>
          </div>
          {task.actual_duration_hrs != null && (
            <div className="flex justify-between">
              <span>Durasi Aktual</span>
              <span className="text-gray-300 font-medium">{task.actual_duration_hrs} Jam</span>
            </div>
          )}
          {task.part_replaced && (
            <div className="flex justify-between">
              <span>Komponen Diganti</span>
              <span className="text-gray-300 font-medium">{task.part_replaced}</span>
            </div>
          )}
          {task.cost_idr != null && (
            <div className="flex justify-between">
              <span>Biaya Aktual</span>
              <span className="text-yellow-500 font-heading font-bold">
                {formatRupiah(task.cost_idr)}
              </span>
            </div>
          )}
          {task.completion_notes && (
            <p className="italic text-gray-600 pt-1 border-t border-white/5">
              &ldquo;{task.completion_notes}&rdquo;
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
