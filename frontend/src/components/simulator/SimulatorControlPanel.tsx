"use client";

import { useState, useEffect } from "react";
import { useSimulatorStore, useToastStore } from "@/stores";
import { X, Play, Square, Settings2, Clock, CalendarDays, Activity } from "lucide-react";
import apiClient from "@/lib/api/axios-instance";
import clsx from "clsx";

export function SimulatorControlPanel() {
  const { isOpen, togglePanel } = useSimulatorStore();
  const { addAlert, dismissAllAlerts, clearAllAlerts } = useToastStore();

  const [dateStr, setDateStr] = useState<string>("2025-07-01");
  const [hour, setHour] = useState<number>(0);
  const [tickInterval, setTickInterval] = useState<number>(10);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Check initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get("/api/simulator/status");
        setIsRunning(res.data.data.is_running || false);
      } catch (err) {
        console.error("Failed to fetch simulator status");
      }
    };
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) togglePanel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, togglePanel]);

  const handleStart = async () => {
    if (!dateStr) {
      addAlert({
        machine_id: "SYS",
        severity: "WARNING",
        title: "Simulator",
        message: "Please select a valid date first",
        timestamp: new Date().toISOString()
      });
      return;
    }

    setIsStarting(true);
    try {
      // Format to ISO UTC e.g. "2025-07-01T00:00:00Z"
      const formattedDate = `${dateStr}T${hour.toString().padStart(2, "0")}:00:00Z`;

      await apiClient.post("/api/simulator/start", {
        start_date: formattedDate,
        tick_interval_seconds: tickInterval
      });

      setIsRunning(true);
      addAlert({
        machine_id: "SYS",
        severity: "INFO",
        title: "Simulator",
        message: "Simulator Engine Started successfully",
        timestamp: new Date().toISOString()
      });
      // togglePanel(); // Optionally close panel after start
    } catch (err: any) {
      addAlert({
        machine_id: "SYS",
        severity: "WARNING",
        title: "Simulator Error",
        message: err?.response?.data?.message || "Failed to start simulator",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await apiClient.post("/api/simulator/stop");
      setIsRunning(false);
      dismissAllAlerts();
      addAlert({
        machine_id: "SYS",
        severity: "INFO",
        title: "Simulator",
        message: "Simulator Engine Stopped",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      addAlert({
        machine_id: "SYS",
        severity: "WARNING",
        title: "Simulator Error",
        message: err?.response?.data?.message || "Failed to stop simulator",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handleResetClick = () => {
    setIsConfirmResetOpen(true);
  };

  const executeReset = async () => {
    setIsResetting(true);
    try {
      await apiClient.post("/api/simulator/reset");
      clearAllAlerts();
      addAlert({
        machine_id: "SYS",
        severity: "INFO",
        title: "Simulator",
        message: "Database successfully reset to clean slate",
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      addAlert({
        machine_id: "SYS",
        severity: "CRITICAL",
        title: "Simulator Error",
        message: err?.response?.data?.message || "Failed to reset simulator data",
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={togglePanel}
        />
      )}

      {/* Panel */}
      <div
        className={clsx(
          "fixed top-0 right-0 z-50 h-full w-[400px] max-w-[90vw] transform transition-transform duration-300 ease-in-out flex flex-col",
          "bg-lapis-surface/90 backdrop-blur-xl border-l border-lapis-border shadow-2xl shadow-black/80",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-lapis-border/50 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-lapis-neon/10 rounded-lg">
              <Settings2 size={24} className="text-lapis-neon" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Simulator Engine
              </h2>
              <p className="text-xs text-lapis-muted">
                Control the predictive telemetry stream
              </p>
            </div>
          </div>
          <button
            onClick={togglePanel}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 font-body">

          {/* Start Date Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays size={16} className="text-lapis-neon" />
              Dataset Inject Point
            </h3>

            <div className="space-y-6 bg-black/20 p-5 rounded-xl border border-white/5">
              {/* Date Input */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Date</span>
                </div>
                <div className="relative">
                  <CalendarDays size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg pl-10 p-2.5 focus:ring-1 focus:ring-lapis-neon focus:border-lapis-neon outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  * Dataset: July 2025 - Jan 2026. Out-of-bounds dates will start from beginning.
                </p>
              </div>

              {/* Hour Select */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Time (Hour)</span>
                </div>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-lg pl-10 p-2.5 focus:ring-1 focus:ring-lapis-neon focus:border-lapis-neon outline-none appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }).map((_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, "0")}:00 UTC
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Speed Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-amber-400" />
              Stream Speed
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 5, label: "5s / tick" },
                { value: 10, label: "10s / tick" },
                { value: 15, label: "15s / tick" },
                { value: 300, label: "5min / tick" },
                { value: 600, label: "10min / tick" },
                { value: 900, label: "15min / tick" },
                { value: 3600, label: "60min / tick" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTickInterval(opt.value)}
                  className={clsx(
                    "py-3 rounded-lg border text-sm font-bold transition-all cursor-pointer",
                    tickInterval === opt.value
                      ? "bg-lapis-neon/20 border-lapis-neon text-white"
                      : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">
              * 1 tick represents exactly 1 hour of real machine operation.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-lapis-border/50 bg-black/40 flex flex-col gap-3">
          <button
            onClick={handleStart}
            disabled={isStarting || isRunning}
            className={clsx(
              "w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all",
              (isStarting || isRunning)
                ? "bg-lapis-neon/20 text-lapis-neon border border-lapis-neon opacity-70 cursor-not-allowed"
                : "bg-gradient-to-r from-lapis-neon to-[#3A8A06] hover:brightness-110 text-black hover:text-white shadow-[0_0_20px_rgba(95,218,10,0.3)]] cursor-pointer"
            )}
          >
            {isStarting ? (
              <span className="animate-pulse">Starting...</span>
            ) : isRunning ? (
              <>
                <Activity size={20} className="text-lapis-neon animate-pulse" />
                ENGINE RUNNING
              </>
            ) : (
              <>
                <Play size={20} className="fill-black hover:fill-white" />
                START ENGINE
              </>
            )}
          </button>

          <button
            onClick={handleStop}
            disabled={isStopping || !isRunning}
            className={clsx(
              "w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all border",
              (isStopping || !isRunning)
                ? "bg-black/40 text-lapis-red/50 border-lapis-red/20 opacity-50 cursor-not-allowed"
                : "bg-black/40 hover:bg-lapis-red/20 text-lapis-red border-lapis-red/50 hover:border-lapis-red shadow-[0_0_15px_rgba(255,59,48,0.2)] hover:shadow-[0_0_25px_rgba(255,59,48,0.4)] cursor-pointer"
            )}
          >
            {isStopping ? (
              <span className="animate-pulse">Stopping...</span>
            ) : (
              <>
                <Square size={18} className="fill-current" />
                STOP ENGINE
              </>
            )}
          </button>

          <button
            onClick={handleResetClick}
            disabled={isResetting || isRunning}
            className="w-full mt-2 text-xs text-gray-500 hover:text-white underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isResetting ? "Erasing Database..." : "Reset/Clear All Simulated Data"}
          </button>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-[#081819] border border-white/10 rounded-2xl shadow-2xl p-6 flex flex-col">
            <h3 className="font-heading text-lg font-extrabold text-white mb-2">Reset Simulator Data</h3>
            <p className="text-sm text-[#C3CCD1] mb-6">
              Are you sure you want to completely erase all simulated data from the database? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsConfirmResetOpen(false);
                  executeReset();
                }}
                className="px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
