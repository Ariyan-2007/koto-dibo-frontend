import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField } from '@/components/ui/Field'
import type { FinancialEntryStatus } from '@/lib/api/types'

export interface LedgerFilterValues {
  from?: string
  to?: string
  status?: FinancialEntryStatus
}

const EMPTY: LedgerFilterValues = {}

export function activeLedgerFilterCount(f: LedgerFilterValues): number {
  return Object.values(f).filter((v) => v !== undefined && v !== '').length
}

/** Shared `from`/`to`/`status` filter sheet for the four list screens whose API already accepts
 * this exact shape (§2.1 Bazar, §2.2 Contributions, §2.3 balance/transactions, §4 bill-splits) but
 * previously had no UI control for it — every list fetched everything unfiltered. */
export function LedgerFilterSheet({
  open,
  onClose,
  title,
  periodLabel = 'Date range',
  value,
  onApply,
}: {
  open: boolean
  onClose: () => void
  title: string
  /** "Period" for bill splits, "Date range" (default) for Bazar/Contributions/Transactions. */
  periodLabel?: string
  value: LedgerFilterValues
  onApply: (filter: LedgerFilterValues) => void
}) {
  const [draft, setDraft] = useState<LedgerFilterValues>(value)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onApply(draft)
    onClose()
  }

  function handleClear() {
    setDraft(EMPTY)
    onApply(EMPTY)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-[12px] font-medium text-muted">{periodLabel}</p>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="From" type="date" value={draft.from ?? ''} onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })} />
            <InputField label="To" type="date" value={draft.to ?? ''} onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })} />
          </div>
        </div>

        <SelectField
          label="Status"
          value={draft.status ?? ''}
          onChange={(e) => setDraft({ ...draft, status: (e.target.value || undefined) as FinancialEntryStatus | undefined })}
        >
          <option value="">All</option>
          <option value="Active">Active</option>
          <option value="Cancelled">Cancelled</option>
        </SelectField>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClear}>
            Clear
          </Button>
          <Button type="submit" className="flex-1">
            Apply
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
