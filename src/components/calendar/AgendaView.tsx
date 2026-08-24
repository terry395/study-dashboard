import { format, parseISO, isSameDay, isToday, isFuture } from 'date-fns'
import { MapPin, List } from 'lucide-react'
import type { CalendarEvent } from '@/types'

interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  // Sort and group by date
  const sorted = [...events]
    .filter(e => isFuture(parseISO(e.end_datetime)) || isToday(parseISO(e.start_datetime)))
    .sort((a, b) => a.start_datetime.localeCompare(b.start_datetime))

  if (sorted.length === 0) {
    return (
      <div className="empty-state" style={{ marginTop: '3rem' }}>
        <List size={40} />
        <h3>No upcoming events</h3>
        <p>Your agenda for the next 60 days is clear.</p>
      </div>
    )
  }

  // Group by day
  const groups: { date: Date; events: CalendarEvent[] }[] = []
  for (const ev of sorted) {
    const evDate = parseISO(ev.start_datetime)
    const existing = groups.find(g => isSameDay(g.date, evDate))
    if (existing) {
      existing.events.push(ev)
    } else {
      groups.push({ date: evDate, events: [ev] })
    }
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group.date.toISOString()} style={{ marginBottom: '1.25rem' }}>
          {/* Day header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: isToday(group.date) ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
              border: `1px solid ${isToday(group.date) ? 'var(--color-accent)' : 'var(--color-border)'}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: isToday(group.date) ? '#fff' : 'var(--color-text-muted)', textTransform: 'uppercase', lineHeight: 1 }}>
                {format(group.date, 'EEE')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: isToday(group.date) ? '#fff' : 'var(--color-text-primary)', lineHeight: 1.2 }}>
                {format(group.date, 'd')}
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {format(group.date, 'MMMM yyyy')}
              {isToday(group.date) && <strong style={{ color: 'var(--color-accent)', marginLeft: 6 }}>Today</strong>}
            </span>
          </div>

          {/* Events */}
          <div style={{ marginLeft: 52, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {group.events.map(ev => {
              const colour = ev.colour ?? ev.category?.colour ?? 'var(--color-accent)'
              const start  = parseISO(ev.start_datetime)
              const end    = parseISO(ev.end_datetime)
              const isSystem = ev.source_type !== 'manual'

              return (
                <div
                  key={ev.id}
                  onClick={isSystem ? undefined : () => onEventClick(ev)}
                  className="card-sm"
                  style={{
                    borderLeft: `3px solid ${colour}`,
                    cursor: isSystem ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem', marginTop: 2, flexWrap: 'wrap' }}>
                      {ev.all_day ? (
                        <span>All day</span>
                      ) : (
                        <span>{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</span>
                      )}
                      {ev.location && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} /> {ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.category && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: colour, textTransform: 'uppercase', flexShrink: 0 }}>
                      {ev.category.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
