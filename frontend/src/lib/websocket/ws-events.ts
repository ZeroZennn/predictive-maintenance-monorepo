import type { MachineReading, MachineStatus, SensorData, MaintenanceTask } from "@/types";

// =============================================================================
// BAGIAN 1 — Event type constants
// =============================================================================

export const WS_EVENTS = {
  /** Dikirim backend setiap ada data sensor baru */
  MACHINE_UPDATE: "MACHINE_UPDATE",
  /** Dikirim backend ketika mesin masuk status CRITICAL */
  CRITICAL_ALERT: "CRITICAL_ALERT",
  /** Dikirim backend ketika mesin masuk status WARNING */
  WARNING_ALERT: "WARNING_ALERT",
  /** Dikirim backend ketika mesin kembali ke HEALTHY */
  STATUS_RESOLVED: "STATUS_RESOLVED",
  /** Konfirmasi koneksi berhasil dari backend */
  CONNECTION_ACK: "CONNECTION_ACK",
  PING: "PING",
  PONG: "PONG",
  /** Dikirim backend saat ML mendeteksi mesin butuh maintenance (is_active=true) */
  NEW_MAINTENANCE_TASK: "new_maintenance_task",
} as const;

// =============================================================================
// BAGIAN 2 — WebSocket connection state type
// =============================================================================

export type WsConnectionState =
  | "CONNECTING"
  | "CONNECTED"
  | "DISCONNECTED"
  | "RECONNECTING";

// =============================================================================
// BAGIAN 3 — Incoming message interfaces
// =============================================================================

export interface WsBaseMessage {
  event_type: string;
  timestamp: string;
}

export interface WsMachineUpdateMessage extends WsBaseMessage {
  event_type: "MACHINE_UPDATE";
  data: MachineReading;
}

export interface WsCriticalAlertMessage extends WsBaseMessage {
  event_type: "CRITICAL_ALERT";
  data: {
    machine_id: string;
    status: MachineStatus;
    message: string;
    sensors: SensorData;
  };
}

export interface WsWarningAlertMessage extends WsBaseMessage {
  event_type: "WARNING_ALERT";
  data: {
    machine_id: string;
    status: MachineStatus;
    message: string;
  };
}

export interface WsStatusResolvedMessage extends WsBaseMessage {
  event_type: "STATUS_RESOLVED";
  data: {
    machine_id: string;
    previous_status: MachineStatus;
  };
}

// =============================================================================
// BAGIAN 4 — Union type untuk semua incoming messages
// =============================================================================

export type WsIncomingMessage =
  | WsMachineUpdateMessage
  | WsCriticalAlertMessage
  | WsWarningAlertMessage
  | WsStatusResolvedMessage
  | WsBaseMessage;

// =============================================================================
// BAGIAN 5 — Type guard functions
// =============================================================================

export function isMachineUpdate(
  msg: WsIncomingMessage
): msg is WsMachineUpdateMessage {
  return msg.event_type === WS_EVENTS.MACHINE_UPDATE;
}

export function isCriticalAlert(
  msg: WsIncomingMessage
): msg is WsCriticalAlertMessage {
  return msg.event_type === WS_EVENTS.CRITICAL_ALERT;
}

export function isWarningAlert(
  msg: WsIncomingMessage
): msg is WsWarningAlertMessage {
  return msg.event_type === WS_EVENTS.WARNING_ALERT;
}

export function isStatusResolved(
  msg: WsIncomingMessage
): msg is WsStatusResolvedMessage {
  return msg.event_type === WS_EVENTS.STATUS_RESOLVED;
}

// =============================================================================
// BAGIAN 6 — EVENT: new_maintenance_task
// Dikirim Backend saat ML mendeteksi mesin butuh maintenance (is_active=true)
// =============================================================================

/** Payload WebSocket untuk event new_maintenance_task */
export interface WsMaintenanceTaskPayload {
  event: "new_maintenance_task";
  data: MaintenanceTask;
}

/** Type guard — memvalidasi payload sebelum diproses di ws-manager */
export function isMaintenanceTask(
  msg: unknown
): msg is WsMaintenanceTaskPayload {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as Record<string, unknown>;

  return (
    m["event"] === "new_maintenance_task" &&
    typeof m["data"] === "object" &&
    m["data"] !== null &&
    typeof (m["data"] as Record<string, unknown>)["task_id"] === "string" &&
    typeof (m["data"] as Record<string, unknown>)["machine_id"] === "string" &&
    typeof (m["data"] as Record<string, unknown>)["rul_days"] === "number"
  );
}
