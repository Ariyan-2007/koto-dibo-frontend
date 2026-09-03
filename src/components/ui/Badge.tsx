import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'primary' | 'muted' | 'danger' | 'success' | 'warning' | 'outline'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary-active',
  muted: 'bg-surface-muted text-muted',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-primary-soft text-primary-active',
  warning: 'bg-warning-soft text-warning',
  outline: 'bg-transparent text-primary border border-primary',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'muted', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[3px] px-2 py-0.5 text-[11px] font-medium tracking-wide',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
