import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Tap-to-reveal explainer for a jargon-y label (e.g. "Attributed Cost") — deliberately click-based
 * rather than hover-only, since this is a touch-first PWA where hover doesn't exist.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex align-middle">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`What does "${label}" mean?`}
        aria-expanded={open}
        className="ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-[10px] font-semibold leading-none text-muted hover:bg-border hover:text-ink"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-1.5 w-48 -translate-x-1/2 rounded-md border border-border bg-surface p-2.5 text-left text-xs font-normal leading-snug text-muted shadow-card"
        >
          {children}
        </span>
      )}
    </span>
  )
}
