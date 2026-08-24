import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { Test, Module } from '@/types'
import type { TestInsert } from '@/services/tests'
import { Alert } from '@/components/Alert'
import { format } from 'date-fns'

interface TestFormProps {
  initial?: Test | null
  modules: Module[]
  onSave: (data: TestInsert) => Promise<void>
  onCancel: () => void
}

export function TestForm({ initial, modules, onSave, onCancel }: TestFormProps) {
  const [name,      setName]      = useState(initial?.name       ?? '')
  const [moduleId,  setModuleId]  = useState(initial?.module_id  ?? '')
  const [date,      setDate]      = useState(initial?.date       ?? format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(initial?.start_time ?? '09:00')
  const [endTime,   setEndTime]   = useState(initial?.end_time   ?? '')
  const [location,  setLocation]  = useState(initial?.location   ?? '')
  const [topics,    setTopics]    = useState<string[]>(initial?.topics ?? [])
  const [newTopic,  setNewTopic]  = useState('')
  const [weightage, setWeightage] = useState(initial?.weightage?.toString() ?? '')
  const [notes,     setNotes]     = useState(initial?.notes      ?? '')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  function addTopic() {
    const t = newTopic.trim()
    if (!t || topics.includes(t)) return
    setTopics(prev => [...prev, t])
    setNewTopic('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Test name is required.'); return }
    if (!date)        { setError('Date is required.'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name:       name.trim(),
        module_id:  moduleId || null,
        date,
        start_time: startTime,
        end_time:   endTime || null,
        location:   location.trim() || null,
        topics,
        weightage:  weightage ? parseFloat(weightage) : null,
        notes:      notes.trim() || null,
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
        <label className="label" htmlFor="tst-name">Test / exam name *</label>
        <input id="tst-name" className="input" type="text" value={name}
          onChange={e => setName(e.target.value)} placeholder="Mid-Term Test" required />
      </div>

      <div className="form-group">
        <label className="label" htmlFor="tst-module">Module</label>
        <select id="tst-module" className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="">— No module —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="tst-date">Date *</label>
          <input id="tst-date" className="input" type="date" value={date}
            onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="tst-start">Start time *</label>
          <input id="tst-start" className="input" type="time" value={startTime}
            onChange={e => setStartTime(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="tst-end">End time</label>
          <input id="tst-end" className="input" type="time" value={endTime}
            onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="tst-loc">Location / venue</label>
          <input id="tst-loc" className="input" type="text" value={location}
            onChange={e => setLocation(e.target.value)} placeholder="Room E401" />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="tst-weight">Weightage (%)</label>
          <input id="tst-weight" className="input" type="number" min="0" max="100" step="0.5"
            value={weightage} onChange={e => setWeightage(e.target.value)} placeholder="25" />
        </div>
      </div>

      {/* Topics */}
      <div className="form-group">
        <label className="label">Topics covered</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
          {topics.map(t => (
            <span key={t} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)', padding: '2px 8px', fontSize: 12,
            }}>
              {t}
              <button type="button" onClick={() => setTopics(prev => prev.filter(x => x !== t))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="input" type="text" value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic() } }}
            placeholder="Add topic (press Enter)…" style={{ flex: 1 }} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addTopic}>
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="label" htmlFor="tst-notes">Notes</label>
        <textarea id="tst-notes" className="input" value={notes}
          onChange={e => setNotes(e.target.value)} rows={2} style={{ resize: 'vertical' }}
          placeholder="Study materials, past papers…" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add test'}
        </button>
      </div>
    </form>
  )
}
