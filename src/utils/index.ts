import {
  differenceInCalendarDays,
  format,
  startOfWeek,
  endOfWeek,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  addDays,
} from 'date-fns'
import type { DeadlineInfo } from '@/types'

/**
 * Given a due date string (YYYY-MM-DD) and optional time (HH:MM),
 * returns a human-readable deadline status and label.
 */
export function getDeadlineInfo(dueDate: string, dueTime?: string | null): DeadlineInfo {
  const dateStr = dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59:59`
  const due = parseISO(dateStr)
  const now = new Date()
  const daysFromNow = differenceInCalendarDays(due, now)

  if (isPast(due) && !isToday(due)) {
    const overdueDays = Math.abs(daysFromNow)
    return {
      status: 'overdue',
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
      daysFromNow,
    }
  }
  if (isToday(due)) {
    return { status: 'today', label: 'Due today', daysFromNow: 0 }
  }
  if (isTomorrow(due)) {
    return { status: 'tomorrow', label: 'Due tomorrow', daysFromNow: 1 }
  }
  if (daysFromNow <= 7) {
    return { status: 'soon', label: `Due in ${daysFromNow} days`, daysFromNow }
  }
  return { status: 'upcoming', label: `Due in ${daysFromNow} days`, daysFromNow }
}

/** Format a date string for display */
export function formatDate(date: string): string {
  return format(parseISO(date), 'd MMM yyyy')
}

/** Format a datetime string for display */
export function formatDateTime(datetime: string): string {
  return format(parseISO(datetime), 'd MMM yyyy, h:mm a')
}

/** Format time only */
export function formatTime(time: string): string {
  // time is HH:MM
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return format(d, 'h:mm a')
}

/** Get Monday of the current week */
export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 })
}

/** Format week as YYYY-MM-DD (Monday) */
export function toWeekStart(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** Format seconds as H:MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Format seconds as "2h 15m" */
export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

/** Format file size bytes as human-readable */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Get badge class for deadline status */
export function getDeadlineBadgeClass(status: string): string {
  switch (status) {
    case 'overdue':  return 'badge badge-danger'
    case 'today':    return 'badge badge-warning'
    case 'tomorrow': return 'badge badge-warning'
    case 'soon':     return 'badge badge-info'
    default:         return 'badge badge-neutral'
  }
}

/** Get days in a week array starting Monday */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Generate a random colour from the module palette */
export const MODULE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#22c55e', '#14b8a6', '#38bdf8',
  '#f97316', '#84cc16',
]

export function randomModuleColor(): string {
  return MODULE_COLORS[Math.floor(Math.random() * MODULE_COLORS.length)]
}
