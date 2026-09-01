import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'
import { cn } from '@/lib/cn'

const PRESETS = [0, 0.5, 1, 1.5, 2, 3]

export function MealCellSheet({
  open,
  title,
  currentCount,
  hasEntry,
  isSaving,
  onClose,
  onSet,
  onClear,
}: {
  open: boolean
  title: string
  currentCount: number | null
  hasEntry: boolean
  isSaving: boolean
  onClose: () => void
  onSet: (count: number) => void
  onClear: () => void
}) {
  const [custom, setCustom] = useState('')

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((value) => (
            <button
              key={value}
              onClick={() => onSet(value)}
              disabled={isSaving}
              className={cn(
                'rounded-md border py-3 text-center text-base font-medium',
                hasEntry && currentCount === value
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border text-ink hover:bg-surface-muted',
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <InputField
              label="Custom amount"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            disabled={!custom || isSaving}
            onClick={() => {
              onSet(Number(custom))
              setCustom('')
            }}
            className="shrink-0"
          >
            Set
          </Button>
        </div>

        {hasEntry && (
          <Button variant="ghost" className="text-danger" onClick={onClear} disabled={isSaving}>
            Clear Entry
          </Button>
        )}
      </div>
    </Sheet>
  )
}
