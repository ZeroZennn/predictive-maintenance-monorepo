'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMachineStore } from '@/stores'
import { useMaintenanceStore } from '@/stores'
import { fetchUsers, fetchDocuments, fetchAdminMaintenanceLogs } from '@/lib/api'
import { AdminStatCard } from './index'
import type { AdminUser, AdminDocument, MaintenanceLog } from '@/types'
import { Users, Factory, FileText, Wrench, AlertTriangle } from 'lucide-react'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts'

export default function AdminDashboardTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [documents, setDocuments] = useState<AdminDocument[]>([])
  const [recentLogs, setRecentLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const machines = useMachineStore(s => s.machines)
  const tasks = useMaintenanceStore(s => s.tasks)
  const activeTasks = useMemo(() => 
    tasks.filter(t => t.status !== 'DONE'), 
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
          setRecentLogs(l.value ? l.value.slice(0, 5) : [])
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const machineList = useMemo(
    () => Object.values(machines), [machines]
  )

  const healthCount = useMemo(() => ({
    HEALTHY:  machineList.filter(
      m => m.status === 'HEALTHY').length,
    WARNING:  machineList.filter(
      m => m.status === 'WARNING').length,
    CRITICAL: machineList.filter(
      m => m.status === 'CRITICAL').length,
  }), [machineList])

  const alertMachines = useMemo(() =>
    machineList
      .filter(m => 
        m.status === 'WARNING' || 
        m.status === 'CRITICAL'
      )
      .sort((a, b) => 
        (a.rul_days ?? 999) - (b.rul_days ?? 999)
      )
      .slice(0, 5),
    [machineList]
  )

  const docStatus = useMemo(() => ({
    READY:      documents.filter(
      d => d.status === 'READY').length,
    PROCESSING: documents.filter(
      d => d.status === 'PROCESSING').length,
    FAILED:     documents.filter(
      d => d.status === 'FAILED').length,
  }), [documents])
  
  const rulData = useMemo(() => {
    return machineList
      .filter(m => m.rul_days !== null && m.rul_days !== undefined)
      .sort((a, b) => a.rul_days! - b.rul_days!)
      .slice(0, 8)
      .map(m => ({
        name: m.id,
        rul: parseFloat(m.rul_days!.toFixed(1)),
        fill: m.status === 'CRITICAL' ? '#f87171' : m.status === 'WARNING' ? '#fbbf24' : '#5FDA0A'
      }))
  }, [machineList])

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })

  return (
    <div className="flex flex-col gap-6 p-6 
                    overflow-y-auto h-full
                    scrollbar-thin 
                    scrollbar-thumb-lapis-border
                    scrollbar-track-transparent">

      {/* ── BARIS 1: 4 Stat Cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <AdminStatCard
          icon={Factory}
          label="Total Mesin"
          value={20}
        />
        <AdminStatCard
          icon={Users}
          label="Total User"
          value={isLoading ? '...' : users.length}
        />
        <AdminStatCard
          icon={FileText}
          label="Total Dokumen"
          value={isLoading ? '...' : documents.length}
        />
        <AdminStatCard
          icon={Wrench}
          label="Active Tasks"
          value={activeTasks.length}
          iconColor="text-lapis-amber"
          iconBg="bg-lapis-amber/10"
          borderColor="border-lapis-amber/20"
        />
      </div>

      {/* ── BARIS 2: Visual Analytics (RUL Chart) ── */}
      <div className="rounded-xl bg-[#2B3739]/80 backdrop-blur-md 
                      border border-lapis-border/30 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#5FDA0A]">
            Critical Machines (Lowest RUL)
          </h3>
          <span className="text-xs text-lapis-muted bg-[#101617] px-3 py-1 rounded-full border border-white/5">Real-time Forecast</span>
        </div>
        <div className="h-64 w-full">
          {rulData.length === 0 ? (
             <div className="flex h-full items-center justify-center text-lapis-muted text-sm">
               Data simulasi RUL belum tersedia.
             </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rulData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#607678" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#607678" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#101617', borderColor: '#2B3739', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#5FDA0A' }}
                />
                <Bar dataKey="rul" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {rulData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── BARIS 3: Health Distribution + Alert List ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kiri: Health Distribution */}
        <div className="rounded-xl bg-[#2B3739]/80 backdrop-blur-md 
                        border border-lapis-border/30 p-5 shadow-lg flex flex-col">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-6">
            Machine Health Distribution
          </h3>
          <div className="flex flex-col gap-5 flex-1 justify-center">
            {([
              { key: 'HEALTHY',  color: 'bg-[#5FDA0A]', shadow: 'shadow-[0_0_10px_#5FDA0A]',
                label: 'Healthy' },
              { key: 'WARNING',  color: 'bg-lapis-amber', shadow: 'shadow-[0_0_10px_#fbbf24]',
                label: 'Warning' },
              { key: 'CRITICAL', color: 'bg-lapis-red', shadow: 'shadow-[0_0_10px_#f87171]',
                label: 'Critical' },
            ] as const).map(({ key, color, shadow, label }) => (
              <div key={key} className="flex items-center gap-4">
                <span className="text-xs font-medium text-lapis-muted w-16">
                  {label}
                </span>
                <div className="flex-1 h-3 rounded-full 
                                bg-[#101617] overflow-hidden border border-white/5 relative">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full 
                                ${color} ${shadow} transition-all 
                                duration-1000 ease-out`}
                    style={{ 
                      width: `${(healthCount[key] / 20) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-bold 
                                 text-white w-6 text-right">
                  {healthCount[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kanan: Alert List */}
        <div className="rounded-xl bg-[#2B3739]/80 backdrop-blur-md 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Mesin Perlu Perhatian
          </h3>
          {alertMachines.length === 0 ? (
            <div className="flex items-center gap-2 
                            text-[#5FDA0A] mt-8 bg-[#5FDA0A]/10 p-4 rounded-lg border border-[#5FDA0A]/20">
              <div className="w-2 h-2 rounded-full 
                              bg-[#5FDA0A] animate-pulse" />
              <span className="text-sm font-medium">
                Semua mesin dalam kondisi prima. Tidak ada peringatan aktif.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {alertMachines.map(m => (
                <div key={m.id}
                  className="flex items-center justify-between bg-[#101617]/50 p-3 rounded-lg border border-white/5 hover:bg-[#101617] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm
                      flex-shrink-0 ${
                        m.status === 'CRITICAL'
                          ? 'bg-lapis-red animate-pulse shadow-[0_0_8px_#f87171]'
                          : 'bg-lapis-amber shadow-[0_0_8px_#fbbf24]'
                      }`} />
                    <span className="text-sm font-bold text-white tracking-wide">
                      {m.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold tracking-wider uppercase
                      px-2.5 py-1 rounded-md ${
                        m.status === 'CRITICAL'
                          ? 'bg-lapis-red/20 text-lapis-red border border-lapis-red/30'
                          : 'bg-lapis-amber/20 text-lapis-amber border border-lapis-amber/30'
                      }`}>
                      {m.status}
                    </span>
                    {m.rul_days != null && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-lapis-muted uppercase tracking-wider">RUL</span>
                        <span className="text-xs font-bold text-white">
                          {m.rul_days.toFixed(1)} <span className="text-lapis-muted font-normal text-[10px]">Hari</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── BARIS 4: Doc Status + Recent Logs ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kiri: Document Status */}
        <div className="rounded-xl bg-[#2B3739]/80 backdrop-blur-md 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Document Index Status
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'READY', label: 'Ready',
                color: 'bg-[#5FDA0A]', shadow: 'shadow-[#5FDA0A]/20' },
              { key: 'PROCESSING', label: 'Processing',
                color: 'bg-lapis-amber animate-pulse', shadow: 'shadow-lapis-amber/20' },
              { key: 'FAILED', label: 'Failed',
                color: 'bg-lapis-red', shadow: 'shadow-lapis-red/20' },
            ] as const).map(({ key, label, color, shadow }) => (
              <div key={key} 
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#101617]/50 border border-white/5 shadow-inner ${shadow}`}>
                <span className="text-[10px] text-lapis-muted uppercase tracking-wider font-medium">
                  {label}
                </span>
                <span className="text-2xl font-black text-white">
                  {isLoading ? '...' : docStatus[key]}
                </span>
                <div className={`w-8 h-1 rounded-full ${color} mt-1 opacity-80`} />
              </div>
            ))}
          </div>
        </div>

        {/* Kanan: Recent Logs */}
        <div className="rounded-xl bg-[#2B3739]/80 backdrop-blur-md 
                        border border-lapis-border/30 p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-semibold uppercase 
                           tracking-widest text-lapis-muted">
              Log Terbaru
            </h3>
            <span className="text-[10px] text-[#5FDA0A] bg-[#5FDA0A]/10 px-2 py-0.5 rounded-full border border-[#5FDA0A]/20">Live Sync</span>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} 
                  className="h-8 bg-[#101617] 
                             rounded-lg animate-pulse border border-white/5" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-lapis-muted bg-[#101617]/50 rounded-lg border border-white/5 border-dashed">
              Belum ada log maintenance.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentLogs.map(log => (
                <div key={log.log_id}
                  className="flex items-center justify-between p-2 hover:bg-[#101617] rounded-md transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#101617] border border-white/5 flex items-center justify-center text-lapis-muted group-hover:text-white transition-colors">
                      <Wrench size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">
                        {log.machine_id}
                      </span>
                      <span className="text-[10px] font-mono text-lapis-muted">
                        ID: {log.log_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {log.cost_idr != null && (
                      <span className="text-xs font-bold text-[#5FDA0A]">
                        {formatRupiah(log.cost_idr)}
                      </span>
                    )}
                    <span className="text-[10px] text-lapis-muted">
                      {log.duration_hrs != null 
                        ? `${log.duration_hrs} Jam` 
                        : 'Durasi N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
