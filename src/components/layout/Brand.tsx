import { GraduationCap } from 'lucide-react'

export function Brand({ subtitle = 'Campus Management' }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-indigo-500/30">
        <GraduationCap className="h-6 w-6" aria-hidden />
      </div>
      <div className="leading-tight">
        <p className="font-display text-lg font-extrabold text-ink">CampusSphere</p>
        <p className="text-xs font-medium text-muted">{subtitle}</p>
      </div>
    </div>
  )
}
