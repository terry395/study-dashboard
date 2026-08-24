import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary that catches any React render errors within its tree.
 * Shows a recovery UI rather than a blank/white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', textAlign: 'center', gap: '1rem',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
          </div>

          <div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: 16, fontWeight: 700 }}>
              Something went wrong
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              An unexpected error occurred in this section.
            </p>
          </div>

          {this.state.error && (
            <details style={{
              maxWidth: 480, width: '100%',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: 12, color: 'var(--color-text-muted)',
              textAlign: 'left',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 4 }}>
                Error details
              </summary>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              onClick={this.handleReset}
            >
              <RefreshCw size={14} /> Try again
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight page-level error boundary wrapper.
 * Wrap each lazy page in this to prevent full-app crashes from a single page.
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
