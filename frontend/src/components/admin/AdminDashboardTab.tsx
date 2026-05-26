'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMachineStore } from '@/stores'
import { useMaintenanceStore } from '@/stores'
import { fetchUsers, fetchDocuments, fetchAdminMaintenanceLogs } from '@/lib/api'
import { AdminStatCard } from './index'
import type { AdminUser, AdminDocument, MaintenanceLog } from '@/types'
import { Users, Factory, FileText, Wrench, AlertTriangle } from 'lucide-react'

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

      {/* ── BARIS 2: Health Distribution + Alert List ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kiri: Health Distribution */}
        <div className="rounded-xl bg-[#2B3739] 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Machine Health Distribution
          </h3>
          <div className="flex flex-col gap-3">
            {([
              { key: 'HEALTHY',  color: 'bg-lapis-neon',
                label: 'Healthy' },
              { key: 'WARNING',  color: 'bg-lapis-amber',
                label: 'Warning' },
              { key: 'CRITICAL', color: 'bg-lapis-red',
                label: 'Critical' },
            ] as const).map(({ key, color, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-lapis-muted w-14">
                  {label}
                </span>
                <div className="flex-1 h-2 rounded-full 
                                bg-[#101617] overflow-hidden">
                  <div
                    className={`h-full rounded-full 
                                ${color} transition-all 
                                duration-700`}
                    style={{ 
                      width: `${(healthCount[key] / 20) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs font-bold 
                                 text-lapis-text w-4 text-right">
                  {healthCount[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kanan: Alert List */}
        <div className="rounded-xl bg-[#2B3739] 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Mesin Perlu Perhatian
          </h3>
          {alertMachines.length === 0 ? (
            <div className="flex items-center gap-2 
                            text-lapis-neon">
              <div className="w-2 h-2 rounded-full 
                              bg-lapis-neon" />
              <span className="text-xs">
                Semua mesin dalam kondisi prima
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {alertMachines.map(m => (
                <div key={m.id}
                  className="flex items-center 
                             justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full 
                      flex-shrink-0 ${
                        m.status === 'CRITICAL'
                          ? 'bg-lapis-red animate-pulse'
                          : 'bg-lapis-amber'
                      }`} />
                    <span className="text-xs font-semibold 
                                     text-lapis-text">
                      {m.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold 
                      px-2 py-0.5 rounded-full ${
                        m.status === 'CRITICAL'
                          ? 'bg-lapis-red/20 text-lapis-red'
                          : 'bg-lapis-amber/20 text-lapis-amber'
                      }`}>
                      {m.status}
                    </span>
                    {m.rul_days != null && (
                      <span className="text-[10px] 
                                       text-lapis-muted">
                        {m.rul_days.toFixed(0)}d
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── BARIS 3: Doc Status + Recent Logs ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Kiri: Document Status */}
        <div className="rounded-xl bg-[#2B3739] 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Document Index Status
          </h3>
          <div className="flex flex-col gap-2">
            {([
              { key: 'READY', label: 'Ready',
                color: 'bg-lapis-neon' },
              { key: 'PROCESSING', label: 'Processing',
                color: 'bg-lapis-amber animate-pulse' },
              { key: 'FAILED', label: 'Failed',
                color: 'bg-lapis-red' },
            ] as const).map(({ key, label, color }) => (
              <div key={key} 
                className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full 
                                flex-shrink-0 ${color}`} />
                <span className="text-xs text-lapis-muted 
                                 flex-1">
                  {label}
                </span>
                <span className="text-xs font-bold 
                                 text-lapis-text">
                  {isLoading ? '...' : docStatus[key]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Kanan: Recent Logs */}
        <div className="rounded-xl bg-[#2B3739] 
                        border border-lapis-border/30 p-5 shadow-lg">
          <h3 className="text-xs font-semibold uppercase 
                         tracking-widest text-lapis-muted mb-4">
            Log Terbaru
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[0,1,2].map(i => (
                <div key={i} 
                  className="h-4 bg-[#101617] 
                             rounded animate-pulse" />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-xs text-lapis-muted">
              Belum ada log maintenance
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentLogs.map(log => (
                <div key={log.log_id}
                  className="flex items-center 
                             justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono 
                                     text-lapis-muted">
                      {log.log_id}
                    </span>
                    <span className="text-xs font-semibold 
                                     text-lapis-text">
                      {log.machine_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] 
                                     text-lapis-muted">
                      {log.duration_hrs != null 
                        ? `${log.duration_hrs}h` 
                        : '-'}
                    </span>
                    {log.cost_idr != null && (
                      <span className="text-[10px] 
                                       text-lapis-neon">
                        {formatRupiah(log.cost_idr)}
                      </span>
                    )}
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
