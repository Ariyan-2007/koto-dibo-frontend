import { useQuery } from '@tanstack/react-query'
import { getHouseholdBalance } from '@/lib/api/balance'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Wallet } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'

/** The household fund's running total — not tied to a month/date range, unlike the settlement view. */
export function HouseholdBalanceCard({ householdId }: { householdId: string }) {
  const { data: balance, isLoading } = useQuery({
    queryKey: ['householdBalance', householdId],
    queryFn: () => getHouseholdBalance(householdId),
  })

  if (isLoading || !balance) {
    return <Skeleton className="h-24" />
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wallet width={18} height={18} className="text-primary" />
        <p className="text-sm font-medium text-ink">Household Fund</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-muted">Balance</p>
          <p className={`mt-1 text-lg font-semibold ${balance.currentBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
            {formatMoney(balance.currentBalance, balance.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Contributed</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatMoney(balance.totalContributions, balance.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Spent</p>
          <p className="mt-1 text-lg font-semibold text-ink">{formatMoney(balance.totalSpentFromFund, balance.currency)}</p>
        </div>
      </div>
    </Card>
  )
}
