import apiClient from "./axios-instance";
import type { Machine, MachineReading } from "@/types";

export async function fetchAllMachines(): Promise<Machine[]> {
  const response = await apiClient.get<Machine[]>("/api/machines");
  return response.data;
}

export async function fetchMachineDetail(
  machineId: string
): Promise<Machine> {
  const response = await apiClient.get<Machine>(
    "/api/machines/" + machineId
  );
  return response.data;
}

export async function fetchMachineHistory(
  machineId: string,
  limit?: number
): Promise<MachineReading[]> {
  const response = await apiClient.get<MachineReading[]>(
    "/api/machines/" + machineId + "/history",
    { params: { limit: limit ?? 100 } }
  );
  return response.data;
}

export interface BackendAnomaly {
  timestamp: string;
  machine_id: string;
  anomaly_type: 'state_transition' | 'threshold_crossing';
  description: string;
  source: string;
  predicted_label?: string; // For state_transition
  sensor_triggered?: string; // For threshold_crossing
}

export async function fetchAnomalyTimeline(
  machineId: string,
  limit?: number
): Promise<BackendAnomaly[]> {
  const response = await apiClient.get<{ data: { anomalies: BackendAnomaly[] } }>(
    `/api/telemetry/anomaly/${machineId}`,
    { params: { limit: limit ?? 50 } }
  );
  return response.data.data.anomalies;
}
