import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  icon?: ReactNode
  /** Draws the blueprint corner brackets — reserve for the one primary action on a screen. */
  framed?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active border border-primary',
  secondary: 'bg-transparent text-ink border border-border hover:bg-surface-muted',
  ghost: 'bg-transparent text-primary border border-transparent hover:bg-primary-soft',
  danger: 'bg-danger-soft text-danger border border-danger-border hover:brightness-95',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-4 text-[14px] gap-2',
  sm: 'h-9 px-3 text-[13px] gap-1.5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, icon, framed = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-heading font-semibold tracking-tight transition-colors',
        'focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-45 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        framed && 'corner-frame',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
})
