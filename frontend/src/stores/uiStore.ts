import { create } from "zustand";

interface UIStore {
  // State
  activeTab: string;
  sidebarCollapsed: boolean;
  isPageLoading: boolean;

  // Actions
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setIsPageLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  // State
  activeTab: "",
  sidebarCollapsed: false,
  isPageLoading: false,

  // Actions
  setActiveTab: (tab: string) => set({ activeTab: tab }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set({ sidebarCollapsed: collapsed }),

  setIsPageLoading: (loading: boolean) => set({ isPageLoading: loading }),
}));
