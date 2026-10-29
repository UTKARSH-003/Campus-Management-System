import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { isSupabaseConfigured } from '../lib/supabase'
import { CenterCard, SetupNeeded } from '../components/layout/ProtectedRoute'
import { Button } from '../components/ui/Button'
import { Field, inputCls } from '../components/ui/forms'

export default function Login() {
  const { session, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured) return <SetupNeeded />
  if (loading) return <div className="animated-background flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" aria-label="Loading" /></div>
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  if (session) return <Navigate to={from} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Enter both your email and password.'); return }
    setBusy(true); setError(null)
    const err = await signIn(email.trim(), password)
    setBusy(false)
    if (err) setError(err)
    else navigate(from, { replace: true })
  }

  return (
    <CenterCard>
      <h1 className="font-display text-2xl font-extrabold text-ink">Administrator sign in</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Demo University · Academic year 2026-2027</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email"><input id="email" type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password" htmlFor="password"><input id="password" type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
    </CenterCard>
  )
}
