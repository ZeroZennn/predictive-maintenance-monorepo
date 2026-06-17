"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import MachineStatusDot from "./MachineStatusDot";
import StatusBadge from "./StatusBadge";
import { useMachineDetail } from "@/hooks";
import { clsx } from "clsx";

interface MachineCardProps {
  machineId: string;
  onClick?: (machineId: string) => void;
}

import { useMachineStore } from "@/stores";

export default function MachineCard({
  machineId,
  onClick,
}: MachineCardProps) {
  const machine = useMachineDetail(machineId);
  const isActive = useMachineStore((state) => state.selectedMachineId === machineId);

  if (!machine) return null;

  return (
    <motion.div
      onClick={() => onClick?.(machineId)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={clsx(
        "relative rounded-xl border cursor-pointer",
        "flex flex-col justify-between",
        "p-4 overflow-hidden",
        "transition-all duration-300",
        // Active state
        isActive && [
          "bg-[#38531e]", // Dark green matching the image
          "border-lapis-neon",
        ],
        // Inactive state
        !isActive && [
          "bg-gradient-to-b from-[#2B3739] to-[#1C2626]",
          "border-transparent",
          "hover:border-lapis-muted",
        ],
        // Critical state override
        !isActive && machine?.status === "CRITICAL" && "border-lapis-red",
        !isActive && machine?.status === "WARNING" && "border-lapis-amber"
      )}
    >
      {/* Machine illustration area */}
      <div className="w-full flex items-center justify-center mt-1 mb-2">
        <div className="relative w-32 h-28">
          <Image
            src={`/assets/machines/M3D.png`}
            alt={`Machine ${machine?.id || machineId}`}
            fill
            className="object-contain transition-all duration-300"
            onError={(e) => {
              // Fallback jika image belum ada
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          {/* Fallback placeholder jika image belum ada */}
          <div className="absolute inset-0 flex items-center justify-center -z-10">
            <span className="text-lapis-neon font-bold text-xs opacity-40">
              {machineId}
            </span>
          </div>
        </div>
      </div>

      {/* Machine info — bottom */}
      <div className="w-full text-left mt-2">
        <p className="text-white font-bold text-xl leading-tight">
          {machine?.id ?? machineId}
        </p>
        <p className="text-white/90 text-sm mt-0.5 truncate">
          {machine?.name ?? "Loading..."}
        </p>
      </div>
    </motion.div>
  );
}
