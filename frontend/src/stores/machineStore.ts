import { create } from "zustand";
import type { Machine, MachineReading, MachineStatus, UrgencyLevel } from "@/types";
import { MACHINE_IDS } from "@/config";

interface MachineStore {
  // State
  machines: Record<string, Machine>;
  selectedMachineId: string | null;
  statusFilter: "ALL" | MachineStatus;
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
  setStatusFilter: (filter: "ALL" | MachineStatus) => void;

  // Selector
  getMachineById: (id: string) => Machine | undefined;
}

const defaultMachines: Record<string, Machine> = MACHINE_IDS.reduce((acc, id) => {
  acc[id] = {
    id,
    name: "Machine " + id,
    status: "HEALTHY",
    rul_days: 2,
    last_updated: new Date().toISOString(),
    confidence: 0,
    probabilities: {
      HEALTHY: 0.92,
      WARNING: 0.05,
      CRITICAL: 0.03,
    },
    // test critical data
    // health_score: 65,
    // sensors: {
    //   temperature: 85.1,
    //   vibration: 1.53,
    //   pressure: 110.8,
    //   rpm: 2754,
    //   power_consumption: 88.3,
    //   noise_level: 81.2,
    //   humidity: 50.9,
    //   operating_hours: 1761.4,
    // },
    // test healthy data
    health_score: 92,
    sensors: {
      temperature: 72.1,
      vibration: 0.52,
      pressure: 104.2,
      rpm: 2401,
      power_consumption: 84.9,
      noise_level: 69.7,
      humidity: 50,
      operating_hours: 7.2,
    },
  };
  return acc;
}, {} as Record<string, Machine>);

export const useMachineStore = create<MachineStore>()((set, get) => ({
  // State
  machines: defaultMachines,
  selectedMachineId: null,
  statusFilter: "ALL",
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

  setStatusFilter: (filter: "ALL" | MachineStatus) =>
    set({ statusFilter: filter }),

  // Selector — reads live state via get()
  getMachineById: (id: string) => get().machines[id],
}));
