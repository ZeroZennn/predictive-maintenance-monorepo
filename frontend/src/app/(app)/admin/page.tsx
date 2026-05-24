'use client'

import { useState } from 'react'
import type { AdminTab } from '@/types'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AdminTabBar,
  AdminDashboardTab,
  UserManagementTab,
  DocumentManagementTab,
  MaintenanceLogsTab,
} from '@/components/admin'
import { ShieldCheck } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header Bar ── */}
      <div className="flex items-center justify-between
                      px-6 py-4 flex-shrink-0
                      border-b border-lapis-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg
                          bg-lapis-neon/10
                          border border-lapis-neon/30
                          flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-lapis-neon" />
          </div>
          <div>
            <h1 className="text-sm font-black 
                           uppercase tracking-widest
                           text-lapis-text">
              Admin Panel
            </h1>
            <p className="text-[10px] text-lapis-muted">
              Pusat Kendali Administratif
            </p>
          </div>
        </div>

        {/* Role badge */}
        <span className="text-[10px] font-bold px-3 py-1 rounded-full
                         bg-lapis-neon/10 text-lapis-neon
                         border border-lapis-neon/30
                         uppercase tracking-widest">
          Admin Access
        </span>
      </div>

      {/* ── Tab Bar ── */}
      <AdminTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <AdminDashboardTab />}
            {activeTab === 'users' && <UserManagementTab />}
            {activeTab === 'documents' && <DocumentManagementTab />}
            {activeTab === 'logs' && <MaintenanceLogsTab />}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}
