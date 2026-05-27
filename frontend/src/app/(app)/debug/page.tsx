"use client";

import { useEffect, useState } from "react";
import { wsManager } from "@/lib/websocket/ws-manager";
import { useWebSocketInit } from "@/hooks/useWebSocketInit";
import { Terminal, Activity, Database, Clock } from "lucide-react";
import { clsx } from "clsx";
import { MACHINE_IDS } from "@/config";

interface SensorLog {
  id: string; // unique react key
  machine_id: string;
  timestamp: string;
  health_status: string;
  health_score: number;
  rul_days: number | null;
  received_at: string; // real time
  sensors: any;
}

interface SimulatorProgress {
  percentage: number;
  ticks_sent: number;
  ticks_total: number;
  current_timestamp: string;
}

export default function SimulatorDebugPage() {
  const { connectionState } = useWebSocketInit();
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [progress, setProgress] = useState<SimulatorProgress | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (connectionState !== "CONNECTED") return;

    // We rely on the global join from WebSocketInitializer, but we can explicitly join here if needed
    wsManager.joinGlobal();
    wsManager.joinSimulator();
    MACHINE_IDS.forEach(id => wsManager.joinMachine(id));

    const handleSensorUpdate = (data: any) => {
      setLogs((prev) => {
        const newLog: SensorLog = {
          id: `${data.machine_id}-${Date.now()}-${Math.random()}`,
          machine_id: data.machine_id,
          timestamp: data.timestamp,
          health_status: data.health_status?.label || "UNKNOWN",
          health_score: data.health_status?.health_score ?? 0,
          rul_days: data.rul?.rul_days ?? null,
          received_at: new Date().toLocaleTimeString(),
          sensors: data.sensor_live,
        };
        
        // Keep last 1000 logs to prevent memory leak
        const nextLogs = [newLog, ...prev];
        if (nextLogs.length > 1000) nextLogs.length = 1000;
        return nextLogs;
      });
    };

    const handleSimulatorTick = (data: any) => {
      setProgress({
        percentage: data.percentage,
        ticks_sent: data.ticks_sent,
        ticks_total: data.ticks_total,
        current_timestamp: data.current_timestamp,
      });
    };

    wsManager.on('sensor:update', handleSensorUpdate);
    wsManager.on('simulator:tick', handleSimulatorTick);

    return () => {
      wsManager.off('sensor:update', handleSensorUpdate);
      wsManager.off('simulator:tick', handleSimulatorTick);
    };
  }, [connectionState]);

  return (
    <div className="flex-1 h-full flex flex-col p-4 md:p-6 lg:p-8 xl:p-10 ml-0 md:ml-[90px] bg-[#081819] overflow-hidden text-white font-body">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold flex items-center gap-3 tracking-wide">
            <Terminal className="text-lapis-neon" size={28} />
            SIMULATOR STREAM DEBUGGER
          </h1>
          <p className="text-lapis-muted text-sm mt-1">
            Raw incoming WebSocket payload inspection (sensor:update & simulator:tick)
          </p>
        </div>

        {/* Progress Card */}
        {progress && (
          <div className="bg-[#121A1A] border border-[#1E3D40] rounded-xl p-3 px-5 flex items-center gap-6 min-w-[300px]">
            <div>
              <div className="text-[10px] text-lapis-muted uppercase font-bold tracking-wider mb-1">
                Simulator Progress
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {progress.percentage}%
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
                <span>{progress.ticks_sent} / {progress.ticks_total} ticks</span>
                <span className="text-lapis-neon">{progress.current_timestamp}</span>
              </div>
              <div className="w-full bg-[#1C2626] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-lapis-neon to-[#3A8A06] h-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[#121A1A] p-2 rounded-lg border border-[#1E3D40]">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 px-2">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
            <Activity size={16} className={connectionState === "CONNECTED" ? "text-lapis-neon animate-pulse" : "text-lapis-red"} />
            Connection: <span className="font-bold">{connectionState}</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-gray-700"></div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-300">
            <Database size={16} className="text-blue-400" />
            Total Logs: <span className="font-mono font-bold">{logs.length}</span>
          </div>
        </div>
        
        <button 
          onClick={() => setLogs([])}
          className="px-4 py-1.5 bg-lapis-card hover:bg-lapis-red/20 text-lapis-red text-sm font-bold rounded border border-transparent hover:border-lapis-red transition-all"
        >
          CLEAR LOGS
        </button>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-[#121A1A] border border-[#1E3D40] rounded-xl overflow-hidden flex flex-col relative shadow-lg shadow-black/50">
        
        <div className="flex-1 overflow-auto flex flex-col" style={{ scrollBehavior: isAutoScroll ? 'smooth' : 'auto' }}>
          <div className="min-w-[900px] flex flex-col h-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 p-3 bg-[#1C2626] border-b border-[#1E3D40] text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-1 pl-2"><Clock size={14} className="inline mr-1"/> Sys Time</div>
              <div className="col-span-2">Dataset Timestamp</div>
              <div className="col-span-1">Machine</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-center">Score / RUL</div>
              <div className="col-span-6">Raw Sensors (T, V, P, R, Pw, N, H, O)</div>
            </div>

            {/* Table Body */}
            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
                <Terminal size={48} className="mb-4 opacity-50" />
                <p>Waiting for WebSocket events...</p>
                <p className="text-xs mt-2 opacity-70">Make sure the backend simulator is running.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {logs.map((log, i) => (
                  <div 
                    key={log.id} 
                    className={clsx(
                      "grid grid-cols-12 gap-2 p-2 px-3 border-b border-[#1E3D40]/30 hover:bg-[#1E3D40]/50 transition-colors text-sm font-mono items-center",
                      i % 2 === 0 ? "bg-transparent" : "bg-black/20"
                    )}
                  >
                    <div className="col-span-1 text-gray-400 text-xs">{log.received_at}</div>
                    <div className="col-span-2 text-blue-400">{log.timestamp}</div>
                    <div className="col-span-1 font-bold text-white">{log.machine_id}</div>
                    
                    <div className="col-span-1 flex justify-center">
                      <span className={clsx(
                        "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                        log.health_status === "HEALTHY" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                        log.health_status === "WARNING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        log.health_status === "CRITICAL" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        "bg-gray-500/10 text-gray-400"
                      )}>
                        {log.health_status}
                      </span>
                    </div>

                    <div className="col-span-1 text-center flex flex-col text-xs">
                      <span className="text-white">{Math.round(log.health_score)}</span>
                      {log.rul_days !== null && (
                        <span className="text-amber-400">{log.rul_days}d</span>
                      )}
                    </div>

                    <div className="col-span-6 flex gap-3 text-xs text-gray-300 items-center overflow-hidden">
                      <span title="Temperature" className="text-[#F59E0B]">{log.sensors?.temperature?.toFixed(1)}</span>
                      <span title="Vibration" className="text-[#5FDA0A]">{log.sensors?.vibration?.toFixed(2)}</span>
                      <span title="Pressure" className="text-[#3B82F6]">{log.sensors?.pressure?.toFixed(1)}</span>
                      <span title="RPM" className="text-[#8B5CF6]">{log.sensors?.rpm}</span>
                      <span title="Power" className="text-[#EC4899]">{log.sensors?.power_consumption?.toFixed(1)}</span>
                      <span title="Noise" className="text-[#F43F5E]">{log.sensors?.noise_level?.toFixed(1)}</span>
                      <span title="Humidity" className="text-gray-400">{log.sensors?.humidity?.toFixed(1)}</span>
                      <span title="Op Hours" className="text-white font-bold">{log.sensors?.operating_hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
