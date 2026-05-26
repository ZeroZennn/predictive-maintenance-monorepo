import apiClient from "./axios-instance";
import type { MaintenanceSchedule } from "@/types";

export interface GetSchedulesParams {
  month?: string;
  week?: string;
  machine_id?: string;
  source?: "MANUAL" | "PREDICTIVE";
  status?: string;
}

export async function fetchSchedules(
  params?: GetSchedulesParams
): Promise<MaintenanceSchedule[]> {
  const response = await apiClient.get("/api/maintenance/schedules", { params });
  return response.data.data.schedules || [];
}

export async function fetchPendingSchedules(): Promise<MaintenanceSchedule[]> {
  const response = await apiClient.get("/api/maintenance/schedules/pending");
  return response.data.data.schedules || [];
}

export async function createPreventiveSchedule(payload: {
  machine_id: string;
  scheduled_date: string;
  estimated_duration_hrs?: number;
  notes?: string;
}): Promise<MaintenanceSchedule> {
  const response = await apiClient.post("/api/maintenance/schedules", payload);
  return response.data.data;
}

export async function confirmSchedule(
  id: string,
  payload?: { scheduled_date?: string }
): Promise<MaintenanceSchedule> {
  const response = await apiClient.patch(
    `/api/maintenance/schedules/${id}/confirm`,
    payload || {}
  );
  return response.data.data;
}

export async function completeSchedule(
  id: string,
  payload: {
    actual_date: string;
    actual_duration_hrs?: number;
    part_replaced?: string;
    cost_idr?: number;
    completion_notes?: string;
  }
): Promise<MaintenanceSchedule> {
  const response = await apiClient.patch(
    `/api/maintenance/schedules/${id}/complete`,
    payload
  );
  return response.data.data;
}

export async function updateManualSchedule(
  id: string,
  payload: {
    scheduled_date?: string;
    estimated_duration_hrs?: number;
    notes?: string;
  }
): Promise<MaintenanceSchedule> {
  const response = await apiClient.patch(`/api/maintenance/schedules/${id}`, payload);
  return response.data.data;
}

export async function deleteSchedule(id: string): Promise<void> {
  await apiClient.delete(`/api/maintenance/schedules/${id}`);
}
