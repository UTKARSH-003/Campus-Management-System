import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; loading?: boolean; size?: 'sm' | 'md' }

const styles: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-md shadow-indigo-500/20',
  secondary: 'bg-white text-ink border border-indigo-100 hover:bg-brand-light',
  danger: 'bg-rose-accent text-white hover:bg-rose-600',
  ghost: 'text-muted hover:bg-brand-light hover:text-ink',
}

export function Button({ variant = 'primary', loading, size = 'md', className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed
        ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm min-h-[42px]'} ${styles[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
