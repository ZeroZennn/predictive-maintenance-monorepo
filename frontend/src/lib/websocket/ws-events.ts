import type { MachineReading, MachineStatus, SensorData, MaintenanceTask } from "@/types";

// =============================================================================
// BAGIAN 1 — Event type constants
// =============================================================================

export const WS_EVENTS = {
  // Events dari Backend (harus match persis)
  SENSOR_UPDATE:        'sensor:update',
  ALERT_NEW:            'alert:new',
  MACHINE_STATUS_UPDATE:'machine:status_update',
  MAINTENANCE_NEW_SUGGESTION: 'maintenance:new_suggestion',
  MAINTENANCE_CONFIRMED: 'maintenance:confirmed',
  SIMULATOR_TICK:       'simulator:tick',

  // Events yang di-emit FE ke Backend (join rooms)
  JOIN_MACHINE:         'join:machine',
  JOIN_GLOBAL:          'join:global',
  JOIN_SIMULATOR:       'join:simulator',
} as const;

export type WsEventKey = keyof typeof WS_EVENTS;
export type WsEventValue = typeof WS_EVENTS[WsEventKey];

// Backward compatibility aliases
export const MACHINE_UPDATE    = WS_EVENTS.SENSOR_UPDATE;
export const CRITICAL_ALERT    = WS_EVENTS.ALERT_NEW;
export const WARNING_ALERT     = WS_EVENTS.ALERT_NEW;
export const STATUS_RESOLVED   = WS_EVENTS.MACHINE_STATUS_UPDATE;
export const CONNECTION_ACK    = 'CONNECTION_ACK';
export const PING              = 'PING';
export const PONG              = 'PONG';


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
  return msg.event_type === MACHINE_UPDATE;
}

export function isCriticalAlert(
  msg: WsIncomingMessage
): msg is WsCriticalAlertMessage {
  return msg.event_type === CRITICAL_ALERT;
}

export function isWarningAlert(
  msg: WsIncomingMessage
): msg is WsWarningAlertMessage {
  return msg.event_type === WARNING_ALERT;
}

export function isStatusResolved(
  msg: WsIncomingMessage
): msg is WsStatusResolvedMessage {
  return msg.event_type === STATUS_RESOLVED;
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
