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
    rul_days: 999,
    last_updated: new Date().toISOString(),
    confidence: 0,
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
