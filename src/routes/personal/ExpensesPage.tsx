import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExpense, listExpenses, type ExpenseInput } from '@/lib/api/expenses'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { getMonthRange, formatMoney, formatDate } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ChevronLeft, ChevronRight, Plus, Receipt } from '@/components/ui/icons'
import { ExpenseFormSheet } from '@/components/personal/ExpenseFormSheet'

// ExpenseDto carries no currency field (personal expenses are single-currency at MVP) — BDT is
// the display default, same posture MealSettlementPage takes for MealCalculationDto.
const CURRENCY = 'BDT'

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const { from, to, label } = getMonthRange(cursor.year, cursor.month)

  const [formOpen, setFormOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', from, to],
    queryFn: () => listExpenses({ from, to }),
  })

  const sorted = useMemo(
    () => [...(expenses ?? [])].sort((a, b) => b.date.localeCompare(a.date)),
    [expenses],
  )
  const total = useMemo(() => sorted.reduce((sum, e) => sum + e.amount, 0), [sorted])
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of sorted) map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [sorted])

  const createMutation = useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense added')
      setFormOpen(false)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors({
          amount: err.fieldError('amount') ?? '',
          category: err.fieldError('category') ?? '',
          description: err.fieldError('description') ?? '',
          date: err.fieldError('date') ?? '',
        })
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <p className="font-medium text-ink">{label}</p>
        <button
          onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <Card className="p-4">
            <p className="text-xs text-muted">Total Spent</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{formatMoney(total, CURRENCY)}</p>
            {categoryTotals.length > 0 && (
              <div className="mt-4 flex flex-col gap-2.5">
                {categoryTotals.slice(0, 5).map(([category, amount]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="truncate">{category}</span>
                      <span className="shrink-0">{formatMoney(amount, CURRENCY)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-pill bg-surface-muted">
                      <div className="h-1.5 rounded-pill bg-primary" style={{ width: `${Math.min(100, (amount / total) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {sorted.length > 0 ? (
            <div className="flex flex-col gap-2">
              {sorted.map((expense) => (
                <Card key={expense.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{formatMoney(expense.amount, CURRENCY)}</p>
                      <Badge>{expense.category}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {formatDate(expense.date)}
                      {expense.description && ` · ${expense.description}`}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Receipt width={28} height={28} />}
              title="No Expenses This Month"
              description="Log what you spend to track it against your budget."
            />
          )}
        </>
      )}

      <Button
        onClick={() => {
          setFieldErrors({})
          setFormOpen(true)
        }}
        icon={<Plus width={18} height={18} />}
      >
        Add Expense
      </Button>

      <ExpenseFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        isSubmitting={createMutation.isPending}
        fieldErrors={fieldErrors}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  )
}
