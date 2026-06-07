"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useMachineStore, useCopilotStore } from "@/stores";
import { MachineCard } from "@/components/dashboard";
import { ChevronDown, CheckSquare, Square } from "lucide-react";
import { clsx } from "clsx";

export default function MachineListSidebar() {
  const machines = useMachineStore((state) => state.machines);
  const filter = useMachineStore((state) => state.machineFilter);
  const setFilter = useMachineStore((state) => state.setMachineFilter);
  const selectMachine = useMachineStore((state) => state.setSelectedMachine);
  const selectedMachineId = useMachineStore((state) => state.selectedMachineId);
  const setCopilotContext = useCopilotStore((state) => state.setActiveMachineContext);

  // Sync selected machine to Copilot
  useEffect(() => {
    if (selectedMachineId) {
      setCopilotContext(selectedMachineId);
    }
  }, [selectedMachineId, setCopilotContext]);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => Object.values(machines), [machines]);

  const filteredMachines = useMemo(() => {
    if (filter.length === 0) return list;
    return list.filter((m) => filter.includes(m.id));
  }, [list, filter]);

  const toggleMachine = (id: string) => {
    if (filter.includes(id)) {
      setFilter(filter.filter((f) => f !== id));
    } else {
      setFilter([...filter, id]);
    }
  };

  const selectAll = () => setFilter([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col md:h-screen max-h-screen sticky top-0 w-full md:w-[200px] lg:w-[200px] 2xl:w-[260px] flex-shrink-0 bg-transparent border-b md:border-b-0 md:border-r border-lapis-border group relative">
      {/* Header / Dropdown Filter */}
      <div className="p-3 flex-shrink-0 flex items-center justify-between md:block relative z-30" ref={dropdownRef}>
        <label className="text-[10px] text-gray-400 mb-0 md:mb-1 block mr-2 md:mr-0">Select Machines</label>
        <div className="relative w-[150px] md:w-full">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between bg-[#2B3739] border border-gray-700 hover:border-lapis-neon transition-colors text-xs text-white p-2 rounded cursor-pointer outline-none"
          >
            <span className="truncate">
              {filter.length === 0 ? "All Machines" : `${filter.length} Selected`}
            </span>
            <ChevronDown size={14} className={clsx("text-gray-400 transition-transform duration-300", isOpen && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          <div
            className={clsx(
              "absolute top-full left-0 right-0 mt-1 bg-[#1A2224] border border-[#1E3D40] rounded-lg shadow-xl shadow-black overflow-hidden transition-all duration-300 transform origin-top z-50",
              isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
            )}
          >
            <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
              <button
                onClick={selectAll}
                className="w-full flex items-center gap-2 p-2 hover:bg-[#2B3739] rounded transition-colors text-left"
              >
                {filter.length === 0 ? (
                  <CheckSquare size={14} className="text-lapis-neon flex-shrink-0" />
                ) : (
                  <Square size={14} className="text-gray-500 flex-shrink-0" />
                )}
                <span className="text-xs text-white">Select All</span>
              </button>
              <div className="h-[1px] bg-[#1E3D40] my-1" />
              {list.map((m) => {
                const isSelected = filter.length === 0 || filter.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleMachine(m.id)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-[#2B3739] rounded transition-colors text-left"
                  >
                    {isSelected ? (
                      <CheckSquare size={14} className="text-lapis-neon flex-shrink-0" />
                    ) : (
                      <Square size={14} className="text-gray-500 flex-shrink-0" />
                    )}
                    <span className="text-xs text-gray-200">{m.id} - {m.name}</span>
                  </button>
                );
              })}
            </div>
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
