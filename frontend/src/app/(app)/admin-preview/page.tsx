'use client'

import { useState } from 'react'
import { Users, FileText, Activity } from 'lucide-react'
import { AdminStatCard, ConfirmDeleteModal, AdminDashboardTab, UserManagementTab, DocumentManagementTab, MaintenanceLogsTab } from '@/components/admin'

export default function AdminPreviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = () => {
    setIsDeleting(true)
    setTimeout(() => {
      setIsDeleting(false)
      setIsModalOpen(false)
    }, 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-8 max-w-6xl mx-auto space-y-12">
      <h1 className="text-3xl font-black text-lapis-text">Admin Components Preview</h1>
      
      <section className="space-y-4 h-[800px] border border-lapis-border rounded-xl bg-black">
        <h2 className="text-xl font-bold text-lapis-text p-4 border-b border-lapis-border">AdminDashboardTab</h2>
        <div className="h-[calc(100%-4rem)] overflow-hidden relative">
          <AdminDashboardTab />
        </div>
      </section>

      <section className="space-y-4 h-[800px] border border-lapis-border rounded-xl bg-black">
        <h2 className="text-xl font-bold text-lapis-text p-4 border-b border-lapis-border">UserManagementTab</h2>
        <div className="h-[calc(100%-4rem)] overflow-hidden relative">
          <UserManagementTab />
        </div>
      </section>

      <section className="space-y-4 h-[800px] border border-lapis-border rounded-xl bg-black">
        <h2 className="text-xl font-bold text-lapis-text p-4 border-b border-lapis-border">DocumentManagementTab</h2>
        <div className="h-[calc(100%-4rem)] overflow-hidden relative">
          <DocumentManagementTab />
        </div>
      </section>

      <section className="space-y-4 h-[800px] border border-lapis-border rounded-xl bg-black">
        <h2 className="text-xl font-bold text-lapis-text p-4 border-b border-lapis-border">MaintenanceLogsTab</h2>
        <div className="h-[calc(100%-4rem)] overflow-hidden relative">
          <MaintenanceLogsTab />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-lapis-text">AdminStatCard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminStatCard
            icon={Users}
            label="Total Users"
            value="1,248"
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
            borderColor="border-blue-500/20"
          />
          <AdminStatCard
            icon={FileText}
            label="Documents Processed"
            value="856"
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
            borderColor="border-emerald-500/20"
          />
          <AdminStatCard
            icon={Activity}
            label="Active Maintenance"
            value="12"
            iconColor="text-orange-500"
            iconBg="bg-orange-500/10"
            borderColor="border-orange-500/20"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-lapis-text">ConfirmDeleteModal</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-lapis-red text-white font-semibold rounded-lg hover:bg-lapis-red/90 transition"
        >
          Open Delete Modal
        </button>

        <ConfirmDeleteModal
          isOpen={isModalOpen}
          title="Hapus Pengguna?"
          description="Tindakan ini tidak dapat dibatalkan. Pengguna akan dihapus secara permanen dari sistem."
          onConfirm={handleDelete}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isDeleting}
        />
      </section>
    </div>
  )
}
