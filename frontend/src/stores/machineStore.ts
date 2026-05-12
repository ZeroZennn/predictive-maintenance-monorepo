import { create } from "zustand";
import type { Machine, MachineReading, MachineStatus } from "@/types";
import { MACHINE_IDS } from "@/config";

interface MachineStore {
  // State
  machines: Record<string, Machine>;
  selectedMachineId: string | null;
  statusFilter: "ALL" | MachineStatus;
  lastUpdated: string | null;

  // Actions
  updateMachineReading: (reading: MachineReading) => void;
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
  updateMachineReading: (reading: MachineReading) =>
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
        },
      },
      lastUpdated: reading.timestamp,
    })),

  setSelectedMachine: (id: string | null) => set({ selectedMachineId: id }),

  setStatusFilter: (filter: "ALL" | MachineStatus) =>
    set({ statusFilter: filter }),

  // Selector — reads live state via get()
  getMachineById: (id: string) => get().machines[id],
}));
