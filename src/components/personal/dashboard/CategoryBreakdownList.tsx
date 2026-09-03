import { Badge } from '@/components/ui/Badge'
import { formatMoney, formatPercent } from '@/lib/format'
import { BUDGET_CATEGORY_STATUS_LABEL, BUDGET_CATEGORY_STATUS_TONE } from '@/lib/personal/labels'
import { cn } from '@/lib/cn'
import type { CategoryBreakdownDto } from '@/lib/api/types'

export function CategoryBreakdownList({ items, currency }: { items: CategoryBreakdownDto[]; currency: string }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((c) => {
        const pct = Math.min(100, c.utilizationPercentage ?? 0)
        const barTone = c.status === 'Overspent' ? 'bg-danger' : c.status === 'Warning' ? 'bg-warning' : 'bg-primary'
        return (
          <div key={c.categoryId}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate font-medium text-ink">{c.categoryName}</span>
              <Badge tone={BUDGET_CATEGORY_STATUS_TONE[c.status]}>{BUDGET_CATEGORY_STATUS_LABEL[c.status]}</Badge>
            </div>
            <div className="mt-1.5 h-1.5 rounded-pill bg-surface-muted">
              <div className={cn('h-1.5 rounded-pill', barTone)} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted">
              <span>
                {formatMoney(c.spent, currency)} of {formatMoney(c.budget, currency)}
              </span>
              <span>{formatPercent(c.utilizationPercentage)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
