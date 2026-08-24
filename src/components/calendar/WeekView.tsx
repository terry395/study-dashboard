import { startOfWeek, addDays, format, isToday, parseISO } from 'date-fns'
import type { CalendarEvent } from '@/types'

interface WeekViewProps {
  currentDate: Date
  getEventsForDay: (day: Date) => CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onSlotClick: (day: Date) => void
}

export function WeekView({ currentDate, getEventsForDay, onEventClick, onSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
      {days.map(day => {
        const dayEvents = getEventsForDay(day)
        const isCurrentDay = isToday(day)

        return (
          <div key={day.toISOString()}>
            {/* Day header */}
            <div style={{
              textAlign: 'center', padding: '0.5rem 0.25rem',
              borderBottom: `2px solid ${isCurrentDay ? 'var(--color-accent)' : 'var(--color-border)'}`,
              marginBottom: '0.5rem',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: isCurrentDay ? 'var(--color-accent)' : 'transparent',
                color: isCurrentDay ? '#fff' : 'var(--color-text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto', fontSize: 14, fontWeight: isCurrentDay ? 700 : 400,
              }}>
                {format(day, 'd')}
              </div>
            </div>

            {/* Events */}
            <div
              style={{ minHeight: 300, cursor: 'pointer', padding: '0 2px' }}
              onClick={() => onSlotClick(day)}
            >
              {dayEvents.map(ev => (
                <WeekEventBlock
                  key={ev.id} event={ev}
                  onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeekEventBlock({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  const colour = event.colour ?? event.category?.colour ?? 'var(--color-accent)'
  const start  = parseISO(event.start_datetime)

  return (
    <div
      onClick={onClick}
      style={{
        background: colour + '20',
        border: `1px solid ${colour}40`,
        borderLeft: `3px solid ${colour}`,
        borderRadius: 'var(--radius-sm)',
        padding: '4px 6px',
        marginBottom: 4,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: colour, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {event.title}
      </div>
      {!event.all_day && (
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
          {format(start, 'h:mm a')}
        </div>
      )}
    </div>
  )
}
