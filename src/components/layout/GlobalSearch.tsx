import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search } from 'lucide-react'
import { globalSearch, type SearchHit } from '../../services/search'
import { useDebounce } from '../../hooks/useDebounce'
import { errorText } from '../../lib/errors'
import { useDismiss } from './useClickOutside'

export function GlobalSearch({ className = '' }: { className?: string }) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounced = useDebounce(term, 350)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useDismiss(ref, open, () => setOpen(false))

  useEffect(() => {
    let live = true
    if (debounced.trim().length < 2) { setHits([]); setError(null); setLoading(false); return }
    setLoading(true)
    globalSearch(debounced)
      .then((r) => { if (live) { setHits(r); setError(null) } })
      .catch((e) => { if (live) setError(errorText(e)) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [debounced])

  const go = (h: SearchHit) => { setOpen(false); setTerm(''); navigate(h.link) }
  const showPanel = open && term.trim().length >= 2

  return (
    <div ref={ref} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
        placeholder="Search students, faculty, courses..." aria-label="Global search"
        className="w-full min-w-0 rounded-xl border border-white/70 bg-white/80 py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 md:min-w-[256px]" />
      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-indigo-100 bg-white p-2 shadow-xl md:w-[380px] md:left-auto">
          {loading && <p className="flex items-center gap-2 p-3 text-sm text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Searching...</p>}
          {!loading && error && <p role="alert" className="p-3 text-sm text-rose-600">{error}</p>}
          {!loading && !error && hits.length === 0 && <p className="p-3 text-sm text-muted">No matching records found.</p>}
          {!loading && !error && hits.map((h) => (
            <button key={`${h.type}-${h.id}`} onClick={() => go(h)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-brand-light">
              <span className="w-16 shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-center text-[11px] font-bold text-indigo-700">{h.type}</span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-ink">{h.title}</span><span className="block truncate text-xs text-muted">{h.subtitle}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
