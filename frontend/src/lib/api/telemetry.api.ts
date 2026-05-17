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
