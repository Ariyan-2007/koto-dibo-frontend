import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, TextareaField } from '@/components/ui/Field'
import { CategorySelect } from '@/components/personal/CategorySelect'
import type { BudgetCategoryInput } from '@/lib/api/budgets'

export function AddBudgetCategorySheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: BudgetCategoryInput) => void
  isSubmitting: boolean
  fieldErrors?: Record<string, string>
}) {
  const [categoryId, setCategoryId] = useState('')
  const [plannedAmount, setPlannedAmount] = useState('')
  const [rolloverEnabled, setRolloverEnabled] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setCategoryId('')
      setPlannedAmount('')
      setRolloverEnabled(false)
      setNotes('')
    }
  }, [open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ categoryId, plannedAmount: Number(plannedAmount), rolloverEnabled, notes: notes.trim() || undefined })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Category Envelope">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <CategorySelect value={categoryId} onChange={setCategoryId} error={fieldErrors?.categoryId} />
        <InputField
          label="Planned Amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={plannedAmount}
          onChange={(e) => setPlannedAmount(e.target.value)}
          error={fieldErrors?.plannedAmount}
          required
          autoFocus
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={rolloverEnabled} onChange={(e) => setRolloverEnabled(e.target.checked)} />
          Roll unspent (or overspent) balance into next period
        </label>
        <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={!categoryId}>
          Add
        </Button>
      </form>
    </Sheet>
  )
}
