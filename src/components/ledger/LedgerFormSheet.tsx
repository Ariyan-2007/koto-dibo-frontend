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
  signMode = 'positive',
  amountLabel,
  amountHint,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: LedgerFormValues) => void
  isSubmitting: boolean
  title: string
  noteLabel?: string
  fieldErrors?: Record<string, string>
  initial?: Partial<LedgerFormValues>
  /** 'negative' is the Bazar "leftover" flow (§Phase 2) — the user always types a positive
   * magnitude here; the sign is applied on submit so a stray minus sign can't slip through. */
  signMode?: 'positive' | 'negative'
  amountLabel?: string
  amountHint?: string
}) {
  const [date, setDate] = useState(initial?.date ?? todayIso())
  const [amount, setAmount] = useState(initial?.amount !== undefined ? Math.abs(initial.amount).toString() : '')
  const [currency, setCurrency] = useState(initial?.currency ?? 'BDT')
  const [note, setNote] = useState(initial?.note ?? '')

  const noteRequired = signMode === 'negative'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const magnitude = Math.abs(Number(amount))
    onSubmit({ date, amount: signMode === 'negative' ? -magnitude : magnitude, currency: currency.toUpperCase(), note })
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
          label={amountLabel ?? `Amount (${currency})`}
          hint={amountHint}
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
        <TextareaField
          label={noteLabel}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={fieldErrors?.note}
          required={noteRequired}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  )
}
