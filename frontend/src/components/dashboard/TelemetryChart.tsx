"use client";

import { useState } from "react";
import { useMachineStore } from "@/stores";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { clsx } from "clsx";
import { Activity } from "lucide-react";

interface TelemetryChartProps {
  className?: string;
}

const metrics = [
  { key: "temperature", label: "Temperature", color: "#F59E0B" }, // Amber
  { key: "vibration", label: "Vibration", color: "#5FDA0A" }, // Lapis Neon
  { key: "pressure", label: "Pressure", color: "#3B82F6" }, // Blue
  { key: "rpm", label: "RPM", color: "#8B5CF6" }, // Purple
  { key: "power_consumption", label: "Power", color: "#EC4899" }, // Pink
  { key: "noise_level", label: "Noise", color: "#F43F5E" }, // Rose
  { key: "humidity", label: "Humidity", color: "#06B6D4" }, // Cyan
];

export default function TelemetryChart({ className }: TelemetryChartProps) {
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const machine = useMachineStore((state) =>
    state.machines[selectedMachineId]
  );

  const [selectedMetric, setSelectedMetric] = useState(metrics[0]);

  if (!machine || !machine.history || machine.history.length === 0) {
    return (
      <div
        className={clsx(
          "h-[300px] rounded-xl bg-[#2B3739] animate-pulse",
          className
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        "bg-gradient-to-b from-[#2B3739] to-[#1C2626] rounded-xl border border-[#1E3D40] p-4 flex flex-col gap-4",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-gradient-to-b from-lapis-neon to-[#3A8A06]">
            <Activity size={12} className="text-[#081819]" strokeWidth={3} />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            TELEMETRY HISTORY
          </span>
        </div>

        {/* Metric Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              onClick={() => setSelectedMetric(metric)}
              className={clsx(
                "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border",
                selectedMetric.key === metric.key
                  ? "bg-[#1E3D40] text-white border-[#5FDA0A]"
                  : "bg-[#121A1A] text-gray-400 border-[#1E3D40] hover:text-white"
              )}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={machine.history} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3D40" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#4B5563"
              fontSize={10}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              minTickGap={30}
              tickFormatter={(val) => {
                if (!val) return "";
                const date = new Date(val);
                if (!isNaN(date.getTime())) {
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = date.toLocaleString('default', { month: 'short' });
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  return `${day} ${month} ${hours}:${minutes}`;
                }
                return val;
              }}
            />
            <YAxis
              stroke="#4B5563"
              fontSize={10}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickCount={6}
              tickFormatter={(val) => {
                if (typeof val !== 'number') return val;
                if (selectedMetric.key === 'rpm') return val.toFixed(0);
                if (selectedMetric.key === 'vibration') return val.toFixed(3);
                return val.toFixed(1);
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#121A1A",
                borderColor: "#1E3D40",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fff",
              }}
              itemStyle={{ color: selectedMetric.color }}
              labelFormatter={(label) => {
                const date = new Date(label);
                if (!isNaN(date.getTime())) {
                  return date.toLocaleString('id-ID', { 
                    day: '2-digit', month: 'short', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit' 
                  });
                }
                return label;
              }}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric.key}
              stroke={selectedMetric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: selectedMetric.color, stroke: "#121A1A", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
