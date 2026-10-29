import { createClient } from '@supabase/supabase-js'

// Only the project URL and the PUBLISHABLE (anon) key belong in the browser.
// Never put a service_role / secret key in a VITE_ variable: it would be public.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'not-configured', {
  auth: { persistSession: true, autoRefreshToken: true },
})
