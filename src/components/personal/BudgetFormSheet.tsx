import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'
import type { BudgetInput } from '@/lib/api/budget'

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function BudgetFormSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fieldErrors,
  existingPeriods,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: BudgetInput) => void
  isSubmitting: boolean
  fieldErrors?: Record<string, string>
  /** Periods (YYYY-MM) that already have a budget — only one budget per month is allowed. */
  existingPeriods: string[]
}) {
  const [period, setPeriod] = useState(currentPeriod())
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (open) {
      setPeriod(currentPeriod())
      setAmount('')
    }
  }, [open])

  const duplicate = existingPeriods.includes(period)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (duplicate) return
    onSubmit({ period, amount: Number(amount) })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add Budget">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <InputField
          label="Month"
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          error={fieldErrors?.period ?? (duplicate ? 'You already have a budget for this month.' : undefined)}
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
        <Button type="submit" isLoading={isSubmitting} disabled={duplicate} className="w-full">
          Save
        </Button>
      </form>
    </Sheet>
  )
}
