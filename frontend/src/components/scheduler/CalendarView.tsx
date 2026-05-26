"use client";

import { useState, useEffect } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MaintenanceSchedule } from "@/types";
import CalendarDay from "./CalendarDay";
import TaskSlidePanel from "./TaskSlidePanel";
import { AddPreventiveModal } from "./SchedulerModals";
import { wsManager } from "@/lib/websocket/ws-manager";
import { WS_EVENTS } from "@/lib/websocket/ws-events";
import { useToastStore } from "@/stores";


interface CalendarViewProps {
    schedules?: MaintenanceSchedule[];
    onSchedulesChange?: (schedules: MaintenanceSchedule[]) => void;
}

export default function CalendarView({ schedules: propSchedules, onSchedulesChange }: CalendarViewProps = {}) {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const addAlert = useToastStore((state) => state.addAlert);

    // If parent passes controlled schedules, use those; otherwise own local state
    const [localSchedules, setLocalSchedules] = useState<MaintenanceSchedule[]>([]);
    const schedules = propSchedules ?? localSchedules;
    const setSchedules = onSchedulesChange ?? setLocalSchedules;

    // Listen to simulator time and auto-snap calendar month
    useEffect(() => {
        function handleSimulatorTick(data: any) {
            if (data && data.current_timestamp) {
                const tickDate = new Date(data.current_timestamp);
                setCurrentDate((prev) => {
                    // Only update state if the month or year actually changed
                    if (!isSameMonth(prev, tickDate)) {
                        return startOfMonth(tickDate);
                    }
                    return prev;
                });
            }
        }

        wsManager.on(WS_EVENTS.SIMULATOR_TICK, handleSimulatorTick);
        return () => {
            wsManager.off(WS_EVENTS.SIMULATOR_TICK, handleSimulatorTick);
        };
    }, []);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const dateFormat = "MMMM yyyy";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

    // Filter schedules for the selected date to pass to the slide panel
    const selectedDateTasks = selectedDate
        ? schedules.filter((s) =>
            isSameDay(new Date(s.scheduled_date), selectedDate)
        )
        : [];

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setIsPanelOpen(true);
    };

    const handleSavePreventive = (data: {
        machine_id: string;
        type: "PREVENTIVE";
        scheduled_date: string;
        estimated_duration_hrs: number;
        notes: string;
    }) => {
        const newSchedule: MaintenanceSchedule = {
            id: `sched-manual-${Date.now()}`,
            machine_id: data.machine_id,
            type: data.type,
            source: "MANUAL",
            status: "SCHEDULED",
            scheduled_date: data.scheduled_date,
            estimated_duration_hrs: data.estimated_duration_hrs,
            notes: data.notes,
            created_at: new Date().toISOString(),
        };

        // Update state to trigger real-time re-render on the calendar
        setSchedules([...schedules, newSchedule]);

        addAlert({
            machine_id: newSchedule.machine_id,
            severity: "INFO",
            title: "Jadwal Disimpan",
            message: `Jadwal Preventive Baru untuk ${newSchedule.machine_id} pada ${format(new Date(newSchedule.scheduled_date), "dd MMM yyyy", { locale: idLocale })} berhasil ditambahkan.`,
            timestamp: new Date().toISOString()
        });
    };

    return (
        <div className="flex flex-col h-full bg-[#081819] text-white relative overflow-hidden">
            {/* Header & Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 border-b border-white/5 gap-4">

                {/* Month Navigation */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={24} className="text-[#C3CCD1]" />
                    </button>
                    <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-widest uppercase w-48 text-center">
                        {format(currentDate, dateFormat, { locale: idLocale })}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <ChevronRight size={24} className="text-[#C3CCD1]" />
                    </button>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <select className="bg-[#0F2A2C] border border-white/10 text-[#C3CCD1] text-xs md:text-sm rounded-lg px-3 py-2 md:px-4 md:py-2 outline-none focus:border-[#5FDA0A]/50 transition-colors cursor-pointer flex-1 md:flex-none">
                        <option>Semua Mesin</option>
                        <option>M-01</option>
                        <option>M-05</option>
                        <option>M-07</option>
                        <option>M-13</option>
                    </select>
                    <select className="bg-[#0F2A2C] border border-white/10 text-[#C3CCD1] text-xs md:text-sm rounded-lg px-3 py-2 md:px-4 md:py-2 outline-none focus:border-[#5FDA0A]/50 transition-colors cursor-pointer flex-1 md:flex-none">
                        <option>Semua Tipe</option>
                        <option>Preventive</option>
                        <option>Corrective</option>
                        <option>Emergency</option>
                    </select>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 md:gap-2 bg-[#5FDA0A]/10 text-[#5FDA0A] border border-[#5FDA0A]/50 hover:bg-[#5FDA0A]/20 px-3 py-2 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm transition-colors cursor-pointer w-full sm:w-auto"
                    >
                        <Plus size={16} /> Tambah Jadwal
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center font-heading text-xs font-bold text-gray-500 uppercase tracking-widest pb-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
                    {days.map((day: Date, idx: number) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const dayTasks = schedules.filter((s) =>
                            isSameDay(new Date(s.scheduled_date), day)
                        );

                        return (
                            <CalendarDay
                                key={day.toISOString() + idx}
                                date={day}
                                isCurrentMonth={isCurrentMonth}
                                tasks={dayTasks}
                                onClick={handleDayClick}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Side Slide Panel */}
            <TaskSlidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                selectedDate={selectedDate}
                tasks={selectedDateTasks}
            />

            {/* Add Preventive Maintenance Modal */}
            <AddPreventiveModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleSavePreventive}
            />
        </div>
    );
}
