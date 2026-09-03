import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addBudgetCategory,
  adjustBudgetCategory,
  getBudget,
  rolloverBudget,
  transferBudgetCategory,
  updateBudget,
  type AdjustBudgetCategoryInput,
  type BudgetCategoryInput,
  type RolloverBudgetInput,
  type TransferBudgetCategoryInput,
  type UpdateBudgetInput,
} from '@/lib/api/budgets'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { formatMoney, formatDate, formatPercent } from '@/lib/format'
import { BUDGET_HEALTH_LABEL, BUDGET_HEALTH_TONE, PERIOD_TYPE_LABEL } from '@/lib/personal/labels'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { InputField, TextareaField } from '@/components/ui/Field'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ArrowLeft, Pencil, Plus, RefreshCw, Layers } from '@/components/ui/icons'
import { CategoryEnvelopeCard } from '@/components/personal/CategoryEnvelopeCard'
import { AddBudgetCategorySheet } from '@/components/personal/AddBudgetCategorySheet'
import { AdjustCategorySheet } from '@/components/personal/AdjustCategorySheet'
import { TransferCategorySheet } from '@/components/personal/TransferCategorySheet'
import { AdjustmentHistorySheet } from '@/components/personal/AdjustmentHistorySheet'
import { RolloverSheet } from '@/components/personal/RolloverSheet'
import type { BudgetCategoryDto, BudgetStatus } from '@/lib/api/types'

// Draft -> Active|Archived, Active -> Completed|Archived, Completed -> Archived, Archived terminal.
const NEXT_STATUSES: Record<BudgetStatus, BudgetStatus[]> = {
  Draft: ['Active', 'Archived'],
  Active: ['Completed', 'Archived'],
  Completed: ['Archived'],
  Archived: [],
}

export function BudgetDetailPage() {
  const { budgetId } = useParams<{ budgetId: string }>()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [rolloverOpen, setRolloverOpen] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<BudgetCategoryDto | null>(null)
  const [transferTarget, setTransferTarget] = useState<BudgetCategoryDto | null>(null)
  const [historyTarget, setHistoryTarget] = useState<BudgetCategoryDto | null>(null)
  const [actionError, setActionError] = useState<string | undefined>()

  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => getBudget(budgetId!),
    enabled: !!budgetId,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['budget', budgetId] })
    queryClient.invalidateQueries({ queryKey: ['budgets'] })
  }

  const updateMutation = useMutation({
    mutationFn: (input: UpdateBudgetInput) => updateBudget(budgetId!, input),
    onSuccess: () => {
      invalidate()
      toast.success('Budget updated')
      setEditOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  const addCategoryMutation = useMutation({
    mutationFn: (input: BudgetCategoryInput) => addBudgetCategory(budgetId!, input),
    onSuccess: () => {
      invalidate()
      toast.success('Category added')
      setAddCategoryOpen(false)
    },
    onError: (err) => {
      if (err instanceof ApiError) toast.error(err.message)
      else toast.error(errorMessage(err))
    },
  })

  const adjustMutation = useMutation({
    mutationFn: (input: AdjustBudgetCategoryInput) => adjustBudgetCategory(budgetId!, adjustTarget!.id, input),
    onSuccess: () => {
      invalidate()
      toast.success('Adjustment saved')
      setAdjustTarget(null)
      setActionError(undefined)
    },
    onError: (err) => {
      if (err instanceof ApiError) setActionError(err.fieldError('delta') ?? err.message)
      else toast.error(errorMessage(err))
    },
  })

  const transferMutation = useMutation({
    mutationFn: (input: TransferBudgetCategoryInput) => transferBudgetCategory(budgetId!, transferTarget!.id, input),
    onSuccess: () => {
      invalidate()
      toast.success('Transferred')
      setTransferTarget(null)
      setActionError(undefined)
    },
    onError: (err) => {
      if (err instanceof ApiError) setActionError(err.fieldError('amount') ?? err.message)
      else toast.error(errorMessage(err))
    },
  })

  const rolloverMutation = useMutation({
    mutationFn: (input: RolloverBudgetInput) => rolloverBudget(budgetId!, input),
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast.success(`Rolled over to "${next.name}"`)
      setRolloverOpen(false)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  if (isLoading || !budget) {
    return <SkeletonList rows={4} />
  }

  const canManage = budget.status !== 'Archived'
  const nextStatuses = NEXT_STATUSES[budget.status]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to="/budgets" className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="flex-1 truncate font-heading text-[22px] font-semibold text-ink">{budget.name}</h1>
        <button onClick={() => setEditOpen(true)} aria-label="Edit budget" className="rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink">
          <Pencil width={18} height={18} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="muted">{budget.status}</Badge>
        <Badge tone={BUDGET_HEALTH_TONE[budget.health]}>{BUDGET_HEALTH_LABEL[budget.health]}</Badge>
        <span className="text-sm text-muted">
          {PERIOD_TYPE_LABEL[budget.periodType]} · {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
        </span>
      </div>

      {budget.description && <p className="text-sm text-muted">{budget.description}</p>}

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border bg-border">
        <SummaryTile label="Planned" value={formatMoney(budget.totalPlanned, budget.currency)} />
        <SummaryTile label="Rollover" value={formatMoney(budget.totalRollover, budget.currency)} />
        <SummaryTile label="Available" value={formatMoney(budget.totalAvailable, budget.currency)} />
        <SummaryTile label="Spent" value={formatMoney(budget.totalSpent, budget.currency)} />
        <SummaryTile
          label={budget.totalOverspent > 0 ? 'Overspent' : 'Remaining'}
          value={formatMoney(budget.totalOverspent > 0 ? budget.totalOverspent : budget.totalRemaining, budget.currency)}
          danger={budget.totalOverspent > 0}
        />
        <SummaryTile label="Used" value={formatPercent(budget.utilizationPercentage)} />
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((s) => (
            <Button key={s} size="sm" variant="secondary" isLoading={updateMutation.isPending} onClick={() => updateMutation.mutate({ status: s })}>
              Mark {s}
            </Button>
          ))}
          <Button size="sm" variant="secondary" icon={<RefreshCw width={15} height={15} />} onClick={() => setRolloverOpen(true)}>
            Roll Over
          </Button>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-[15px] font-semibold text-ink">Category envelopes</h2>
          {canManage && (
            <button onClick={() => setAddCategoryOpen(true)} className="flex items-center gap-1 text-sm font-medium text-primary">
              <Plus width={15} height={15} /> Add
            </button>
          )}
        </div>

        {budget.categories.length > 0 ? (
          <div className="flex flex-col gap-3">
            {budget.categories.map((c) => (
              <CategoryEnvelopeCard
                key={c.id}
                category={c}
                currency={budget.currency}
                canManage={canManage}
                onAdjust={() => setAdjustTarget(c)}
                onTransfer={() => setTransferTarget(c)}
                onHistory={() => setHistoryTarget(c)}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={<Layers width={28} height={28} />} title="No Categories Yet" description="Add an envelope to start tracking spend against a plan." />
        )}
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit Budget">
        <EditBudgetForm budget={budget} isSubmitting={updateMutation.isPending} onSubmit={(v) => updateMutation.mutate(v)} />
      </Sheet>

      <AddBudgetCategorySheet
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        isSubmitting={addCategoryMutation.isPending}
        onSubmit={(v) => addCategoryMutation.mutate(v)}
      />

      <AdjustCategorySheet
        open={!!adjustTarget}
        onClose={() => {
          setAdjustTarget(null)
          setActionError(undefined)
        }}
        category={adjustTarget}
        currency={budget.currency}
        isSubmitting={adjustMutation.isPending}
        error={actionError}
        onSubmit={(v) => adjustMutation.mutate(v)}
      />

      <TransferCategorySheet
        open={!!transferTarget}
        onClose={() => {
          setTransferTarget(null)
          setActionError(undefined)
        }}
        fromCategory={transferTarget}
        otherCategories={budget.categories.filter((c) => c.id !== transferTarget?.id)}
        currency={budget.currency}
        isSubmitting={transferMutation.isPending}
        error={actionError}
        onSubmit={(v) => transferMutation.mutate(v)}
      />

      <AdjustmentHistorySheet
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        budgetId={budgetId!}
        allocationId={historyTarget?.id ?? null}
        categoryName={historyTarget?.categoryName}
        currency={budget.currency}
      />

      <RolloverSheet open={rolloverOpen} onClose={() => setRolloverOpen(false)} budget={budget} isSubmitting={rolloverMutation.isPending} onSubmit={(v) => rolloverMutation.mutate(v)} />
    </div>
  )
}

function SummaryTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="bg-surface p-3.5 text-center">
      <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">{label}</p>
      <p className={`font-num mt-1 font-heading text-[17px] font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

function EditBudgetForm({
  budget,
  onSubmit,
  isSubmitting,
}: {
  budget: { name: string; description: string | null; notes: string | null }
  onSubmit: (values: UpdateBudgetInput) => void
  isSubmitting: boolean
}) {
  const [name, setName] = useState(budget.name)
  const [description, setDescription] = useState(budget.description ?? '')
  const [notes, setNotes] = useState(budget.notes ?? '')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name: name.trim(), description: description.trim() || undefined, notes: notes.trim() || undefined })
      }}
      className="flex flex-col gap-4"
    >
      <InputField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <InputField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Save
      </Button>
    </form>
  )
}
