import { AlertTriangle, CheckCircle2, Clock, Info, MinusCircle, XCircle } from 'lucide-react'
import { label } from '../../utils/constants'

export type BadgeTone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'

const tones: Record<BadgeTone, { cls: string; Icon: typeof Info }> = {
  good: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  warn: { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  bad: { cls: 'bg-rose-50 text-rose-700 border-rose-200', Icon: XCircle },
  info: { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', Icon: Info },
  neutral: { cls: 'bg-slate-50 text-slate-600 border-slate-200', Icon: MinusCircle },
}

/** Status is always conveyed with an icon AND text, never colour alone. */
export function StatusBadge({ tone, children, icon }: { tone: BadgeTone; children: string; icon?: 'alert' }) {
  const { cls, Icon } = tones[tone]
  const I = icon === 'alert' ? AlertTriangle : Icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${cls}`}>
      <I className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  )
}

const STATUS_TONE: Record<string, BadgeTone> = {
  active: 'good', published: 'good', graded: 'good', present: 'good', submitted: 'info',
  inactive: 'neutral', archived: 'neutral', retired: 'neutral', draft: 'neutral', closed: 'neutral', graduated: 'info',
  on_leave: 'warn', late: 'warn', suspended: 'bad', absent: 'bad', missing: 'bad',
}
export const StatusPill = ({ status }: { status: string }) => (
  <StatusBadge tone={STATUS_TONE[status] ?? 'neutral'}>{label(status)}</StatusBadge>
)

const PRIORITY_TONE: Record<string, BadgeTone> = { informational: 'info', important: 'warn', urgent: 'bad' }
export const PriorityBadge = ({ priority }: { priority: string }) => (
  <StatusBadge tone={PRIORITY_TONE[priority] ?? 'info'} icon={priority === 'urgent' ? 'alert' : undefined}>{label(priority)}</StatusBadge>
)
