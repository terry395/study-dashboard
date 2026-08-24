import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format,
} from 'date-fns'
import type { CalendarEvent } from '@/types'
import { Plus } from 'lucide-react'

interface MonthViewProps {
  currentDate: Date
  getEventsForDay: (day: Date) => CalendarEvent[]
  onDayClick: (day: Date) => void
  onDayAddEvent: (day: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function MonthView({ currentDate, getEventsForDay, onDayClick, onDayAddEvent, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd    = endOfWeek(monthEnd,     { weekStartsOn: 1 })
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>
      {/* Weekday headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '0.4rem', marginBottom: '0.25rem',
      }}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, gap: 1 }}>
        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isCurrentDay   = isToday(day)

          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: 90,
                background: isCurrentDay ? 'var(--color-accent-subtle)' : 'var(--color-bg-surface)',
                border: `1px solid ${isCurrentDay ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem',
                opacity: isCurrentMonth ? 1 : 0.45,
                cursor: 'pointer',
                transition: 'background 0.1s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onClick={() => onDayClick(day)}
            >
              {/* Day number */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 3,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: isCurrentDay ? 700 : 500,
                  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  background: isCurrentDay ? 'var(--color-accent)' : 'transparent',
                  color: isCurrentDay ? '#fff' : 'var(--color-text-secondary)',
                }}>
                  {format(day, 'd')}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onDayAddEvent(day) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', padding: 2, borderRadius: 4,
                    opacity: 0, transition: 'opacity 0.15s',
                  }}
                  className="day-add-btn"
                  aria-label="Add event"
                >
                  <Plus size={11} />
                </button>
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dayEvents.slice(0, 3).map(ev => (
                  <EventChip key={ev.id} event={ev} onClick={e => { e.stopPropagation(); onEventClick(ev) }} />
                ))}
                {dayEvents.length > 3 && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', paddingLeft: 3 }}>
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        div:hover > .day-add-btn { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

function EventChip({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  const colour = event.colour ?? event.category?.colour ?? 'var(--color-accent)'
  const isSystem = event.source_type !== 'manual'

  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 10, fontWeight: 600,
        background: colour + '25',
        borderLeft: `2px solid ${colour}`,
        color: colour,
        padding: '1px 4px',
        borderRadius: '0 3px 3px 0',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        cursor: isSystem ? 'default' : 'pointer',
        opacity: isSystem ? 0.8 : 1,
      }}
      title={event.title}
    >
      {event.title}
    </div>
  )
}
