"use client";

import { clsx } from "clsx";
import { isToday, format } from "date-fns";
import { MaintenanceSchedule } from "@/types";

// Re-export for backwards compatibility with components that import CalendarTask
export type CalendarTask = MaintenanceSchedule;

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  tasks: CalendarTask[];
  onClick?: (date: Date) => void;
}

export default function CalendarDay({ date, isCurrentMonth, tasks, onClick }: CalendarDayProps) {
  const isCurrentDay = isToday(date);
  const dayNumber = format(date, "d");

  // Helper to determine dot color based on rules from brief (updated to new schema)
  const getDotColor = (task: CalendarTask) => {
    if (task.type === "EMERGENCY" || task.urgency_level === "IMMEDIATE") {
      return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] border border-red-300";
    }
    if (task.status === "PENDING_CONFIRMATION" || task.type === "CORRECTIVE") {
      return "bg-yellow-500";
    }
    return "bg-green-500"; // SCHEDULED / PREVENTIVE
  };

  const visibleTasks = tasks.slice(0, 3);
  const remainingCount = tasks.length - 3;

  return (
    <div
      onClick={() => onClick && onClick(date)}
      className={clsx(
        "min-h-[120px] p-2 border border-white/5 transition-colors cursor-pointer group flex flex-col",
        isCurrentMonth ? "bg-[#081819] hover:bg-[#0C2223]" : "bg-[#081819]/50",
        isCurrentDay && "ring-1 ring-[#5FDA0A] ring-inset"
      )}
    >
      <div className="flex justify-end mb-2">
        <span
          className={clsx(
            "font-heading text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
            isCurrentDay
              ? "bg-[#5FDA0A] text-[#081819]"
              : isCurrentMonth
              ? "text-[#C3CCD1] group-hover:text-white"
              : "text-gray-600"
          )}
        >
          {dayNumber}
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 justify-end pb-1">
        <div className="flex flex-wrap gap-1.5 px-1">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className={clsx("w-2.5 h-2.5 rounded-full", getDotColor(task))}
              title={`Task: ${task.machine_id} - ${task.status}`}
            />
          ))}
          {remainingCount > 0 && (
            <span className="text-[10px] text-gray-500 font-medium ml-1 flex items-center">
              +{remainingCount} lagi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
