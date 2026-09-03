import { useEffect, useState, type FormEvent } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { InputField } from '@/components/ui/Field'
import type { RolloverBudgetInput } from '@/lib/api/budgets'
import type { BudgetDto } from '@/lib/api/types'

/** All fields optional — omitted, the next period auto-computes from the current budget's
 * `PeriodType` (§Phase 7.4). Only worth overriding for an off-cadence next period. */
export function RolloverSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  budget,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: RolloverBudgetInput) => void
  isSubmitting: boolean
  budget: BudgetDto | null
}) {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setStartDate('')
      setEndDate('')
    }
  }, [open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ name: name.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Roll Over to Next Period">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Creates the next period's budget. Every category's planned amount carries forward, and categories with rollover
          enabled also carry their current remaining balance{budget?.totalOverspent ? ' — even if it went negative' : ''}.
        </p>
        <InputField label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} hint="Auto-generated if left blank" />
        {budget?.periodType === 'Custom' ? (
          <>
            <InputField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <InputField label="End Date" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
          </>
        ) : (
          <>
            <InputField label="Start Date (optional)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} hint="Auto-computed if left blank" />
            <InputField label="End Date (optional)" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Roll Over
        </Button>
      </form>
    </Sheet>
  )
}
