import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBudget, listBudgets } from '@/lib/api/budgets'
import type { CreateBudgetInput } from '@/lib/api/budgets'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { useIsMounted } from '@/lib/useIsMounted'
import { formatMoney, formatDate, formatPercent } from '@/lib/format'
import { BUDGET_HEALTH_LABEL, BUDGET_HEALTH_TONE, PERIOD_TYPE_LABEL } from '@/lib/personal/labels'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Plus, Wallet, ChevronRight } from '@/components/ui/icons'
import { BudgetFormSheet } from '@/components/personal/BudgetFormSheet'
import { cn } from '@/lib/cn'
import type { BudgetStatus } from '@/lib/api/types'

const STATUS_TABS: { value: BudgetStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
]

export function BudgetsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isMounted = useIsMounted()
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'All'>('All')
  const [formOpen, setFormOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', statusFilter],
    queryFn: () => listBudgets(statusFilter === 'All' ? undefined : { status: statusFilter }),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateBudgetInput) => createBudget(input),
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success('Budget created')
      setFormOpen(false)
      if (isMounted.current) navigate(`/budgets/${budget.id}`)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors({ name: err.fieldError('name') ?? '', startDate: err.fieldError('startDate') ?? '' })
        toast.error(err.message)
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">Personal finance</p>
        <h1 className="mt-0.5 font-heading text-[26px] font-semibold text-ink">Budgets</h1>
      </div>

      <div className="inline-flex overflow-x-auto rounded-sm border border-border">
        {STATUS_TABS.map((tab, i) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 font-heading text-[13px] font-semibold',
              i > 0 && 'border-l border-border',
              statusFilter === tab.value ? 'bg-primary text-on-primary' : 'text-ink hover:bg-surface-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : budgets && budgets.length > 0 ? (
        <div className="flex flex-col gap-3">
          {budgets.map((budget) => (
            <Link key={budget.id} to={`/budgets/${budget.id}`}>
              <Card className="p-4 hover:border-primary">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-[15px] font-semibold text-ink">{budget.name}</p>
                    <p className="text-xs text-muted">
                      {PERIOD_TYPE_LABEL[budget.periodType]} · {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={BUDGET_HEALTH_TONE[budget.health]}>{BUDGET_HEALTH_LABEL[budget.health]}</Badge>
                    <ChevronRight width={16} height={16} className="text-muted" />
                  </div>
                </div>
                <div className="mt-3 h-2.5 rounded-[2px] bg-surface-muted">
                  <div
                    className={cn('h-2.5 rounded-[2px]', budget.health === 'Overspending' || budget.health === 'Critical' ? 'bg-danger' : 'bg-primary')}
                    style={{ width: `${Math.min(100, budget.utilizationPercentage ?? 0)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
                  <span>
                    {formatMoney(budget.totalSpent, budget.currency)} of {formatMoney(budget.totalAvailable, budget.currency)}
                  </span>
                  <span>{formatPercent(budget.utilizationPercentage)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet width={28} height={28} />}
          title="No Budgets Yet"
          description="Create one for this month and add category envelopes to track your spending against."
        />
      )}

      <Button
        onClick={() => {
          setFieldErrors({})
          setFormOpen(true)
        }}
        framed
        icon={<Plus width={18} height={18} />}
      >
        New budget
      </Button>

      <BudgetFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        isSubmitting={createMutation.isPending}
        fieldErrors={fieldErrors}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </div>
  )
}
