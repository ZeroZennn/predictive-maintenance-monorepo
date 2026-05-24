import { LucideIcon } from 'lucide-react'

interface AdminStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  iconColor?: string
  iconBg?: string
  borderColor?: string
}

export default function AdminStatCard({
  icon: Icon,
  label,
  value,
  iconColor = 'text-lapis-neon',
  iconBg = 'bg-lapis-neon/10',
  borderColor = 'border-lapis-border',
}: AdminStatCardProps) {
  return (
    <div className={`
      flex items-center gap-4 p-5 rounded-xl
      bg-[#2B3739] border ${borderColor} shadow-lg
      hover:border-lapis-neon/30
      transition-colors duration-150
    `}>
      {/* Icon container */}
      <div className={`
        w-12 h-12 rounded-xl flex-shrink-0
        flex items-center justify-center
        ${iconBg} border border-white/5
      `}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <span className="text-2xl font-black text-lapis-text
                         leading-none">
          {value}
        </span>
        <span className="text-[11px] text-lapis-muted 
                         uppercase tracking-widest mt-1">
          {label}
        </span>
      </div>
    </div>
  )
}
