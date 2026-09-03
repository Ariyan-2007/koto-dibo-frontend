import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { History, ArrowRightLeft } from '@/components/ui/icons'
import { formatMoney, formatPercent } from '@/lib/format'
import { BUDGET_CATEGORY_STATUS_LABEL, BUDGET_CATEGORY_STATUS_TONE } from '@/lib/personal/labels'
import { cn } from '@/lib/cn'
import type { BudgetCategoryDto } from '@/lib/api/types'

export function CategoryEnvelopeCard({
  category,
  currency,
  canManage,
  onAdjust,
  onTransfer,
  onHistory,
}: {
  category: BudgetCategoryDto
  currency: string
  canManage: boolean
  onAdjust: () => void
  onTransfer: () => void
  onHistory: () => void
}) {
  const pct = Math.min(100, category.usagePercentage ?? 0)
  const barTone = category.status === 'Overspent' ? 'bg-danger' : category.status === 'Warning' ? 'bg-warning' : 'bg-primary'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{category.categoryName}</p>
          <p className="text-xs text-muted">
            {formatMoney(category.spent, currency)} of {formatMoney(category.totalAvailable, currency)}
            {category.rolloverAmount !== 0 && ` (incl. ${formatMoney(category.rolloverAmount, currency)} rollover)`}
          </p>
        </div>
        <Badge tone={BUDGET_CATEGORY_STATUS_TONE[category.status]}>{BUDGET_CATEGORY_STATUS_LABEL[category.status]}</Badge>
      </div>

      <div className="mt-3 h-2 rounded-pill bg-surface-muted">
        <div className={cn('h-2 rounded-pill', barTone)} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span>{formatPercent(category.usagePercentage)} used</span>
        <span className={category.remaining < 0 ? 'font-medium text-danger' : undefined}>
          {category.remaining < 0
            ? `${formatMoney(Math.abs(category.remaining), currency)} over`
            : `${formatMoney(category.remaining, currency)} left`}
        </span>
      </div>

      {category.notes && <p className="mt-2 text-xs text-muted">{category.notes}</p>}

      {canManage && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <button onClick={onAdjust} className="flex-1 rounded-md py-1.5 text-xs font-medium text-primary hover:bg-primary-soft">
            Adjust
          </button>
          <button onClick={onTransfer} className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-ink hover:bg-surface-muted">
            <ArrowRightLeft width={13} height={13} /> Transfer
          </button>
          <button onClick={onHistory} className="flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium text-muted hover:bg-surface-muted">
            <History width={13} height={13} /> History
          </button>
        </div>
      )}
    </Card>
  )
}
