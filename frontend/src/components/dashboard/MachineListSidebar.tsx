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
    <div className="flex flex-col md:h-screen max-h-screen sticky top-0 w-full md:w-[200px] lg:w-[200px] 2xl:w-[260px] flex-shrink-0 bg-transparent border-b md:border-b-0 md:border-r border-lapis-border group relative">
      {/* Header / Dropdown Filter */}
      <div className="p-3 flex-shrink-0 flex items-center justify-between md:block">
        <label className="text-[10px] text-gray-400 mb-0 md:mb-1 block mr-2 md:mr-0">Select Zone</label>
        <div className="relative w-[150px] md:w-full">
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
        className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto px-3 md:px-2 pb-3 md:pb-4 gap-3 md:gap-0 md:space-y-2
                   [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1 md:[&::-webkit-scrollbar]:w-1.5 
                   [&::-webkit-scrollbar-track]:bg-transparent 
                   [&::-webkit-scrollbar-thumb]:bg-[#1E3D40] hover:[&::-webkit-scrollbar-thumb]:bg-[#6B8F92] 
                   [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {filteredMachines.map((machine) => (
          <div key={machine.id} className="w-[140px] md:w-full flex-shrink-0">
            <MachineCard
              machineId={machine.id}
              onClick={() => selectMachine(machine.id)}
            />
          </div>
        ))}

        {/* Scroll Hint Overlay */}
        <div className="sticky bottom-4 left-0 right-0 hidden md:flex justify-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="bg-[#1A2224]/90 backdrop-blur-sm text-gray-400 text-[10px] px-3 py-1.5 rounded-full border border-[#1E3D40] flex items-center gap-1.5">
            <span>Scroll ke bawah</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
}
