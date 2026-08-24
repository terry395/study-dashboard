interface LoadingSpinnerProps {
  size?: number
  message?: string
}

export function LoadingSpinner({ size = 32, message }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '2rem' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: 'spin 0.8s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="12" cy="12" r="10"
          stroke="var(--color-border-light)"
          strokeWidth="3"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {message && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>{message}</p>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <LoadingSpinner size={40} message="Loading…" />
    </div>
  )
}

interface SkeletonProps {
  height?: number | string
  width?: number | string
  style?: React.CSSProperties
}

export function Skeleton({ height = 16, width = '100%', style }: SkeletonProps) {
  return <div className="skeleton" style={{ height, width, ...style }} />
}
