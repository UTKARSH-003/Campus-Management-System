import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props { page: number; pageSize: number; total: number; onPage: (p: number) => void }

export function Pagination({ page, pageSize, total, onPage }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const btn = 'rounded-lg border border-indigo-100 bg-white p-2 text-ink hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed'
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-indigo-50 px-6 py-4 text-sm text-muted sm:flex-row">
      <span>Showing <b className="text-ink">{from}-{to}</b> of <b className="text-ink">{total}</b></span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <span className="min-w-[5rem] text-center font-semibold text-ink">Page {page} / {pages}</span>
        <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </nav>
  )
}
