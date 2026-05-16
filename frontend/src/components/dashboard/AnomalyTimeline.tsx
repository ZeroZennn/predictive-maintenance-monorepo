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
        <div className="absolute top-0 bottom-0 left-[33%] w-[34%] bg-gradient-to-t from-[#5FDA0A]/30 to-transparent border-x border-x-[#5FDA0A] border-b border-b-[#5FDA0A] border-t-0 pointer-events-none z-10">

          {/* Floating Pill Label inside Green Window */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1A2224] text-white text-[12px] md:text-[14px] lg:text-[14px] px-3 py-1.5 rounded-lg border-[0.5] border-[#D9D9D9]/70 shadow-lg font-normal tracking-wide animate-soft-zoom pointer-events-auto whitespace-nowrap flex flex-col items-center justify-center">
            Anomaly Timeline

            {/* Small Needle / Pointer connecting pill to timeline */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[1.5px] h-1.5 bg-gray-400" />
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
                <div className="w-[2.5px] h-3.5 bg-[#EF7513]" />
                {/* Label */}
                <span className="text-[16px] text-gray-300 font-mono mt-1.5">
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
