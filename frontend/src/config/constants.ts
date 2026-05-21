import type { SensorData, MachineStatus } from "@/types";

export const API_BASE_URL = "http://localhost:8000";
export const WS_URL = "ws://localhost:8000/ws/telemetry";

export const MACHINE_IDS: string[] = Array.from(
  { length: 20 },
  (_, i) => `M-${String(i + 1).padStart(2, "0")}`
);
// Hasil: ["M-01", "M-02", ..., "M-20"]

export interface SensorConfig {
  key: keyof SensorData;
  label: string;
  unit: string;
  min: number;
  max: number;
  warningThreshold: number;
  criticalThreshold: number;
}

export const SENSOR_CONFIG: SensorConfig[] = [
  { key: "temperature",       label: "Suhu Operasional",    unit: "°C",   min: 50,   max: 100,  warningThreshold: 80,   criticalThreshold: 90   },
  { key: "vibration",         label: "Tingkat Getaran",     unit: "mm/s", min: 0,    max: 10,   warningThreshold: 6,    criticalThreshold: 8    },
  { key: "pressure",          label: "Tekanan Operasional", unit: "bar",  min: 80,   max: 130,  warningThreshold: 115,  criticalThreshold: 125  },
  { key: "rpm",               label: "Rotasi Per Menit",    unit: "rpm",  min: 1500, max: 3500, warningThreshold: 2800, criticalThreshold: 3200 },
  { key: "power_consumption", label: "Konsumsi Daya",       unit: "kW",   min: 100,  max: 250,  warningThreshold: 200,  criticalThreshold: 230  },
  { key: "noise_level",       label: "Tingkat Kebisingan",  unit: "dB",   min: 30,   max: 100,  warningThreshold: 75,   criticalThreshold: 88   },
  { key: "humidity",          label: "Kelembaban Udara",    unit: "%",    min: 30,   max: 80,   warningThreshold: 65,   criticalThreshold: 75   },
  { key: "operating_hours",   label: "Jam Operasi",         unit: "hrs",  min: 0,    max: 5000, warningThreshold: 3500, criticalThreshold: 4500 }
];

export interface StatusConfig {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
  animationClass: string;
}

export const STATUS_CONFIG: Record<MachineStatus, StatusConfig> = {
  HEALTHY: {
    label: "Healthy",
    colorClass: "text-lapis-neon",
    bgClass: "bg-lapis-neon-dim",
    borderClass: "border-lapis-neon",
    glowClass: "shadow-glow-neon",
    animationClass: "",
  },
  WARNING: {
    label: "Warning",
    colorClass: "text-lapis-amber",
    bgClass: "bg-lapis-amber-dim",
    borderClass: "border-lapis-amber",
    glowClass: "shadow-glow-amber",
    animationClass: "",
  },
  CRITICAL: {
    label: "Critical",
    colorClass: "text-lapis-red",
    bgClass: "bg-lapis-red-dim",
    borderClass: "border-lapis-red",
    glowClass: "shadow-glow-red",
    animationClass: "animate-pulse-critical",
  },
};
