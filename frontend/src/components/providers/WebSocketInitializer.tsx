"use client";

import { useWebSocketInit } from "@/hooks/useWebSocketInit";

function WebSocketInitializer() {
  const { connectionState } = useWebSocketInit();

  if (process.env.NODE_ENV === "development") {
    console.log("[App] WS Connection State:", connectionState);
  }

  return null;
}

export default WebSocketInitializer;
