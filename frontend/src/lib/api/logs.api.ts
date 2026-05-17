import apiClient from "./axios-instance";
import type { MachineReading, MaintenanceTask } from "@/types";

export async function fetchSensorLogs(params: {
  machineId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: MachineReading[]; total: number }> {
  const response = await apiClient.get<{
    data: MachineReading[];
    total: number;
  }>("/api/logs/sensors", { params });
  return response.data;
}

export async function fetchMaintenanceLogs(params: {
  machineId?: string;
  page?: number;
  limit?: number;
}): Promise<{ data: MaintenanceTask[]; total: number }> {
  const response = await apiClient.get<{
    data: MaintenanceTask[];
    total: number;
  }>("/api/logs/maintenance", { params });
  return response.data;
}

export async function exportLogs(
  format: "pdf" | "xlsx",
  filters: Record<string, string>
): Promise<Blob> {
  const response = await apiClient.get<Blob>("/api/logs/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return response.data;
}
