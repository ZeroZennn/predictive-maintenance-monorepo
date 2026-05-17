import { create } from "zustand";
import type { Message } from "@/types";

interface CopilotStore {
  // State
  messages: Message[];
  isOpen: boolean;
  isLoading: boolean;
  sessionId: string;
  activeMachineContext: string | null;

  // Actions
  addMessage: (message: Message) => void;
  setIsOpen: (open: boolean) => void;
  togglePanel: () => void;
  setIsLoading: (loading: boolean) => void;
  setActiveMachineContext: (machineId: string | null) => void;
  clearHistory: () => void;

  // Helper
  generateMessageId: () => string;
}

const generateSessionId = (): string =>
  Math.random().toString(36).substring(2) + Date.now();

export const useCopilotStore = create<CopilotStore>()((set) => ({
  // State
  messages: [],
  isOpen: false,
  isLoading: false,
  sessionId: generateSessionId(),
  activeMachineContext: null,

  // Actions
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsOpen: (open: boolean) => set({ isOpen: open }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  setIsLoading: (loading: boolean) => set({ isLoading: loading }),

  setActiveMachineContext: (machineId: string | null) =>
    set({ activeMachineContext: machineId }),

  clearHistory: () =>
    set({ messages: [], sessionId: generateSessionId() }),

  // Helper — pure function, no state dependency
  generateMessageId: () =>
    "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2),
}));
