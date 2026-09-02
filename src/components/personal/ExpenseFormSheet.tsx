import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, TextareaField } from '@/components/ui/Field'
import { todayIso } from '@/lib/format'
import type { ExpenseInput } from '@/lib/api/expenses'

const CATEGORY_SUGGESTIONS = [
  'Food',
  'Groceries',
  'Transport',
  'Rent',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Subscriptions',
  'Other',
]

export function ExpenseFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fieldErrors,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: ExpenseInput) => void
  isSubmitting: boolean
  fieldErrors?: Record<string, string>
}) {
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')

  // Reset to a clean form every time the sheet opens — it stays mounted between opens, so
  // without this a previously-submitted expense's values would linger in the fields.
  useEffect(() => {
    if (open) {
      setDate(todayIso())
      setAmount('')
      setCategory('')
      setDescription('')
    }
  }, [open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ amount: Number(amount), category: category.trim(), description: description.trim(), date })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Expense">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Date"
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          error={fieldErrors?.date}
          required
        />
        <InputField
          label="Amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors?.amount}
          required
          autoFocus
        />
        <div>
          <InputField
            label="Category"
            list="expense-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={fieldErrors?.category}
            maxLength={100}
            required
          />
          <datalist id="expense-categories">
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <TextareaField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors?.description}
          maxLength={500}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  )
}
