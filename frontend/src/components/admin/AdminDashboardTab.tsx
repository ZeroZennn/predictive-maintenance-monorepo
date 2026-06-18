'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMachineStore, useToastStore } from '@/stores'
import { useMaintenanceStore } from '@/stores'
import { fetchUsers, fetchDocuments, fetchAdminMaintenanceLogs } from '@/lib/api'
import type { AdminUser, AdminDocument, MaintenanceLog } from '@/types'
import {
  Users, FileText, Wrench, AlertTriangle, Activity,
  TrendingUp, ShieldCheck, Clock, CheckCircle2, XCircle,
  Loader2, ChevronRight, Zap, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { ROUTES } from '@/config'

// ── Mini Ring Chart (pure SVG, no recharts) ─────────────────────
function RingChart({
  value, max, color, size = 80, stroke = 8
}: { value: number; max: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const filled = max > 0 ? (value / max) * circ : 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#1E3D40" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  )
}

// ── Metric Card ──────────────────────────────────────────────────
function MetricCard({
  icon: Icon, label, value, sub, iconColor = 'text-lapis-neon',
  iconBg = 'bg-lapis-neon/10', trend
}: {
  icon: React.ElementType; label: string; value: string | number
  sub?: string; iconColor?: string; iconBg?: string
  trend?: { dir: 'up' | 'down'; text: string }
}) {
  return (
    <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-4 shadow-lg
                    hover:border-lapis-neon/20 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg} border border-white/5`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full
            ${trend.dir === 'up' ? 'bg-lapis-neon/10 text-lapis-neon' : 'bg-lapis-red/10 text-lapis-red'}`}>
            {trend.text}
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white leading-none mb-1">{value}</div>
      <div className="text-[11px] text-lapis-muted uppercase tracking-widest">{label}</div>
      {sub && <div className="text-[10px] text-lapis-muted/60 mt-1">{sub}</div>}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────
export default function AdminDashboardTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [recentLogs, setRecentLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const machines = useMachineStore(s => s.machines)
  const tasks = useMaintenanceStore(s => s.tasks)
  const alerts = useToastStore(s => s.alerts)

  const activeTasks = useMemo(() =>
    tasks.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'),
    [tasks])

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [u, d, l] = await Promise.allSettled([
          fetchUsers(),
          fetchDocuments(),
          fetchAdminMaintenanceLogs(),
        ])
        if (u.status === 'fulfilled') setUsers(u.value || [])
        if (d.status === 'fulfilled') setDocuments(d.value || [])
        if (l.status === 'fulfilled')
          setRecentLogs(l.value ? l.value.slice(0, 6) : [])
      } finally {
        setIsLoading(false)
        setLastRefresh(new Date())
      }
    }
    loadData()
    // Auto-refresh every 60s
    const interval = setInterval(loadData, 60_000)
    return () => clearInterval(interval)
  }, [])

  const machineList = useMemo(() => Object.values(machines), [machines])
  const TOTAL = machineList.length || 20

  const healthCount = useMemo(() => ({
    HEALTHY: machineList.filter(m => m.status === 'HEALTHY').length,
    WARNING: machineList.filter(m => m.status === 'WARNING').length,
    CRITICAL: machineList.filter(m => m.status === 'CRITICAL').length,
  }), [machineList])

  const systemScore = useMemo(() =>
    TOTAL > 0 ? Math.round(((healthCount.HEALTHY + healthCount.WARNING * 0.5) / TOTAL) * 100) : 100,
    [healthCount, TOTAL])

  const alertMachines = useMemo(() =>
    machineList
      .filter(m => m.status === 'WARNING' || m.status === 'CRITICAL')
      .sort((a, b) => (a.rul_days ?? 999) - (b.rul_days ?? 999))
      .slice(0, 6),
    [machineList])

  const docStatus = useMemo(() => ({
    READY: documents.filter(d => d.status === 'READY').length,
    PROCESSING: documents.filter(d => d.status === 'PROCESSING').length,
    FAILED: documents.filter(d => d.status === 'FAILED').length,
  }), [documents])

  const activeAlerts = useMemo(() =>
    alerts.filter(a => !a.isDismissed).slice(0, 5),
    [alerts])

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
      notation: 'compact', compactDisplay: 'short',
    }).format(val)

  const scoreColor = systemScore >= 80 ? '#5FDA0A' : systemScore >= 50 ? '#EF7513' : '#FF3B3B'

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full
                    scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">System Analytics</h1>
          <p className="text-[11px] text-lapis-muted mt-0.5">
            Real-time overview {lastRefresh ? `· Refreshed ${lastRefresh.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-lapis-neon/10 border border-lapis-neon/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-lapis-neon animate-pulse" />
            <span className="text-[10px] text-lapis-neon font-medium uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      {/* ── ROW 1: Metric Cards (5 cols) ── */}
      <div className="grid grid-cols-5 gap-4">
        <MetricCard icon={BarChart3} label="Total Mesin" value={TOTAL}
          sub="Unit terdaftar" iconColor="text-lapis-neon" iconBg="bg-lapis-neon/10" />
        <MetricCard icon={Users} label="Total User" value={isLoading ? '…' : users.length}
          sub={`${users.filter(u => u.status === 'ACTIVE').length} aktif`}
          iconColor="text-sky-400" iconBg="bg-sky-400/10" />
        <MetricCard icon={FileText} label="Dokumen" value={isLoading ? '…' : documents.length}
          sub={`${docStatus.READY} terindeks`}
          iconColor="text-violet-400" iconBg="bg-violet-400/10" />
        <MetricCard icon={Wrench} label="Active Tasks" value={activeTasks.length}
          sub="Belum selesai"
          iconColor="text-lapis-amber" iconBg="bg-lapis-amber/10" />
        <MetricCard icon={AlertTriangle} label="Active Alerts" value={activeAlerts.length}
          sub={`${healthCount.CRITICAL} critical`}
          iconColor={healthCount.CRITICAL > 0 ? 'text-lapis-red' : 'text-lapis-muted'}
          iconBg={healthCount.CRITICAL > 0 ? 'bg-lapis-red/10' : 'bg-lapis-muted/10'} />
      </div>

      {/* ── ROW 2: Health Overview (3-col) ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Kiri: System Health Score + Ring */}
        <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-5 shadow-lg
                        flex flex-col items-center justify-center gap-3">
          <span className="text-[11px] text-lapis-muted uppercase tracking-widest font-semibold">
            System Health Score
          </span>
          <div className="relative">
            <RingChart value={systemScore} max={100} color={scoreColor} size={100} stroke={10} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color: scoreColor }}>{systemScore}</span>
              <span className="text-[9px] text-lapis-muted">/ 100</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full mt-1">
            {[
              { key: 'HEALTHY', label: 'OK', val: healthCount.HEALTHY, color: '#5FDA0A' },
              { key: 'WARNING', label: 'WARN', val: healthCount.WARNING, color: '#EF7513' },
              { key: 'CRITICAL', label: 'CRIT', val: healthCount.CRITICAL, color: '#FF3B3B' },
            ].map(({ key, label, val, color }) => (
              <div key={key} className="flex flex-col items-center bg-[#101617]/50 rounded-lg p-2">
                <span className="text-lg font-black" style={{ color }}>{val}</span>
                <span className="text-[9px] text-lapis-muted tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tengah: Machine Health Progress bars */}
        <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-5 shadow-lg flex flex-col">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-lapis-muted mb-4">
            Fleet Distribution
          </h3>
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {([
              { key: 'HEALTHY' as const, color: '#5FDA0A', glow: '#5FDA0A40', label: 'Healthy' },
              { key: 'WARNING' as const, color: '#EF7513', glow: '#EF751340', label: 'Warning' },
              { key: 'CRITICAL' as const, color: '#FF3B3B', glow: '#FF3B3B40', label: 'Critical' },
            ]).map(({ key, color, glow, label }) => {
              const pct = TOTAL > 0 ? (healthCount[key] / TOTAL) * 100 : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-[11px] text-lapis-muted w-14 font-medium">{label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#101617] overflow-hidden border border-white/5">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${glow}` }} />
                  </div>
                  <span className="text-sm font-bold text-white w-5 text-right">{healthCount[key]}</span>
                  <span className="text-[10px] text-lapis-muted w-8 text-right">{Math.round(pct)}%</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between">
            <span className="text-[10px] text-lapis-muted">Total fleet</span>
            <span className="text-[11px] font-bold text-white">{TOTAL} mesin</span>
          </div>
        </div>

        {/* Kanan: Document Index Status */}
        <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-lapis-muted">
              Document Index
            </h3>
            <Link href={ROUTES.ADMIN_DOCUMENTS}
              className="text-[10px] text-lapis-neon hover:underline flex items-center gap-0.5">
              Kelola <ChevronRight size={10} />
            </Link>
          </div>
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="w-5 h-5 text-lapis-muted animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <FileText className="w-8 h-8 text-lapis-muted/40 mx-auto mb-2" />
                <p className="text-[11px] text-lapis-muted">Belum ada dokumen.</p>
                <Link href={ROUTES.ADMIN_DOCUMENTS}
                  className="text-[10px] text-lapis-neon hover:underline mt-1 block">
                  Upload sekarang →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              {[
                { key: 'READY' as const, label: 'Terindeks', icon: CheckCircle2, color: 'text-lapis-neon', bg: 'bg-lapis-neon/10', border: 'border-lapis-neon/20' },
                { key: 'PROCESSING' as const, label: 'Processing', icon: Loader2, color: 'text-lapis-amber', bg: 'bg-lapis-amber/10', border: 'border-lapis-amber/20' },
                { key: 'FAILED' as const, label: 'Gagal', icon: XCircle, color: 'text-lapis-red', bg: 'bg-lapis-red/10', border: 'border-lapis-red/20' },
              ].map(({ key, label, icon: Icon, color, bg, border }) => (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-lg ${bg} border ${border}`}>
                  <Icon className={`w-4 h-4 ${color} ${key === 'PROCESSING' ? 'animate-spin' : ''} flex-shrink-0`} />
                  <span className={`text-[11px] font-medium ${color} flex-1`}>{label}</span>
                  <span className="text-lg font-black text-white">{docStatus[key]}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between">
            <span className="text-[10px] text-lapis-muted">Total dokumen</span>
            <span className="text-[11px] font-bold text-white">{isLoading ? '…' : documents.length}</span>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Alert Machines + Activity Feed ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kiri: Mesin Perlu Perhatian (compact) */}
        <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-lapis-muted">
              Mesin Perlu Perhatian
            </h3>
          </div>
          {alertMachines.length === 0 ? (
            <div className="flex flex-1 items-center justify-center bg-lapis-neon/5 rounded-lg border border-lapis-neon/10">
              <div className="flex items-center gap-2 p-4">
                <ShieldCheck className="w-4 h-4 text-lapis-neon" />
                <span className="text-xs text-lapis-neon font-medium">Semua mesin beroperasi normal</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alertMachines.map(m => (
                <div key={m.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#101617]/60 border border-white/5
                             hover:bg-[#101617] transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0
                    ${m.status === 'CRITICAL'
                      ? 'bg-lapis-red animate-pulse shadow-[0_0_6px_#FF3B3B]'
                      : 'bg-lapis-amber shadow-[0_0_6px_#EF7513]'}`} />
                  <span className="text-sm font-bold text-white flex-1">{m.id}</span>
                  <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full
                    ${m.status === 'CRITICAL'
                      ? 'bg-lapis-red/15 text-lapis-red border border-lapis-red/25'
                      : 'bg-lapis-amber/15 text-lapis-amber border border-lapis-amber/25'}`}>
                    {m.status}
                  </span>
                  {m.rul_days != null && (
                    <span className="text-[10px] text-lapis-muted font-mono w-16 text-right">
                      {m.rul_days.toFixed(1)} hr
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Kanan: Activity Feed (alerts + maintenance logs) */}
        <div className="rounded-xl bg-[#2B3739]/80 border border-lapis-border/30 p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-lapis-muted">
              Recent Activity
            </h3>
            <span className="text-[10px] text-lapis-neon bg-lapis-neon/10 px-2 py-0.5 rounded-full border border-lapis-neon/20">
              Live Sync
            </span>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
            {/* Active alerts dulu */}
            {activeAlerts.map(a => (
              <div key={a.id} className="flex items-start gap-2.5 px-3 py-2 rounded-lg
                                         bg-[#101617]/50 border border-white/5 group hover:bg-[#101617] transition-colors">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0
                  ${a.severity === 'CRITICAL' ? 'bg-lapis-red animate-pulse' : 'bg-lapis-amber'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{a.machine_id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider
                      ${a.severity === 'CRITICAL' ? 'bg-lapis-red/15 text-lapis-red' : 'bg-lapis-amber/15 text-lapis-amber'}`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-[10px] text-lapis-muted truncate">{a.message}</p>
                </div>
                <span className="text-[9px] text-lapis-muted/60 flex-shrink-0 mt-0.5">
                  {formatTime(a.timestamp)}
                </span>
              </div>
            ))}

            {/* Maintenance logs */}
            {isLoading ? (
              [0, 1, 2].map(i => (
                <div key={i} className="h-10 bg-[#101617] rounded-lg animate-pulse border border-white/5" />
              ))
            ) : recentLogs.length === 0 && activeAlerts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-lapis-muted text-xs
                              bg-[#101617]/30 rounded-lg border border-dashed border-white/5">
                Belum ada aktivitas terbaru.
              </div>
            ) : (
              recentLogs.slice(0, 6 - activeAlerts.length).map(log => (
                <div key={log.log_id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#101617]/50
                             border border-white/5 hover:bg-[#101617] transition-colors group">
                  <div className="w-6 h-6 rounded bg-lapis-neon/10 border border-lapis-neon/15
                                  flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-3 h-3 text-lapis-neon" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{log.machine_id}</span>
                      <span className="text-[9px] text-lapis-muted bg-[#101617] px-1.5 py-0.5 rounded border border-white/5">
                        {log.maintenance_type}
                      </span>
                    </div>
                    {log.cost_idr != null && (
                      <span className="text-[10px] text-lapis-neon font-medium">
                        {formatRupiah(log.cost_idr)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-lapis-muted/60 flex-shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-white/5">
            <Link href={ROUTES.LOGS}
              className="flex items-center justify-center gap-1 text-[10px] text-lapis-muted
                         hover:text-lapis-neon transition-colors">
              Lihat semua log <ChevronRight size={10} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
