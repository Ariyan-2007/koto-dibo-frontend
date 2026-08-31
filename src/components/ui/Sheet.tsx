import type { ReactNode } from 'react'
import { X } from './icons'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full flex-col rounded-t-lg bg-surface shadow-sheet md:max-w-lg md:rounded-lg md:shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-pill p-1.5 text-muted hover:bg-surface-muted"
          >
            <X />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 pb-safe">{children}</div>
      </div>
    </div>
  )
}
