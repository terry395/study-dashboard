import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Alert } from '@/components/Alert'

export default function Register() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()

  const [username,     setUsername]     = useState('')
  const [displayName,  setDisplayName]  = useState('')
  const [pin,          setPin]          = useState('')
  const [confirmPin,   setConfirmPin]   = useState('')
  const [showPin,      setShowPin]      = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  function validatePin(value: string): string | null {
    if (value.length !== 6)     return 'PIN must be exactly 6 digits.'
    if (!/^\d{6}$/.test(value)) return 'PIN must contain only numbers (0–9).'
    return null
  }

  function validateUsername(value: string): string | null {
    if (!value.trim())                        return 'Username is required.'
    if (value.length < 3)                     return 'Username must be at least 3 characters.'
    if (!/^[a-zA-Z0-9._-]+$/.test(value))    return 'Username may only contain letters, numbers, dots, hyphens and underscores.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const unErr = validateUsername(username)
    if (unErr) { setError(unErr); return }

    const pinErr = validatePin(pin)
    if (pinErr) { setError(pinErr); return }

    if (pin !== confirmPin) { setError('PINs do not match.'); return }

    setLoading(true)
    const { error } = await signUp(username.trim(), pin, displayName.trim() || username.trim())
    setLoading(false)
    if (error) { setError(error); return }
    navigate('/')
  }

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={logoStyle}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>Create account</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            Set up your StudyDash account
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {/* Username */}
          <div className="form-group">
            <label className="label" htmlFor="reg-username">
              Username <span className="required-star">*</span>
            </label>
            <input
              id="reg-username"
              className="input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
              placeholder="terrytan"
              required
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
              Letters, numbers, dots, hyphens, underscores. Min 3 characters.
            </p>
          </div>

          {/* Display name (optional) */}
          <div className="form-group">
            <label className="label" htmlFor="reg-name">Display name</label>
            <input
              id="reg-name"
              className="input"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Terry Tan (optional)"
              autoComplete="name"
            />
          </div>

          {/* PIN */}
          <div className="form-group">
            <label className="label" htmlFor="reg-pin">
              6-Digit PIN <span className="required-star">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-pin"
                className="input"
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setPin(v)
                }}
                placeholder="••••••"
                required
                autoComplete="new-password"
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
              Exactly 6 numeric digits (e.g. 123456)
            </p>
          </div>

          {/* Confirm PIN */}
          <div className="form-group">
            <label className="label" htmlFor="reg-confirm">
              Confirm PIN <span className="required-star">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-confirm"
                className="input"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPin}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setConfirmPin(v)
                }}
                placeholder="••••••"
                required
                autoComplete="new-password"
                inputMode="numeric"
                maxLength={6}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                aria-label={showConfirm ? 'Hide PIN' : 'Show PIN'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', padding: 2, display: 'flex',
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
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
