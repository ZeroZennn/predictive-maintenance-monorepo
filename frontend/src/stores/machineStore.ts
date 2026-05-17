import { create } from "zustand";
import type { Machine, MachineReading, MachineStatus, UrgencyLevel, SensorData } from "@/types";
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

const generateMockHistory = (baseSensors: SensorData) => {
  const history = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // 1 hour intervals
    const noise = () => (Math.random() - 0.5) * 0.1; // +/- 5% noise
    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: Number((baseSensors.temperature * (1 + noise())).toFixed(1)),
      vibration: Number((baseSensors.vibration * (1 + noise())).toFixed(2)),
      pressure: Number((baseSensors.pressure * (1 + noise())).toFixed(1)),
      rpm: Math.round(baseSensors.rpm * (1 + noise())),
      power_consumption: Number((baseSensors.power_consumption * (1 + noise())).toFixed(1)),
      noise_level: Number((baseSensors.noise_level * (1 + noise())).toFixed(1)),
      humidity: Number((baseSensors.humidity * (1 + noise())).toFixed(1)),
      operating_hours: baseSensors.operating_hours,
    });
  }
  return history;
};

const defaultMachines: Record<string, Machine> = MACHINE_IDS.reduce((acc, id) => {
  acc[id] = {
    id,
    name: "Machine " + id,
    status: "HEALTHY",
    rul_days: 2,
    last_updated: new Date().toISOString(),
    confidence: 0.9,
    probabilities: {
      HEALTHY: 0.92,
      WARNING: 0.05,
      CRITICAL: 0.03,
    },
    // test healthy data
    urgency_level: "MONITOR",
    issues_this_week: 0,
    days_since_last_maintenance: 12,
    total_downtime_hours: 0,
    mtbf_days: 155,
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
    history: generateMockHistory({
      temperature: 72.1,
      vibration: 0.52,
      pressure: 104.2,
      rpm: 2401,
      power_consumption: 84.9,
      noise_level: 69.7,
      humidity: 50,
      operating_hours: 7.2,
    }),
    // test critical data
    // urgency_level: "CRITICAL",
    // issues_this_week: 8,
    // days_since_last_maintenance: 45,
    // total_downtime_hours: 12,
    // mtbf_days: 120,
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
