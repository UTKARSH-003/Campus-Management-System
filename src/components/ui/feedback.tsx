import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} aria-hidden />

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand"><Inbox className="h-6 w-6" aria-hidden /></div>
      <p className="font-bold text-ink">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-accent"><AlertCircle className="h-6 w-6" aria-hidden /></div>
      <p className="font-bold text-ink">Something went wrong</p>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw className="h-4 w-4" aria-hidden />Try again</Button>}
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  )
}
