import { useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, TextareaField } from '@/components/ui/Field'
import { todayIso } from '@/lib/format'

export interface LedgerFormValues {
  date: string
  amount: number
  currency: string
  note: string
}

export function LedgerFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  title,
  noteLabel = 'Note',
  fieldErrors,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: LedgerFormValues) => void
  isSubmitting: boolean
  title: string
  noteLabel?: string
  fieldErrors?: Record<string, string>
  initial?: Partial<LedgerFormValues>
}) {
  const [date, setDate] = useState(initial?.date ?? todayIso())
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'BDT')
  const [note, setNote] = useState(initial?.note ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ date, amount: Number(amount), currency: currency.toUpperCase(), note })
  }

  return (
    <Sheet open={open} onClose={onClose} title={title}>
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
        <InputField
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          error={fieldErrors?.currency}
          required
        />
        <TextareaField label={noteLabel} value={note} onChange={(e) => setNote(e.target.value)} error={fieldErrors?.note} />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  )
}
