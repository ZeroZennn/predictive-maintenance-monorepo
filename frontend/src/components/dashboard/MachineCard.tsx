"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MachineStatusDot from "./MachineStatusDot";
import StatusBadge from "./StatusBadge";
import { useMachineDetail } from "@/hooks";
import { clsx } from "clsx";

interface MachineCardProps {
  machineId: string;
  isActive?: boolean;
  onClick?: (machineId: string) => void;
}

export default function MachineCard({
  machineId,
  isActive = false,
  onClick,
}: MachineCardProps) {
  const machine = useMachineDetail(machineId);

  if (!machine) {
    return (
      <div className="animate-pulse bg-lapis-card rounded-xl h-[120px] w-full" />
    );
  }

  return (
    <motion.div
      onClick={() => onClick?.(machineId)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        "relative rounded-xl border cursor-pointer",
        "flex flex-col items-center justify-between",
        "p-3 gap-2 overflow-hidden",
        "transition-all duration-300",
        // Active state
        isActive && [
          "bg-lapis-neon-dim",
          "border-lapis-neon",
          // "shadow-glow-neon",
        ],
        // Inactive state
        !isActive && [
          "bg-lapis-card",
          "border-lapis-border",
          "hover:border-lapis-muted",
        ],
        // Critical state override
        !isActive &&
        machine?.status === "CRITICAL" &&
        "border-lapis-red animate-pulse-critical",
        !isActive && machine?.status === "WARNING" && "border-lapis-amber"
      )}
    >
      {/* Status dot — pojok kanan atas */}
      <div className="absolute top-2 right-2">
        <MachineStatusDot status={machine?.status ?? "HEALTHY"} size="md" />
      </div>

      {/* Machine illustration area */}
      <div className="w-full flex items-center justify-center h-16 mt-1">
        <div className="relative w-20 h-16">
          <Image
            src={`/assets/machines/${machineId}.png`}
            alt={`Machine ${machineId}`}
            fill
            className="object-contain drop-shadow-lg"
            onError={(e) => {
              // Fallback jika image belum ada
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {/* Fallback placeholder jika image belum ada */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lapis-neon font-bold text-xs opacity-40">
              {machineId}
            </span>
          </div>
        </div>
      </div>

      {/* Machine info — bottom */}
      <div className="w-full text-center">
        <p className="text-lapis-text font-bold text-sm leading-tight">
          {machine?.id ?? machineId}
        </p>
        <p className="text-lapis-muted text-[10px] mt-0.5 truncate">
          {machine?.name ?? "Loading..."}
        </p>
      </div>
    </motion.div>
  );
}
