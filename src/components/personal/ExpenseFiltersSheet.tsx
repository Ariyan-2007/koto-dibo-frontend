import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField } from '@/components/ui/Field'
import { CategorySelect } from '@/components/personal/CategorySelect'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '@/lib/personal/labels'
import type { ExpenseListFilter } from '@/lib/api/expenses'
import type { ExpenseSortField } from '@/lib/api/types'

const SORT_FIELDS: { value: ExpenseSortField; label: string }[] = [
  { value: 'Date', label: 'Date' },
  { value: 'Amount', label: 'Amount' },
  { value: 'CreatedAt', label: 'Date Added' },
  { value: 'Merchant', label: 'Merchant' },
  { value: 'Category', label: 'Category' },
]

/** Everything but `page`/`pageSize` — those reset separately whenever filters change. */
export type ExpenseFilterValues = Omit<ExpenseListFilter, 'page' | 'pageSize'>

const EMPTY: ExpenseFilterValues = { sortBy: 'Date', sortDescending: true }

export function ExpenseFiltersSheet({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean
  onClose: () => void
  value: ExpenseFilterValues
  onApply: (filter: ExpenseFilterValues) => void
}) {
  const [draft, setDraft] = useState<ExpenseFilterValues>(value)

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
    <Sheet open={open} onClose={onClose} title="Filter Expenses">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Search"
          value={draft.search ?? ''}
          onChange={(e) => setDraft({ ...draft, search: e.target.value || undefined })}
          hint="Matches description, merchant, or category"
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField label="From" type="date" value={draft.from ?? ''} onChange={(e) => setDraft({ ...draft, from: e.target.value || undefined })} />
          <InputField label="To" type="date" value={draft.to ?? ''} onChange={(e) => setDraft({ ...draft, to: e.target.value || undefined })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Min Amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft.minAmount ?? ''}
            onChange={(e) => setDraft({ ...draft, minAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
          <InputField
            label="Max Amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={draft.maxAmount ?? ''}
            onChange={(e) => setDraft({ ...draft, maxAmount: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>

        <CategorySelect
          label="Category (any)"
          value={draft.categoryId ?? ''}
          onChange={(id) => setDraft({ ...draft, categoryId: id || undefined })}
        />

        <SelectField
          label="Payment Method"
          value={draft.paymentMethod ?? ''}
          onChange={(e) => setDraft({ ...draft, paymentMethod: e.target.value || undefined })}
        >
          <option value="">Any</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABEL[m]}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Merchant Contains" value={draft.merchant ?? ''} onChange={(e) => setDraft({ ...draft, merchant: e.target.value || undefined })} />
          <InputField label="Tag" value={draft.tag ?? ''} onChange={(e) => setDraft({ ...draft, tag: e.target.value || undefined })} />
        </div>

        <SelectField
          label="Recurring Only"
          value={draft.isRecurring === undefined ? '' : String(draft.isRecurring)}
          onChange={(e) => setDraft({ ...draft, isRecurring: e.target.value === '' ? undefined : e.target.value === 'true' })}
        >
          <option value="">Any</option>
          <option value="true">Recurring-generated only</option>
          <option value="false">One-off only</option>
        </SelectField>

        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Sort By" value={draft.sortBy ?? 'Date'} onChange={(e) => setDraft({ ...draft, sortBy: e.target.value as ExpenseSortField })}>
            {SORT_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Order"
            value={draft.sortDescending === false ? 'asc' : 'desc'}
            onChange={(e) => setDraft({ ...draft, sortDescending: e.target.value !== 'asc' })}
          >
            <option value="desc">Newest / Highest first</option>
            <option value="asc">Oldest / Lowest first</option>
          </SelectField>
        </div>

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
