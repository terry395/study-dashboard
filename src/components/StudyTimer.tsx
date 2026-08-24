import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Timer } from 'lucide-react'
import type { Module, StudyGoal } from '@/types'
import type { SessionInsert } from '@/services/studyGoals'
import { formatDuration } from '@/utils'

interface StudyTimerProps {
  modules: Module[]
  goals: StudyGoal[]
  onSessionSave: (session: SessionInsert) => Promise<void>
}

type TimerState = 'idle' | 'running' | 'paused'

export function StudyTimer({ modules, goals, onSessionSave }: StudyTimerProps) {
  const [state,     setState]     = useState<TimerState>('idle')
  const [elapsed,   setElapsed]   = useState(0)        // seconds
  const [moduleId,  setModuleId]  = useState('')
  const [goalId,    setGoalId]    = useState('')
  const [topic,     setTopic]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const startTimeRef = useRef<Date | null>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Tick every second when running
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } else {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state])

  function handleStart() {
    if (state === 'idle') startTimeRef.current = new Date()
    setState('running')
    setSaved(false)
  }

  function handlePause() { setState('paused') }
  function handleResume() { setState('running') }

  async function handleEnd() {
    if (!startTimeRef.current || elapsed < 5) { reset(); return }
    setState('paused')
    setSaving(true)

    const endTime = new Date()
    await onSessionSave({
      module_id:       moduleId    || null,
      study_goal_id:   goalId      || null,
      topic:           topic.trim() || null,
      start_time:      startTimeRef.current.toISOString(),
      end_time:        endTime.toISOString(),
      duration_seconds: elapsed,
    })

    setSaving(false)
    setSaved(true)
    reset()
  }

  function reset() {
    setState('idle')
    setElapsed(0)
    startTimeRef.current = null
  }

  const selectedModule = modules.find(m => m.id === moduleId)
  const filteredGoals  = goals.filter(g => !moduleId || g.module_id === moduleId)

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      {/* Module + goal selectors (only when idle) */}
      {state === 'idle' && (
        <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label" htmlFor="timer-module">Module</label>
            <select id="timer-module" className="input" value={moduleId} onChange={e => { setModuleId(e.target.value); setGoalId('') }}>
              <option value="">— Optional —</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="timer-goal">Study goal</label>
            <select id="timer-goal" className="input" value={goalId} onChange={e => setGoalId(e.target.value)}>
              <option value="">— Optional —</option>
              {filteredGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label" htmlFor="timer-topic">Topic / focus</label>
            <input id="timer-topic" className="input" type="text" value={topic}
              onChange={e => setTopic(e.target.value)} placeholder="e.g. Integration by parts" />
          </div>
        </div>
      )}

      {/* Timer display */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
        {/* Module name */}
        {selectedModule && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: selectedModule.colour }} />
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              {selectedModule.name}
            </span>
          </div>
        )}
        {topic && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{topic}</div>
        )}

        {/* Big clock */}
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: state === 'running' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: '1.5rem',
          transition: 'color 0.3s',
        }}>
          {formatDuration(elapsed)}
        </div>

        {/* Status indicator */}
        {state !== 'idle' && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: state === 'running' ? 'var(--color-success)' : 'var(--color-warning)',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: state === 'running' ? 'var(--color-success)' : 'var(--color-warning)',
              animation: state === 'running' ? 'pulse 1.5s infinite' : 'none',
            }} />
            {state === 'running' ? 'Recording' : 'Paused'}
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
          {state === 'idle' && (
            <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ minWidth: 140 }}>
              <Play size={18} /> Start session
            </button>
          )}
          {state === 'running' && (
            <>
              <button className="btn btn-secondary" onClick={handlePause}>
                <Pause size={16} /> Pause
              </button>
              <button className="btn btn-danger" onClick={handleEnd} disabled={saving}>
                <Square size={16} /> {saving ? 'Saving…' : 'End & save'}
              </button>
            </>
          )}
          {state === 'paused' && (
            <>
              <button className="btn btn-primary" onClick={handleResume}>
                <Play size={16} /> Resume
              </button>
              <button className="btn btn-danger" onClick={handleEnd} disabled={saving}>
                <Square size={16} /> {saving ? 'Saving…' : 'End & save'}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Discard</button>
            </>
          )}
        </div>

        {saved && (
          <div style={{ marginTop: '1rem', fontSize: 13, color: 'var(--color-success)', fontWeight: 600 }}>
            ✓ Session saved!
          </div>
        )}
      </div>

      {/* Hint */}
      {state === 'idle' && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)', marginTop: '1rem' }}>
          <Timer size={12} style={{ display: 'inline', marginRight: 4 }} />
          Select a module and topic (optional), then start your session.
        </p>
      )}
    </div>
  )
}
