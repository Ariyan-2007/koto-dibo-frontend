import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { getHouseholdSettlement } from '@/lib/api/settlement'
import { getMonthRange } from '@/lib/format'
import { useHouseholdLedger } from '@/lib/ledger/useHouseholdLedger'
import { Card } from '@/components/ui/Card'
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { InfoTip } from '@/components/ui/InfoTip'
import { GiveTakeStrip } from '@/components/settlement/GiveTakeStrip'
import { ChevronLeft, ChevronRight, Bowl, Scale, ArrowUpRight, ArrowDownRight, Check } from '@/components/ui/icons'
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

  const ledger = useHouseholdLedger(household.id, household.createdAt)

  const currency = 'BDT'

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Where Everyone Stands</h1>

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
              <p className="text-xs text-muted">Meal Give/Take</p>
              <p className={`mt-1 text-lg font-semibold ${settlement.totalMealGiveTake >= 0 ? 'text-primary' : 'text-danger'}`}>
                {formatMoney(settlement.totalMealGiveTake, currency)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-muted">Bill Split Owed</p>
              <p className="mt-1 text-lg font-semibold text-ink">{formatMoney(settlement.totalBillSplitOwed, currency)}</p>
            </Card>
          </div>

          {settlement.members.length === 0 ? (
            <EmptyState icon={<Scale width={28} height={28} />} title="No Members Yet" description="Add members to this household to start tracking who owes what." />
          ) : settlement.members.length === 1 ? (
            <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted">
              With just one member, there's no one to settle up with yet — invite someone to share costs.
            </p>
          ) : settlement.members.every((m) => m.netBalance === 0) ? (
            <Card className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-pill bg-primary-soft text-primary">
                <Check width={22} height={22} />
              </div>
              <p className="font-semibold text-ink">You're all squared away! 🎉</p>
              <p className="text-sm text-muted">Nobody owes anybody anything for {label}.</p>
            </Card>
          ) : (
            <>
              <Card className="overflow-x-auto">
                <table className="w-full min-w-105 text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted text-left text-muted">
                      <th className="p-3 font-medium">Member</th>
                      <th className="p-3 font-medium">Meals</th>
                      <th className="p-3 font-medium">Bills</th>
                      <th className="p-3 font-medium text-right">
                        Net
                        <InfoTip label="Net">
                          What this member owes or is owed this month: their meal Give/Take minus their bill-split share. Green with
                          an up-arrow means the household owes them.
                        </InfoTip>
                      </th>
                      <th className="p-3 font-medium text-right">
                        Lifetime
                        <InfoTip label="Lifetime">
                          The running total since this household started tracking — every month's Net balance added together,
                          never reset to zero.
                        </InfoTip>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.members.map((m) => {
                      const lifetimeReady = !!ledger.periods[ledger.currentMonthKey]
                      const lifetime = ledger.memberBalance(m.userId)
                      return (
                        <tr key={m.userId} className="border-b border-border last:border-0">
                          <td className="max-w-32 truncate p-3 font-medium text-ink">{nameByUser.get(m.userId) ?? 'Former member'}</td>
                          <td className="p-3 text-ink">{formatMoney(m.mealGiveTake, currency)}</td>
                          <td className="p-3 text-ink">{formatMoney(m.billSplitOwed, currency)}</td>
                          <td className={`p-3 text-right font-semibold ${m.netBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                            <span className="inline-flex items-center gap-1 justify-end">
                              {m.netBalance !== 0 &&
                                (m.netBalance > 0 ? (
                                  <ArrowUpRight width={13} height={13} />
                                ) : (
                                  <ArrowDownRight width={13} height={13} />
                                ))}
                              {m.netBalance >= 0 ? '+' : ''}
                              {formatMoney(m.netBalance, currency)}
                            </span>
                          </td>
                          <td className={`p-3 text-right text-muted ${lifetimeReady && lifetime !== 0 ? (lifetime > 0 ? 'text-primary' : 'text-danger') : ''}`}>
                            {lifetimeReady ? (
                              <span className="inline-flex items-center gap-1 justify-end">
                                {lifetime !== 0 &&
                                  (lifetime > 0 ? (
                                    <ArrowUpRight width={13} height={13} />
                                  ) : (
                                    <ArrowDownRight width={13} height={13} />
                                  ))}
                                {lifetime >= 0 ? '+' : ''}
                                {formatMoney(lifetime, currency)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>

              <GiveTakeStrip
                items={settlement.members.map((m) => ({ name: nameByUser.get(m.userId) ?? 'Former member', giveTake: m.netBalance }))}
                currency={currency}
              />
            </>
          )}

          <div className="flex gap-3">
            <Link to={`/h/${household.id}/meals/settlement`} className="flex-1">
              <Card className="flex items-center gap-2 p-3 text-sm font-medium text-ink hover:border-primary">
                <Bowl width={16} height={16} className="text-primary" />
                Meal Breakdown
              </Card>
            </Link>
            <Link to={`/h/${household.id}/bill-splits`} className="flex-1">
              <Card className="flex items-center gap-2 p-3 text-sm font-medium text-ink hover:border-primary">
                <Scale width={16} height={16} className="text-primary" />
                Bill Splits
              </Card>
            </Link>
          </div>

          <Link to={`/h/${household.id}/history`}>
            <Card className="flex items-center justify-between p-3 text-sm font-medium text-ink hover:border-primary">
              <span>
                <span className="block font-medium">Running Ledger</span>
                <span className="block text-xs font-normal text-muted">
                  See your balance across every month — never lose track again.
                </span>
              </span>
              <ChevronRight width={16} height={16} className="shrink-0 text-muted" />
            </Card>
          </Link>
        </>
      )}
    </div>
  )
}
