import type { AdminTab } from '@/types'
import { LayoutDashboard, Users, FileText, ClipboardList, LucideIcon } from 'lucide-react'

interface AdminTabBarProps {
  activeTab: AdminTab
  onChange: (tab: AdminTab) => void
}

const TAB_CONFIG: {
  key: AdminTab
  label: string
  icon: LucideIcon
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users',     label: 'Manajemen User', icon: Users },
  { key: 'documents', label: 'Manajemen Dokumen', icon: FileText },
  { key: 'logs',      label: 'Maintenance Logs', icon: ClipboardList },
]

export default function AdminTabBar({ activeTab, onChange }: AdminTabBarProps) {
  return (
    <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
      <div className="flex items-end gap-1 px-4 pt-2
                      bg-[#2B3739] rounded-xl border border-lapis-border/30
                      flex-shrink-0 overflow-hidden">
      {TAB_CONFIG.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-3
              text-xs font-semibold border-b-2
              transition-all duration-150
              whitespace-nowrap
              ${isActive
                ? 'border-lapis-neon text-lapis-neon'
                : 'border-transparent text-lapis-muted hover:text-lapis-text hover:border-lapis-border'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        )
      })}
      </div>
    </div>
  )
}
