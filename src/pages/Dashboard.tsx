import { useState, useEffect, useCallback } from 'react'
import { format, isToday, parseISO, addDays } from 'date-fns'
import {
  AlertTriangle, Clock, ClipboardList,
  FlaskConical, BookOpen, Calendar, Plus,
} from 'lucide-react'
import { getAssignments } from '@/services/assignments'
import { getTests } from '@/services/tests'
import { getGoalsForWeek } from '@/services/studyGoals'
import { getEvents } from '@/services/calendar'
import type { Assignment, Test, StudyGoal, CalendarEvent } from '@/types'
import { getDeadlineInfo, toWeekStart, getCurrentWeekStart } from '@/utils'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'

// Live clock hook
function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/**
 * Expand any recurring events in `rawEvents` into occurrences that fall on `today`,
 * and include non-recurring events whose start_datetime falls on `todayStr`.
 * Mirrors the logic in useCalendar's getEventsForDay so the Dashboard stays consistent.
 */
function expandToday(rawEvents: CalendarEvent[], today: Date, todayStr: string): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0)
  const endOfToday   = new Date(today); endOfToday.setHours(23, 59, 59, 999)

  for (const ev of rawEvents) {
    if (!ev.recurrence_rule) {
      // Non-recurring: check if it falls on today
      const start = parseISO(ev.start_datetime)
      const end   = parseISO(ev.end_datetime)
      const startStr = format(start, 'yyyy-MM-dd')
      const endStr   = format(end,   'yyyy-MM-dd')
      if (ev.all_day) {
        if (todayStr >= startStr && todayStr <= endStr) result.push(ev)
      } else {
        if (format(start, 'yyyy-MM-dd') === todayStr) result.push(ev)
      }
      continue
    }

    // Recurring: expand one period around today only
    const eventStart = parseISO(ev.start_datetime)
    const eventEnd   = parseISO(ev.end_datetime)
    const duration   = eventEnd.getTime() - eventStart.getTime()

    // Parse recurrence rule (minimal — covers DAILY/WEEKLY/MONTHLY/YEARLY)
    const parts: Record<string, string> = {}
    ev.recurrence_rule.split(';').forEach(p => { const [k, v] = p.split('='); parts[k] = v })
    const freq     = parts['FREQ']     ?? ''
    const interval = parseInt(parts['INTERVAL'] ?? '1', 10) || 1

    let current = new Date(eventStart)

    // Fast-forward to near today
    if (current < startOfToday) {
      if (freq === 'YEARLY') {
        const skip = Math.max(0, Math.floor((today.getFullYear() - current.getFullYear() - 1) / interval) * interval)
        if (skip > 0) current = new Date(current), current.setFullYear(current.getFullYear() + skip)
      } else if (freq === 'MONTHLY') {
        const monthsGap = (today.getFullYear() - current.getFullYear()) * 12 + today.getMonth() - current.getMonth() - 1
        const skip = Math.max(0, Math.floor(monthsGap / interval) * interval)
        if (skip > 0) current = new Date(current), current.setMonth(current.getMonth() + skip)
      }
    }

    // Step through occurrences looking for one that hits today
    let guard = 0
    while (current <= endOfToday && guard < 800) {
      const occStr = format(current, 'yyyy-MM-dd')
      if (ev.all_day ? (todayStr >= occStr && todayStr <= format(new Date(current.getTime() + duration), 'yyyy-MM-dd')) : occStr === todayStr) {
        result.push({
          ...ev,
          id: `${ev.id}_${occStr.replace(/-/g, '')}`,
          start_datetime: current.toISOString(),
          end_datetime:   new Date(current.getTime() + duration).toISOString(),
        })
        break
      }
      // Advance
      if (freq === 'DAILY')        { current = addDays(current, interval) }
      else if (freq === 'WEEKLY')  { current = addDays(current, 7 * interval) }
      else if (freq === 'MONTHLY') { current = new Date(current); current.setMonth(current.getMonth() + interval) }
      else if (freq === 'YEARLY')  { current = new Date(current); current.setFullYear(current.getFullYear() + interval) }
      else break
      guard++
    }
  }
  return result
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const now = useClock()

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [tests,       setTests]       = useState<Test[]>([])
  const [goals,       setGoals]       = useState<StudyGoal[]>([])
  const [events,      setEvents]      = useState<CalendarEvent[]>([])
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const [aRes, tRes, gRes, eRes] = await Promise.all([
      getAssignments(),
      getTests(),
      getGoalsForWeek(toWeekStart(getCurrentWeekStart())),
      getEvents(
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),    // local midnight → UTC
        new Date(new Date().setHours(23, 59, 59, 999)).toISOString(), // local end-of-day → UTC
      ),
    ])
    setLoading(false)
    setAssignments(aRes.data)
    setTests(tRes.data)
    setGoals(gRes.data)
    // Expand recurring events and filter to today's occurrences only.
    // getEvents now returns ALL recurring events (needed so future-year calendar
    // views work), so we must expand and filter here rather than showing raw data.
    const today = new Date()
    const todayDateStr = format(today, 'yyyy-MM-dd')
    const expanded = expandToday(eRes.data, today, todayDateStr)
    setEvents(expanded)
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleGoal(goal: StudyGoal) {
    const { updateGoal } = await import('@/services/studyGoals')
    const newStatus = goal.status === 'Completed' ? 'Not Started' : 'Completed'
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: newStatus } : g))
    await updateGoal(goal.id, { status: newStatus })
  }

  if (loading) return <PageLoader />

  // Derived data
  const userName = user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'there'
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const activeAssignments = assignments.filter(a => a.status !== 'Completed' && a.status !== 'Submitted')
  const overdue   = activeAssignments.filter(a => getDeadlineInfo(a.due_date, a.due_time).status === 'overdue')
  const upcoming  = activeAssignments
    .filter(a => getDeadlineInfo(a.due_date, a.due_time).status !== 'overdue')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 5)

  const upcomingTests = tests
    .filter(t => new Date(`${t.date}T${t.start_time}`) > new Date())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  const todayGoals = goals.filter(g => !g.target_date || isToday(new Date(g.target_date)) || !g.target_date)
  const weekGoals  = goals
  const weekCompleted = weekGoals.filter(g => g.status === 'Completed').length
  const weekPct    = weekGoals.length ? Math.round((weekCompleted / weekGoals.length) * 100) : 0

  const todayEvents = [...events].sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            {greeting}, {userName} 👋
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {format(now, "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 1rem',
          fontSize: 22, fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-accent)',
          letterSpacing: '-0.02em',
        }}>
          {format(now, 'h:mm:ss a')}
        </div>
      </div>

      {/* ── Overdue warning (sticky top) ────────────────────────────── */}
      {overdue.length > 0 && (
        <div style={{
          background: 'var(--color-danger-subtle)',
          border: '1px solid var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-danger)', marginBottom: 6 }}>
              {overdue.length} overdue assignment{overdue.length > 1 ? 's' : ''}
            </div>
            {overdue.map(a => {
              const dl = getDeadlineInfo(a.due_date, a.due_time)
              return (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, padding: '3px 0', borderTop: '1px solid var(--color-danger)' + '30',
                }}>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    {a.module?.name && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{a.module.name} · </span>}
                    {a.name}
                  </span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600, flexShrink: 0, marginLeft: 12 }}>
                    {dl.label}
                  </span>
                </div>
              )
            })}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)', flexShrink: 0 }}
            onClick={() => navigate('/assignments')}>
            View all
          </button>
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem',
        marginBottom: '1rem',
      }}>

        {/* Today's events */}
        <DashCard
          title="Today's events"
          icon={<Calendar size={14} />}
          action={{ label: 'Calendar', onClick: () => navigate('/calendar') }}
        >
          {todayEvents.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '0.5rem 0' }}>
              No events today.{' '}
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-accent)', padding: '0 4px' }}
                onClick={() => navigate('/calendar')}>
                Add one
              </button>
            </div>
          ) : (
            todayEvents.map(ev => {
              const colour = ev.colour ?? ev.category?.colour ?? 'var(--color-accent)'
              return (
                <div key={ev.id} style={{
                  display: 'flex', gap: '0.75rem', padding: '0.4rem 0',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ width: 3, background: colour, borderRadius: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                    {!ev.all_day && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {format(new Date(ev.start_datetime), 'h:mm a')}
                        {' – '}
                        {format(new Date(ev.end_datetime), 'h:mm a')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </DashCard>

        {/* Upcoming deadlines */}
        <DashCard
          title="Upcoming deadlines"
          icon={<ClipboardList size={14} />}
          action={{ label: '+ Add', onClick: () => navigate('/assignments') }}
        >
          {upcoming.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No upcoming deadlines.</div>
          ) : (
            upcoming.map(a => {
              const dl = getDeadlineInfo(a.due_date, a.due_time)
              const urgencyColor =
                dl.status === 'today'    ? 'var(--color-danger)'  :
                dl.status === 'tomorrow' ? 'var(--color-warning)' :
                dl.status === 'soon'     ? 'var(--color-warning)' :
                'var(--color-text-muted)'

              return (
                <div key={a.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    {a.module && (
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.module.colour }} />
                        {a.module.name}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {format(new Date(a.due_date), 'd MMM')}{a.due_time && ' · ' + a.due_time.slice(0,5)}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: urgencyColor, flexShrink: 0, marginLeft: 8 }}>
                    {dl.label}
                  </span>
                </div>
              )
            })
          )}
        </DashCard>

        {/* Upcoming tests */}
        <DashCard
          title="Upcoming tests"
          icon={<FlaskConical size={14} />}
          action={{ label: '+ Add', onClick: () => navigate('/tests') }}
        >
          {upcomingTests.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No upcoming tests.</div>
          ) : (
            upcomingTests.map(t => {
              const testDate = new Date(`${t.date}T${t.start_time}`)
              const daysUntil = Math.ceil((testDate.getTime() - Date.now()) / 86400000)

              return (
                <div key={t.id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  padding: '0.4rem 0', borderBottom: '1px solid var(--color-border)',
                }}>
                  {/* Countdown pill */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)', flexShrink: 0,
                    background: daysUntil <= 2 ? 'var(--color-danger-subtle)' : 'var(--color-accent-subtle)',
                    border: `1px solid ${daysUntil <= 2 ? 'var(--color-danger)' : 'var(--color-accent)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, color: daysUntil <= 2 ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                      {daysUntil}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>days</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {t.module && (
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginBottom: 1 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.module.colour }} />
                        {t.module.name}
                      </div>
                    )}
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {format(testDate, 'd MMM · h:mm a')}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </DashCard>

        {/* Today's study goals */}
        <DashCard
          title="This week's study goals"
          icon={<BookOpen size={14} />}
          action={{ label: '+ Add', onClick: () => navigate('/study') }}
        >
          {weekGoals.length === 0 ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No goals this week.</div>
          ) : (
            <>
              {/* Progress */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{weekCompleted} / {weekGoals.length} completed</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{weekPct}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${weekPct}%` }} />
                </div>
              </div>
              {/* Goals list */}
              {weekGoals.slice(0, 5).map(g => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.3rem 0', cursor: 'pointer',
                }}
                onClick={() => toggleGoal(g)}>
                  <span style={{ color: g.status === 'Completed' ? 'var(--color-success)' : 'var(--color-text-muted)', flexShrink: 0 }}>
                    {g.status === 'Completed' ? '☑' : '☐'}
                  </span>
                  <span style={{
                    fontSize: 13, flex: 1,
                    textDecoration: g.status === 'Completed' ? 'line-through' : 'none',
                    opacity: g.status === 'Completed' ? 0.5 : 1,
                  }}>
                    {g.title}
                  </span>
                </div>
              ))}
              {weekGoals.length > 5 && (
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  +{weekGoals.length - 5} more goals
                </div>
              )}
            </>
          )}
        </DashCard>

      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="card">
        <p className="section-title" style={{ marginBottom: '0.75rem' }}>Quick add</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Assignment', path: '/assignments', icon: ClipboardList },
            { label: 'Test',       path: '/tests',       icon: FlaskConical },
            { label: 'Study goal', path: '/study',       icon: BookOpen },
            { label: 'Event',      path: '/calendar',    icon: Calendar },
            { label: 'Module',     path: '/modules',     icon: Clock },
          ].map(item => (
            <button key={item.label} className="btn btn-secondary btn-sm"
              onClick={() => navigate(item.path)}>
              <Plus size={12} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Reusable dashboard card ────────────────────────────────────────────────────

interface DashCardProps {
  title: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
  children: React.ReactNode
}

function DashCard({ title, icon, action, children }: DashCardProps) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--color-text-muted)',
          }}>
            {title}
          </span>
        </div>
        {action && (
          <button className="btn btn-ghost btn-sm" onClick={action.onClick}
            style={{ fontSize: 11, color: 'var(--color-accent)' }}>
            {action.label}
          </button>
        )}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}
