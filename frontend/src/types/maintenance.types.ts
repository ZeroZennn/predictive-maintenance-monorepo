import { UrgencyLevel } from "./machine.types";

// ─── Kanban Column Helper (dipertahankan untuk kompatibilitas WebSocket lama) ───
export type KanbanColumnType = "URGENT" | "SOON" | "SCHEDULED";

// Helper: derive kolom Kanban dari rul_days
export function getKanbanColumn(rul_days: number): KanbanColumnType {
  if (rul_days < 3) return "URGENT";
  if (rul_days <= 7) return "SOON";
  return "SCHEDULED";
}

// ─── Tipe-tipe Utama Maintenance Schedule (sesuai skema DB) ───

export type MaintenanceType = "PREVENTIVE" | "CORRECTIVE" | "EMERGENCY";
export type MaintenanceSource = "MANUAL" | "PREDICTIVE";
export type MaintenanceStatus =
  | "PENDING_CONFIRMATION"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Interface utama sesuai skema tabel `maintenance_schedules` di DB.
 * Menggantikan `CalendarTask` dan `MaintenanceTask` lama.
 */
export interface MaintenanceSchedule {
  id: string;                          // UUID
  machine_id: string;
  type: MaintenanceType;
  source: MaintenanceSource;
  status: MaintenanceStatus;
  scheduled_date: string;              // ISO8601

  // Optional base fields
  estimated_duration_hrs?: number;
  notes?: string;

  // Predictive-only Fields (saat source === 'PREDICTIVE')
  rul_at_creation?: number;
  urgency_level?: "IMMEDIATE" | "CRITICAL" | "WARNING" | "MONITOR";
  ml_confidence?: number;

  // Completion Fields (saat status === 'COMPLETED')
  actual_date?: string;
  actual_duration_hrs?: number;
  part_replaced?: string;
  cost_idr?: number;
  completion_notes?: string;

  // Audit
  created_at?: string;
  updated_at?: string;
}

// ─── Legacy: MaintenanceTask (dipertahankan agar WebSocket hook tidak crash) ───
// Ini memetakan event lama dari backend ke skema baru secara gradual.
export interface MaintenanceTask {
  task_id: string;
  machine_id: string;
  created_at: string;
  scheduled_date: string;
  rul_days: number;
  rul_hours: number;
  urgency_level: UrgencyLevel;
  maintenance_type: MaintenanceType;
  technician?: string | null;
  notes?: string | null;
  status: MaintenanceStatus | "PENDING" | "DONE";
  id?: string;
  type?: MaintenanceType;
  estimated_duration_hrs?: number;
  assigned_technician?: string;
  technician_notes?: string;
  part_replaced?: string;
  downtime_hrs?: number;
  cost_idr?: number;
}

export interface MaintenanceLog {
  log_id: string
  machine_id: string
  date: string
  maintenance_type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY'
  component_replaced?: string | null
  duration_hrs?: number | null
  cost_idr?: number | null
  technician_notes?: string | null
  created_at: string
  updated_at: string
}
