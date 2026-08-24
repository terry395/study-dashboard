import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Plus, CheckCircle2, Circle, Trash2, Pencil,
  Play, Pause, Square, Timer,
} from 'lucide-react'
import {
  getGoalsForWeek, getAllGoals, createGoal, updateGoal,
  deleteGoal, completeGoal,
  createSession, getSessions,
} from '@/services/studyGoals'
import { getModules } from '@/services/modules'
import type { StudyGoal, StudySession, Module } from '@/types'
import type { GoalInsert } from '@/services/studyGoals'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/LoadingSpinner'
import { Alert } from '@/components/Alert'
import { GoalForm } from '@/components/GoalForm'
import { StudyTimer } from '@/components/StudyTimer'
import { toWeekStart, getCurrentWeekStart, formatDate, formatDurationHuman } from '@/utils'
import { format, subWeeks, addWeeks } from 'date-fns'

export default function Study() {
  const [tab,          setTab]          = useState<'goals' | 'timer' | 'history'>('goals')
  const [goals,        setGoals]        = useState<StudyGoal[]>([])
  const [sessions,     setSessions]     = useState<StudySession[]>([])
  const [modules,      setModules]      = useState<Module[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [weekStart,    setWeekStart]    = useState(() => toWeekStart(getCurrentWeekStart()))
  const [formOpen,     setFormOpen]     = useState(false)
  const [editing,      setEditing]      = useState<StudyGoal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<StudyGoal | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [gRes, mRes, sRes] = await Promise.all([
      getGoalsForWeek(weekStart),
      getModules(),
      getSessions(),
    ])
    setLoading(false)
    if (gRes.error) { setError('Failed to load study goals.'); return }
    setGoals(gRes.data)
    setModules(mRes.data)
    setSessions(sRes.data)
  }, [weekStart])

  useEffect(() => { load() }, [load])

  async function handleSaveGoal(payload: GoalInsert) {
    if (editing) {
      const { error } = await updateGoal(editing.id, payload)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await createGoal(payload)
      if (error) throw new Error(error.message)
    }
    setFormOpen(false)
    setEditing(null)
    await load()
  }

  async function handleComplete(goal: StudyGoal) {
    const newStatus = goal.status === 'Completed' ? 'Not Started' : 'Completed'
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: newStatus } : g))
    await updateGoal(goal.id, { status: newStatus })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteGoal(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  const completed = goals.filter(g => g.status === 'Completed').length
  const pct       = goals.length ? Math.round((completed / goals.length) * 100) : 0

  if (loading) return <PageLoader />

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Study</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'goals' && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
              <Plus size={15} /> Add goal
            </button>
          )}
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', padding: 4 }}>
        {(['goals', 'timer', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="btn"
            style={{
              flex: 1, background: tab === t ? 'var(--color-bg-surface)' : 'transparent',
              color: tab === t ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              border: '1px solid ' + (tab === t ? 'var(--color-border)' : 'transparent'),
              textTransform: 'capitalize', fontWeight: tab === t ? 600 : 400,
            }}>
            {t === 'goals' ? '📋 Goals' : t === 'timer' ? '⏱ Timer' : '📊 History'}
          </button>
        ))}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <GoalsTab
          goals={goals}
          weekStart={weekStart}
          completed={completed}
          pct={pct}
          onPrevWeek={() => setWeekStart(w => toWeekStart(subWeeks(new Date(w), 1)))}
          onNextWeek={() => setWeekStart(w => toWeekStart(addWeeks(new Date(w), 1)))}
          onCurrentWeek={() => setWeekStart(toWeekStart(getCurrentWeekStart()))}
          onComplete={handleComplete}
          onEdit={g => { setEditing(g); setFormOpen(true) }}
          onDelete={g => setDeleteTarget(g)}
        />
      )}

      {/* Timer tab */}
      {tab === 'timer' && (
        <StudyTimer
          modules={modules}
          goals={goals.filter(g => g.status !== 'Completed')}
          onSessionSave={async (session) => {
            await createSession(session)
            await load()
          }}
        />
      )}

      {/* History tab */}
      {tab === 'history' && (
        <HistoryTab sessions={sessions} />
      )}

      {/* Form modal */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}
        title={editing ? 'Edit goal' : 'Add study goal'} maxWidth="520px">
        <GoalForm
          initial={editing} modules={modules} weekStart={weekStart}
          onSave={handleSaveGoal} onCancel={() => { setFormOpen(false); setEditing(null) }}
        />
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete goal"
        message={`Delete "${deleteTarget?.title}"?`} confirmLabel="Delete" danger
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── Goals tab ─────────────────────────────────────────────────────────────────

interface GoalsTabProps {
  goals: StudyGoal[]
  weekStart: string
  completed: number
  pct: number
  onPrevWeek: () => void
  onNextWeek: () => void
  onCurrentWeek: () => void
  onComplete: (g: StudyGoal) => void
  onEdit: (g: StudyGoal) => void
  onDelete: (g: StudyGoal) => void
}

function GoalsTab({ goals, weekStart, completed, pct, onPrevWeek, onNextWeek, onCurrentWeek, onComplete, onEdit, onDelete }: GoalsTabProps) {
  const weekEnd = format(addWeeks(new Date(weekStart), 1), 'MMM d')
  const weekStartFmt = format(new Date(weekStart), 'MMM d')
  const isCurrentWeek = weekStart === toWeekStart(getCurrentWeekStart())

  return (
    <>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onPrevWeek}>←</button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {weekStartFmt} – {weekEnd}
        </span>
        <button className="btn btn-secondary btn-sm" onClick={onNextWeek}>→</button>
        {!isCurrentWeek && (
          <button className="btn btn-ghost btn-sm" onClick={onCurrentWeek}>This week</button>
        )}
      </div>

      {/* Progress */}
      {goals.length > 0 && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Week progress</span>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {completed} / {goals.length} completed · {pct}%
            </span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Goal list */}
      {goals.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <BookOpen size={40} />
          <h3>No goals this week</h3>
          <p>Plan your study goals for the week to stay on track.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {goals.map(g => (
            <GoalRow key={g.id} goal={g}
              onComplete={() => onComplete(g)}
              onEdit={() => onEdit(g)}
              onDelete={() => onDelete(g)}
            />
          ))}
        </div>
      )}
    </>
  )
}

interface GoalRowProps {
  goal: StudyGoal
  onComplete: () => void
  onEdit: () => void
  onDelete: () => void
}

function GoalRow({ goal: g, onComplete, onEdit, onDelete }: GoalRowProps) {
  const isComplete = g.status === 'Completed'
  const priorityColors = { Low: 'var(--color-text-muted)', Medium: 'var(--color-warning)', High: 'var(--color-danger)' }

  return (
    <div className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button onClick={onComplete} className="btn btn-ghost btn-icon"
        style={{ color: isComplete ? 'var(--color-success)' : 'var(--color-text-muted)', flexShrink: 0 }}>
        {isComplete ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          {g.module && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: g.module.colour }} />
              {g.module.name}
            </div>
          )}
          <span style={{ fontSize: 10, fontWeight: 700, color: priorityColors[g.priority] }}>
            {g.priority}
          </span>
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600,
          color: 'var(--color-text-primary)',
          textDecoration: isComplete ? 'line-through' : 'none',
          opacity: isComplete ? 0.6 : 1,
        }}>
          {g.title}
        </div>
        {g.target_date && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            Target: {formatDate(g.target_date)}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit}><Pencil size={13} /></button>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onDelete}>
          <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
        </button>
      </div>
    </div>
  )
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab({ sessions }: { sessions: StudySession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '3rem' }}>
        <Timer size={40} />
        <h3>No study sessions yet</h3>
        <p>Use the Timer tab to track your study sessions.</p>
      </div>
    )
  }

  // Aggregate by module
  const byModule: Record<string, { name: string; colour: string; seconds: number }> = {}
  sessions.forEach(s => {
    const key = s.module_id ?? '__none__'
    if (!byModule[key]) {
      byModule[key] = {
        name:    s.module?.name    ?? 'No module',
        colour:  s.module?.colour  ?? 'var(--color-text-muted)',
        seconds: 0,
      }
    }
    byModule[key].seconds += s.duration_seconds
  })

  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0)

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total sessions" value={String(sessions.length)} />
        <StatCard label="Total study time" value={formatDurationHuman(totalSeconds)} />
      </div>

      {/* By module */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <p className="section-title">By module</p>
        {Object.values(byModule).map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.colour, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {formatDurationHuman(m.seconds)}
            </span>
          </div>
        ))}
      </div>

      {/* Session list */}
      <p className="section-title">Recent sessions</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {sessions.slice(0, 30).map(s => (
          <div key={s.id} className="card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {s.module?.name ?? 'No module'}
                {s.topic && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> · {s.topic}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {format(new Date(s.start_time), 'd MMM yyyy, h:mm a')}
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
              {formatDurationHuman(s.duration_seconds)}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{value}</div>
    </div>
  )
}

// eslint suppress
const _unused = { Play, Pause, Square }; void _unused
