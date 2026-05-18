import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaintenanceTask, KanbanColumnType } from '@/types';
import { TaskCard } from './index';
import { AlertOctagon, Clock, CalendarCheck } from 'lucide-react';

interface KanbanColumnProps {
  type: KanbanColumnType;
  tasks: MaintenanceTask[];
}

// ── COLUMN CONFIG (objek lokal) ──
const COLUMN_CONFIG = {
  URGENT: {
    label: 'URGENT',
    subtext: '< 3 Hari',
    Icon: AlertOctagon,
    headerColor: 'text-lapis-red',
    borderAccent: 'border-none',
    badgeBg: 'bg-lapis-red/20 text-lapis-red',
    emptyText: 'Tidak ada tugas mendesak',
  },
  SOON: {
    label: 'SOON',
    subtext: '3 – 7 Hari',
    Icon: Clock,
    headerColor: 'text-lapis-amber',
    borderAccent: 'border-none',
    badgeBg: 'bg-lapis-amber/20 text-lapis-amber',
    emptyText: 'Tidak ada tugas dalam waktu dekat',
  },
  SCHEDULED: {
    label: 'SCHEDULED',
    subtext: '> 7 Hari',
    Icon: CalendarCheck,
    headerColor: 'text-lapis-neon',
    borderAccent: 'border-none',
    badgeBg: 'bg-lapis-neon/20 text-lapis-neon',
    emptyText: 'Tidak ada tugas terjadwal',
  },
} as const;

export default function KanbanColumn({ type, tasks }: KanbanColumnProps) {
  const config = COLUMN_CONFIG[type];
  const Icon = config.Icon;

  return (
    <div className={`
      flex flex-col h-full rounded-xl 
      bg-gradient-to-b from-[#2B3739] to-[#1C2626] border ${config.borderAccent}
      overflow-hidden
    `}>

      {/* Header Kolom — sticky */}
      <div className={`
        flex items-center justify-between
        px-4 py-3 border-b ${config.borderAccent}
        flex-shrink-0 bg-gradient-to-b from-[#2B3739] to-[#1C2626]
      `}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.headerColor}`} />
          <div className="flex flex-col">
            <span className={`
              text-xs font-black uppercase tracking-widest 
              ${config.headerColor}
            `}>
              {config.label}
            </span>
            <span className="text-[10px] text-lapis-muted">
              {config.subtext}
            </span>
          </div>
        </div>

        {/* Counter badge */}
        <span className={`
          text-[10px] font-bold px-2 py-0.5 
          rounded-full ${config.badgeBg}
        `}>
          {tasks.length} tasks
        </span>
      </div>

      {/* Scrollable Card List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5
                      scrollbar-thin scrollbar-thumb-lapis-border
                      scrollbar-track-transparent">

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center 
                          justify-center h-full gap-2 
                          py-12 text-lapis-muted">
            <Icon className="w-8 h-8 opacity-20" />
            <p className="text-xs text-center">
              {config.emptyText}
            </p>
          </div>
        )}

        {/* AnimatePresence untuk entry/exit card */}
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <motion.div
              key={task.task_id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <TaskCard task={task} />
            </motion.div>
          ))}
        </AnimatePresence>

      </div>

      {/* Footer counter */}
      <div className={`
        px-4 py-2 border-t ${config.borderAccent} 
        flex-shrink-0
      `}>
        <p className="text-[10px] text-lapis-muted">
          {tasks.length} dari total tugas aktif
        </p>
      </div>

    </div>
  );
}
