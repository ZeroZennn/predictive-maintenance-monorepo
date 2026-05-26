'use client';

import { useEffect } from 'react';
import { wsManager } from '@/lib/websocket/ws-manager';
import { WS_EVENTS } from '@/lib/websocket/ws-events';
import type { MaintenanceSchedule, MaintenanceType } from '@/types';

// ─── Raw payload dari Backend event maintenance:new_suggestion ───
export interface MaintenanceSuggestionPayload {
  schedule_id:         string;
  machine_id:          string;
  rul_at_creation:     number;
  scheduled_date:      string;   // "YYYY-MM-DD"
  safety_margin_date:  string;
  urgency_level:       "IMMEDIATE" | "CRITICAL" | "WARNING" | "MONITOR";
  ml_confidence:       number;
  type:                MaintenanceType;
  priority:            string;
  classification:      string;
  is_update:           boolean;
}

export interface MaintenanceConfirmedPayload {
  schedule_id:    string;
  machine_id:     string;
  scheduled_date: string;
}

interface UseMaintenanceSocketOptions {
  onNewTask: (schedule: MaintenanceSchedule) => void;
  onConfirmTask?: (payload: MaintenanceConfirmedPayload) => void;
}

/**
 * Listens to 'maintenance:new_suggestion' and 'maintenance:confirmed' WS events
 * from Backend and maps it to the canonical MaintenanceSchedule type.
 */
export function useMaintenanceSocket({ onNewTask, onConfirmTask }: UseMaintenanceSocketOptions) {
  useEffect(() => {
    function handleNewSuggestion(data: unknown) {
      const raw = data as MaintenanceSuggestionPayload;
      console.log('[useMaintenanceSocket] maintenance:new_suggestion received:', raw);

      // Map raw WS payload → MaintenanceSchedule
      const schedule: MaintenanceSchedule = {
        id: raw.schedule_id,
        machine_id: raw.machine_id,
        type: raw.type,
        source: 'PREDICTIVE',
        status: 'PENDING_CONFIRMATION',
        // Backend sends "YYYY-MM-DD", convert to full ISO for consistency
        scheduled_date: raw.scheduled_date + 'T08:00:00Z',
        rul_at_creation: raw.rul_at_creation,
        urgency_level: raw.urgency_level,
        ml_confidence: raw.ml_confidence,
        created_at: new Date().toISOString(),
      };

      onNewTask(schedule);
    }

    function handleConfirm(data: unknown) {
      const raw = data as MaintenanceConfirmedPayload;
      console.log('[useMaintenanceSocket] maintenance:confirmed received:', raw);
      if (onConfirmTask) onConfirmTask(raw);
    }

    wsManager.on(WS_EVENTS.MAINTENANCE_NEW_SUGGESTION, handleNewSuggestion as (data: unknown) => void);
    wsManager.on(WS_EVENTS.MAINTENANCE_CONFIRMED, handleConfirm as (data: unknown) => void);

    return () => {
      wsManager.off(WS_EVENTS.MAINTENANCE_NEW_SUGGESTION, handleNewSuggestion as (data: unknown) => void);
      wsManager.off(WS_EVENTS.MAINTENANCE_CONFIRMED, handleConfirm as (data: unknown) => void);
    };
  }, [onNewTask, onConfirmTask]);
}
