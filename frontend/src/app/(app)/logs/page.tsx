"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMachineStore } from "@/stores";
import { wsManager } from "@/lib/websocket/ws-manager";
import { fetchMachineHistory } from "@/lib/api/telemetry.api";
import { MACHINE_IDS } from "@/config";
import {
  FileDown,
  FileText,
  Database,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  Filter,
} from "lucide-react";
import { clsx } from "clsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

// ── Flat row shape matching TimescaleDB API response ─────────────────────
// Note: MachineReading uses nested { sensors: SensorData } but the history
// API returns a flat row — so we define our own interface here.
interface EnrichedReading {
  machine_id:        string;
  timestamp:         string;
  // Sensor columns (flat)
  temperature:       number;
  vibration:         number;
  pressure:          number;
  rpm:               number;
  power_consumption: number;
  noise_level:       number;
  humidity:          number;
  operating_hours:   number;
  // ML Prediction columns (nullable — null when no prediction available yet)
  health_status?:    string | null;
  health_score?:     number | null;
  rul_days?:         number | null;
  confidence_score?: number | null;
  urgency_level?:    string | null;
}

// ── Raw socket payload types ───────────────────────────────────────────────
interface SensorUpdatePayload {
  machine_id: string;
  timestamp: string;
  sensor_live?: Record<string, number>;
  health_status?: { label: string; health_score: number; confidence: number } | null;
  rul?: { is_active: boolean; rul_days: number | null; urgency_level: string } | null;
}

// ── Status badge colours ──────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return <span className="text-gray-600 text-xs italic">—</span>;
  }
  const colours: Record<string, string> = {
    HEALTHY:  "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    WARNING:  "bg-amber-500/20   text-amber-400   border-amber-500/40",
    CRITICAL: "bg-red-500/20     text-red-400     border-red-500/40",
  };
  return (
    <span
      className={clsx(
        "px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wider",
        colours[status.toUpperCase()] ?? "bg-gray-500/20 text-gray-400 border-gray-500/40"
      )}
    >
      {status.toUpperCase()}
    </span>
  );
}

// ── Urgency badge ──────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }: { urgency?: string | null }) {
  if (!urgency || urgency === "MONITOR") {
    return <span className="text-gray-600 text-xs">—</span>;
  }
  const colours: Record<string, string> = {
    URGENT:   "text-red-400",
    SOON:     "text-amber-400",
    PLANNED:  "text-sky-400",
  };
  return (
    <span className={clsx("text-xs font-semibold", colours[urgency] ?? "text-gray-400")}>
      {urgency}
    </span>
  );
}

// ── Max live rows kept in-memory to prevent browser OOM ───────────────────
const MAX_LIVE_ROWS = 50;

export default function HistoricalLogsPage() {
  const selectedMachineId =
    useMachineStore((s) => s.selectedMachineId) || "M-01";
  const setSelectedMachine = useMachineStore((s) => s.setSelectedMachine);

  const [historicalRows, setHistoricalRows] = useState<EnrichedReading[]>([]);
  const [liveRows, setLiveRows] = useState<EnrichedReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [historyLimit, setHistoryLimit] = useState(100);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const machineRef = useRef(selectedMachineId);
  machineRef.current = selectedMachineId;

  // ── Fetch historical data from API (TimescaleDB with ML JOIN) ─────────
  const loadHistory = useCallback(async (machineId: string, limit: number) => {
    setIsLoading(true);
    setLiveRows([]);
    try {
      const data = await fetchMachineHistory(machineId, limit);
      setHistoricalRows((data.readings as unknown as EnrichedReading[]) || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistoricalRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(selectedMachineId, historyLimit);
  }, [selectedMachineId, historyLimit, loadHistory]);

  // ── Socket.IO live listener ────────────────────────────────────────────
  useEffect(() => {
    // Track connection state
    const checkConnected = () => setIsLive(wsManager.isConnected());
    checkConnected();

    const handleConnect = () => setIsLive(true);
    const handleDisconnect = () => setIsLive(false);

    const handleSensorUpdate = (data: unknown) => {
      const payload = data as SensorUpdatePayload;
      if (payload.machine_id !== machineRef.current) return;

      const newRow: EnrichedReading = {
        timestamp:          payload.timestamp,
        machine_id:         payload.machine_id,
        temperature:        payload.sensor_live?.temperature        ?? 0,
        vibration:          payload.sensor_live?.vibration          ?? 0,
        pressure:           payload.sensor_live?.pressure           ?? 0,
        rpm:                payload.sensor_live?.rpm                ?? 0,
        power_consumption:  payload.sensor_live?.power_consumption  ?? 0,
        noise_level:        payload.sensor_live?.noise_level        ?? 0,
        humidity:           payload.sensor_live?.humidity           ?? 0,
        operating_hours:    payload.sensor_live?.operating_hours    ?? 0,
        // ML columns from socket payload
        health_status:      payload.health_status?.label            ?? null,
        health_score:       payload.health_status?.health_score     ?? null,
        rul_days:           payload.rul?.rul_days                   ?? null,
        urgency_level:      payload.rul?.urgency_level              ?? null,
        confidence_score:   payload.health_status?.confidence       ?? null,
      };

      setLiveRows((prev) => {
        // Deduplicate by timestamp
        if (prev.length > 0 && prev[0].timestamp === newRow.timestamp) return prev;
        return [newRow, ...prev].slice(0, MAX_LIVE_ROWS);
      });
    };

    // Simulator reset: clear everything — DB is empty after TRUNCATE
    const handleSimulatorReset = () => {
      setLiveRows([]);
      setHistoricalRows([]);
    };

    wsManager.on("connect",          handleConnect);
    wsManager.on("disconnect",       handleDisconnect);
    wsManager.on("sensor:update",    handleSensorUpdate);
    wsManager.on("simulator:reset",  handleSimulatorReset);

    return () => {
      wsManager.off("connect",         handleConnect);
      wsManager.off("disconnect",      handleDisconnect);
      wsManager.off("sensor:update",   handleSensorUpdate);
      wsManager.off("simulator:reset", handleSimulatorReset);
    };
  }, []);

  // ── Merged view: live rows on top, historical rows below ────────────────
  // Deduplicate: exclude historical rows whose timestamp is already in liveRows
  // (this happens when Reload DB is clicked while live data is still streaming)
  const liveTimestamps = new Set(liveRows.map((r) => r.timestamp));
  const dedupedHistory = historicalRows.filter((r) => !liveTimestamps.has(r.timestamp));
  
  let allRows: EnrichedReading[] = [...liveRows, ...dedupedHistory];
  let filteredDedupedHistory = dedupedHistory;

  if (statusFilter !== "ALL") {
    allRows = allRows.filter((r) => r.health_status === statusFilter);
    filteredDedupedHistory = filteredDedupedHistory.filter((r) => r.health_status === statusFilter);
  }

  if (dateFilter === "TODAY") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    allRows = allRows.filter((r) => new Date(r.timestamp).getTime() >= today.getTime());
    filteredDedupedHistory = filteredDedupedHistory.filter((r) => new Date(r.timestamp).getTime() >= today.getTime());
  }

  // ── Export helpers — historical only (live rows excluded) ─────────────
  const buildExportRows = () =>
    filteredDedupedHistory.map((row) => ({
      Timestamp:       new Date(row.timestamp).toLocaleString("id-ID"),
      "Temp (°C)":     Number(row.temperature).toFixed(1),
      "Vib (mm/s)":    Number(row.vibration).toFixed(3),
      "Pres (PSI)":    Number(row.pressure).toFixed(1),
      RPM:             row.rpm,
      "Pwr (kW)":      Number(row.power_consumption).toFixed(1),
      "Noise (dB)":    Number(row.noise_level).toFixed(1),
      "Hum (%)":       Number(row.humidity).toFixed(1),
      "Op Hrs":        row.operating_hours,
      "Health Status": row.health_status  ?? "—",
      "Health Score":  row.health_score   != null ? `${row.health_score}%` : "—",
      "RUL (days)":    row.rul_days       != null ? Number(row.rul_days).toFixed(1) : "—",
      Urgency:         row.urgency_level  ?? "—",
    }));

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(`Historical Telemetry Log — ${selectedMachineId}`, 14, 15);
    doc.setFontSize(8);
    doc.text(
      `Exported: ${format(new Date(), "dd/MM/yyyy HH:mm")}  |  Historical rows: ${filteredDedupedHistory.length}  (live rows excluded)`,
      14, 21
    );
    autoTable(doc, {
      head: [["Timestamp","Temp","Vib","Pres","RPM","Pwr","Noise","Hum","Op Hrs","Status","Score","RUL (d)","Urgency"]],
      body: filteredDedupedHistory.map((row) => [
        new Date(row.timestamp).toLocaleString("id-ID", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        Number(row.temperature).toFixed(1),
        Number(row.vibration).toFixed(3),
        Number(row.pressure).toFixed(1),
        row.rpm,
        Number(row.power_consumption).toFixed(1),
        Number(row.noise_level).toFixed(1),
        Number(row.humidity).toFixed(1),
        row.operating_hours,
        row.health_status  ?? "—",
        row.health_score   != null ? `${row.health_score}%` : "—",
        row.rul_days       != null ? Number(row.rul_days).toFixed(1) : "—",
        row.urgency_level  ?? "—",
      ]),
      startY: 26,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [18, 40, 42] },
    });
    doc.save(`PRIME_Logs_${selectedMachineId}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(buildExportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historical Telemetry");
    XLSX.writeFile(wb, `PRIME_Logs_${selectedMachineId}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 h-full flex flex-col p-4 md:p-6 lg:p-8 bg-[#081819] overflow-hidden text-white font-body pb-24 md:pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold flex items-center gap-3 tracking-wide">
            <Database className="text-lapis-neon" size={28} />
            HISTORICAL LOGS &amp; REPORTS
          </h1>
          <p className="text-lapis-muted text-sm mt-1 flex items-center gap-2 flex-wrap">
            {isLive ? (
              <>
                <Wifi size={13} className="text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-semibold">Live</span>
                <span className="text-gray-500">— new rows appear automatically on top</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-gray-500" />
                <span className="text-gray-500">Offline — showing static historical data only</span>
              </>
            )}
            {liveRows.length > 0 && (
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
                +{liveRows.length} live
              </span>
            )}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="flex items-center gap-2 bg-[#121A1A] border border-[#1E3D40] rounded-xl px-3 py-2 text-sm shadow-sm">
            <Filter size={14} className="text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent outline-none text-gray-300 font-semibold cursor-pointer appearance-none"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
            </select>
            <div className="w-px h-4 bg-[#1E3D40] mx-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none text-gray-300 font-semibold cursor-pointer appearance-none"
            >
              <option value="ALL">All Status</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <select
            value={selectedMachineId}
            onChange={(e) => {
              setSelectedMachine(e.target.value);
              setHistoryLimit(100); // Reset limit on machine change
            }}
            className="bg-[#121A1A] border border-[#1E3D40] rounded-xl px-4 py-2 outline-none focus:border-lapis-neon transition-colors cursor-pointer text-sm font-bold uppercase tracking-wider"
          >
            {MACHINE_IDS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          <button
            onClick={() => loadHistory(selectedMachineId, historyLimit)}
            disabled={isLoading}
            title="Reload historical data from database"
            className="flex items-center gap-2 px-3 py-2 bg-[#1C2626] hover:bg-[#1E3D40] border border-[#1E3D40] disabled:opacity-50 rounded-xl text-sm transition-all"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Reload DB
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={allRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              <FileDown size={16} />
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={allRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-800 hover:from-green-500 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition-all"
            >
              <FileText size={16} />
              EXCEL
            </button>
          </div>
        </div>
      </div>

      {/* ── Row count info ── */}
      {!isLoading && (filteredDedupedHistory.length > 0 || liveRows.length > 0) && (
        <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
          <Activity size={11} />
          <span className="text-white font-semibold">{allRows.length}</span> records displayed
          <span className="mx-1 text-gray-700">·</span>
          <span className="text-emerald-500">{liveRows.length} live (not exported)</span>
          <span className="mx-1 text-gray-700">+</span>
          <span className="text-gray-400">{filteredDedupedHistory.length} historical (exported)</span>
        </p>
      )}

      {/* ── Table Container ── */}
      <div className="flex-1 bg-gradient-to-b from-[#121A1A] to-[#081819] border border-[#1E3D40] rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
              <div className="w-8 h-8 border-4 border-lapis-neon border-t-transparent rounded-full animate-spin mb-4" />
              <p>Fetching historical data from TimescaleDB...</p>
            </div>
          ) : allRows.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[300px]">
              <Database size={48} className="mb-4 opacity-50" />
              <p className="font-semibold">No data found for {selectedMachineId}</p>
              <p className="text-xs mt-1 text-gray-600">Start the simulator or wait for new readings</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#1C2626] border-b border-[#1E3D40] sticky top-0 z-10 shadow-sm">
                <tr className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-3 py-3">
                    <Calendar size={12} className="inline mr-1 mb-0.5" />
                    Timestamp
                  </th>
                  <th className="px-3 py-3 text-center text-[#F59E0B]">Temp (°C)</th>
                  <th className="px-3 py-3 text-center text-[#5FDA0A]">Vib (mm/s)</th>
                  <th className="px-3 py-3 text-center text-[#3B82F6]">Pres (PSI)</th>
                  <th className="px-3 py-3 text-center text-[#8B5CF6]">RPM</th>
                  <th className="px-3 py-3 text-center text-[#EC4899]">Pwr (kW)</th>
                  <th className="px-3 py-3 text-center text-[#F43F5E]">Noise (dB)</th>
                  <th className="px-3 py-3 text-center text-gray-300">Hum (%)</th>
                  <th className="px-3 py-3 text-center text-white">Op Hrs</th>
                  {/* ML columns — separated visually */}
                  <th className="px-3 py-3 text-center text-lapis-neon border-l border-[#1E3D40]">Status</th>
                  <th className="px-3 py-3 text-center text-lapis-neon">Score</th>
                  <th className="px-3 py-3 text-center text-lapis-neon">RUL (days)</th>
                  <th className="px-3 py-3 text-center text-lapis-neon">Urgency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3D40]/30">
                {allRows.map((row, i) => {
                  const isLiveRow = i < liveRows.length;
                  // Insert divider row between last live row and first historical row
                  const isDividerBefore =
                    liveRows.length > 0 && i === liveRows.length;

                  return (
                    <>
                      {isDividerBefore && (
                        <tr key="divider" className="bg-[#0d2020]">
                          <td
                            colSpan={13}
                            className="px-4 py-2 text-center"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E3D40] to-transparent" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                                ↑ Live (not exported) &nbsp;·&nbsp; Historical (exported) ↓
                              </span>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E3D40] to-transparent" />
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        key={`${row.machine_id}-${row.timestamp}-${i}`}
                        className={clsx(
                          "hover:bg-[#1E3D40]/50 transition-colors text-sm font-mono",
                          isLiveRow
                            ? "bg-emerald-900/10 border-l-2 border-l-emerald-500/40"
                            : i % 2 === 0 ? "bg-transparent" : "bg-black/20"
                        )}
                      >
                        <td className="px-3 py-2.5 text-gray-300 text-xs">
                          {isLiveRow && (
                            <span className="mr-1.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30 align-middle">
                              LIVE
                            </span>
                          )}
                          {new Date(row.timestamp).toLocaleString("id-ID", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2.5 text-center text-[#F59E0B]">{Number(row.temperature).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-[#5FDA0A]">{Number(row.vibration).toFixed(3)}</td>
                        <td className="px-3 py-2.5 text-center text-[#3B82F6]">{Number(row.pressure).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-[#8B5CF6]">{row.rpm}</td>
                        <td className="px-3 py-2.5 text-center text-[#EC4899]">{Number(row.power_consumption).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-[#F43F5E]">{Number(row.noise_level).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-gray-400">{Number(row.humidity).toFixed(1)}</td>
                        <td className="px-3 py-2.5 text-center text-white font-semibold">{row.operating_hours}</td>
                        {/* ML Prediction columns */}
                        <td className="px-3 py-2.5 text-center border-l border-[#1E3D40]/60">
                          <StatusBadge status={row.health_status} />
                        </td>
                        <td className="px-3 py-2.5 text-center text-gray-300 text-xs">
                          {row.health_score != null ? `${row.health_score}%` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs">
                          {row.rul_days != null ? (
                            <span className={clsx(
                              "font-semibold",
                              row.rul_days < 7  ? "text-red-400" :
                              row.rul_days < 30 ? "text-amber-400" : "text-sky-400"
                            )}>
                              {Number(row.rul_days).toFixed(1)}
                            </span>
                          ) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <UrgencyBadge urgency={row.urgency_level} />
                        </td>
                      </tr>
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination / Load More Footer */}
        {!isLoading && allRows.length >= historyLimit && statusFilter === "ALL" && dateFilter === "ALL" && (
          <div className="bg-[#1C2626] border-t border-[#1E3D40] p-3 flex justify-center">
            <button
              onClick={() => setHistoryLimit(prev => prev + 100)}
              className="px-4 py-1.5 bg-[#121A1A] hover:bg-lapis-neon/20 border border-[#1E3D40] hover:border-lapis-neon text-lapis-neon text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              Load 100 More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
