import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> { hover?: boolean; flush?: boolean }

export function GlassCard({ hover, flush, className = '', children, ...rest }: Props) {
  return (
    <div className={`glass-card ${flush ? '' : 'p-6'} ${hover ? 'glass-card-hover' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}
