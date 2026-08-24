import { format, parseISO } from 'date-fns'
import { Plus, MapPin, Clock } from 'lucide-react'
import type { CalendarEvent } from '@/types'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onAddEvent: () => void
}

export function DayView({ currentDate, events, onEventClick, onAddEvent }: DayViewProps) {
  const allDay  = events.filter(e => e.all_day)
  const timed   = events.filter(e => !e.all_day).sort((a, b) =>
    a.start_datetime.localeCompare(b.start_datetime)
  )

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* All-day events */}
      {allDay.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="section-title">All day</p>
          {allDay.map(ev => (
            <DayEventCard key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
          ))}
        </div>
      )}

      {/* Timed events */}
      {timed.length > 0 ? (
        <>
          <p className="section-title">Scheduled</p>
          {timed.map(ev => (
            <DayEventCard key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
          ))}
        </>
      ) : (
        <div className="empty-state" style={{ marginTop: '3rem' }}>
          <Clock size={36} />
          <h3>Nothing scheduled</h3>
          <p>No events on {format(currentDate, 'EEEE, d MMMM yyyy')}.</p>
          <button className="btn btn-primary" onClick={onAddEvent}>
            <Plus size={14} /> Add event
          </button>
        </div>
      )}
    </div>
  )
}

function DayEventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const colour   = event.colour ?? event.category?.colour ?? 'var(--color-accent)'
  const start    = parseISO(event.start_datetime)
  const end      = parseISO(event.end_datetime)
  const isSystem = event.source_type !== 'manual'

  return (
    <div
      onClick={isSystem ? undefined : onClick}
      className="card-sm"
      style={{
        borderLeft: `4px solid ${colour}`,
        marginBottom: '0.5rem',
        cursor: isSystem ? 'default' : 'pointer',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      }}
    >
      {!event.all_day && (
        <div style={{ flexShrink: 0, width: 64, textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: colour }}>
            {format(start, 'h:mm a')}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
            {format(end, 'h:mm a')}
          </div>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{event.title}</div>
        {event.location && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {event.location}
          </div>
        )}
        {event.description && (
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
            {event.description}
          </div>
        )}
        {isSystem && (
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Auto-generated · edit from {event.source_type}s page
          </span>
        )}
      </div>
      {event.category && (
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          color: colour, flexShrink: 0,
        }}>
          {event.category.name}
        </span>
      )}
    </div>
  )
}
