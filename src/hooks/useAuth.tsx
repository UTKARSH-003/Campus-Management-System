import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // 1. Restore the persisted session, then follow auth changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next) // keep this callback synchronous (no awaited Supabase calls here)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }
    setProfileLoading(true)
    const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle()
    setProfile((data as Profile | null) ?? null)
    setProfileLoading(false)
  }, [userId])

  // 2. Load the role from the database (never from the client).
  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    return /invalid login credentials/i.test(error.message)
      ? 'Invalid email or password. Please check your credentials and try again.'
      : error.message
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      isAdmin: profile?.role === 'admin',
      loading: !sessionReady || (Boolean(userId) && profileLoading),
      signIn,
      signOut,
      refreshProfile: loadProfile,
    }),
    [session, profile, sessionReady, profileLoading, userId, signIn, signOut, loadProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
