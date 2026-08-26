/**
 * AuthContext.tsx — Authentication using Supabase Auth.
 *
 * Strategy: Username + 6-digit PIN.
 * Supabase Auth requires an email address, so we use a synthetic email:
 *   {username}@studydash.local
 * This is completely invisible to the user. Passwords are hashed by Supabase (bcrypt).
 * All RLS policies use user_id (not email), so all existing data is unaffected.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/** Derive the synthetic Supabase email from a username */
export function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@studydash.local`
}

interface AuthContextValue {
  user:     User | null
  session:  Session | null
  loading:  boolean
  /** Display name: user_metadata.name → username → fallback */
  displayName: string
  signIn:  (username: string, pin: string) => Promise<{ error: string | null }>
  signUp:  (username: string, pin: string, displayName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  /** Derive a friendly display name from the user object */
  const displayName = (
    (user?.user_metadata?.name as string | undefined) ||
    (user?.email?.replace('@studydash.local', '')) ||
    'User'
  )

  const signIn = useCallback(async (username: string, pin: string) => {
    const email = usernameToEmail(username)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pin })
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return { error: 'Incorrect username or PIN. Please try again.' }
      }
      return { error: error.message }
    }
    return { error: null }
  }, [])

  const signUp = useCallback(async (username: string, pin: string, displayName: string) => {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pin,
      options: { data: { name: displayName || username } },
    })
    if (error) {
      if (error.message.toLowerCase().includes('user already registered')) {
        return { error: 'That username is already taken. Please choose another.' }
      }
      return { error: error.message }
    }

    // Create the profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        user_id: data.user.id,
        name: displayName || username,
        email,
      })
    }
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, displayName, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
