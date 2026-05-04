export type MaintenanceType = "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface MaintenanceTask {
  id: string;
  machine_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduled_date: string;
  estimated_duration_hrs?: number;
  assigned_technician?: string;
  technician_notes?: string;
  part_replaced?: string;
  downtime_hrs?: number;
  cost_idr?: number;
}
