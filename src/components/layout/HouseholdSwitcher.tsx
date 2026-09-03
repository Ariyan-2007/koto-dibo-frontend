import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listHouseholds } from '@/lib/api/households'
import type { HouseholdDto } from '@/lib/api/types'
import { ChevronDown, Check, Plus } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function HouseholdSwitcher({ current }: { current: HouseholdDto }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: households } = useQuery({
    queryKey: ['households'],
    queryFn: listHouseholds,
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full min-w-0 items-center gap-2 rounded-sm px-2.5 py-2.5 text-left hover:bg-surface-muted"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-semibold text-ink leading-tight">{current.name}</p>
          <p className="text-[11px] text-muted leading-tight">
            {current.callerRole} · {current.memberCount} member{current.memberCount === 1 ? '' : 's'}
          </p>
        </div>
        <ChevronDown width={14} height={14} className="shrink-0 text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="listbox" aria-label="Switch household" className="absolute left-0 top-full z-50 mt-1 w-64 rounded-sm border border-border bg-surface py-1 shadow-pop">
            {(households ?? []).map((h) => (
              <button
                key={h.id}
                role="option"
                aria-selected={h.id === current.id}
                onClick={() => {
                  setOpen(false)
                  navigate(`/h/${h.id}`)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted',
                  h.id === current.id ? 'text-primary' : 'text-ink',
                )}
              >
                <span className="truncate">{h.name}</span>
                {h.id === current.id && <Check width={16} height={16} className="shrink-0" />}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => {
                setOpen(false)
                navigate('/households')
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
            >
              <Plus width={16} height={16} />
              All households
            </button>
          </div>
        </>
      )}
    </div>
  )
}
