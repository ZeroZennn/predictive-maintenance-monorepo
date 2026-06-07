'use client'

import { useState, useEffect, useMemo } from 'react'
import { fetchUsers, createUser, updateUser, deleteUser } from '@/lib/api'
import type { AdminUser } from '@/types'
import { ConfirmDeleteModal } from './index'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, X, Loader2, UserCircle } from 'lucide-react'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DATA (aktif sebelum Backend siap)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MOCK_USERS: AdminUser[] = [
  {
    user_id: 'u-001', name: 'Budi Santoso',
    email: 'budi@lapisai.id', role: 'TECHNICIAN',
    status: 'ACTIVE',
    created_at: '2025-01-10T00:00:00Z'
  },
  {
    user_id: 'u-002', name: 'Rina Dewi',
    email: 'rina@lapisai.id', role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2025-01-08T00:00:00Z'
  },
  {
    user_id: 'u-003', name: 'Hendra Kusuma',
    email: 'hendra@lapisai.id', role: 'TECHNICIAN',
    status: 'INACTIVE',
    created_at: '2025-02-15T00:00:00Z'
  },
]

export default function UserManagementTab() {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STATE LOKAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    role: 'TECHNICIAN' as AdminUser['role'],
    status: 'ACTIVE' as AdminUser['status'],
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DATA FETCH
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => setUsers(MOCK_USERS))
      .finally(() => setIsLoading(false))
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DERIVED DATA (useMemo — TIDAK filter di selector)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HANDLERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function openAdd() {
    setForm({
      name: '', email: '', password: '',
      role: 'TECHNICIAN', status: 'ACTIVE'
    })
    setModalMode('add')
  }

  function openEdit(user: AdminUser) {
    setSelectedUser(user)
    setForm({
      name: user.name, email: user.email,
      password: '', role: user.role,
      status: user.status
    })
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setSelectedUser(null)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (modalMode === 'add') {
        const newUser = await createUser(form)
        setUsers(prev => [newUser, ...prev])
      } else if (modalMode === 'edit' && selectedUser) {
        const payload = { ...form }
        if (!payload.password)
          delete (payload as Partial<typeof form>).password
        const updated = await updateUser(selectedUser.user_id, payload)
        setUsers(prev => prev.map(u =>
          u.user_id === updated.user_id ? updated : u
        ))
      }
      closeModal()
    } catch {
      // API belum siap — optimistic update untuk dev
      if (modalMode === 'add') {
        const mock: AdminUser = {
          user_id: `u-${Date.now()}`,
          name: form.name, email: form.email,
          role: form.role, status: form.status,
          created_at: new Date().toISOString(),
        }
        setUsers(prev => [mock, ...prev])
      } else if (modalMode === 'edit' && selectedUser) {
        setUsers(prev => prev.map(u =>
          u.user_id === selectedUser.user_id
            ? { ...u, ...form } : u
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
      await deleteUser(deleteTarget.user_id)
    } catch {
      // Optimistic delete untuk dev
    } finally {
      setUsers(prev => prev.filter(
        u => u.user_id !== deleteTarget.user_id
      ))
      setDeleteTarget(null)
      setIsSubmitting(false)
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STRUKTUR JSX
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="h-full p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col h-full overflow-hidden bg-[#2B3739] rounded-2xl shadow-xl border border-lapis-border/30">

        {/* Toolbar */}
        <div className="flex items-center justify-between 
                      gap-4 p-5 flex-shrink-0
                      border-b border-lapis-border/20">

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 
                             -translate-y-1/2 w-3.5 h-3.5 
                             text-lapis-muted" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 text-xs
                       bg-[#101617] border border-lapis-border/30
                       rounded-lg text-lapis-text
                       placeholder:text-lapis-muted
                       focus:outline-none 
                       focus:border-lapis-neon/50
                       transition-colors duration-150"
            />
          </div>

          {/* Tambah User Button */}
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2
                     bg-lapis-neon text-black text-xs 
                     font-bold rounded-lg
                     hover:bg-lapis-neon/80
                     transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah User
          </button>
        </div>

        {/* Tabel */}
        <div className="flex-1 overflow-auto px-4 md:px-6 pt-2
                      scrollbar-thin 
                      scrollbar-thumb-lapis-border
                      scrollbar-track-transparent">
          <div className="rounded-xl overflow-hidden border border-lapis-border/20">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 
                            bg-[#505C5E]">
                <tr className="border-b border-lapis-border/20">
                  {['Nama', 'Email', 'Role',
                    'Status', 'Bergabung', 'Aksi']
                    .map(h => (
                      <th key={h}
                        className="px-4 py-3 text-left 
                               text-lapis-muted 
                               font-semibold uppercase 
                               tracking-widest text-[10px]">
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton rows
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}
                      className="bg-[#101617] border-b border-lapis-border/20">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 bg-lapis-surface/50 
                                      rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedUsers.length === 0 ? (
                  <tr className="bg-[#101617]">
                    <td colSpan={6}
                      className="px-4 py-12 text-center 
                             text-lapis-muted">
                      Tidak ada user ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => (
                    <tr key={user.user_id ?? `user-row-${idx}`}
                      className="bg-[#101617] border-b border-[#2B3739]
                             hover:bg-lapis-surface/30
                             transition-colors duration-100">

                      {/* Nama */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full
                                      bg-lapis-neon/10
                                      border border-lapis-neon/20
                                      flex items-center 
                                      justify-center flex-shrink-0">
                            <UserCircle className="w-4 h-4 
                                               text-lapis-neon" />
                          </div>
                          <span className="font-semibold 
                                       text-lapis-text">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-lapis-muted">
                        {user.email}
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full 
                      text-[10px] font-bold border ${user.role === 'ADMIN'
                            ? 'bg-lapis-neon/10 text-lapis-neon border-lapis-neon/30'
                            : 'bg-lapis-amber/10 text-lapis-amber border-lapis-amber/30'
                          }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status dot */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full 
                        ${user.status === 'ACTIVE'
                              ? 'bg-lapis-neon'
                              : 'bg-lapis-muted'}`} />
                          <span className="text-lapis-muted">
                            {user.status}
                          </span>
                        </div>
                      </td>

                      {/* Bergabung */}
                      <td className="px-4 py-3 text-lapis-muted">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg
                                   text-lapis-muted
                                   hover:text-lapis-neon
                                   hover:bg-lapis-neon/10
                                   transition-colors duration-150">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="p-1.5 rounded-lg
                                   text-lapis-muted
                                   hover:text-lapis-red
                                   hover:bg-lapis-red/10
                                   transition-colors duration-150">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between
                        px-5 py-3 border-t border-lapis-border
                        flex-shrink-0">
            <span className="text-xs text-lapis-muted">
              {filteredUsers.length} user total
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs
                  font-semibold transition-colors duration-150
                  ${currentPage === i + 1
                      ? 'bg-lapis-neon text-black'
                      : 'text-lapis-muted hover:text-lapis-text'
                    }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL TAMBAH / EDIT ── */}
      <AnimatePresence>
        {modalMode && (
          <>
            <motion.div
              key="user-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-50 
                         bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              key="user-modal"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                damping: 25, stiffness: 300
              }}
              className="fixed inset-0 z-50 flex 
                         items-center justify-center
                         pointer-events-none"
            >
              <div className="pointer-events-auto w-full
                              max-w-md mx-4 rounded-2xl
                              bg-lapis-surface 
                              border border-lapis-border
                              shadow-2xl p-6">

                {/* Header Modal */}
                <div className="flex items-center 
                                justify-between mb-5">
                  <h3 className="text-sm font-bold 
                                 text-lapis-text">
                    {modalMode === 'add'
                      ? 'Tambah User Baru'
                      : `Edit: ${selectedUser?.name}`}
                  </h3>
                  <button onClick={closeModal}>
                    <X className="w-4 h-4 text-lapis-muted
                                  hover:text-lapis-text" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-3">

                  {/* Nama */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase
                                      tracking-widest 
                                      text-lapis-muted">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(
                        f => ({ ...f, name: e.target.value })
                      )}
                      className="px-3 py-2 text-xs rounded-lg
                                 bg-lapis-card 
                                 border border-lapis-border
                                 text-lapis-text
                                 focus:outline-none 
                                 focus:border-lapis-neon/50
                                 transition-colors duration-150"
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase
                                      tracking-widest 
                                      text-lapis-muted">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(
                        f => ({ ...f, email: e.target.value })
                      )}
                      className="px-3 py-2 text-xs rounded-lg
                                 bg-lapis-card 
                                 border border-lapis-border
                                 text-lapis-text
                                 focus:outline-none 
                                 focus:border-lapis-neon/50
                                 transition-colors duration-150"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase
                                      tracking-widest 
                                      text-lapis-muted">
                      Password
                      {modalMode === 'edit' &&
                        ' (kosongkan jika tidak diubah)'}
                      {modalMode === 'add' && ' *'}
                    </label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(
                        f => ({ ...f, password: e.target.value })
                      )}
                      className="px-3 py-2 text-xs rounded-lg
                                 bg-lapis-card 
                                 border border-lapis-border
                                 text-lapis-text
                                 focus:outline-none 
                                 focus:border-lapis-neon/50
                                 transition-colors duration-150"
                    />
                  </div>

                  {/* Role + Status (2 kolom) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase
                                        tracking-widest 
                                        text-lapis-muted">
                        Role *
                      </label>
                      <select
                        value={form.role}
                        onChange={e => setForm(f => ({
                          ...f,
                          role: e.target.value as
                            AdminUser['role']
                        }))}
                        className="px-3 py-2 text-xs rounded-lg
                                   bg-lapis-card 
                                   border border-lapis-border
                                   text-lapis-text
                                   focus:outline-none 
                                   focus:border-lapis-neon/50
                                   transition-colors duration-150">
                        <option value="TECHNICIAN">
                          TECHNICIAN
                        </option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase
                                        tracking-widest 
                                        text-lapis-muted">
                        Status *
                      </label>
                      <select
                        value={form.status}
                        onChange={e => setForm(f => ({
                          ...f,
                          status: e.target.value as
                            AdminUser['status']
                        }))}
                        className="px-3 py-2 text-xs rounded-lg
                                   bg-lapis-card 
                                   border border-lapis-border
                                   text-lapis-text
                                   focus:outline-none
                                   focus:border-lapis-neon/50
                                   transition-colors duration-150">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg text-xs
                               font-semibold text-lapis-muted
                               bg-lapis-card border 
                               border-lapis-border
                               hover:text-lapis-text
                               disabled:opacity-50
                               transition-colors duration-150">
                    Batal
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !form.name
                      || !form.email}
                    className="px-4 py-2 rounded-lg text-xs
                               font-semibold text-black
                               bg-lapis-neon
                               hover:bg-lapis-neon/80
                               disabled:opacity-50
                               flex items-center gap-2
                               transition-colors duration-150">
                    {isSubmitting && (
                      <Loader2 className="w-3 h-3 
                                          animate-spin" />
                    )}
                    Simpan
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Hapus user "${deleteTarget?.name}"?`}
        description="Tindakan ini tidak dapat dibatalkan. 
          User akan dihapus permanen dari sistem."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isSubmitting}
      />
    </div>
  )
}
