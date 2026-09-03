import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField, TextareaField } from '@/components/ui/Field'
import { CategorySelect } from '@/components/personal/CategorySelect'
import { TagsInput } from '@/components/personal/TagsInput'
import { FREQUENCIES, FREQUENCY_LABEL, PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from '@/lib/personal/labels'
import { todayIso } from '@/lib/format'
import type { RecurringExpenseInput } from '@/lib/api/recurringExpenses'
import type { RecurringExpenseDto } from '@/lib/api/types'

export function RecurringExpenseFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fieldErrors,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: RecurringExpenseInput) => void
  isSubmitting: boolean
  fieldErrors?: Record<string, string>
  /** When set, edits this template — `Frequency`/`StartDate` render read-only (immutable server-side). */
  initial?: RecurringExpenseDto
}) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('BDT')
  const [categoryId, setCategoryId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [tags, setTags] = useState<string[]>([])
  const [frequency, setFrequency] = useState('Monthly')
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount(initial ? String(initial.amount) : '')
    setCurrency(initial?.currency ?? 'BDT')
    setCategoryId(initial?.categoryId ?? '')
    setMerchant(initial?.merchant ?? '')
    setDescription(initial?.description ?? '')
    setNotes(initial?.notes ?? '')
    setPaymentMethod(initial?.paymentMethod ?? 'Cash')
    setTags(initial?.tags ?? [])
    setFrequency(initial?.frequency ?? 'Monthly')
    setStartDate(initial?.startDate ?? todayIso())
    setEndDate(initial?.endDate ?? '')
  }, [open, initial])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({
      amount: Number(amount),
      currency,
      categoryId,
      merchant: merchant.trim() || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      paymentMethod,
      tags,
      frequency,
      startDate,
      endDate: endDate || undefined,
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Edit Recurring Expense' : 'New Recurring Expense'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label={`Amount (${currency})`}
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

        <CategorySelect value={categoryId} onChange={setCategoryId} error={fieldErrors?.categoryId} />

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} maxLength={200} />
          <SelectField label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </SelectField>
        </div>

        <InputField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            disabled={!!initial}
            hint={initial ? 'Immutable — deactivate and create a new one to change cadence' : undefined}
          >
            {FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {FREQUENCY_LABEL[f]}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={!!initial}
            required
          />
        </div>

        <InputField label="End Date (optional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />

        <TagsInput value={tags} onChange={setTags} error={fieldErrors?.tags} />

        <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />

        <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={!categoryId}>
          Save
        </Button>
      </form>
    </Sheet>
  )
}
