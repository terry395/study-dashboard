/**
 * useCalendar.ts — Custom hook that manages calendar state and event expansion.
 * Handles recurring event expansion client-side for the calendar views.
 */
import { useState, useEffect, useCallback } from 'react'
import { getEvents } from '@/services/calendar'
import type { CalendarEvent } from '@/types'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, parseISO, format, isSameDay, getDay,
} from 'date-fns'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

/** Expand a recurring event into individual occurrences within a date range */
function expandRecurring(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  if (!event.recurrence_rule) return [event]

  const rule = parseRRule(event.recurrence_rule)
  if (!rule) return [event]

  const occurrences: CalendarEvent[] = []
  const eventStart = parseISO(event.start_datetime)
  const eventEnd   = parseISO(event.end_datetime)
  const duration   = eventEnd.getTime() - eventStart.getTime()

  let current = new Date(eventStart)
  let count   = 0
  const MAX   = 365 // safety cap

  while (current <= rangeEnd && count < MAX) {
    if (current >= rangeStart) {
      occurrences.push({
        ...event,
        id:             `${event.id}_${format(current, 'yyyyMMdd')}`,
        start_datetime: current.toISOString(),
        end_datetime:   new Date(current.getTime() + duration).toISOString(),
      })
    }

    // Advance by recurrence frequency
    if (rule.freq === 'DAILY') {
      current = addDays(current, rule.interval)
    } else if (rule.freq === 'WEEKLY') {
      // Advance one week, then find next matching day
      current = advanceWeekly(current, rule)
    } else if (rule.freq === 'MONTHLY') {
      current = new Date(current)
      current.setMonth(current.getMonth() + rule.interval)
    } else if (rule.freq === 'YEARLY') {
      current = new Date(current)
      current.setFullYear(current.getFullYear() + rule.interval)
    } else {
      break
    }
    count++
  }

  return occurrences
}

interface RRule {
  freq: string
  interval: number
  byDay?: number[]  // 0=Sun,1=Mon,...,6=Sat
}

function parseRRule(rule: string): RRule | null {
  try {
    const parts: Record<string, string> = {}
    rule.split(';').forEach(p => {
      const [k, v] = p.split('=')
      parts[k] = v
    })

    const freq     = parts['FREQ']     ?? 'WEEKLY'
    const interval = parseInt(parts['INTERVAL'] ?? '1', 10)
    const byDayStr = parts['BYDAY']

    let byDay: number[] | undefined
    if (byDayStr) {
      const dayMap: Record<string, number> = { SU:0, MO:1, TU:2, WE:3, TH:4, FR:5, SA:6 }
      byDay = byDayStr.split(',').map(d => dayMap[d]).filter(d => d !== undefined)
    }

    return { freq, interval: isNaN(interval) ? 1 : interval, byDay }
  } catch {
    return null
  }
}

function advanceWeekly(current: Date, rule: RRule): Date {
  if (!rule.byDay || rule.byDay.length === 0) {
    return addDays(current, 7 * rule.interval)
  }

  // Find the next matching weekday after current
  let next = addDays(current, 1)
  for (let i = 0; i < 7 * rule.interval; i++) {
    if (rule.byDay.includes(getDay(next))) return next
    next = addDays(next, 1)
  }
  return addDays(current, 7 * rule.interval)
}

export function useCalendar() {
  const [view,         setView]         = useState<CalendarView>('month')
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [events,       setEvents]       = useState<CalendarEvent[]>([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const loadEvents = useCallback(async (date: Date, v: CalendarView) => {
    setLoading(true)
    setError('')

    let from: Date, to: Date
    if (v === 'month') {
      from = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
      to   = endOfWeek(endOfMonth(date),     { weekStartsOn: 1 })
    } else if (v === 'week') {
      from = startOfWeek(date, { weekStartsOn: 1 })
      to   = endOfWeek(date,   { weekStartsOn: 1 })
    } else if (v === 'day') {
      from = date
      to   = date
    } else {
      // Agenda: next 60 days
      from = date
      to   = addDays(date, 60)
    }

    const { data, error } = await getEvents(
      format(from, "yyyy-MM-dd'T'00:00:00"),
      format(to,   "yyyy-MM-dd'T'23:59:59"),
    )
    setLoading(false)
    if (error) { setError('Failed to load events.'); return }

    // Expand recurring events
    const expanded: CalendarEvent[] = []
    for (const ev of data) {
      expanded.push(...expandRecurring(ev, from, to))
    }
    setEvents(expanded)
  }, [])

  useEffect(() => {
    loadEvents(currentDate, view)
  }, [currentDate, view, loadEvents])

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter(ev => {
      const start = parseISO(ev.start_datetime)
      const end   = parseISO(ev.end_datetime)
      if (ev.all_day) {
        // all-day: check if day falls within the range
        return day >= new Date(format(start, 'yyyy-MM-dd')) &&
               day <= new Date(format(end,   'yyyy-MM-dd'))
      }
      return isSameDay(start, day)
    })
  }

  return {
    view, setView,
    currentDate, setCurrentDate,
    events, loading, error,
    reload: () => loadEvents(currentDate, view),
    getEventsForDay,
  }
}
