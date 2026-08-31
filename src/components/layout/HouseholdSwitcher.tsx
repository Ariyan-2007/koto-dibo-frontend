import { useState } from 'react'
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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-muted"
      >
        <div>
          <p className="text-sm font-semibold text-ink leading-tight">{current.name}</p>
          <p className="text-xs text-muted leading-tight">{current.callerRole}</p>
        </div>
        <ChevronDown width={16} height={16} className="text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-surface py-1 shadow-card">
            {(households ?? []).map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setOpen(false)
                  navigate(`/h/${h.id}`)
                }}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted',
                  h.id === current.id ? 'text-primary' : 'text-ink',
                )}
              >
                {h.name}
                {h.id === current.id && <Check width={16} height={16} />}
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
