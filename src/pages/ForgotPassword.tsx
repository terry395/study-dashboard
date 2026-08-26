import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

/**
 * ForgotPassword — Not applicable with PIN-based auth.
 * If you forget your PIN, an admin must reset it via the Supabase dashboard.
 */
export default function ForgotPassword() {
  return (
    <div style={outerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={logoStyle}><Lock size={24} /></div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0.75rem 0 0.25rem' }}>PIN Reset</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, margin: 0 }}>
            StudyDash uses a 6-digit PIN login.
          </p>
        </div>

        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
        }}>
          <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Forgot your PIN?
          </p>
          <p style={{ margin: 0 }}>
            To reset your PIN, go to the{' '}
            <strong>Supabase Dashboard → Authentication → Users</strong>,
            find your account and use "Send Reset Email" or update the password directly.
          </p>
        </div>

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
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
