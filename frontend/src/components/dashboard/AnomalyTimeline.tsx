"use client";

import { useMemo, useEffect, useState } from "react";
import type { MachineStatus } from "@/types";
import { clsx } from "clsx";
import { fetchAnomalyTimeline, BackendAnomaly } from "@/lib/api/telemetry.api";
import { useMachineStore } from "@/stores";

export interface AnomalyEvent {
  timestamp: string;
  status: MachineStatus;
  machineId: string;
  description?: string;
  sensor?: string;
}

interface AnomalyTimelineProps {
  events?: AnomalyEvent[];
  windowMinutes?: number; // default: 60
}

export default function AnomalyTimeline({
  events,
  windowMinutes = 60,
}: AnomalyTimelineProps) {
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const machine = useMachineStore((state) => state.machines[selectedMachineId]);
  const [fetchedEvents, setFetchedEvents] = useState<AnomalyEvent[]>([]);

  useEffect(() => {
    // If events are passed explicitly as props, we don't fetch
    if (events) return;

    let isMounted = true;
    const loadTimeline = async () => {
      try {
        const anomalies = await fetchAnomalyTimeline(selectedMachineId, 50);
        if (!isMounted) return;

        // Map BackendAnomaly to AnomalyEvent
        const mapped: AnomalyEvent[] = anomalies
          .map((a) => {
            let status: MachineStatus = "HEALTHY";
            if (a.anomaly_type === "state_transition") {
              status = a.predicted_label as MachineStatus;
            } else if (a.anomaly_type === "threshold_crossing") {
              // We treat threshold crossings as WARNINGs visually in the timeline
              status = "WARNING";
            }

            return {
              timestamp: a.timestamp,
              status,
              machineId: a.machine_id,
              description: a.description,
              sensor: a.sensor_triggered,
            };
          })
          // Filter out HEALTHY transitions because timeline only shows anomalies
          .filter((a) => a.status !== "HEALTHY");

        setFetchedEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch anomaly timeline", err);
      }
    };

    loadTimeline();

    // Optionally set up a polling interval if you want the timeline to refresh
    // Since WebSocket already gives us realtime, we might just rely on that
    // or re-fetch every minute. For now, fetch on mount/machine change.
    const interval = setInterval(loadTimeline, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedMachineId, events]);

  const data = events ?? fetchedEvents;
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

          {/* Anomaly Dots */}
          {visibleEvents.map((e, idx) => {
            const leftPos = getEventPosition(e.timestamp);
            return (
              <div
                key={`${e.timestamp}-${idx}`}
                className="absolute top-0 -mt-[7px] group"
                style={{ left: `${leftPos}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className={clsx(
                    "w-4 h-4 rounded-full border-2 border-[#121A1A] shadow-glow-sm relative z-20 transition-transform hover:scale-125 cursor-pointer",
                    e.status === "CRITICAL"
                      ? "bg-[#F43F5E] shadow-glow-red"
                      : "bg-[#F59E0B] shadow-glow-amber"
                  )}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[#121A1A] border border-[#1E3D40] text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl flex flex-col gap-1">
                  <span className="font-bold text-[#5FDA0A]">
                    {new Date(e.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {e.sensor && (
                    <span className="text-gray-300">
                      Sensor Spike: <span className="text-white uppercase font-mono">{e.sensor}</span>
                    </span>
                  )}
                  {e.description && (
                    <span className="text-gray-400 text-[10px] leading-tight">
                      {e.description}
                    </span>
                  )}
                  {!e.sensor && !e.description && (
                    <span className="text-gray-400">
                      Status: {e.status}
                    </span>
                  )}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#121A1A] border-b border-r border-[#1E3D40] rotate-45" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
