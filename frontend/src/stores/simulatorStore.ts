import { create } from "zustand";

interface SimulatorStore {
  isOpen: boolean;
  togglePanel: () => void;
  setIsOpen: (open: boolean) => void;
}

export const useSimulatorStore = create<SimulatorStore>()((set) => ({
  isOpen: false,
  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (open: boolean) => set({ isOpen: open }),
}));
