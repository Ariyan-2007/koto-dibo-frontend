import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'
import { formatMoney } from '@/lib/format'
import type { BudgetCategoryDto } from '@/lib/api/types'

/** Delta, not an absolute new amount (§Phase 7.4) — the two buttons just flip the sign the user
 * types against, so "reduce by 500" and "add 500" both read as one intuitive number entry. */
export function AdjustCategorySheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  category,
  currency,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: { delta: number; reason?: string }) => void
  isSubmitting: boolean
  category: BudgetCategoryDto | null
  currency: string
  error?: string
}) {
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setDirection('increase')
      setAmount('')
      setReason('')
    }
  }, [open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const magnitude = Number(amount)
    onSubmit({ delta: direction === 'increase' ? magnitude : -magnitude, reason: reason.trim() || undefined })
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Adjust "${category?.categoryName ?? ''}"`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {category && <p className="text-sm text-muted">Currently planned: {formatMoney(category.plannedAmount, currency)}</p>}

        <div className="flex gap-1 rounded-md bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setDirection('increase')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${direction === 'increase' ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}
          >
            Increase
          </button>
          <button
            type="button"
            onClick={() => setDirection('decrease')}
            className={`flex-1 rounded-md py-2 text-sm font-medium ${direction === 'decrease' ? 'bg-surface text-danger shadow-sm' : 'text-muted'}`}
          >
            Decrease
          </button>
        </div>

        <InputField
          label={`Amount (${currency})`}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error}
          required
          autoFocus
        />

        <InputField label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Save Adjustment
        </Button>
      </form>
    </Sheet>
  )
}
