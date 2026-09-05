import { useThemeStore, type ThemeMode } from '@/lib/theme/themeStore'
import { Sun, Moon, Monitor } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'system', label: 'System', icon: Monitor },
  { mode: 'dark', label: 'Dark', icon: Moon },
]

/** Three-way Light/System/Dark switch, backed by `themeStore` (persisted to localStorage,
 * applied as `data-theme` on `<html>`). Icon-only so it drops into a header bar without
 * competing for space with the rest of the nav. */
export function ThemeToggle({ className }: { className?: string }) {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn('inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface-muted p-0.5', className)}
    >
      {OPTIONS.map(({ mode: m, label, icon: Icon }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={label}
          title={label}
          onClick={() => setMode(m)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-[3px] transition-colors',
            mode === m ? 'bg-primary text-on-primary' : 'text-muted hover:bg-surface hover:text-ink',
          )}
        >
          <Icon width={15} height={15} />
        </button>
      ))}
    </div>
  )
}
