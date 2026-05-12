export type MachineStatus = "HEALTHY" | "WARNING" | "CRITICAL";

export interface SensorData {
  temperature: number;
  vibration: number;
  pressure: number;
  rpm: number;
  power_consumption: number;
  noise_level: number;
  humidity: number;
  operating_hours: number;
}

export interface MachinePrediction {
  status: MachineStatus;
  rul_days: number;
  confidence: number;
}

export interface MachineReading {
  machine_id: string;
  timestamp: string;
  sensors: SensorData;
  prediction: MachinePrediction;
}

export interface Machine {
  id: string;
  name: string;
  status: MachineStatus;
  rul_days: number;
  last_updated: string;
  sensors: SensorData;
  confidence: number;
}
