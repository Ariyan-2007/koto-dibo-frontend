import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { useHouseholdLedger } from '@/lib/ledger/useHouseholdLedger'
import { monthKeyRange } from '@/lib/ledger/period'
import { formatMoney } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Scale } from '@/components/ui/icons'

const currency = 'BDT'

export function LedgerHistoryPage() {
  const { household } = useHouseholdContext()
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const ledger = useHouseholdLedger(household.id, household.createdAt)

  const monthsDesc = useMemo(() => [...ledger.loadedKeys].sort().reverse(), [ledger.loadedKeys])
  const activeMembers = members ?? []

  const latestKey = monthsDesc[0]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Running Ledger</h1>
        <p className="text-sm text-muted">
          Balances never reset to zero — each month's own result adds onto everything before it (§0.6).
        </p>
      </div>

      <Card className="p-4">
        <p className="text-xs text-muted">Shopping-fund balance (cumulative)</p>
        <p className="mt-1 text-lg font-semibold text-ink">
          {latestKey ? formatMoney(ledger.fundBalance(latestKey), currency) : <Skeleton className="h-6 w-24" />}
        </p>
        {latestKey && (
          <p className="mt-1 text-xs text-muted">
            This should match whatever your latest "Leftover" Bazar entry says — if it doesn't, someone likely forgot to
            record one, or recorded the wrong amount.
          </p>
        )}
      </Card>

      {monthsDesc.length === 0 ? (
        <Skeleton className="h-40" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-105 text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left text-muted">
                <th className="p-3 font-medium">Month</th>
                {activeMembers.map((m) => (
                  <th key={m.userId} className="max-w-24 truncate p-3 font-medium text-right">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthsDesc.map((key) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-ink">{monthKeyRange(key).label}</td>
                  {activeMembers.map((m) => {
                    const value = ledger.memberBalance(m.userId, key)
                    return (
                      <td key={m.userId} className={`p-3 text-right ${value >= 0 ? 'text-primary' : 'text-danger'}`}>
                        {value >= 0 ? '+' : ''}
                        {formatMoney(value, currency)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {activeMembers.length === 0 && monthsDesc.length > 0 && (
        <EmptyState icon={<Scale width={28} height={28} />} title="No members to show yet" />
      )}

      {ledger.hasMoreHistory ? (
        <Button variant="secondary" onClick={ledger.loadEarlier} isLoading={ledger.isLoadingAny} className="self-center">
          Load Earlier Months
        </Button>
      ) : (
        monthsDesc.length > 0 && <p className="text-center text-xs text-muted">Beginning of this household's tracked history.</p>
      )}
    </div>
  )
}
