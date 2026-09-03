import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { useAuthStore } from '@/lib/auth/authStore'
import { listMembers } from '@/lib/api/households'
import { getHouseholdSettlement } from '@/lib/api/settlement'
import { getHouseholdBalance } from '@/lib/api/balance'
import { getMonthRange } from '@/lib/format'
import { useHouseholdLedger } from '@/lib/ledger/useHouseholdLedger'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { InfoTip } from '@/components/ui/InfoTip'
import { GiveTakeStrip } from '@/components/settlement/GiveTakeStrip'
import { ChevronLeft, ChevronRight, Bowl, Scale, ArrowUpRight, ArrowDownRight, Check } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'

export function SettlementDashboardPage() {
  const { household } = useHouseholdContext()
  const currentUserId = useAuthStore((s) => s.user?.id)
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

  const { data: balance } = useQuery({ queryKey: ['householdBalance', household.id], queryFn: () => getHouseholdBalance(household.id) })

  const ledger = useHouseholdLedger(household.id, household.createdAt)

  const currency = balance?.currency ?? 'BDT'
  const me = settlement?.members.find((m) => m.userId === currentUserId)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">
            Household position · {label}
          </p>
          <h1 className="mt-0.5 text-[26px] font-heading font-semibold text-ink md:text-[32px]">Where the month stands</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
            className="rounded-sm border border-border p-1.5 text-muted hover:bg-surface-muted"
            aria-label="Previous month"
          >
            <ChevronLeft width={16} height={16} />
          </button>
          <button
            onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
            className="rounded-sm border border-border p-1.5 text-muted hover:bg-surface-muted"
            aria-label="Next month"
          >
            <ChevronRight width={16} height={16} />
          </button>
        </div>
      </div>

      {isLoading || !settlement ? (
        <>
          <Skeleton className="h-44" />
          <SkeletonList rows={3} />
        </>
      ) : (
        <>
          {/* Position plate */}
          <div className="grid gap-3 md:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col justify-between gap-4 rounded-sm bg-primary-deep p-6 text-white">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.12em] text-white/65 uppercase">Your net position</p>
                <p className="font-num mt-1.5 font-heading text-[44px] font-semibold leading-none md:text-[56px]">
                  {me ? (
                    <>
                      {me.netBalance >= 0 ? '+' : ''}
                      {formatMoney(me.netBalance, currency)}
                    </>
                  ) : (
                    '—'
                  )}
                </p>
                <p className="mt-2 text-[13px] text-white/80">
                  {!me
                    ? "You're not on this month's settlement yet."
                    : me.netBalance > 0
                      ? 'The household owes you for ' + label + '.'
                      : me.netBalance < 0
                        ? 'You owe the household for ' + label + '.'
                        : "You're settled for " + label + '.'}
                </p>
              </div>
              {me && (
                <div className="flex gap-6 border-t border-white/20 pt-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Meal give/take</p>
                    <p className="font-num font-heading text-[18px] font-semibold">{formatMoney(me.mealGiveTake, currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-white/60 uppercase">Bill share</p>
                    <p className="font-num font-heading text-[18px] font-semibold">−{formatMoney(me.billSplitOwed, currency)}</p>
                  </div>
                </div>
              )}
            </div>

            <Card plain className="corner-frame flex flex-col gap-3 p-4 text-primary">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold tracking-widest text-primary-active uppercase">Household fund</p>
                  <p className="font-heading text-[17px] font-semibold">Fund &amp; runway</p>
                </div>
              </div>
              {!balance ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="grid grid-cols-3 gap-1 border-t border-border pt-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Balance</p>
                    <p className={cn('font-num mt-1 font-heading text-[18px] font-semibold', balance.currentBalance >= 0 ? 'text-primary' : 'text-danger')}>
                      {formatMoney(balance.currentBalance, balance.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Contributed</p>
                    <p className="font-num mt-1 font-heading text-[18px] font-semibold text-ink">{formatMoney(balance.totalContributions, balance.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">Spent</p>
                    <p className="font-num mt-1 font-heading text-[18px] font-semibold text-ink">{formatMoney(balance.totalSpentFromFund, balance.currency)}</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {settlement.members.length === 0 ? (
            <EmptyState icon={<Scale width={28} height={28} />} title="No members yet" description="Add members to this household to start tracking who owes what." />
          ) : settlement.members.length === 1 ? (
            <p className="rounded-sm border border-dashed border-border p-4 text-center text-sm text-muted">
              With just one member, there's no one to settle up with yet — invite someone to share costs.
            </p>
          ) : settlement.members.every((m) => m.netBalance === 0) ? (
            <Card className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-primary-soft text-primary">
                <Check width={22} height={22} />
              </div>
              <p className="font-heading font-semibold text-ink">You're all squared away</p>
              <p className="text-sm text-muted">Nobody owes anybody anything for {label}.</p>
            </Card>
          ) : (
            <>
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <h4 className="font-heading text-[15px] font-semibold text-ink">Members</h4>
                  <span className="text-[11px] text-muted">Lifetime carries across every closed month — never reset</span>
                </div>
                <Card className="overflow-x-auto p-0">
                  <table className="font-num w-full min-w-105 text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="p-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Member</th>
                        <th className="p-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Meals</th>
                        <th className="p-3 text-[11px] font-semibold tracking-wide text-muted uppercase">Bills</th>
                        <th className="p-3 text-right text-[11px] font-semibold tracking-wide text-muted uppercase">
                          Net
                          <InfoTip label="Net">
                            What this member owes or is owed this month: their meal Give/Take minus their bill-split share. Teal
                            with an up-arrow means the household owes them.
                          </InfoTip>
                        </th>
                        <th className="p-3 text-right text-[11px] font-semibold tracking-wide text-muted uppercase">
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
                            <td className="max-w-32 truncate p-3 font-medium text-ink">
                              {nameByUser.get(m.userId) ?? 'Former member'}
                              {m.userId === currentUserId && <Badge tone="primary" className="ml-1.5">You</Badge>}
                            </td>
                            <td className="p-3 text-ink">{formatMoney(m.mealGiveTake, currency)}</td>
                            <td className="p-3 text-ink">{formatMoney(m.billSplitOwed, currency)}</td>
                            <td className={cn('p-3 text-right font-heading font-semibold', m.netBalance >= 0 ? 'text-primary-active' : 'text-danger')}>
                              <span className="inline-flex items-center justify-end gap-1">
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
                            <td className={cn('p-3 text-right text-muted', lifetimeReady && lifetime !== 0 && (lifetime > 0 ? 'text-primary-active' : 'text-danger'))}>
                              {lifetimeReady ? (
                                <span className="inline-flex items-center justify-end gap-1">
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
              </div>

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

          <Link to={`/h/${household.id}/history`}>
            <Card className="flex items-center justify-between p-3 text-sm font-medium text-ink hover:border-primary">
              <span>
                <span className="block font-heading font-semibold">Running ledger</span>
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
