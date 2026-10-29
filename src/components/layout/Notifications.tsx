import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { getInsights } from '../../services/insights'
import { useSettings } from '../../hooks/useSettings'
import { relativeTime } from '../../utils/date'
import { StatusBadge } from '../ui/StatusBadge'
import { useDismiss } from './useClickOutside'
import type { InsightItem } from '../../types'

export function Notifications() {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<InsightItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const load = useCallback(() => {
    setLoading(true)
    getInsights(settings).then((r) => { setItems(r); setError(false) }).catch(() => setError(true)).finally(() => setLoading(false))
  }, [settings])

  useEffect(() => { load() }, [load])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open) load() }} aria-label={`Notifications${items.length ? `, ${items.length} items` : ''}`} aria-expanded={open}
        className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-indigo-100 bg-white text-slate-600 hover:bg-brand-light">
        <Bell className="h-5 w-5" aria-hidden />
        {items.length > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-accent px-1 text-[10px] font-bold text-white">{items.length > 9 ? '9+' : items.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] rounded-2xl border border-indigo-100 bg-white p-2 shadow-xl">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">Notifications</p>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && <p className="p-3 text-sm text-muted">Loading...</p>}
            {error && <p role="alert" className="p-3 text-sm text-rose-600">Could not load notifications.</p>}
            {!loading && !error && items.length === 0 && <p className="p-3 text-sm text-muted">You're all caught up.</p>}
            {items.map((n) => (
              <Link key={n.id} to={n.link} onClick={close} className="block rounded-xl p-3 hover:bg-brand-light">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <StatusBadge tone={n.priority === 'urgent' ? 'bad' : n.priority === 'warning' ? 'warn' : 'info'} icon={n.priority === 'urgent' ? 'alert' : undefined}>
                    {n.priority === 'urgent' ? 'Urgent' : n.priority === 'warning' ? 'Warning' : 'Info'}
                  </StatusBadge>
                  <span className="text-xs text-muted">{relativeTime(n.timestamp)}</span>
                </div>
                <p className="text-sm font-bold text-ink">{n.title}</p>
                <p className="text-xs text-muted">{n.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
