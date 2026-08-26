import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Alert } from '@/components/Alert'

export default function Login() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const [username,    setUsername]    = useState('')
  const [pin,         setPin]         = useState('')
  const [showPin,     setShowPin]     = useState(false)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  function validatePin(value: string): string | null {
    if (value.length !== 6)       return 'PIN must be exactly 6 digits.'
    if (!/^\d{6}$/.test(value))   return 'PIN must contain only numbers (0–9).'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim()) { setError('Username is required.'); return }
    const pinErr = validatePin(pin)
    if (pinErr) { setError(pinErr); return }

    setLoading(true)
    const { error } = await signIn(username.trim(), pin)
    setLoading(false)
    if (error) { setError(error); return }
    navigate('/')
  }

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={logoStyle}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>StudyDash</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            Your personal life &amp; study dashboard
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {/* Username */}
          <div className="form-group">
            <label className="label" htmlFor="login-username">Username</label>
            <input
              id="login-username"
              className="input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="terrytan"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          {/* PIN with show/hide toggle */}
          <div className="form-group">
            <label className="label" htmlFor="login-pin">6-Digit PIN</label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-pin"
                className="input"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => {
                  // Only allow digits, max 6
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPin(v)
                }}
                placeholder="••••••"
                required
                autoComplete="current-password"
                inputMode="numeric"
                maxLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', padding: 2, display: 'flex',
                }}
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              Exactly 6 numeric digits
            </p>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
            <LogIn size={16} />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent)' }}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const outerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-bg-base)',
  padding: '1rem',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '2rem',
  width: '100%',
  maxWidth: 400,
  boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
}

const logoStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: 'var(--color-accent)',
  color: '#fff',
  fontSize: 24,
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
