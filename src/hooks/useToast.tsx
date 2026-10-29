import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'

interface Toast { id: number; kind: 'success' | 'error'; text: string }
interface ToastApi { success: (t: string) => void; error: (t: string) => void }
const ToastContext = createContext<ToastApi | null>(null)
let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = nextId++
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000)
  }, [dismiss])

  const api = useMemo<ToastApi>(() => ({ success: (t) => push('success', t), error: (t) => push('error', t) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[80] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg bg-white ${t.kind === 'error' ? 'border-rose-200' : 'border-emerald-200'}`}>
            {t.kind === 'error'
              ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-accent" aria-hidden />
              : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-accent" aria-hidden />}
            <p className="flex-1 text-sm font-medium text-ink">{t.text}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-muted hover:text-ink rounded-md">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
