"use client";

import { useMachineStore } from "@/stores";
import type { Machine, MachineStatus } from "@/types";

// =============================================================================
// HOOK 1: useMachineList
// Subscribe ke machines (seluruh Record) dan statusFilter
// =============================================================================

export function useMachineList() {
  const machines = useMachineStore((state) => state.machines);
  const statusFilter = useMachineStore((state) => state.statusFilter);
  const setStatusFilter = useMachineStore((state) => state.setStatusFilter);

  const allMachines: Machine[] = Object.values(machines);

  const filteredMachines: Machine[] =
    statusFilter === "ALL"
      ? allMachines
      : allMachines.filter((m) => m.status === statusFilter);

  const totalMachines = allMachines.length;
  const criticalCount = allMachines.filter(
    (m) => m.status === "CRITICAL"
  ).length;
  const warningCount = allMachines.filter((m) => m.status === "WARNING").length;

  return {
    machines: filteredMachines,
    statusFilter,
    setStatusFilter,
    totalMachines,
    criticalCount,
    warningCount,
  };
}

// =============================================================================
// HOOK 2: useMachineDetail
// Subscribe ke machines[machineId] saja — selector spesifik
// =============================================================================

export function useMachineDetail(machineId: string): Machine | undefined {
  return useMachineStore((state) => state.machines[machineId]);
}

// =============================================================================
// HOOK 3: useSelectedMachine
// Subscribe ke selectedMachineId dan machines[selectedMachineId]
// =============================================================================

export function useSelectedMachine() {
  const selectedMachineId = useMachineStore(
    (state) => state.selectedMachineId
  );
  const selectedMachine = useMachineStore((state) =>
    state.selectedMachineId ? state.machines[state.selectedMachineId] : undefined
  );
  const setSelectedMachine = useMachineStore(
    (state) => state.setSelectedMachine
  );

  return {
    selectedMachineId,
    selectedMachine,
    setSelectedMachine,
  };
}
