import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listBillSplits } from '@/lib/api/billSplits'
import { canAddEntry } from '@/lib/permissions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Scale, Plus, ChevronRight } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const METHOD_LABEL: Record<string, string> = {
  TariffMetered: 'Tariff metered',
  EqualSplit: 'Equal split',
  WeightedSplit: 'Weighted split',
}

export function BillSplitListPage() {
  const { household } = useHouseholdContext()
  const { data: splits, isLoading } = useQuery({
    queryKey: ['billSplits', household.id],
    queryFn: () => listBillSplits(household.id),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Bill splits</h1>
        {canAddEntry(household.callerRole) && (
          <Link to={`/h/${household.id}/bill-splits/new`}>
            <Button size="sm" icon={<Plus width={16} height={16} />}>
              New
            </Button>
          </Link>
        )}
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
                  <Badge tone="primary">{METHOD_LABEL[s.splitMethod]}</Badge>
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
          title="No bill splits yet"
          description="Create one for a shared utility bill or any other cost to divide."
        />
      )}
    </div>
  )
}
