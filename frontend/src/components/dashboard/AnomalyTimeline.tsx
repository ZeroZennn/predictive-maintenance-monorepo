"use client";

import { useMemo, useEffect, useState } from "react";
import type { MachineStatus } from "@/types";
import { clsx } from "clsx";
import { fetchAnomalyTimeline, BackendAnomaly } from "@/lib/api/telemetry.api";
import { useMachineStore } from "@/stores";
import { wsManager } from "@/lib/websocket/ws-manager";

export interface AnomalyEvent {
  timestamp: string;
  status: MachineStatus;
  machineId: string;
  description?: string;
  sensor?: string;
}

interface AnomalyTimelineProps {
  events?: AnomalyEvent[];
  windowHours?: number; // default: 6
}

interface SensorUpdatePayload {
  machine_id: string;
  timestamp: string;
}

export default function AnomalyTimeline({
  events,
  windowHours = 6,
}: AnomalyTimelineProps) {
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const [fetchedEvents, setFetchedEvents] = useState<AnomalyEvent[]>([]);

  // ── Track simulator time from socket ────────────────────────────────────
  // Uses the timestamp field from sensor:update so the timeline follows
  // the simulator's dataset time (e.g. July 2025), not the real clock.
  const [simulatorTime, setSimulatorTime] = useState<number | null>(null);

  useEffect(() => {
    const handleSensorUpdate = (data: unknown) => {
      const payload = data as SensorUpdatePayload;
      if (!payload?.timestamp) return;
      const t = new Date(payload.timestamp).getTime();
      if (!isNaN(t)) {
        setSimulatorTime(t);
      }
    };

    wsManager.on("sensor:update", handleSensorUpdate);
    return () => {
      wsManager.off("sensor:update", handleSensorUpdate);
    };
  }, []);

  // ── Fetch anomaly events from API ────────────────────────────────────────
  useEffect(() => {
    if (events) return;

    let isMounted = true;
    const loadTimeline = async () => {
      try {
        const anomalies = await fetchAnomalyTimeline(selectedMachineId, 200);
        if (!isMounted) return;

        const mapped: AnomalyEvent[] = anomalies
          .map((a) => {
            let status: MachineStatus = "HEALTHY";
            if (a.anomaly_type === "state_transition") {
              status = a.predicted_label as MachineStatus;
            } else if (a.anomaly_type === "threshold_crossing") {
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
          .filter((a) => a.status !== "HEALTHY");

        setFetchedEvents(mapped);
      } catch (err) {
        console.error("Failed to fetch anomaly timeline", err);
      }
    };

    loadTimeline();
    // Re-fetch every minute to catch newly stored anomalies
    const interval = setInterval(loadTimeline, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedMachineId, events]);

  const data = events ?? fetchedEvents;

  // ── Time window anchored to simulator time ───────────────────────────────
  // Falls back to real clock if simulator hasn't sent data yet
  const windowMs = windowHours * 60 * 60 * 1000;
  const currentTime = simulatorTime ?? Date.now();
  const startTime = currentTime - windowMs;

  // ── Build hourly ticks ───────────────────────────────────────────────────
  // Each tick is a round hour within [startTime, currentTime]
  const timeTicks = useMemo(() => {
    const hourMs = 60 * 60 * 1000;
    const ticks: number[] = [];
    // Snap to the next whole hour after startTime
    let firstTick = Math.ceil(startTime / hourMs) * hourMs;
    for (let t = firstTick; t <= currentTime; t += hourMs) {
      ticks.push(t);
    }
    return ticks;
  }, [startTime, currentTime]);

  // Position in percent [0, 100] relative to the window
  const getEventPosition = (timestamp: string) => {
    const t = new Date(timestamp).getTime();
    return ((t - startTime) / windowMs) * 100;
  };

  // Only show events that fall inside the visible window (with a small buffer)
  const visibleEvents = useMemo(() => {
    return data.filter((e) => {
      const t = new Date(e.timestamp).getTime();
      return t >= startTime - 60_000 && t <= currentTime + 60_000;
    });
  }, [data, startTime, currentTime]);

  return (
    <div className="relative w-full pt-3 pb-0 px-4">
      <div className="bg-gradient-to-b from-[#2B3739] to-[#1C2626] border border-[#1E3D40] rounded-xl px-6 pt-3 pb-3 relative overflow-visible shadow-lg">
        {/* Green Active Window Box — centred in the timeline */}
        <div className="absolute top-0 bottom-0 left-[33%] w-[34%] bg-gradient-to-t from-[#5FDA0A]/30 to-transparent border-x border-x-[#5FDA0A] border-b border-b-[#5FDA0A] border-t-0 pointer-events-none z-10">
          {/* Floating Pill Label */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1A2224] text-white text-[12px] md:text-[14px] px-3 py-1.5 rounded-lg border border-[#D9D9D9]/40 shadow-lg font-normal tracking-wide pointer-events-auto whitespace-nowrap flex items-center gap-2">
            Timeline
            {simulatorTime && (
              <span className="text-[9px] text-lapis-neon font-mono mt-0.5 opacity-70">
                sim {new Date(simulatorTime).toLocaleString("id-ID", {
                  day: "2-digit", month: "2-digit", year: "2-digit",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
            {/* Needle */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-[1.5px] h-1.5 bg-gray-400" />
          </div>
        </div>

        <div className="relative w-full z-0">
          {/* Main Horizontal Orange Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#EF7513]" />

          {/* Hourly Ticks — slide as simulator time advances */}
          <div className="relative w-full h-10 mt-0">
            {timeTicks.map((tickTime) => {
              const leftPos = ((tickTime - startTime) / windowMs) * 100;
              // Fade labels near edges to avoid clipping
              const opacity = leftPos < 2 || leftPos > 98 ? 0 : 1;
              const label = new Date(tickTime).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={tickTime}
                  className="absolute flex flex-col items-center top-0 transition-all duration-700 ease-linear"
                  style={{ left: `${leftPos}%`, transform: "translateX(-50%)", opacity }}
                >
                  {/* Tick mark */}
                  <div className="w-[2px] h-3 bg-[#EF7513]" />
                  {/* Hour label */}
                  <span className="text-[13px] text-gray-300 font-mono mt-1 select-none whitespace-nowrap">
                    {label}
                  </span>
                </div>
              );
            })}

            {/* "Now" cursor — right edge marker */}
            <div
              className="absolute top-0 flex flex-col items-center"
              style={{ right: 0, transform: "translateX(50%)" }}
            >
              <div className="w-[2px] h-3 bg-lapis-neon" />
              <span className="text-[11px] text-lapis-neon font-mono mt-1 select-none">
                {new Date(currentTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Anomaly Dots */}
          {visibleEvents.map((e, idx) => {
            const leftPos = getEventPosition(e.timestamp);
            const dotOpacity = leftPos < 0.5 || leftPos > 99.5 ? 0 : 1;

            return (
              <div
                key={`${e.timestamp}-${idx}`}
                className="absolute top-0 -mt-[7px] group transition-all duration-700 ease-linear"
                style={{
                  left: `${leftPos}%`,
                  transform: "translateX(-50%)",
                  opacity: dotOpacity,
                }}
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
                    {new Date(e.timestamp).toLocaleString("id-ID", {
                      day: "2-digit", month: "2-digit",
                      hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })}
                  </span>
                  {e.sensor && (
                    <span className="text-gray-300">
                      Sensor: <span className="text-white uppercase font-mono">{e.sensor}</span>
                    </span>
                  )}
                  {e.description && (
                    <span className="text-gray-400 text-[10px] leading-tight">{e.description}</span>
                  )}
                  {!e.sensor && !e.description && (
                    <span className="text-gray-400">Status: {e.status}</span>
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
