import { UrgencyLevel } from "./machine.types";

// Kolom Kanban berdasarkan rentang rul_days
export type KanbanColumnType = "URGENT" | "SOON" | "SCHEDULED";

// Badge type dari handover note
// (akan dikonfirmasi ke Reynaldi — sementara pakai ini)
export type MaintenanceType = "EMERGENCY" | "CORRECTIVE" | "PREVENTIVE";

// Status lama (dipertahankan untuk kompatibilitas API lama)
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

// Shape task yang datang dari WebSocket event: new_maintenance_task
export interface MaintenanceTask {
  // ─── Fields baru dari API Contract (ws-events) ───
  task_id: string;
  machine_id: string;
  created_at: string;           // ISO8601
  scheduled_date: string;       // ISO8601
  rul_days: number;             // Penentu kolom Kanban
  rul_hours: number;
  urgency_level: UrgencyLevel;  // Dari ML output
  maintenance_type: MaintenanceType;
  technician?: string | null;   // Opsional, bisa unassigned
  notes?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";

  // ─── Fields lama (dipertahankan untuk kompatibilitas) ───
  id?: string;
  type?: MaintenanceType;
  estimated_duration_hrs?: number;
  assigned_technician?: string;
  technician_notes?: string;
  part_replaced?: string;
  downtime_hrs?: number;
  cost_idr?: number;
}

// Helper: derive kolom Kanban dari rul_days
// Fungsi ini dipakai di maintenanceStore
export function getKanbanColumn(rul_days: number): KanbanColumnType {
  if (rul_days < 3) return "URGENT";
  if (rul_days <= 7) return "SOON";
  return "SCHEDULED";
}
