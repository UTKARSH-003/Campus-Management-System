import type { LucideIcon } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'

export function MetricCard({ icon: Icon, label, value, hint, tone }: { icon: LucideIcon; label: string; value: string; hint: string; tone: 'indigo' | 'emerald' | 'amber' | 'rose' }) {
  const tones = { indigo: 'bg-indigo-50 text-brand', emerald: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', rose: 'bg-rose-50 text-rose-600' }
  return (
    <GlassCard hover>
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}><Icon className="h-6 w-6" aria-hidden /></div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-display mt-1 text-4xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{hint}</p>
    </GlassCard>
  )
}

export function ProgressCard({ label, value, description, percent, color }: { label: string; value: string; description: string; percent: number | null; color: string }) {
  return (
    <GlassCard hover className="!p-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-display mt-1 text-2xl font-extrabold text-ink">{value}</p>
      <p className="mb-3 mt-0.5 min-h-[2rem] text-xs text-muted">{description}</p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent ?? undefined}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent ?? 0}%`, background: color }} />
      </div>
    </GlassCard>
  )
}
