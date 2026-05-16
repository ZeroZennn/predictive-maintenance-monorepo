"use client";

import { useMemo } from "react";
import { useMachineStore } from "@/stores";
import { MachineCard } from "@/components/dashboard";
import { ChevronDown } from "lucide-react";

export default function MachineListSidebar() {
  const machines = useMachineStore((state) => state.machines);
  const filter = useMachineStore((state) => state.statusFilter);
  const setFilter = useMachineStore((state) => state.setStatusFilter);
  const selectMachine = useMachineStore((state) => state.setSelectedMachine);

  const filteredMachines = useMemo(() => {
    const list = Object.values(machines);
    if (filter === "ALL") return list;
    return list.filter((m) => m.status === filter);
  }, [machines, filter]);

  return (
    <div className="flex flex-col h-full w-[160px] flex-shrink-0 bg-transparent border-r border-lapis-border">
      {/* Header / Dropdown Filter */}
      <div className="p-3 flex-shrink-0">
        <label className="text-[10px] text-gray-400 mb-1 block">Select Zone</label>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="w-full bg-[#2B3739] border border-gray-700 text-xs text-white p-2 rounded cursor-pointer outline-none focus:border-lapis-neon appearance-none pr-8"
          >
            <option value="ALL">All Machine</option>
            <option value="HEALTHY">Healthy</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Scrollable Machine List */}
      <div
        className="flex-1 overflow-y-auto px-2 pb-4 space-y-2
                  scrollbar-none sm:scrollbar-thin scrollbar-track-transparent 
                  scrollbar-thumb-[#1E293B]"
      >
        {filteredMachines.map((machine) => (
          <MachineCard
            key={machine.id}
            machineId={machine.id}
            onClick={() => selectMachine(machine.id)}
          />
        ))}
      </div>
    </div>
  );
}
