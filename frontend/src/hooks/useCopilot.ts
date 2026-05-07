"use client";

import { useCopilotStore } from "@/stores";
import type { Message } from "@/types";

// =============================================================================
// HOOK: useCopilot
// Subscribe ke seluruh copilotStore + helper sendMessage
// =============================================================================

export function useCopilot() {
  const messages = useCopilotStore((state) => state.messages);
  const isOpen = useCopilotStore((state) => state.isOpen);
  const isLoading = useCopilotStore((state) => state.isLoading);
  const sessionId = useCopilotStore((state) => state.sessionId);
  const activeMachineContext = useCopilotStore(
    (state) => state.activeMachineContext
  );

  const addMessage = useCopilotStore((state) => state.addMessage);
  const setIsOpen = useCopilotStore((state) => state.setIsOpen);
  const togglePanel = useCopilotStore((state) => state.togglePanel);
  const setIsLoading = useCopilotStore((state) => state.setIsLoading);
  const setActiveMachineContext = useCopilotStore(
    (state) => state.setActiveMachineContext
  );
  const clearHistory = useCopilotStore((state) => state.clearHistory);
  const generateMessageId = useCopilotStore(
    (state) => state.generateMessageId
  );

  // Helper action: builds a USER Message and dispatches it to the store
  const sendMessage = (content: string, machineId?: string): Message => {
    const message: Message = {
      id: generateMessageId(),
      role: "USER",
      content,
      timestamp: new Date().toISOString(),
      sources: undefined,
      suggested_actions: undefined,
    };

    addMessage(message);

    // Set machine context if provided
    if (machineId !== undefined) {
      setActiveMachineContext(machineId);
    }

    return message;
  };

  return {
    // State
    messages,
    isOpen,
    isLoading,
    sessionId,
    activeMachineContext,
    // Actions
    addMessage,
    setIsOpen,
    togglePanel,
    setIsLoading,
    setActiveMachineContext,
    clearHistory,
    generateMessageId,
    // Helper
    sendMessage,
  };
}
