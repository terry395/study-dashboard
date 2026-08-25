import { useState, useMemo, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import type { Test, Module } from '@/types'
import type { TestInsert } from '@/services/tests'
import { Alert } from '@/components/Alert'
import { format, parseISO } from 'date-fns'

interface TestFormProps {
  initial?: Test | null
  modules: Module[]
  onSave: (data: TestInsert) => Promise<void>
  onCancel: () => void
}

// Duration presets in minutes
const DURATION_PRESETS = [
  { label: '30 minutes',    value: 30  },
  { label: '45 minutes',    value: 45  },
  { label: '1 hour',        value: 60  },
  { label: '1 hour 30 min', value: 90  },
  { label: '2 hours',       value: 120 },
  { label: '2 hours 30 min',value: 150 },
  { label: '3 hours',       value: 180 },
  { label: 'Custom…',       value: -1  },
]

/** Convert HH:MM start time + duration minutes → HH:MM end time */
function calcEndTime(startTime: string, durationMins: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const totalMins = h * 60 + m + durationMins
  const endH = Math.floor(totalMins / 60) % 24
  const endM = totalMins % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

/** Back-calculate duration in minutes from start_time and end_time strings */
function calcDurationMins(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

export function TestForm({ initial, modules, onSave, onCancel }: TestFormProps) {
  const [name,      setName]      = useState(initial?.name       ?? '')
  const [moduleId,  setModuleId]  = useState(initial?.module_id  ?? '')
  const [date,      setDate]      = useState(initial?.date       ?? format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(initial?.start_time ?? '09:00')
  const [location,  setLocation]  = useState(initial?.location   ?? '')
  const [topics,    setTopics]    = useState<string[]>(initial?.topics ?? [])
  const [newTopic,  setNewTopic]  = useState('')
  const [weightage, setWeightage] = useState(initial?.weightage?.toString() ?? '')
  const [notes,     setNotes]     = useState(initial?.notes      ?? '')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  // Duration — back-calculate from existing end_time if editing
  const initialDuration = useMemo(() => {
    if (initial?.start_time && initial?.end_time) {
      const mins = calcDurationMins(initial.start_time, initial.end_time)
      if (mins > 0) return mins
    }
    return 120 // default 2 hours
  }, [initial])

  const [presetValue,      setPresetValue]      = useState<number>(() => {
    const preset = DURATION_PRESETS.find(p => p.value === initialDuration)
    return preset ? preset.value : -1
  })
  const [customDuration,   setCustomDuration]   = useState<string>(() => {
    const preset = DURATION_PRESETS.find(p => p.value === initialDuration)
    return !preset || preset.value === -1 ? String(initialDuration) : '120'
  })

  // The actual duration in minutes used for calculation
  const durationMins = presetValue === -1
    ? (parseInt(customDuration, 10) || 0)
    : presetValue

  // Computed end time shown to user (read-only preview)
  const computedEndTime = durationMins > 0 ? calcEndTime(startTime, durationMins) : ''

  function addTopic() {
    const t = newTopic.trim()
    if (!t || topics.includes(t)) return
    setTopics(prev => [...prev, t])
    setNewTopic('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setError('Test name is required.'); return }
    if (!moduleId)     { setError('Please select a module.'); return }
    if (!date)         { setError('Date is required.'); return }
    if (durationMins <= 0) { setError('Please enter a valid duration.'); return }
    setError('')
    setLoading(true)
    try {
      await onSave({
        name:       name.trim(),
        module_id:  moduleId,
        date,
        start_time: startTime,
        end_time:   computedEndTime || null,
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
        <label className="label" htmlFor="tst-module">
          Module <span style={{ color: 'var(--color-danger)' }}>*</span>
        </label>
        <select id="tst-module" className="input" value={moduleId} onChange={e => setModuleId(e.target.value)}>
          <option value="" disabled>— Select a module —</option>
          {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Date + Start time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
      </div>

      {/* Duration + computed end time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="tst-duration">Duration *</label>
          <select id="tst-duration" className="input" value={presetValue}
            onChange={e => setPresetValue(Number(e.target.value))}>
            {DURATION_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {presetValue === -1 && (
            <input
              className="input" type="number" min="1" max="480" step="5"
              value={customDuration} onChange={e => setCustomDuration(e.target.value)}
              placeholder="Duration in minutes"
              style={{ marginTop: 6 }}
            />
          )}
        </div>
        <div className="form-group">
          <label className="label">End time (calculated)</label>
          <div className="input" style={{
            color: computedEndTime ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            background: 'var(--color-bg-hover)',
            cursor: 'default',
            userSelect: 'none',
          }}>
            {computedEndTime || '—'}
          </div>
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

// Suppress unused import warning from date-fns parseISO (used via useMemo)
void parseISO
