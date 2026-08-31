import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'primary' | 'muted' | 'danger' | 'success'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary',
  muted: 'bg-surface-muted text-muted',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-primary-soft text-primary',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ tone = 'muted', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
