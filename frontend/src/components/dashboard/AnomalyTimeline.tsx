"use client";

import { useMemo } from "react";
import type { MachineStatus } from "@/types";
import { clsx } from "clsx";

export interface AnomalyEvent {
  timestamp: string;
  status: MachineStatus;
  machineId: string;
}

interface AnomalyTimelineProps {
  events?: AnomalyEvent[];
  windowMinutes?: number; // default: 60
}

const MOCK_EVENTS: AnomalyEvent[] = [
  {
    timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
    status: "WARNING",
    machineId: "M-03",
  },
  {
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    status: "CRITICAL",
    machineId: "M-01",
  },
  {
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    status: "WARNING",
    machineId: "M-07",
  },
  {
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    status: "CRITICAL",
    machineId: "M-01",
  },
];

export default function AnomalyTimeline({
  events,
  windowMinutes = 60,
}: AnomalyTimelineProps) {
  const data = events ?? MOCK_EVENTS;
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();
  const startTime = now - windowMs;

  const timeLabels = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const t = new Date(startTime + (i / 6) * windowMs);
      return t.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    });
  }, [startTime, windowMs]);

  const getEventPosition = (timestamp: string) => {
    const t = new Date(timestamp).getTime();
    const ratio = (t - startTime) / windowMs;
    return Math.max(0, Math.min(100, ratio * 100));
  };

  const visibleEvents = useMemo(() => {
    return data.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= startTime && t <= now;
    });
  }, [data, startTime, now]);

  return (
    <div className="relative w-full pt-3 pb-0 px-4">
      <div className="bg-gradient-to-b from-[#2B3739] to-[#1C2626] border border-[#1E3D40] rounded-xl px-6 pt-3 pb-3 relative overflow-visible shadow-lg">
        {/* The Green Active Window Box */}
        {/* Nantinya dirender kondisional jika terdeteksi anomali */}
        <div className="absolute top-0 bottom-0 left-[33%] w-[34%] bg-[#5FDA0A]/10 border border-[#5FDA0A]/30 border-t-[#5FDA0A] border-t-2 pointer-events-none z-10">
          {/* Floating Pill Label inside Green Window */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2B3739] text-gray-200 text-[10px] px-4 py-1 rounded-lg border border-[#1E3D40] shadow-md font-medium tracking-wide animate-soft-zoom pointer-events-auto whitespace-nowrap">
            Anomaly Timeline
          </div>
        </div>

        <div className="relative w-full z-0">
          {/* Main Horizontal Orange Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#EF7513]" />

          {/* Time Ticks and Labels */}
          <div className="flex justify-between items-start w-full relative">
            {timeLabels.map((label, i) => (
              <div key={i} className="flex flex-col items-center relative">
                {/* Tick Mark */}
                <div className="w-[2px] h-2.5 bg-[#EF7513]" />
                {/* Label */}
                <span className="text-[10px] text-gray-300 font-mono mt-1.5">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
