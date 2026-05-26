import { create } from "zustand";
import type { Machine, MachineReading, MachineStatus, UrgencyLevel, SensorData } from "@/types";
import { MACHINE_IDS } from "@/config";

interface MachineStore {
  // State
  machines: Record<string, Machine>;
  selectedMachineId: string | null;
  machineFilter: string[];
  lastUpdated: string | null;

  // Actions
  updateMachineReading: (reading: MachineReading & {
    is_active?: boolean;
    rul_hours?: number | null;
    urgency_level?: UrgencyLevel | null;
    health_score?: number | null;
    confidence?: number | null;
    probabilities?: {
      HEALTHY: number;
      WARNING: number;
      CRITICAL: number;
    };
  }) => void;
  setSelectedMachine: (id: string | null) => void;
  setMachineFilter: (filter: string[]) => void;

  // Selector
  getMachineById: (id: string) => Machine | undefined;
}

const defaultMachines: Record<string, Machine> = MACHINE_IDS.reduce((acc, id) => {
  acc[id] = {
    id,
    name: "Machine " + id,
    status: "HEALTHY", // Base status
    rul_days: 0,
    last_updated: new Date().toISOString(),
    confidence: 0,
    probabilities: {
      HEALTHY: 1,
      WARNING: 0,
      CRITICAL: 0,
    },
    urgency_level: "MONITOR",
    issues_this_week: 0,
    days_since_last_maintenance: 0,
    total_downtime_hours: 0,
    mtbf_days: 0,
    health_score: 0,
    sensors: {
      temperature: 0,
      vibration: 0,
      pressure: 0,
      rpm: 0,
      power_consumption: 0,
      noise_level: 0,
      humidity: 0,
      operating_hours: 0,
    },
    history: [],
  };
  return acc;
}, {} as Record<string, Machine>);

export const useMachineStore = create<MachineStore>()((set, get) => ({
  // State
  machines: defaultMachines,
  selectedMachineId: null,
  machineFilter: [],
  lastUpdated: null,

  // Actions
  updateMachineReading: (reading) =>
    set((state) => ({
      machines: {
        ...state.machines,
        [reading.machine_id]: {
          ...state.machines[reading.machine_id],
          status: reading.prediction.status,
          rul_days: reading.prediction.rul_days,
          confidence: reading.prediction.confidence,
          last_updated: reading.timestamp,
          sensors: reading.sensors,  // ← update semua sensor sekaligus
          history: [
            ...(state.machines[reading.machine_id].history || []).slice(-23),
            {
              timestamp: reading.timestamp, // Raw timestamp for Tooltip and XAxis formatting
              time: new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              ...reading.sensors,
            }
          ],
          // ─── Field baru dari API Contract (backward-compatible) ───
          ...(reading.is_active !== undefined &&
            { is_active: reading.is_active }),
          ...(reading.rul_hours !== undefined &&
            { rul_hours: reading.rul_hours }),
          ...(reading.urgency_level !== undefined &&
            { urgency_level: reading.urgency_level }),
          ...(reading.health_score !== undefined &&
            { health_score: reading.health_score }),
          // confidence dari payload override confidence dari prediction
          ...(reading.confidence !== undefined && reading.confidence !== null &&
            { confidence: reading.confidence }),
          ...(reading.probabilities !== undefined &&
            { probabilities: reading.probabilities }),
        } as Machine,
      },
      lastUpdated: reading.timestamp,
    })),

  setSelectedMachine: (id: string | null) => set({ selectedMachineId: id }),

  setMachineFilter: (filter: string[]) =>
    set({ machineFilter: filter }),

  // Selector — reads live state via get()
  getMachineById: (id: string) => get().machines[id],
}));
