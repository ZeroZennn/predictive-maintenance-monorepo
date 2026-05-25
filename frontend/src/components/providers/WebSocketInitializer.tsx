"use client";

import { useEffect } from "react";
import { useWebSocketInit } from "@/hooks/useWebSocketInit";
import { wsManager } from "@/lib/websocket/ws-manager";
import { useMachineStore } from "@/stores";
function WebSocketInitializer() {
  const { connectionState } = useWebSocketInit();
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId) || "M-01";

  useEffect(() => {
    if (connectionState === "CONNECTED") {
      console.log("[App] Joining WebSocket rooms...");
      wsManager.joinGlobal();
      wsManager.joinSimulator();
      wsManager.joinMachine(selectedMachineId);
    }
  }, [connectionState, selectedMachineId]);

  if (process.env.NODE_ENV === "development") {
    console.log("[App] WS Connection State:", connectionState);
  }

  return null;
}

export default WebSocketInitializer;
