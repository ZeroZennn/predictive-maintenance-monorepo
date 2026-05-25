"use client";

import { useEffect } from "react";
import { useWebSocketInit } from "@/hooks/useWebSocketInit";
import { wsManager } from "@/lib/websocket/ws-manager";
import { useMachineStore } from "@/stores";
import { useToast } from "@/hooks/useToast";
function WebSocketInitializer() {
  const { connectionState } = useWebSocketInit();
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId);
  const machineFilter = useMachineStore((state) => state.machineFilter);
  const { addAlert } = useToast();

  // Determine which machines we should be subscribed to
  // If machineFilter is empty, we subscribe to all machines.
  // We get the machine IDs once from the store without subscribing to avoid infinite re-renders.
  const activeMachineIds = machineFilter.length === 0 
    ? Object.keys(useMachineStore.getState().machines)
    : machineFilter;

  // Effect for setting up global listeners
  useEffect(() => {
    if (connectionState === "CONNECTED") {
      console.log("[App] WebSocket Connected. Setting up global listeners...");
      wsManager.joinGlobal();
      wsManager.joinSimulator();

      const handleSensorUpdate = (data: any) => {
        // DEBUG LOG
        // console.log(`[WS] Received sensor:update for ${data.machine_id}`);
        if (!data.health_status) return; // Skip if no ML prediction yet

        useMachineStore.getState().updateMachineReading({
          machine_id: data.machine_id,
          timestamp: data.timestamp,
          sensors: data.sensor_live,
          prediction: {
            status: data.health_status.label,
            rul_days: data.rul.rul_days,
            confidence: data.health_status.confidence
          },
          is_active: data.rul.is_active,
          rul_hours: data.rul.rul_hours,
          urgency_level: data.rul.urgency_level,
          health_score: data.health_status.health_score,
          probabilities: data.health_status.probabilities
        });
      };

      const handleAlertNew = (data: any) => {
        // Filter out alerts for machines that are not currently selected/monitored
        const currentFilter = useMachineStore.getState().machineFilter;
        if (currentFilter.length > 0 && !currentFilter.includes(data.machine_id)) {
          return; // Ignore alert
        }

        addAlert({
          machine_id: data.machine_id,
          severity: data.severity.toUpperCase(),
          title: `Machine Alert: ${data.machine_id}`,
          message: data.message,
          timestamp: new Date().toISOString(),
        });
      };

      wsManager.on('sensor:update', handleSensorUpdate);
      wsManager.on('alert:new', handleAlertNew);

      return () => {
        wsManager.off('sensor:update', handleSensorUpdate);
        wsManager.off('alert:new', handleAlertNew);
      };
    }
  }, [connectionState]);

  // Effect for managing specific machine channel subscriptions
  useEffect(() => {
    if (connectionState === "CONNECTED") {
      // Ensure we subscribe to the selectedMachineId (e.g. if viewing details)
      const toSubscribe = new Set(activeMachineIds);
      if (selectedMachineId) {
        toSubscribe.add(selectedMachineId);
      }

      // Join all active machines
      toSubscribe.forEach(id => wsManager.joinMachine(id));

      // Cleanup: leave all these machines when filter changes or unmounts
      return () => {
        toSubscribe.forEach(id => wsManager.leaveMachine(id));
      };
    }
  }, [connectionState, activeMachineIds.join(','), selectedMachineId]);

  if (process.env.NODE_ENV === "development") {
    console.log("[App] WS Connection State:", connectionState);
  }

  return null;
}

export default WebSocketInitializer;
