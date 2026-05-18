import { create } from "zustand";
import { MaintenanceTask, getKanbanColumn } from "@/types";

interface MaintenanceState {
  tasks: MaintenanceTask[];
  isLoading: boolean;

  // Actions
  addTask: (task: MaintenanceTask) => void;
  updateTaskStatus: (
    task_id: string,
    status: MaintenanceTask["status"]
  ) => void;
  removeTask: (task_id: string) => void;
  setTasks: (tasks: MaintenanceTask[]) => void;
  setLoading: (val: boolean) => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  tasks: [],
  isLoading: false,

  addTask: (task) =>
    set((state) => {
      // Anti-duplikasi: jangan tambah jika task_id sudah ada
      const exists = state.tasks.some((t) => t.task_id === task.task_id);
      if (exists) return state;
      return { tasks: [...state.tasks, task] };
    }),

  updateTaskStatus: (task_id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.task_id === task_id ? { ...t, status } : t
      ),
    })),

  removeTask: (task_id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.task_id !== task_id),
    })),

  setTasks: (tasks) => set({ tasks }),

  setLoading: (val) => set({ isLoading: val }),
}));

// ─── Selector helpers (dipakai di KanbanColumn) ───
export const selectUrgentTasks = (tasks: MaintenanceTask[]) =>
  tasks.filter((t) => getKanbanColumn(t.rul_days) === "URGENT");

export const selectSoonTasks = (tasks: MaintenanceTask[]) =>
  tasks.filter((t) => getKanbanColumn(t.rul_days) === "SOON");

export const selectScheduledTasks = (tasks: MaintenanceTask[]) =>
  tasks.filter((t) => getKanbanColumn(t.rul_days) === "SCHEDULED");
