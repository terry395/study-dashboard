import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'
import { useState } from 'react'

type AlertType = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  type?: AlertType
  message: string
  dismissible?: boolean
}

const icons = {
  error:   XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info:    Info,
}

const styles: Record<AlertType, { bg: string; color: string; border: string }> = {
  error:   { bg: 'var(--color-danger-subtle)',  color: 'var(--color-danger)',  border: 'var(--color-danger)' },
  warning: { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)', border: 'var(--color-warning)' },
  success: { bg: 'var(--color-success-subtle)', color: 'var(--color-success)', border: 'var(--color-success)' },
  info:    { bg: 'var(--color-info-subtle)',    color: 'var(--color-info)',    border: 'var(--color-info)' },
}

export function Alert({ type = 'info', message, dismissible = false }: AlertProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !message) return null

  const Icon = icons[type]
  const s = styles[type]

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontSize: 13,
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', padding: 0 }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
