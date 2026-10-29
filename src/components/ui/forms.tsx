import type { ReactNode } from 'react'

export const inputCls =
  'w-full rounded-xl border border-indigo-100 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-slate-50'

interface FieldProps { label: string; error?: string; required?: boolean; hint?: string; children: ReactNode; htmlFor?: string }

export function Field({ label, error, required, hint, children, htmlFor }: FieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
        {label} {required && <span className="text-rose-accent" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { options: { value: string | number; label: string }[]; placeholder?: string }

export function Select({ options, placeholder, className = '', ...rest }: SelectProps) {
  return (
    <select className={`${inputCls} ${className}`} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
