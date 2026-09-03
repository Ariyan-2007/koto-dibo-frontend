import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField, SelectField } from '@/components/ui/Field'
import { formatMoney } from '@/lib/format'
import type { BudgetCategoryDto } from '@/lib/api/types'

export function TransferCategorySheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  fromCategory,
  otherCategories,
  currency,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: { toCategoryAllocationId: string; amount: number; reason?: string }) => void
  isSubmitting: boolean
  fromCategory: BudgetCategoryDto | null
  otherCategories: BudgetCategoryDto[]
  currency: string
  error?: string
}) {
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) {
      setToId(otherCategories[0]?.id ?? '')
      setAmount('')
      setReason('')
    }
  }, [open, otherCategories])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ toCategoryAllocationId: toId, amount: Number(amount), reason: reason.trim() || undefined })
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Transfer From "${fromCategory?.categoryName ?? ''}"`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {fromCategory && <p className="text-sm text-muted">Available: {formatMoney(fromCategory.remaining, currency)}</p>}

        <SelectField label="To Category" value={toId} onChange={(e) => setToId(e.target.value)} required>
          {otherCategories.length === 0 && <option value="">No other categories in this budget</option>}
          {otherCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.categoryName}
            </option>
          ))}
        </SelectField>

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

        <Button type="submit" isLoading={isSubmitting} className="w-full" disabled={!toId}>
          Transfer
        </Button>
      </form>
    </Sheet>
  )
}
