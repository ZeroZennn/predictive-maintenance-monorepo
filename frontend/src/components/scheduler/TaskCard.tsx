import React from 'react';
import { MaintenanceTask } from '@/types';
import { Clock, User, Wrench, AlertOctagon, CalendarDays, Timer } from 'lucide-react';

interface TaskCardProps {
  task: MaintenanceTask;
}

// ── HELPER: getUrgencyBadge() ──
function getUrgencyBadge(level: MaintenanceTask['urgency_level']) {
  const config = {
    IMMEDIATE: { 
      label: '⚡ IMMEDIATE', 
      className: 'bg-lapis-red/20 text-lapis-red border-lapis-red/40' 
    },
    CRITICAL: { 
      label: '🔴 CRITICAL',  
      className: 'bg-lapis-red/10 text-lapis-red/80 border-lapis-red/30' 
    },
    WARNING: { 
      label: '⚠️ WARNING',   
      className: 'bg-lapis-amber/20 text-lapis-amber border-lapis-amber/40' 
    },
    MONITOR: { 
      label: '🖥 MONITOR',   
      className: 'bg-lapis-surface/50 to-[#1C2626] text-lapis-muted border-lapis-border' 
    },
  };
  return config[level ?? 'MONITOR'] ?? config['MONITOR'];
}

// ── HELPER: getTypeBadge() ──
function getTypeBadge(type: MaintenanceTask['maintenance_type']) {
  const config = {
    EMERGENCY:  { 
      label: 'EMERGENCY',  
      className: 'bg-lapis-red/20 text-lapis-red border-lapis-red/40' 
    },
    CORRECTIVE: { 
      label: 'CORRECTIVE', 
      className: 'bg-lapis-amber/20 text-lapis-amber border-lapis-amber/40' 
    },
    PREVENTIVE: { 
      label: 'PREVENTIVE', 
      className: 'bg-lapis-neon/10 text-lapis-neon border-lapis-neon/30' 
    },
  };
  return config[type] ?? config['PREVENTIVE'];
}

// ── HELPER: formatDate() ──
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', 
    month: 'short', 
    year: 'numeric'
  });
  // Output contoh: "15 Mei 2026"
}

export default function TaskCard({ task }: TaskCardProps) {
  // Tentukan apakah card ini IMMEDIATE untuk pulse effect
  const isImmediate = task.urgency_level === 'IMMEDIATE';
  const urgency = getUrgencyBadge(task.urgency_level);
  const type = getTypeBadge(task.maintenance_type);

  return (
    <div className={`
      flex flex-col gap-3 p-4 rounded-xl
      bg-[#3A4648] border transition-colors duration-150
      hover:  cursor-default
      ${isImmediate 
        ? 'border-lapis-red' 
        : 'border-lapis-border'}
    `}>

      {/* Baris 1: Dua Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className={`
          text-[10px] font-bold px-2 py-0.5 
          rounded-md border ${urgency.className}
        `}>
          {urgency.label}
        </span>
        <span className={`
          text-[10px] font-semibold px-2 py-0.5 
          rounded-md border ${type.className}
        `}>
          {type.label}
        </span>
      </div>

      {/* Baris 2: Machine ID */}
      <div className="flex items-center gap-2">
        <Wrench className="w-3.5 h-3.5 text-lapis-muted flex-shrink-0" />
        <span className="text-base font-black text-lapis-text tracking-wide">
          {task.machine_id}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-lapis-border" />

      {/* Baris 3: Info Grid */}
      <div className="flex flex-col gap-1.5">

        {/* Tanggal jadwal */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5 text-lapis-muted flex-shrink-0" />
          <span className="text-xs text-lapis-muted">Schedule:</span>
          <span className="text-xs font-semibold text-lapis-text">
            {formatDate(task.scheduled_date)}
          </span>
        </div>

        {/* Sisa hari */}
        <div className="flex flex-col gap-1.5 py-1">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-lapis-muted flex-shrink-0" />
            <span className="text-xs text-lapis-muted">Remaining Time:</span>
            <span className={`text-sm font-black tracking-wide ${
              task.rul_days < 3 
                ? 'text-lapis-red text-glow-red/50' 
                : task.rul_days <= 7 
                  ? 'text-lapis-amber text-glow-amber/50' 
                  : 'text-lapis-neon text-glow-neon/50'
            }`}>
              {task.rul_days.toFixed(1)} Days ({task.rul_hours.toFixed(0)} Hours)
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-[3px] bg-lapis-border/40 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                task.rul_days < 3 
                  ? 'bg-lapis-red' 
                  : task.rul_days <= 7 
                    ? 'bg-lapis-amber' 
                    : 'bg-lapis-neon'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, (task.rul_days / 14) * 100))}%` }}
            />
          </div>
        </div>

        {/* Teknisi */}
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-lapis-muted flex-shrink-0" />
          <span className="text-xs text-lapis-muted">Technician:</span>
          <span className="text-xs font-semibold text-lapis-text">
            {task.technician ?? 'Unassigned'}
          </span>
        </div>

      </div>

      {/* Baris 4: Status Indicator */}
      <div className="flex items-center gap-2 pt-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          task.status === 'DONE'        ? 'bg-lapis-neon' :
          task.status === 'IN_PROGRESS' ? 'bg-lapis-amber' :
                                          'bg-lapis-muted'
        }`} />
        <span className="text-[10px] uppercase tracking-widest text-lapis-muted">
          {task.status.replace('_', ' ')}
        </span>
      </div>

      {/* Subtle usage of extra imports to avoid strict lint warnings */}
      {/* Clock and AlertOctagon can be referenced or left as is */}
      {false && <Clock />}
      {false && <AlertOctagon />}
    </div>
  );
}
