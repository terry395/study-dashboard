import { useState, type FormEvent } from 'react'
import type { StudyGoal, Module } from '@/types'
import type { GoalInsert } from '@/services/studyGoals'
import { Alert } from '@/components/Alert'
import { toWeekStart, getCurrentWeekStart } from '@/utils'
import { format } from 'date-fns'

interface GoalFormProps {
  initial?: StudyGoal | null
  modules: Module[]
  weekStart?: string
  onSave: (data: GoalInsert) => Promise<void>
  onCancel: () => void
}

export function GoalForm({ initial, modules, weekStart, onSave, onCancel }: GoalFormProps) {
  const defaultWeek = weekStart ?? toWeekStart(getCurrentWeekStart())

  const [title,      setTitle]      = useState(initial?.title        ?? '')
  const [moduleId,   setModuleId]   = useState(initial?.module_id    ?? '')
  const [description,setDescription]= useState(initial?.description  ?? '')
  const [targetDate, setTargetDate] = useState(initial?.target_date  ?? '')
  const [week,       setWeek]       = useState(initial?.week_start   ?? defaultWeek)
  const [priority,   setPriority]   = useState<StudyGoal['priority']>(initial?.priority ?? 'Medium')
  const [status,     setStatus]     = useState<StudyGoal['status']>(initial?.status ?? 'Not Started')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Goal title is required.'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        title:       title.trim(),
        module_id:   moduleId || null,
        description: description.trim() || null,
        target_date: targetDate || null,
        week_start:  week,
        priority,
        status,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <Alert type="error" message={error} />}

      <div className="form-group">
        <label className="label" htmlFor="goal-title">
          Goal <span className="required-star">*</span>
        </label>
        <input id="goal-title" className="input" type="text" value={title}
          onChange={e => setTitle(e.target.value)} placeholder="Complete Chapter 4 revision" required />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="goal-module">Module</label>
        <select id="goal-module" className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="">— Optional —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="goal-week">Week starting</label>
          <input id="goal-week" className="input" type="date" value={week}
            onChange={e => setWeek(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="goal-date">Target date (optional)</label>
          <input id="goal-date" className="input" type="date" value={targetDate}
            onChange={e => setTargetDate(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="goal-priority">Priority</label>
          <select id="goal-priority" className="input" value={priority}
            onChange={e => setPriority(e.target.value as StudyGoal['priority'])}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="form-group">
          <label className="label" htmlFor="goal-status">Status</label>
          <select id="goal-status" className="input" value={status}
            onChange={e => setStatus(e.target.value as StudyGoal['status'])}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="goal-desc">Description</label>
        <textarea id="goal-desc" className="input" value={description}
          onChange={e => setDescription(e.target.value)} rows={2} style={{ resize: 'vertical' }}
          placeholder="What do you want to achieve?" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add goal'}
        </button>
      </div>
    </form>
  )
}
