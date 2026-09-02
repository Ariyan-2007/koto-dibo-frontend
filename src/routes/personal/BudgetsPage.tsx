import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBudget, listBudgets, type BudgetInput } from '@/lib/api/budget'
import { listExpenses } from '@/lib/api/expenses'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { getMonthRange, formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Plus, Wallet } from '@/components/ui/icons'
import { BudgetFormSheet } from '@/components/personal/BudgetFormSheet'

// BudgetDto/ExpenseDto carry no currency field — see ExpensesPage.
const CURRENCY = 'BDT'

function periodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return getMonthRange(year, month - 1).label
}

export function BudgetsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: budgets, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: listBudgets })
  // Fetched unfiltered and reduced client-side per period — one query serves every budget's
  // "spent so far" instead of one expenses call per budget.
  const { data: expenses } = useQuery({ queryKey: ['expenses'], queryFn: () => listExpenses() })

  const spentByPeriod = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of expenses ?? []) {
      const period = e.date.slice(0, 7)
      map.set(period, (map.get(period) ?? 0) + e.amount)
    }
    return map
  }, [expenses])

  const sorted = useMemo(() => [...(budgets ?? [])].sort((a, b) => b.period.localeCompare(a.period)), [budgets])
  const existingPeriods = useMemo(() => (budgets ?? []).map((b) => b.period), [budgets])

  const createMutation = useMutation({
    mutationFn: (input: BudgetInput) => createBudget(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Budget added')
      setFormOpen(false)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors({ period: err.fieldError('period') ?? '', amount: err.fieldError('amount') ?? '' })
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <SkeletonList rows={3} />
      ) : sorted.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sorted.map((budget) => {
            const spent = spentByPeriod.get(budget.period) ?? 0
            const pct = Math.min(100, (spent / budget.amount) * 100)
            const over = spent > budget.amount
            return (
              <Card key={budget.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{periodLabel(budget.period)}</p>
                  <p className={cn('shrink-0 text-sm font-medium', over ? 'text-danger' : 'text-ink')}>
                    {formatMoney(spent, CURRENCY)} / {formatMoney(budget.amount, CURRENCY)}
                  </p>
                </div>
                <div className="mt-3 h-2 rounded-pill bg-surface-muted">
                  <div className={cn('h-2 rounded-pill', over ? 'bg-danger' : 'bg-primary')} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {over
                    ? `${formatMoney(spent - budget.amount, CURRENCY)} over budget`
                    : `${formatMoney(budget.amount - spent, CURRENCY)} remaining`}
                </p>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet width={28} height={28} />}
          title="No Budgets Yet"
          description="Set a monthly budget to track your spending against it."
        />
      )}

      <Button
        onClick={() => {
          setFieldErrors({})
          setFormOpen(true)
        }}
        icon={<Plus width={18} height={18} />}
      >
        Add Budget
      </Button>

      <BudgetFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        isSubmitting={createMutation.isPending}
        fieldErrors={fieldErrors}
        existingPeriods={existingPeriods}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  )
}
