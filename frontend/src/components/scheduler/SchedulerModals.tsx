"use client";

import { useState } from "react";
import { X, Calendar, Clock, Settings, DollarSign, FileText, PlusCircle } from "lucide-react";

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    actual_date: string;
    actual_duration_hrs: number;
    part_replaced: string;
    cost_idr: number;
    completion_notes: string;
  }) => void;
  machineId: string;
}

export default function CompletionModal({
  isOpen,
  onClose,
  onSubmit,
  machineId,
}: CompletionModalProps) {
  const [actualDate, setActualDate] = useState(new Date().toISOString().substring(0, 16));
  const [actualDuration, setActualDuration] = useState<number>(0);
  const [partReplaced, setPartReplaced] = useState("");
  const [costIdr, setCostIdr] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      actual_date: new Date(actualDate).toISOString(),
      actual_duration_hrs: Number(actualDuration),
      part_replaced: partReplaced,
      cost_idr: Number(costIdr),
      completion_notes: completionNotes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#081819] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#5FDA0A] font-bold">Penyelesaian Perawatan</span>
            <h3 className="font-heading text-lg font-extrabold text-white">
              Form Konfirmasi Mesin {machineId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-[#C3CCD1] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Tanggal Realisasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-500" />
              Tanggal Realisasi (actual_date)
            </label>
            <input
              type="datetime-local"
              required
              value={actualDate}
              onChange={(e) => setActualDate(e.target.value)}
              className="w-full bg-[#0C2223] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
          </div>

          {/* Durasi Aktual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase flex items-center gap-1.5">
              <Clock size={12} className="text-gray-500" />
              Durasi Aktual (actual_duration_hrs) - Jam
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              placeholder="Contoh: 3.5"
              value={actualDuration || ""}
              onChange={(e) => setActualDuration(Number(e.target.value))}
              className="w-full bg-[#0C2223] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
          </div>

          {/* Komponen Diganti */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase flex items-center gap-1.5">
              <Settings size={12} className="text-gray-500" />
              Komponen Diganti (part_replaced)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Belt & Pulley"
              value={partReplaced}
              onChange={(e) => setPartReplaced(e.target.value)}
              className="w-full bg-[#0C2223] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
          </div>

          {/* Biaya Perbaikan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase flex items-center gap-1.5">
              <DollarSign size={12} className="text-gray-500" />
              Biaya Perbaikan (cost_idr)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500 font-bold">Rp</span>
              <input
                type="number"
                min="0"
                required
                placeholder="Contoh: 1500000"
                value={costIdr || ""}
                onChange={(e) => setCostIdr(Number(e.target.value))}
                className="w-full bg-[#0C2223] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>

          {/* Catatan Teknisi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase flex items-center gap-1.5">
              <FileText size={12} className="text-gray-500" />
              Catatan Teknisi (completion_notes)
            </label>
            <textarea
              placeholder="Berikan detail tindakan perbaikan..."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#0C2223] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#5FDA0A] hover:bg-[#4eb308] text-[#081819] font-bold py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              Simpan & Selesaikan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AddPreventiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    machine_id: string;
    type: "PREVENTIVE";
    scheduled_date: string;
    estimated_duration_hrs: number;
    notes: string;
  }) => void;
}

export function AddPreventiveModal({
  isOpen,
  onClose,
  onSave,
}: AddPreventiveModalProps) {
  const [machineId, setMachineId] = useState("M-01");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      machine_id: machineId,
      type: "PREVENTIVE" as const,
      scheduled_date: new Date(scheduledDate).toISOString(),
      estimated_duration_hrs: Number(estimatedDuration),
      notes,
    };
    console.log("Saving new preventive maintenance schedule:", data);
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#081819] border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-2">
            <PlusCircle size={20} className="text-[#5FDA0A]" />
            <h3 className="font-heading text-lg font-extrabold text-white">
              Tambah Jadwal Preventive
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-[#C3CCD1] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mesin */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase">
              Mesin
            </label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              className="w-full bg-[#040D0E] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer"
            >
              {Array.from({ length: 20 }, (_, i) => {
                const id = `M-${String(i + 1).padStart(2, "0")}`;
                return (
                  <option key={id} value={id}>
                    {id}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tipe */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/40 uppercase">
              Tipe
            </label>
            <input
              type="text"
              disabled
              value="PREVENTIVE"
              className="w-full bg-[#040D0E]/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white/40 outline-none select-none"
            />
          </div>

          {/* Tanggal Jadwal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase">
              Tanggal Jadwal
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-[#040D0E] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors cursor-pointer"
            />
          </div>

          {/* Estimasi Durasi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase">
              Estimasi Durasi (Jam)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              placeholder="Contoh: 2"
              value={estimatedDuration || ""}
              onChange={(e) => setEstimatedDuration(Number(e.target.value))}
              className="w-full bg-[#040D0E] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors"
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#C3CCD1] uppercase">
              Catatan
            </label>
            <textarea
              placeholder="Masukkan catatan/instruksi perawatan..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-[#040D0E] border border-white/10 focus:border-[#5FDA0A]/50 rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="text-white/60 hover:text-white transition-all font-medium py-2 text-sm cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-[#5FDA0A]/10 text-[#5FDA0A] border border-[#5FDA0A]/20 hover:bg-[#5FDA0A]/20 transition-all font-bold font-heading px-6 py-2.5 rounded-lg text-sm cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
