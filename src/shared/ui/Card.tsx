import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`bg-surface border border-border rounded-[var(--radius-card)] p-6 ${className}`} {...props} />
}
