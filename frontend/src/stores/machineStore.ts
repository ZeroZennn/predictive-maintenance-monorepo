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

const defaultMachines: Record<string, Machine> = MACHINE_IDS.reduce<
  Record<string, Machine>
>((acc, machine_id) => {
  acc[machine_id] = {
    id: machine_id,
    name: `Machine ${machine_id}`,
    status: "HEALTHY",
    rul_days: 999,
    last_updated: new Date().toISOString(),
  };
  return acc;
}, {});

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
          id: reading.machine_id,
          name:
            state.machines[reading.machine_id]?.name ??
            `Machine ${reading.machine_id}`,
          status: reading.prediction.status,
          rul_days: reading.prediction.rul_days,
          last_updated: reading.timestamp,
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
