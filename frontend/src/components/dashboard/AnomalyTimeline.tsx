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
    <div
      className="h-12 bg-lapis-surface border-b border-lapis-border
                 flex flex-col justify-between px-4 py-1.5 relative"
    >
      {/* Time labels row */}
      <div className="flex justify-between items-center w-full">
        {timeLabels.map((label, i) => (
          <span key={i} className="text-[9px] text-lapis-muted font-mono">
            {label}
          </span>
        ))}
      </div>

      {/* Timeline track */}
      <div className="relative w-full h-3 bg-lapis-card rounded-full overflow-visible">
        {/* Track line */}
        <div className="absolute inset-y-0 inset-x-0 flex items-center">
          <div className="w-full h-[2px] bg-lapis-border rounded-full" />
        </div>

        {/* Event dots */}
        {visibleEvents.map((event, i) => {
          const pos = getEventPosition(event.timestamp);
          const color =
            event.status === "CRITICAL"
              ? "bg-lapis-red shadow-glow-red"
              : event.status === "WARNING"
              ? "bg-lapis-amber shadow-glow-amber"
              : "bg-lapis-neon";

          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: pos + "%" }}
              title={`${event.machineId} - ${event.status} - ${new Date(
                event.timestamp
              ).toLocaleTimeString("id-ID")}`}
            >
              {/* Dot */}
              <div
                className={clsx(
                  "w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-150",
                  color,
                  event.status === "CRITICAL" && "animate-pulse-critical"
                )}
              />

              {/* Tooltip on hover */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover:flex items-center z-10">
                {/* Arrow pointing left */}
                <div className="absolute left-[-3px] w-2 h-2 bg-lapis-card border-b border-l border-lapis-border rotate-45" />
                {/* Tooltip box */}
                <div className="bg-lapis-card border border-lapis-border rounded px-2 py-1 whitespace-nowrap relative">
                  <p className="text-[9px] font-bold text-lapis-text">
                    {event.machineId}
                  </p>
                  <p
                    className={clsx(
                      "text-[9px]",
                      event.status === "CRITICAL"
                        ? "text-lapis-red"
                        : "text-lapis-amber"
                    )}
                  >
                    {event.status}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* "Now" indicator */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-4 bg-lapis-neon opacity-60 rounded-full" />
      </div>
    </div>
  );
}
