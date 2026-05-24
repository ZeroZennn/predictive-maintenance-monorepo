'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchAdminMaintenanceLogs, createMaintenanceLog, updateMaintenanceLog, deleteMaintenanceLog } from '@/lib/api'
import type { MaintenanceLog } from '@/types'
import { ConfirmDeleteModal } from './index'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PAGE_SIZE = 20

const MACHINE_IDS = Array.from(
  { length: 20 },
  (_, i) => `M-${String(i + 1).padStart(2, '0')}`
)
// Output: ['M-01', 'M-02', ..., 'M-20']

const MAINTENANCE_TYPES = [
  'PREVENTIVE', 'CORRECTIVE', 'EMERGENCY'
] as const

const TYPE_BADGE = {
  PREVENTIVE: 'bg-lapis-neon/10 text-lapis-neon border-lapis-neon/30',
  CORRECTIVE: 'bg-lapis-amber/10 text-lapis-amber border-lapis-amber/30',
  EMERGENCY:  'bg-lapis-red/10 text-lapis-red border-lapis-red/30',
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MOCK_LOGS: MaintenanceLog[] = [
  {
    log_id: 'ML-0001',
    machine_id: 'M-06',
    date: '2025-07-26T00:00:00Z',
    maintenance_type: 'PREVENTIVE',
    component_replaced: 'Sensor',
    duration_hrs: 2.4,
    cost_idr: 2731555,
    technician_notes: null,
    created_at: '2025-07-26T00:00:00Z',
    updated_at: '2025-07-26T00:00:00Z',
  },
  {
    log_id: 'ML-0002',
    machine_id: 'M-08',
    date: '2025-11-22T00:00:00Z',
    maintenance_type: 'CORRECTIVE',
    component_replaced: 'Seal',
    duration_hrs: 9.6,
    cost_idr: 9427034,
    technician_notes: 'Seal aus akibat tekanan berlebih',
    created_at: '2025-11-22T00:00:00Z',
    updated_at: '2025-11-22T00:00:00Z',
  },
  {
    log_id: 'ML-0003',
    machine_id: 'M-01',
    date: '2026-01-15T00:00:00Z',
    maintenance_type: 'EMERGENCY',
    component_replaced: 'Motor',
    duration_hrs: 14.5,
    cost_idr: 15800000,
    technician_notes: 'Motor terbakar — penggantian urgent',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORM TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface LogForm {
  machine_id: string
  date: string
  maintenance_type: MaintenanceLog['maintenance_type']
  component_replaced: string
  duration_hrs: string   // string untuk input, 
                         // parse ke number saat submit
  cost_idr: string       // string untuk input,
                         // parse ke number saat submit
  technician_notes: string
}

const EMPTY_FORM: LogForm = {
  machine_id: 'M-01',
  date: '',
  maintenance_type: 'PREVENTIVE',
  component_replaced: '',
  duration_hrs: '',
  cost_idr: '',
  technician_notes: '',
}

export default function MaintenanceLogsTab() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE LOKAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterMachine, setFilterMachine] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceLog | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<LogForm>(EMPTY_FORM)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA FETCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    fetchAdminMaintenanceLogs()
      .then(setLogs)
      .catch(() => setLogs(MOCK_LOGS))
      .finally(() => setIsLoading(false))
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DERIVED DATA (useMemo — semua filter di sini)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const q = searchQuery.toLowerCase()
      const matchSearch = !q ||
        log.log_id.toLowerCase().includes(q) ||
        log.machine_id.toLowerCase().includes(q)
      const matchType = filterType === 'ALL' ||
        log.maintenance_type === filterType
      const matchMachine = filterMachine === 'ALL' ||
        log.machine_id === filterMachine
      return matchSearch && matchType && matchMachine
    })
  }, [logs, searchQuery, filterType, filterMachine])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredLogs.slice(start, start + PAGE_SIZE)
  }, [filteredLogs, currentPage])

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function openAdd() {
    setForm(EMPTY_FORM)
    setModalMode('add')
  }

  function openEdit(log: MaintenanceLog) {
    setSelectedLog(log)
    setForm({
      machine_id: log.machine_id,
      date: log.date.split('T')[0], // "YYYY-MM-DD"
      maintenance_type: log.maintenance_type,
      component_replaced: log.component_replaced ?? '',
      duration_hrs: log.duration_hrs?.toString() ?? '',
      cost_idr: log.cost_idr?.toString() ?? '',
      technician_notes: log.technician_notes ?? '',
    })
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedLog(null)
  }

  // Parse form ke payload API
  function buildPayload() {
    return {
      machine_id: form.machine_id,
      date: form.date 
        ? new Date(form.date).toISOString() 
        : new Date().toISOString(),
      maintenance_type: form.maintenance_type,
      component_replaced: form.component_replaced || null,
      duration_hrs: form.duration_hrs 
        ? parseFloat(form.duration_hrs) 
        : null,
      cost_idr: form.cost_idr 
        ? parseInt(form.cost_idr) 
        : null,
      technician_notes: form.technician_notes || null,
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (modalMode === 'add') {
        const created = await createMaintenanceLog(buildPayload())
        setLogs(prev => [created, ...prev])
      } else if (modalMode === 'edit' && selectedLog) {
        const updated = await updateMaintenanceLog(selectedLog.log_id, buildPayload())
        setLogs(prev => prev.map(l =>
          l.log_id === updated.log_id ? updated : l
        ))
      }
      closeModal()
    } catch {
      // Optimistic update untuk dev
      if (modalMode === 'add') {
        const mock: MaintenanceLog = {
          log_id: `ML-${String(Date.now()).slice(-4)}`,
          ...buildPayload(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setLogs(prev => [mock, ...prev])
      } else if (modalMode === 'edit' && selectedLog) {
        setLogs(prev => prev.map(l =>
          l.log_id === selectedLog.log_id
            ? { ...l, ...buildPayload(), updated_at: new Date().toISOString() }
            : l
        ))
      }
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsSubmitting(true)
    try {
      await deleteMaintenanceLog(deleteTarget.log_id)
    } catch {
      // Optimistic delete
    } finally {
      setLogs(prev => prev.filter(l => l.log_id !== deleteTarget.log_id))
      setDeleteTarget(null)
      setIsSubmitting(false)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })

  // Helper untuk reset page saat filter berubah
  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v)
      setCurrentPage(1)
    }
  }

  // Shared select className
  const selectCls = `px-3 py-2 text-xs rounded-lg
    bg-[#101617] border border-lapis-border/30
    text-lapis-text focus:outline-none
    focus:border-lapis-neon/50
    transition-colors duration-150`

  // Shared input className
  const inputCls = `px-3 py-2 text-xs rounded-lg
    bg-[#101617] border border-lapis-border/30
    text-lapis-text placeholder:text-lapis-muted
    focus:outline-none focus:border-lapis-neon/50
    transition-colors duration-150`

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STRUKTUR JSX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <>
      <div className="h-full p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden bg-[#2B3739] rounded-2xl shadow-xl border border-lapis-border/30">
        {/* ── Toolbar ── */}
        <div className="flex items-center flex-wrap gap-3 p-5 flex-shrink-0 border-b border-lapis-border/20">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lapis-muted" />
            <input
              type="text"
              placeholder="Cari Log ID atau mesin..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className={`w-full pl-9 pr-4 ${inputCls}`}
            />
          </div>

          {/* Filter Tipe */}
          <select
            value={filterType}
            onChange={e => handleFilterChange(setFilterType)(e.target.value)}
            className={selectCls}
          >
            <option value="ALL">Semua Tipe</option>
            {MAINTENANCE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Filter Mesin */}
          <select
            value={filterMachine}
            onChange={e => handleFilterChange(setFilterMachine)(e.target.value)}
            className={selectCls}
          >
            <option value="ALL">Semua Mesin</option>
            {MACHINE_IDS.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Tambah Log */}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2
                       bg-lapis-neon text-black text-xs
                       font-bold rounded-lg
                       hover:bg-lapis-neon/80
                       transition-colors duration-150
                       flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Log Manual
          </button>
        </div>

        {/* ── Tabel ── */}
        <div className="flex-1 overflow-auto px-4 md:px-6 pt-2 scrollbar-thin scrollbar-thumb-lapis-border scrollbar-track-transparent">
          <div className="rounded-xl overflow-hidden border border-lapis-border/20">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-[#505C5E]">
              <tr className="border-b border-lapis-border/20">
                {['Log ID', 'Tanggal', 'Mesin', 'Tipe', 'Komponen', 'Durasi', 'Biaya', 'Aksi']
                  .map(h => (
                    <th key={h}
                      className="px-4 py-3 text-left
                                 text-lapis-muted font-semibold
                                 uppercase tracking-widest
                                 text-[10px] whitespace-nowrap">
                      {h}
                    </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="bg-[#101617] border-b border-lapis-border/20">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-lapis-surface/50 rounded animate-pulse"/>
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedLogs.length === 0 ? (
                <tr className="bg-[#101617]">
                  <td colSpan={8} className="px-4 py-12 text-center text-lapis-muted">
                    Tidak ada log ditemukan
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => (
                  <tr key={log.log_id} className="bg-[#101617] border-b border-[#2B3739] hover:bg-lapis-surface/30 transition-colors duration-100">
                    {/* Log ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-lapis-muted">
                        {log.log_id}
                      </span>
                    </td>

                    {/* Tanggal */}
                    <td className="px-4 py-3 text-lapis-muted whitespace-nowrap">
                      {formatDate(log.date)}
                    </td>

                    {/* Mesin */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-lapis-neon/10 text-lapis-neon border border-lapis-neon/30">
                        {log.machine_id}
                      </span>
                    </td>

                    {/* Tipe */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${TYPE_BADGE[log.maintenance_type]}`}>
                        {log.maintenance_type}
                      </span>
                    </td>

                    {/* Komponen */}
                    <td className="px-4 py-3 text-lapis-muted max-w-[120px] truncate">
                      {log.component_replaced ?? '—'}
                    </td>

                    {/* Durasi */}
                    <td className="px-4 py-3 text-lapis-text whitespace-nowrap">
                      {log.duration_hrs != null ? `${log.duration_hrs} jam` : '—'}
                    </td>

                    {/* Biaya */}
                    <td className="px-4 py-3 text-lapis-neon whitespace-nowrap font-semibold">
                      {log.cost_idr != null ? formatRupiah(log.cost_idr) : '—'}
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(log)}
                          className="p-1.5 rounded-lg text-lapis-muted hover:text-lapis-neon hover:bg-lapis-neon/10 transition-colors duration-150">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(log)}
                          className="p-1.5 rounded-lg text-lapis-muted hover:text-lapis-red hover:bg-lapis-red/10 transition-colors duration-150">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-lapis-border flex-shrink-0">
          <span className="text-xs text-lapis-muted">
            {filteredLogs.length} log ditemukan
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-lapis-muted hover:text-lapis-text disabled:opacity-30 transition-colors duration-150">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors duration-150 ${currentPage === i + 1 ? 'bg-lapis-neon text-black' : 'text-lapis-muted hover:text-lapis-text'}`}>
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-lapis-muted hover:text-lapis-text disabled:opacity-30 transition-colors duration-150">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* ── MODAL TAMBAH / EDIT ── */}
      <AnimatePresence>
        {modalMode && (
          <>
            <motion.div
              key="log-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="log-modal"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md mx-4 rounded-2xl bg-lapis-surface border border-lapis-border shadow-2xl p-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-lapis-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-lapis-text">
                    {modalMode === 'add' ? 'Tambah Log Manual' : `Edit Log ${selectedLog?.log_id}`}
                  </h3>
                  <button onClick={closeModal}>
                    <X className="w-4 h-4 text-lapis-muted hover:text-lapis-text" />
                  </button>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-3">
                  {/* Mesin + Tipe (2 kolom) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                        Mesin *
                      </label>
                      <select
                        value={form.machine_id}
                        onChange={e => setForm(f => ({ ...f, machine_id: e.target.value }))}
                        className={selectCls}>
                        {MACHINE_IDS.map(id => (
                          <option key={id} value={id}>{id}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                        Tipe *
                      </label>
                      <select
                        value={form.maintenance_type}
                        onChange={e => setForm(f => ({
                          ...f,
                          maintenance_type: e.target.value as MaintenanceLog['maintenance_type']
                        }))}
                        className={selectCls}>
                        {MAINTENANCE_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tanggal */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Komponen Diganti */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                      Komponen Diganti
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Sensor, Seal, Motor"
                      value={form.component_replaced}
                      onChange={e => setForm(f => ({ ...f, component_replaced: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Durasi + Biaya (2 kolom) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                        Durasi (jam)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="0.0"
                        value={form.duration_hrs}
                        onChange={e => setForm(f => ({ ...f, duration_hrs: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                        Biaya (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.cost_idr}
                        onChange={e => setForm(f => ({ ...f, cost_idr: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Catatan Teknisi */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-widest text-lapis-muted">
                      Catatan Teknisi
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Catatan opsional..."
                      value={form.technician_notes}
                      onChange={e => setForm(f => ({ ...f, technician_notes: e.target.value }))}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-lapis-muted bg-lapis-card border border-lapis-border hover:text-lapis-text disabled:opacity-50 transition-colors duration-150">
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !form.machine_id || !form.date}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-black bg-lapis-neon hover:bg-lapis-neon/80 disabled:opacity-50 flex items-center gap-2 transition-colors duration-150">
                    {isSubmitting && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE ── */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Hapus log "${deleteTarget?.log_id}"?`}
        description={`Log maintenance mesin ${deleteTarget?.machine_id} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isSubmitting}
      />
    </>
  )
}
