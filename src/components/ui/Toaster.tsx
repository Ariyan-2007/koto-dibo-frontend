import { useToastStore } from '@/lib/toast'
import { cn } from '@/lib/cn'

const toneClasses = {
  info: 'bg-surface text-ink border-border',
  success: 'bg-primary text-on-primary border-primary',
  error: 'bg-danger-soft text-danger border-danger-border',
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          aria-label={`Dismiss: ${t.message}`}
          className={cn(
            'pointer-events-auto max-w-sm rounded-md border px-4 py-3 text-left text-sm shadow-card',
            toneClasses[t.tone],
          )}
        >
          {t.message}
        </button>
      ))}
    </div>
  )
}
