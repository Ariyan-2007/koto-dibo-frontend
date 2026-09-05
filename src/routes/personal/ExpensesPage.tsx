import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createExpense, deleteExpense, listExpenses, updateExpense, type ExpenseInput } from '@/lib/api/expenses'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { formatMoney, formatDate } from '@/lib/format'
import { PAYMENT_METHOD_LABEL } from '@/lib/personal/labels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Plus, Receipt, Filter, ChevronLeft, ChevronRight, Repeat, Tag, Trash, Pencil } from '@/components/ui/icons'
import { ExpenseFormSheet } from '@/components/personal/ExpenseFormSheet'
import { ExpenseFiltersSheet, type ExpenseFilterValues } from '@/components/personal/ExpenseFiltersSheet'
import { CategoryManagerSheet } from '@/components/personal/CategoryManagerSheet'
import type { ExpenseDto } from '@/lib/api/types'

const PAGE_SIZE = 20
const DEFAULT_FILTER: ExpenseFilterValues = { sortBy: 'Date', sortDescending: true }

function activeFilterCount(f: ExpenseFilterValues): number {
  const { sortBy: _sortBy, sortDescending: _sortDescending, ...rest } = f
  return Object.values(rest).filter((v) => v !== undefined && v !== '').length
}

export function ExpensesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<ExpenseFilterValues>(DEFAULT_FILTER)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ExpenseDto | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ExpenseDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filter, page],
    queryFn: () => listExpenses({ ...filter, page, pageSize: PAGE_SIZE }),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['expenses'] })
  }

  const createMutation = useMutation({
    mutationFn: (input: ExpenseInput) => createExpense(input),
    onSuccess: () => {
      invalidate()
      toast.success('Expense added')
      closeForm()
    },
    onError: handleFormError,
  })

  const updateMutation = useMutation({
    mutationFn: (input: ExpenseInput) => updateExpense(editing!.id, input),
    onSuccess: () => {
      invalidate()
      toast.success('Expense updated')
      closeForm()
    },
    onError: handleFormError,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      invalidate()
      toast.success('Expense deleted')
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setDeleteTarget(null)
    },
  })

  function handleFormError(err: unknown) {
    if (err instanceof ApiError && err.errors) {
      setFieldErrors({
        amount: err.fieldError('amount') ?? '',
        categoryId: err.fieldError('categoryId') ?? '',
        date: err.fieldError('date') ?? '',
        tags: err.fieldError('tags') ?? '',
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

  function applyFilter(next: ExpenseFilterValues) {
    setFilter(next)
    setPage(1)
  }

  const filterCount = useMemo(() => activeFilterCount(filter), [filter])
  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">Personal finance</p>
          <h1 className="mt-0.5 font-heading text-[26px] font-semibold text-ink">Expenses</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/expenses/recurring" aria-label="Recurring expenses" className="rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink">
            <Repeat width={18} height={18} />
          </Link>
          <button
            onClick={() => setCategoriesOpen(true)}
            aria-label="Manage categories"
            className="rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <Tag width={18} height={18} />
          </button>
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="Filter expenses"
            className="relative rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <Filter width={18} height={18} />
            {filterCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-pill bg-primary text-[10px] font-semibold text-on-primary">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList rows={5} />
      ) : items.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            {items.map((expense) => (
              <Card key={expense.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium text-ink">{formatMoney(expense.amount, expense.currency)}</p>
                    <Badge>{expense.categoryName}</Badge>
                    {expense.isRecurringGenerated && <Badge tone="primary">Recurring</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {formatDate(expense.date)}
                    {expense.merchant && ` · ${expense.merchant}`}
                    {expense.description && ` · ${expense.description}`}
                    {` · ${PAYMENT_METHOD_LABEL[expense.paymentMethod]}`}
                  </p>
                  {expense.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {expense.tags.map((t) => (
                        <span key={t} className="rounded-[2px] bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditing(expense)
                      setFormOpen(true)
                    }}
                    aria-label="Edit expense"
                    className="rounded-pill p-2 text-muted hover:bg-surface-muted hover:text-ink"
                  >
                    <Pencil width={15} height={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(expense)}
                    aria-label="Delete expense"
                    className="rounded-pill p-2 text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash width={15} height={15} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-md p-2 text-sm text-muted hover:bg-surface-muted disabled:opacity-40"
              >
                <ChevronLeft width={16} height={16} /> Prev
              </button>
              <p className="text-xs text-muted">
                Page {data?.page} of {totalPages} · {data?.totalCount} total
              </p>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-md p-2 text-sm text-muted hover:bg-surface-muted disabled:opacity-40"
              >
                Next <ChevronRight width={16} height={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Receipt width={28} height={28} />}
          title={filterCount > 0 ? 'No Matching Expenses' : 'No Expenses Yet'}
          description={filterCount > 0 ? 'Try widening your filters.' : 'Log what you spend to track it against your budget.'}
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
        Add Expense
      </Button>

      <ExpenseFormSheet
        open={formOpen}
        onClose={closeForm}
        isSubmitting={editing ? updateMutation.isPending : createMutation.isPending}
        fieldErrors={fieldErrors}
        initial={editing ?? undefined}
        onSubmit={(values) => (editing ? updateMutation.mutate(values) : createMutation.mutate(values))}
      />

      <ExpenseFiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} value={filter} onApply={applyFilter} />

      <CategoryManagerSheet open={categoriesOpen} onClose={() => setCategoriesOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete This Expense?"
        description={deleteTarget ? `${formatMoney(deleteTarget.amount, deleteTarget.currency)} · ${deleteTarget.categoryName}` : undefined}
        confirmLabel="Delete"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
