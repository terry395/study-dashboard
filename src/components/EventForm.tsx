import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { CalendarEvent, CalendarCategory } from '@/types'
import type { EventInsert } from '@/services/calendar'
import { Alert } from '@/components/Alert'
import { format, parseISO } from 'date-fns'

interface EventFormProps {
  initial?: CalendarEvent | null
  categories: CalendarCategory[]
  defaultDate?: string | null
  onSave: (data: EventInsert) => Promise<void>
  onCancel: () => void
  /** Called when the user clicks Delete — parent handles confirmation dialog */
  onDelete?: (event: CalendarEvent) => void
}

const RECURRENCE_OPTIONS = [
  { value: '',                              label: 'Does not repeat' },
  { value: 'FREQ=DAILY;INTERVAL=1',         label: 'Daily' },
  { value: 'FREQ=WEEKLY;INTERVAL=1',        label: 'Weekly' },
  { value: 'FREQ=WEEKLY;INTERVAL=2',        label: 'Every 2 weeks' },
  { value: 'FREQ=MONTHLY;INTERVAL=1',       label: 'Monthly' },
  { value: 'FREQ=YEARLY;INTERVAL=1',        label: 'Annually' },
  { value: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',   label: 'Mon / Wed / Fri' },
  { value: 'FREQ=WEEKLY;BYDAY=TU,TH',      label: 'Tue / Thu' },
]

export function EventForm({ initial, categories, defaultDate, onSave, onCancel, onDelete }: EventFormProps) {
  const today = defaultDate ?? format(new Date(), 'yyyy-MM-dd')

  const [title,      setTitle]      = useState(initial?.title       ?? '')
  const [catId,      setCatId]      = useState(initial?.category_id ?? '')
  const [startDate,  setStartDate]  = useState(() => {
    if (initial?.start_datetime) return format(parseISO(initial.start_datetime), 'yyyy-MM-dd')
    return today
  })
  const [startTime,  setStartTime]  = useState(() => {
    if (initial?.start_datetime) return format(parseISO(initial.start_datetime), 'HH:mm')
    return '09:00'
  })
  const [endDate,    setEndDate]    = useState(() => {
    if (initial?.end_datetime) return format(parseISO(initial.end_datetime), 'yyyy-MM-dd')
    return today
  })
  const [endTime,    setEndTime]    = useState(() => {
    if (initial?.end_datetime) return format(parseISO(initial.end_datetime), 'HH:mm')
    return '10:00'
  })
  const [allDay,     setAllDay]     = useState(initial?.all_day     ?? false)
  const [location,   setLocation]   = useState(initial?.location    ?? '')
  const [description,setDesc]       = useState(initial?.description ?? '')
  const [colour,     setColour]     = useState(initial?.colour      ?? '')
  const [recurrence, setRecurrence] = useState(initial?.recurrence_rule ?? '')
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Event title is required.'); return }
    if (!startDate)    { setError('Start date is required.'); return }
    if (!endDate)      { setError('End date is required.'); return }
    setError('')
    setLoading(true)

    const startDt = allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime}:00`
    const endDt = allDay
      ? `${endDate}T23:59:59`
      : `${endDate}T${endTime}:00`

    try {
      await onSave({
        title:           title.trim(),
        category_id:     catId    || null,
        start_datetime:  startDt,
        end_datetime:    endDt,
        all_day:         allDay,
        location:        location.trim()    || null,
        description:     description.trim() || null,
        colour:          colour || null,
        recurrence_rule: recurrence || null,
        source_type:     'manual',
        assignment_id:   null,
        test_id:         null,
        module_id:       null,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setLoading(false)
    }
  }

  // Only show delete for existing manual events (not system-generated)
  const canDelete = !!initial && !initial.id.includes('_') && initial.source_type === 'manual'

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <Alert type="error" message={error} />}

      <div className="form-group">
        <label className="label" htmlFor="evt-title">
          Event title <span className="required-star">*</span>
        </label>
        <input id="evt-title" className="input" type="text" value={title}
          onChange={e => setTitle(e.target.value)} placeholder="Family dinner" required />
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="label" htmlFor="evt-cat">Category</label>
        <select id="evt-cat" className="input" value={catId} onChange={e => setCatId(e.target.value)}>
          <option value="">— None —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* All day toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input id="evt-allday" type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} />
        <label htmlFor="evt-allday" style={{ fontSize: 13, cursor: 'pointer' }}>All-day event</label>
      </div>

      {/* Start */}
      <div style={{ display: 'grid', gridTemplateColumns: allDay ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="evt-sdate">
            Start date <span className="required-star">*</span>
          </label>
          <input id="evt-sdate" className="input" type="date" value={startDate}
            onChange={e => setStartDate(e.target.value)} required />
        </div>
        {!allDay && (
          <div className="form-group">
            <label className="label" htmlFor="evt-stime">Start time</label>
            <input id="evt-stime" className="input" type="time" value={startTime}
              onChange={e => setStartTime(e.target.value)} />
          </div>
        )}
      </div>

      {/* End */}
      <div style={{ display: 'grid', gridTemplateColumns: allDay ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group">
          <label className="label" htmlFor="evt-edate">
            End date <span className="required-star">*</span>
          </label>
          <input id="evt-edate" className="input" type="date" value={endDate}
            onChange={e => setEndDate(e.target.value)} required />
        </div>
        {!allDay && (
          <div className="form-group">
            <label className="label" htmlFor="evt-etime">End time</label>
            <input id="evt-etime" className="input" type="time" value={endTime}
              onChange={e => setEndTime(e.target.value)} />
          </div>
        )}
      </div>

      {/* Location */}
      <div className="form-group">
        <label className="label" htmlFor="evt-loc">Location</label>
        <input id="evt-loc" className="input" type="text" value={location}
          onChange={e => setLocation(e.target.value)} placeholder="Optional location" />
      </div>

      {/* Recurrence */}
      <div className="form-group">
        <label className="label" htmlFor="evt-recur">Repeat</label>
        <select id="evt-recur" className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
          {RECURRENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="label" htmlFor="evt-desc">Description</label>
        <textarea id="evt-desc" className="input" value={description}
          onChange={e => setDesc(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
      </div>

      {/* Footer — Delete on the left, Cancel/Save on the right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 }}>
        {/* Delete button — only visible for existing manual events */}
        {canDelete ? (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onDelete!(initial!)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={14} /> Delete event
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : initial ? 'Save changes' : 'Create event'}
          </button>
        </div>
      </div>
    </form>
  )
}
