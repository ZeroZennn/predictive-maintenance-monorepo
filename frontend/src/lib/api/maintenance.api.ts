import apiClient from "./axios-instance";
import type { MaintenanceTask, MaintenanceLog } from "@/types";

export async function fetchMaintenanceTasks(): Promise<MaintenanceTask[]> {
  const response = await apiClient.get<MaintenanceTask[]>(
    "/api/maintenance/schedules"
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

// ── Scheduler Endpoints (baru) ──

export async function fetchSchedulesByMonth(
  month: string  // format: "2026-05"
): Promise<MaintenanceTask[]> {
  const { data } = await apiClient.get(
    `/api/maintenance/schedules?month=${month}`
  )
  return data
}

export async function fetchPendingSchedules(): 
  Promise<MaintenanceTask[]> {
  const { data } = await apiClient.get(
    '/api/maintenance/schedules/pending'
  )
  return data
}

export async function createPreventiveSchedule(
  payload: {
    machine_id: string
    scheduled_date: string
    estimated_duration_hrs: number
  }
): Promise<MaintenanceTask> {
  const { data } = await apiClient.post(
    '/api/maintenance/schedules', payload
  )
  return data
}

export async function confirmSchedule(
  id: string
): Promise<MaintenanceTask> {
  const { data } = await apiClient.patch(
    `/api/maintenance/schedules/${id}/confirm`
  )
  return data
}

export async function completeSchedule(
  id: string,
  payload: {
    actual_duration_hrs: number
    part_replaced?: string
    cost_idr?: number
  }
): Promise<MaintenanceTask> {
  const { data } = await apiClient.patch(
    `/api/maintenance/schedules/${id}/complete`,
    payload
  )
  return data
}

export async function deleteSchedule(
  id: string
): Promise<void> {
  await apiClient.delete(`/api/maintenance/schedules/${id}`)
}
