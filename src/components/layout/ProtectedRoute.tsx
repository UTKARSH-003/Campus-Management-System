import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert, DatabaseZap } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { SettingsProvider } from '../../hooks/useSettings'
import { isSupabaseConfigured } from '../../lib/supabase'
import { Brand } from './Brand'
import { Button } from '../ui/Button'
import { GlassCard } from '../ui/GlassCard'

export function CenterCard({ children }: { children: ReactNode }) {
  return (
    <div className="animated-background flex min-h-screen items-center justify-center p-4">
      <GlassCard className="w-full max-w-md !p-8">
        <div className="mb-6"><Brand subtitle="Smart Campus Management System" /></div>
        {children}
      </GlassCard>
    </div>
  )
}

export function SetupNeeded() {
  return (
    <CenterCard>
      <div className="flex items-start gap-3">
        <DatabaseZap className="mt-1 h-6 w-6 shrink-0 text-amber-accent" aria-hidden />
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">Supabase is not configured</h1>
          <p className="mt-2 text-sm text-slate-600">Copy <code className="rounded bg-brand-light px-1">.env.example</code> to <code className="rounded bg-brand-light px-1">.env</code>, fill in <code className="rounded bg-brand-light px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-brand-light px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code>, then restart <code className="rounded bg-brand-light px-1">npm run dev</code>. See the README for the full setup.</p>
        </div>
      </div>
    </CenterCard>
  )
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, isAdmin, profile, signOut } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) return <SetupNeeded />
  if (loading) {
    return <div className="animated-background flex min-h-screen items-center justify-center" role="status" aria-label="Loading"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (!isAdmin) {
    return (
      <CenterCard>
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-rose-accent" aria-hidden />
          <div>
            <h1 className="font-display text-xl font-extrabold text-ink">Administrator access required</h1>
            <p className="mt-2 text-sm text-slate-600">
              You are signed in as <b>{session.user.email}</b>{profile ? '' : ' (no profile found)'}, but this account has not been granted the administrator role. Ask the project owner to promote it in the Supabase SQL Editor (see README, step "Create the administrator").
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => void signOut()}>Sign out</Button>
          </div>
        </div>
      </CenterCard>
    )
  }
  return <SettingsProvider>{children}</SettingsProvider>
}
