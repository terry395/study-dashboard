import { useState, useEffect, useCallback } from 'react'
import {
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight,
  List, Grid3x3, Columns, AlignLeft,
} from 'lucide-react'
import { useCalendar, type CalendarView } from '@/hooks/useCalendar'
import {
  createEvent, updateEvent, deleteEvent,
  getCategories, seedDefaultCategories,
} from '@/services/calendar'
import type { CalendarEvent, CalendarCategory } from '@/types'
import type { EventInsert } from '@/services/calendar'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageLoader } from '@/components/LoadingSpinner'
import { Alert } from '@/components/Alert'
import { EventForm } from '@/components/EventForm'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView }  from '@/components/calendar/WeekView'
import { DayView }   from '@/components/calendar/DayView'
import { AgendaView } from '@/components/calendar/AgendaView'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'

export default function CalendarPage() {
  const { user } = useAuth()
  const {
    view, setView, currentDate, setCurrentDate,
    events, loading, error, reload, getEventsForDay,
  } = useCalendar()

  const [categories,   setCategories]   = useState<CalendarCategory[]>([])
  const [formOpen,     setFormOpen]     = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)
  const [defaultDate,  setDefaultDate]  = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    if (!user) return
    await seedDefaultCategories(user.id)
    const { data } = await getCategories()
    setCategories(data)
  }, [user])

  useEffect(() => { loadCategories() }, [loadCategories])

  async function handleSaveEvent(payload: EventInsert) {
    if (editingEvent) {
      // Always derive the real DB id by stripping any recurrence occurrence suffix.
      // Recurring occurrences have ids like "<uuid>_20260813"; the base uuid is before '_'.
      const baseId = editingEvent.id.split('_')[0]
      const { error } = await updateEvent(baseId, payload)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await createEvent(payload)
      if (error) throw new Error(error.message)
    }
    setFormOpen(false)
    setEditingEvent(null)
    setDefaultDate(null)
    await reload()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteEvent(deleteTarget.id.split('_')[0]) // strip recurrence suffix
    setDeleteTarget(null)
    await reload()
  }

  function openNewEvent(date?: string) {
    setEditingEvent(null)
    setDefaultDate(date ?? format(currentDate, 'yyyy-MM-dd'))
    setFormOpen(true)
  }

  function openEditEvent(ev: CalendarEvent) {
    if (ev.source_type !== 'manual') return // don't edit system events
    // For recurring occurrences, strip the "_YYYYMMDD" suffix so the form
    // receives the base event's ID. This ensures handleSaveEvent calls
    // updateEvent (not createEvent) for ALL event edits — recurring or not.
    const baseId = ev.id.split('_')[0]
    setEditingEvent({ ...ev, id: baseId })
    setDefaultDate(null)
    setFormOpen(true)
  }

  /** Called from EventForm's Delete button — close form, open confirm dialog */
  function handleDeleteRequest(ev: CalendarEvent) {
    setFormOpen(false)
    setEditingEvent(null)
    // Strip any recurrence suffix so we always target the base event id
    const baseId = ev.id.split('_')[0]
    setDeleteTarget({ ...ev, id: baseId })
  }

  const VIEW_LABELS: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
    { key: 'month',  label: 'Month',  icon: <Grid3x3 size={14} /> },
    { key: 'week',   label: 'Week',   icon: <Columns size={14} /> },
    { key: 'day',    label: 'Day',    icon: <AlignLeft size={14} /> },
    { key: 'agenda', label: 'Agenda', icon: <List size={14} /> },
  ]

  function nav(dir: 1 | -1) {
    setCurrentDate(d => {
      const nd = new Date(d)
      if (view === 'month') nd.setMonth(nd.getMonth() + dir)
      else if (view === 'week') nd.setDate(nd.getDate() + 7 * dir)
      else nd.setDate(nd.getDate() + dir)
      return nd
    })
  }

  function getTitle() {
    if (view === 'month')  return format(currentDate, 'MMMM yyyy')
    if (view === 'week')   return format(currentDate, "'Week of' d MMM yyyy")
    if (view === 'day')    return format(currentDate, 'EEEE, d MMMM yyyy')
    return 'Agenda'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Nav arrows + title */}
        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => nav(-1)} aria-label="Previous">
          <ChevronLeft size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentDate(new Date())}>
          Today
        </button>
        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => nav(1)} aria-label="Next">
          <ChevronRight size={16} />
        </button>

        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1 }}>{getTitle()}</h2>

        {/* View switcher */}
        <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
          {VIEW_LABELS.map(v => (
            <button key={v.key} onClick={() => setView(v.key)}
              className="btn btn-sm"
              style={{
                gap: 5,
                background: view === v.key ? 'var(--color-bg-surface)' : 'transparent',
                border: '1px solid ' + (view === v.key ? 'var(--color-border)' : 'transparent'),
                color: view === v.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontWeight: view === v.key ? 600 : 400,
              }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <button className="btn btn-primary" onClick={() => openNewEvent()} id="add-event-btn">
          <Plus size={15} /> Add event
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Calendar view */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {loading ? (
          <PageLoader />
        ) : view === 'month' ? (
          <MonthView
            currentDate={currentDate}
            getEventsForDay={getEventsForDay}
            onDayClick={d => { setCurrentDate(d); setView('day') }}
            onDayAddEvent={d => openNewEvent(format(d, 'yyyy-MM-dd'))}
            onEventClick={openEditEvent}
          />
        ) : view === 'week' ? (
          <WeekView
            currentDate={currentDate}
            getEventsForDay={getEventsForDay}
            onEventClick={openEditEvent}
            onSlotClick={d => openNewEvent(format(d, 'yyyy-MM-dd'))}
          />
        ) : view === 'day' ? (
          <DayView
            currentDate={currentDate}
            events={getEventsForDay(currentDate)}
            onEventClick={openEditEvent}
            onAddEvent={() => openNewEvent(format(currentDate, 'yyyy-MM-dd'))}
          />
        ) : (
          <AgendaView
            events={events}
            onEventClick={openEditEvent}
          />
        )}
      </div>

      {/* Empty state */}
      {!loading && events.length === 0 && view !== 'agenda' && (
        <div style={{
          position: 'absolute', bottom: '2rem', right: '2rem',
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)', padding: '1rem',
          fontSize: 12, color: 'var(--color-text-muted)',
        }}>
          <CalendarIcon size={16} style={{ display: 'inline', marginRight: 6 }} />
          Click a day or <strong style={{ color: 'var(--color-accent)' }}>+ Add event</strong> to get started
        </div>
      )}

      {/* Event form modal */}
      <Modal open={formOpen} onClose={() => { setFormOpen(false); setEditingEvent(null) }}
        title={editingEvent ? 'Edit event' : 'New event'} maxWidth="580px">
        <EventForm
          initial={editingEvent} categories={categories}
          defaultDate={defaultDate}
          onSave={handleSaveEvent}
          onCancel={() => { setFormOpen(false); setEditingEvent(null) }}
          onDelete={handleDeleteRequest}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Delete event"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete" danger
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
