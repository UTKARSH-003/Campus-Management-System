import { Search } from 'lucide-react'

interface Props { value: string; onChange: (v: string) => void; placeholder: string; className?: string }

export function SearchField({ value, onChange, placeholder, className = '' }: Props) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="w-full rounded-xl border border-indigo-100 bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
    </div>
  )
}
