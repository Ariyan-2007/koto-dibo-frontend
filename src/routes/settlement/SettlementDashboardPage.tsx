import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { getHouseholdSettlement } from '@/lib/api/settlement'
import { getMonthRange } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton'
import { GiveTakeStrip } from '@/components/settlement/GiveTakeStrip'
import { ChevronLeft, ChevronRight, Bowl, Scale } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'

export function SettlementDashboardPage() {
  const { household } = useHouseholdContext()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const { from, to, label } = getMonthRange(cursor.year, cursor.month)

  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const { data: settlement, isLoading } = useQuery({
    queryKey: ['settlement', household.id, from, to],
    queryFn: () => getHouseholdSettlement(household.id, from, to),
  })

  const currency = 'BDT'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Where everyone stands</h1>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <p className="font-medium text-ink">{label}</p>
        <button
          onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {isLoading || !settlement ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <SkeletonList rows={3} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center">
              <p className="text-xs text-muted">Meal give/take</p>
              <p className={`mt-1 text-lg font-semibold ${settlement.totalMealGiveTake >= 0 ? 'text-primary' : 'text-danger'}`}>
                {formatMoney(settlement.totalMealGiveTake, currency)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted">Bill split owed</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatMoney(settlement.totalBillSplitOwed, currency)}</p>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-muted">
                  <th className="p-3 font-medium">Member</th>
                  <th className="p-3 font-medium">Meals</th>
                  <th className="p-3 font-medium">Bills</th>
                  <th className="p-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {settlement.members.map((m) => (
                  <tr key={m.userId} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-ink">{nameByUser.get(m.userId) ?? '—'}</td>
                    <td className="p-3 text-ink">{formatMoney(m.mealGiveTake, currency)}</td>
                    <td className="p-3 text-ink">{formatMoney(m.billSplitOwed, currency)}</td>
                    <td className={`p-3 text-right font-semibold ${m.netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {m.netBalance >= 0 ? '+' : ''}
                      {formatMoney(m.netBalance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <GiveTakeStrip
            items={settlement.members.map((m) => ({ name: nameByUser.get(m.userId) ?? '—', giveTake: m.netBalance }))}
            currency={currency}
          />

          <div className="flex gap-3">
            <Link to={`/h/${household.id}/meals/settlement`} className="flex-1">
              <Card className="flex items-center gap-2 p-3 text-sm font-medium text-ink hover:border-primary">
                <Bowl width={16} height={16} className="text-primary" />
                Meal breakdown
              </Card>
            </Link>
            <Link to={`/h/${household.id}/bill-splits`} className="flex-1">
              <Card className="flex items-center gap-2 p-3 text-sm font-medium text-ink hover:border-primary">
                <Scale width={16} height={16} className="text-primary" />
                Bill splits
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
