import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Alert } from '@/components/Alert'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) { setError(error); return }
    setSuccess(true)
  }

  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={logoStyle}>S</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>Reset password</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            Enter your email and we'll send a reset link.
          </p>
        </div>

        {error   && <Alert type="error" message={error} />}
        {success && <Alert type="success" message="Check your email for a password reset link." />}

        {!success && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="label" htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
              <Mail size={16} />
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          <Link to="/login" style={{ color: 'var(--color-accent)' }}>← Back to sign in</Link>
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
