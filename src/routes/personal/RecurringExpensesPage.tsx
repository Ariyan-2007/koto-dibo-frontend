import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRecurringExpense,
  deactivateRecurringExpense,
  generateDueRecurringExpenses,
  listRecurringExpenses,
  updateRecurringExpense,
  type RecurringExpenseInput,
} from '@/lib/api/recurringExpenses'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { formatMoney, formatDate } from '@/lib/format'
import { FREQUENCY_LABEL } from '@/lib/personal/labels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Plus, Repeat, RefreshCw, Pencil } from '@/components/ui/icons'
import { RecurringExpenseFormSheet } from '@/components/personal/RecurringExpenseFormSheet'
import type { RecurringExpenseDto } from '@/lib/api/types'

export function RecurringExpensesPage() {
  const queryClient = useQueryClient()
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RecurringExpenseDto | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<RecurringExpenseDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: recurring, isLoading } = useQuery({
    queryKey: ['recurringExpenses', showInactive],
    queryFn: () => listRecurringExpenses(showInactive),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['recurringExpenses'] })
  }

  const createMutation = useMutation({
    mutationFn: (input: RecurringExpenseInput) => createRecurringExpense(input),
    onSuccess: () => {
      invalidate()
      toast.success('Recurring expense created')
      closeForm()
    },
    onError: handleFormError,
  })

  const updateMutation = useMutation({
    mutationFn: (input: RecurringExpenseInput) =>
      updateRecurringExpense(editing!.id, {
        amount: input.amount,
        currency: input.currency,
        categoryId: input.categoryId,
        merchant: input.merchant,
        description: input.description,
        notes: input.notes,
        paymentMethod: input.paymentMethod,
        tags: input.tags,
        endDate: input.endDate,
      }),
    onSuccess: () => {
      invalidate()
      toast.success('Recurring expense updated')
      closeForm()
    },
    onError: handleFormError,
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateRecurringExpense(id),
    onSuccess: () => {
      invalidate()
      toast.success('Recurring expense deactivated')
      setDeactivateTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setDeactivateTarget(null)
    },
  })

  const generateMutation = useMutation({
    mutationFn: () => generateDueRecurringExpenses(),
    onSuccess: (generated) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      invalidate()
      toast.success(generated.length > 0 ? `${generated.length} expense${generated.length === 1 ? '' : 's'} generated` : 'Nothing due yet')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  function handleFormError(err: unknown) {
    if (err instanceof ApiError && err.errors) {
      setFieldErrors({
        amount: err.fieldError('amount') ?? '',
        categoryId: err.fieldError('categoryId') ?? '',
        startDate: err.fieldError('startDate') ?? '',
      })
      toast.error(err.message)
    } else {
      toast.error(errorMessage(err))
    }
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFieldErrors({})
  }

  const items = recurring ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/expenses" className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="flex-1 font-heading text-[22px] font-semibold text-ink">Recurring expenses</h1>
        <Button size="sm" variant="secondary" isLoading={generateMutation.isPending} onClick={() => generateMutation.mutate()} icon={<RefreshCw width={15} height={15} />}>
          Sync due
        </Button>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Show deactivated
      </label>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((r) => (
            <Card key={r.id} className={`flex items-center gap-3 p-4 ${!r.isActive && 'opacity-50'}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="font-medium text-ink">{formatMoney(r.amount, r.currency)}</p>
                  <Badge>{r.categoryName}</Badge>
                  <Badge tone="primary">{FREQUENCY_LABEL[r.frequency]}</Badge>
                  {!r.isActive && <Badge tone="muted">Inactive</Badge>}
                </div>
                <p className="truncate text-xs text-muted">
                  {r.merchant && `${r.merchant} · `}
                  {r.isActive ? `Next: ${formatDate(r.nextOccurrenceDate)}` : `Ended`}
                  {r.lastGeneratedDate && ` · Last: ${formatDate(r.lastGeneratedDate)}`}
                </p>
              </div>
              {r.isActive && (
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditing(r)
                      setFormOpen(true)
                    }}
                    aria-label="Edit recurring expense"
                    className="rounded-pill p-2 text-muted hover:bg-surface-muted hover:text-ink"
                  >
                    <Pencil width={15} height={15} />
                  </button>
                  <button
                    onClick={() => setDeactivateTarget(r)}
                    aria-label="Deactivate recurring expense"
                    className="rounded-pill p-2 text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <RefreshCw width={15} height={15} className="rotate-45" />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Repeat width={28} height={28} />}
          title="No Recurring Expenses"
          description="Set up a template for rent, subscriptions, or anything else that repeats — it generates real expenses automatically."
        />
      )}

      <Button
        onClick={() => {
          setEditing(null)
          setFieldErrors({})
          setFormOpen(true)
        }}
        icon={<Plus width={18} height={18} />}
      >
        New Recurring Expense
      </Button>

      <RecurringExpenseFormSheet
        open={formOpen}
        onClose={closeForm}
        isSubmitting={editing ? updateMutation.isPending : createMutation.isPending}
        fieldErrors={fieldErrors}
        initial={editing ?? undefined}
        onSubmit={(values) => (editing ? updateMutation.mutate(values) : createMutation.mutate(values))}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate This Recurring Expense?"
        description="It stops generating new expenses. Past occurrences already logged aren't affected."
        confirmLabel="Deactivate"
        danger
        isLoading={deactivateMutation.isPending}
        onConfirm={() => deactivateTarget && deactivateMutation.mutate(deactivateTarget.id)}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  )
}
