import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listBillSplits } from '@/lib/api/billSplits'
import { canAddEntry } from '@/lib/permissions'
import { BILL_SPLIT_METHOD_LABEL } from '@/lib/billsplit/labels'
import { LedgerFilterSheet, activeLedgerFilterCount, type LedgerFilterValues } from '@/components/ledger/LedgerFilterSheet'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Scale, Plus, ChevronRight, Filter } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

export function BillSplitListPage() {
  const { household } = useHouseholdContext()
  const [filter, setFilter] = useState<LedgerFilterValues>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { data: splits, isLoading } = useQuery({
    queryKey: ['billSplits', household.id, filter],
    queryFn: () => listBillSplits(household.id, filter),
  })
  const filterCount = activeLedgerFilterCount(filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">Household · Splits</p>
          <h1 className="mt-0.5 font-heading text-[26px] font-semibold text-ink">Bill splits</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFiltersOpen(true)}
            aria-label="Filter bill splits"
            className="relative rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink"
          >
            <Filter width={18} height={18} />
            {filterCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-pill bg-primary text-[10px] font-semibold text-on-primary">
                {filterCount}
              </span>
            )}
          </button>
          {canAddEntry(household.callerRole) && (
            <Link to={`/h/${household.id}/bill-splits/new`}>
              <Button size="sm" icon={<Plus width={16} height={16} />}>
                New
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : splits && splits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {splits.map((s) => (
            <Link key={s.id} to={`/h/${household.id}/bill-splits/${s.id}`}>
              <Card className={cn('flex items-center gap-3 p-4 hover:border-primary', s.status === 'Cancelled' && 'opacity-50')}>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-medium text-ink', s.status === 'Cancelled' && 'line-through')}>{s.title}</p>
                  <p className="text-xs text-muted">
                    {formatDate(s.periodFrom)} – {formatDate(s.periodTo)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="primary">{BILL_SPLIT_METHOD_LABEL[s.splitMethod]}</Badge>
                  {s.status === 'Cancelled' && <Badge tone="danger">Cancelled</Badge>}
                  <ChevronRight width={16} height={16} className="text-muted" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Scale width={28} height={28} />}
          title={filterCount > 0 ? 'No Matching Bill Splits' : 'No Bill Splits Yet'}
          description={filterCount > 0 ? 'Try widening your filters.' : 'Create one for a shared utility bill or any other cost to divide.'}
        />
      )}

      <LedgerFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter Bill Splits"
        periodLabel="Period"
        value={filter}
        onApply={setFilter}
      />
    </div>
  )
}
