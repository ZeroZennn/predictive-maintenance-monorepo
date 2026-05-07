import { WS_URL } from "@/config";
import { useMachineStore, useToastStore } from "@/stores";
import {
  type WsConnectionState,
  type WsIncomingMessage,
  isMachineUpdate,
  isCriticalAlert,
  isWarningAlert,
  isStatusResolved,
} from "./ws-events";

// =============================================================================
// WebSocketManager — Pure TypeScript Singleton
// No React, no hooks, no components.
// Stores are accessed via .getState() (Zustand's vanilla API).
// =============================================================================

class WebSocketManager {
  private static instance: WebSocketManager | null = null;

  private socket: WebSocket | null = null;
  private connectionState: WsConnectionState = "DISCONNECTED";
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private readonly reconnectDelay: number = 3000; // ms
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** External listeners keyed by event type — for optional component subscriptions */
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  private constructor() {}

  // ---------------------------------------------------------------------------
  // Static: Singleton accessor
  // ---------------------------------------------------------------------------

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // ---------------------------------------------------------------------------
  // Public methods
  // ---------------------------------------------------------------------------

  /** Open a WebSocket connection. No-op if already OPEN. */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.connectionState = "CONNECTING";

    this.socket = new WebSocket(WS_URL);
    this.socket.onopen = () => this.handleOpen();
    this.socket.onmessage = (event: MessageEvent) =>
      this.handleMessage(event);
    this.socket.onclose = () => this.handleClose();
    this.socket.onerror = () => this.handleError();
  }

  /** Close the connection and cancel any pending reconnect. */
  disconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.reconnectAttempts = 0;

    if (this.socket) {
      this.socket.close();
    }

    this.socket = null;
    this.connectionState = "DISCONNECTED";
  }

  /** Return current connection state (read-only). */
  getConnectionState(): WsConnectionState {
    return this.connectionState;
  }

  // ---------------------------------------------------------------------------
  // Private: event handlers
  // ---------------------------------------------------------------------------

  private handleOpen(): void {
    this.connectionState = "CONNECTED";
    this.reconnectAttempts = 0;

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    console.log("[WS] Connected to Lapis AI telemetry stream");
  }

  private handleMessage(event: MessageEvent): void {
    let message: WsIncomingMessage;

    try {
      message = JSON.parse(event.data as string) as WsIncomingMessage;
    } catch (err) {
      console.error("[WS] Failed to parse message:", err);
      return;
    }

    // --- Route by event type ---------------------------------------------------

    if (isMachineUpdate(message)) {
      useMachineStore.getState().updateMachineReading(message.data);
      return;
    }

    if (isCriticalAlert(message)) {
      // Reflect the critical status in the machine store as well
      useMachineStore.getState().updateMachineReading({
        machine_id: message.data.machine_id,
        timestamp: message.timestamp,
        sensors: message.data.sensors,
        prediction: {
          status: "CRITICAL",
          rul_days: 0,
          confidence: 1,
        },
      });

      useToastStore.getState().addAlert({
        machine_id: message.data.machine_id,
        severity: "CRITICAL",
        title: "⚠️ CRITICAL: " + message.data.machine_id,
        message: message.data.message,
        timestamp: message.timestamp,
      });
      return;
    }

    if (isWarningAlert(message)) {
      useToastStore.getState().addAlert({
        machine_id: message.data.machine_id,
        severity: "WARNING",
        title: "⚡ WARNING: " + message.data.machine_id,
        message: message.data.message,
        timestamp: message.timestamp,
      });
      return;
    }

    if (isStatusResolved(message)) {
      // Find the active (non-dismissed) alert for this machine and resolve it
      const { alerts, resolveAlert } = useToastStore.getState();
      const activeAlert = alerts.find(
        (a) => a.machine_id === message.data.machine_id && !a.isDismissed
      );
      if (activeAlert) {
        resolveAlert(activeAlert.id);
      }
      return;
    }
  }

  private handleClose(): void {
    this.socket = null;
    this.connectionState = "RECONNECTING";
    console.log("[WS] Connection closed. Attempting reconnect...");
    this.scheduleReconnect();
  }

  private handleError(): void {
    console.error("[WS] WebSocket error occurred");
    // Browser will automatically fire onclose after onerror — no action needed here.
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.connectionState = "DISCONNECTED";
      console.error("[WS] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts += 1;

    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.reconnectTimer = setTimeout(() => {
      console.log(
        `[WS] Reconnecting... attempt ${this.reconnectAttempts}`
      );
      this.connect();
    }, delay);
  }
}

// =============================================================================
// Singleton export — module-level instantiation ensures one instance app-wide
// =============================================================================

export const wsManager = WebSocketManager.getInstance();
