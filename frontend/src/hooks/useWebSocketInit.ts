"use client";

import { useEffect, useState } from "react";
import { wsManager } from "@/lib/websocket/ws-manager";
import type { WsConnectionState } from "@/lib/websocket/ws-events";

export function useWebSocketInit() {
  const [connectionState, setConnectionState] =
    useState<WsConnectionState>(wsManager.getConnectionState());

  useEffect(() => {
    wsManager.connect();

    const interval = setInterval(() => {
      setConnectionState(wsManager.getConnectionState());
    }, 2000);

    return () => {
      clearInterval(interval);
      wsManager.disconnect();
    };
  }, []);

  return { connectionState };
}
