"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronRight, Bell } from "lucide-react";
import { useToastStore, useCopilotStore } from "@/stores";
import { useRouter } from "next/navigation";

export default function UrgentAlertTicker() {
  const router = useRouter();
  const allAlerts = useToastStore((s) => s.alerts);
  const dismissToast = useToastStore((s) => s.dismissToast);
  const isCopilotOpen = useCopilotStore((s) => s.isOpen);

  // Hanya tampilkan yang urgent (WARNING / CRITICAL) dan belum didismiss
  const urgentAlerts = allAlerts.filter(
    (a) => !a.isDismissed && (a.severity === "CRITICAL" || a.severity === "WARNING")
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // Looping logika (Carousel vertikal)
  useEffect(() => {
    if (urgentAlerts.length <= 1) {
      setCurrentIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % urgentAlerts.length);
    }, 4000); // Ganti setiap 4 detik
    return () => clearInterval(timer);
  }, [urgentAlerts.length]);

  if (urgentAlerts.length === 0) return null;

  const currentAlert = urgentAlerts[currentIndex];

  return (
    <div
      className={`fixed bottom-6 z-40 transition-all duration-300 ease-in-out hidden sm:flex pointer-events-auto ${
        isCopilotOpen ? "right-[420px]" : "right-24"
      }`}
    >
      <div className="flex items-center gap-0 w-auto max-w-[400px]">
        {/* Ticker Container */}
        <div className="flex items-center bg-[#1A2121]/90 backdrop-blur-md border border-lapis-border rounded-l-full rounded-r-lg shadow-[0_0_20px_rgba(239,68,68,0.15)] overflow-hidden h-12 relative">
          
          <div className={`flex items-center justify-center w-12 h-12 flex-shrink-0 ${
            currentAlert?.severity === "CRITICAL" ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 px-3 py-1 overflow-hidden h-full relative min-w-[200px]">
            <AnimatePresence mode="wait">
              {currentAlert && (
                <motion.div
                  key={currentAlert.id}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col justify-center px-3"
                >
                  <div className="flex items-center gap-2">
                    {currentAlert.machine_id && (
                      <span className="text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded text-white whitespace-nowrap">
                        {currentAlert.machine_id}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white truncate">
                      {currentAlert.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-lapis-muted truncate mt-0.5">
                    {currentAlert.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pr-2">
            <button
              onClick={() => {
                if (currentAlert) dismissToast(currentAlert.id);
              }}
              className="text-[10px] font-medium text-lapis-muted hover:text-white px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => router.push("/alerts")}
              className="w-7 h-7 flex items-center justify-center rounded-md bg-lapis-neon/10 text-lapis-neon hover:bg-lapis-neon/20 transition-colors group"
              title="Lihat Semua Notifikasi"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
