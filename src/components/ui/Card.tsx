import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** A plain hairline-bordered plate with no fill — sits flush on the page
   * background instead of floating above it. Used for the instrument-panel
   * callouts (settlement plans, pre-close checks) rather than list rows. */
  plain?: boolean
}

export function Card({ className, plain = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-sm border border-border',
        plain ? 'bg-transparent' : 'bg-surface shadow-card',
        className,
      )}
      {...props}
    />
  )
}
