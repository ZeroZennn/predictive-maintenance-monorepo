"use client";

import { X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { MaintenanceSchedule } from "@/types";
import TaskDetailCard from "./TaskDetailCard";

interface TaskSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  tasks: MaintenanceSchedule[];
}

export default function TaskSlidePanel({ isOpen, onClose, selectedDate, tasks }: TaskSlidePanelProps) {
  const formattedDate = selectedDate
    ? format(selectedDate, "dd MMMM yyyy", { locale: idLocale })
    : "";

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      {/* Side Panel Container */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-[#081819] border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[#5FDA0A] font-bold">Jadwal Perawatan</span>
            <h3 className="font-heading text-lg font-extrabold text-white">
              {formattedDate}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 text-[#C3CCD1] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Body / Tasks List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskDetailCard key={task.id} task={task} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-sm text-[#C3CCD1]/50 border border-dashed border-white/5 rounded-2xl p-4">
              <Calendar className="w-8 h-8 text-gray-500 mb-2" />
              <span>Tidak ada jadwal perawatan di tanggal ini.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
