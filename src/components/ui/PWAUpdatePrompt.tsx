import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from '@/components/ui/icons'
import { Button } from '@/components/ui/Button'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="alert"
      className="pt-safe fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-3"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm shadow-card">
        <RefreshCw width={18} height={18} className="shrink-0 text-primary" />
        <p className="flex-1 text-ink">A new version is available.</p>
        <Button size="sm" onClick={() => void updateServiceWorker(true)}>
          Update
        </Button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Dismiss update notice"
          className="text-ink-muted hover:text-ink"
        >
          <X width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
