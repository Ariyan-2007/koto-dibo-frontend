import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField, TextareaField } from '@/components/ui/Field'
import { CategorySelect } from '@/components/personal/CategorySelect'
import { Plus, X } from '@/components/ui/icons'
import { PERIOD_TYPES, PERIOD_TYPE_LABEL } from '@/lib/personal/labels'
import { todayIso, getMonthRange } from '@/lib/format'
import type { CreateBudgetInput } from '@/lib/api/budgets'
import type { BudgetPeriodType } from '@/lib/api/types'

interface CategoryRow {
  id: string
  categoryId: string
  plannedAmount: string
  rolloverEnabled: boolean
}

function emptyRow(): CategoryRow {
  return { id: crypto.randomUUID(), categoryId: '', plannedAmount: '', rolloverEnabled: false }
}

function defaultName(periodType: BudgetPeriodType, startDate: string): string {
  if (periodType !== 'Monthly') return ''
  const [y, m] = startDate.split('-').map(Number)
  return getMonthRange(y, m - 1).label
}

export function BudgetFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: CreateBudgetInput) => void
  isSubmitting: boolean
  fieldErrors?: Record<string, string>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('BDT')
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('Monthly')
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<CategoryRow[]>([])

  useEffect(() => {
    if (!open) return
    const today = todayIso()
    setName(defaultName('Monthly', today))
    setDescription('')
    setCurrency('BDT')
    setPeriodType('Monthly')
    setStartDate(today)
    setEndDate('')
    setNotes('')
    setRows([])
  }, [open])

  function updateRow(id: string, patch: Partial<CategoryRow>) {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const categories = rows
      .filter((r) => r.categoryId && Number(r.plannedAmount) > 0)
      .map((r) => ({ categoryId: r.categoryId, plannedAmount: Number(r.plannedAmount), rolloverEnabled: r.rolloverEnabled }))

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      currency,
      periodType,
      startDate,
      endDate: periodType === 'Custom' ? endDate : undefined,
      notes: notes.trim() || undefined,
      categories: categories.length > 0 ? categories : undefined,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title="New Budget">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Period Type"
            value={periodType}
            onChange={(e) => {
              const next = e.target.value as BudgetPeriodType
              setPeriodType(next)
              if (!name || name === defaultName(periodType, startDate)) setName(defaultName(next, startDate))
            }}
          >
            {PERIOD_TYPES.map((p) => (
              <option key={p} value={p}>
                {PERIOD_TYPE_LABEL[p]}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (!name || name === defaultName(periodType, startDate)) setName(defaultName(periodType, e.target.value))
            }}
            required
          />
        </div>

        {periodType === 'Custom' && (
          <InputField label="End Date" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
        )}

        <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors?.name} maxLength={100} required />

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} required />
          <InputField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-ink">
            Category Envelopes <span className="font-normal text-muted">(optional — add more later)</span>
          </p>
          {rows.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-col gap-2 rounded-md border border-border p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <CategorySelect value={row.categoryId} onChange={(id) => updateRow(row.id, { categoryId: id })} />
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="Amount"
                      value={row.plannedAmount}
                      onChange={(e) => updateRow(row.id, { plannedAmount: e.target.value })}
                      className="h-11 w-28 rounded-md border border-border bg-surface px-2 text-right text-sm text-ink focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                      aria-label="Remove category"
                      className="rounded-pill p-2 text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <X width={16} height={16} />
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={row.rolloverEnabled}
                      onChange={(e) => updateRow(row.id, { rolloverEnabled: e.target.checked })}
                    />
                    Roll unspent (or overspent) balance into next period
                  </label>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setRows([...rows, emptyRow()])}
            className="flex items-center gap-1 rounded-sm border border-dashed border-border px-3 py-1.5 text-xs text-muted hover:bg-surface-muted"
          >
            <Plus width={14} height={14} /> Add a category
          </button>
        </div>

        <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create Budget (Draft)
        </Button>
      </form>
    </Sheet>
  )
}
