export type MachineStatus = "HEALTHY" | "WARNING" | "CRITICAL";

// Exported untuk dipakai di maintenanceStore dan komponen lain
export type UrgencyLevel = "IMMEDIATE" | "CRITICAL" | "WARNING" | "MONITOR";

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

  // ─── Fields dari model_2_rul API Contract ───
  // True hanya jika status WARNING atau CRITICAL.
  // False = HEALTHY — RULBanner tampilkan "Mesin dalam kondisi prima"
  is_active?: boolean;

  // rul_days * 24 (referensi untuk Scheduler)
  rul_hours?: number | null;

  // IMMEDIATE  = rul_days <= 1
  // CRITICAL   = rul_days <= 2
  // WARNING    = rul_days <= 7
  // MONITOR    = rul_days > 7 atau is_active = false
  urgency_level?: UrgencyLevel | null;

  // ─── Fields dari model_1_classifier API Contract ───
  // Math.round(probabilities.HEALTHY * 100) — Range: 0–100
  health_score?: number | null;

  probabilities?: {
    HEALTHY: number;
    WARNING: number;
    CRITICAL: number;
  };

  // Maintenance KPI Fields
  issues_this_week?: number;
  days_since_last_maintenance?: number;
  total_downtime_hours?: number;
  mtbf_days?: number;

  history?: Array<SensorData & { time: string }>;
}
