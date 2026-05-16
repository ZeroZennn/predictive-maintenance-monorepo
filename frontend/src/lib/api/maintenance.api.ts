import apiClient from "./axios-instance";
import type { MaintenanceTask } from "@/types";

export async function fetchMaintenanceTasks(): Promise<MaintenanceTask[]> {
  const response = await apiClient.get<MaintenanceTask[]>(
    "/api/maintenance/tasks"
  );
  return response.data;
}

export async function updateTaskStatus(
  taskId: string,
  status: MaintenanceTask["status"]
): Promise<MaintenanceTask> {
  const response = await apiClient.patch<MaintenanceTask>(
    "/api/maintenance/tasks/" + taskId,
    { status }
  );
  return response.data;
}
