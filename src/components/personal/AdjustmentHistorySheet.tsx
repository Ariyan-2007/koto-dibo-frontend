import { useQuery } from '@tanstack/react-query'
import { Sheet } from '@/components/ui/Sheet'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { History } from '@/components/ui/icons'
import { getBudgetCategoryAdjustments } from '@/lib/api/budgets'
import { formatMoney } from '@/lib/format'
import type { BudgetAdjustmentType } from '@/lib/api/types'

const TYPE_LABEL: Record<BudgetAdjustmentType, string> = {
  Initial: 'Initial Allocation',
  Increase: 'Increase',
  Decrease: 'Decrease',
  Rollover: 'Rolled Over',
  TransferIn: 'Transfer In',
  TransferOut: 'Transfer Out',
}

export function AdjustmentHistorySheet({
  open,
  onClose,
  budgetId,
  allocationId,
  categoryName,
  currency,
}: {
  open: boolean
  onClose: () => void
  budgetId: string
  allocationId: string | null
  categoryName?: string
  currency: string
}) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['budgetAdjustments', budgetId, allocationId],
    queryFn: () => getBudgetCategoryAdjustments(budgetId, allocationId!),
    enabled: open && !!allocationId,
  })

  return (
    <Sheet open={open} onClose={onClose} title={`History — ${categoryName ?? ''}`}>
      {isLoading ? (
        <SkeletonList rows={3} />
      ) : history && history.length > 0 ? (
        <div className="flex flex-col gap-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0">
              <div className="min-w-0">
                <p className="font-medium text-ink">{TYPE_LABEL[h.type]}</p>
                {h.reason && <p className="truncate text-xs text-muted">{h.reason}</p>}
                <p className="text-xs text-muted">{new Date(h.createdAt).toLocaleString()}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`font-medium ${h.amount >= 0 ? 'text-primary' : 'text-danger'}`}>
                  {h.amount >= 0 ? '+' : ''}
                  {formatMoney(h.amount, currency)}
                </p>
                <p className="text-xs text-muted">Balance after: {formatMoney(h.balanceAfter, currency)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<History width={28} height={28} />} title="No Adjustments Yet" />
      )}
    </Sheet>
  )
}
