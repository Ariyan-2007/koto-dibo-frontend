import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { getMealRate } from '@/lib/api/meals'
import { getMonthRange } from '@/lib/format'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { GiveTakeStrip } from '@/components/settlement/GiveTakeStrip'
import { ChevronLeft, ChevronRight, ArrowLeft, Bowl } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'

export function MealSettlementPage() {
  const { household } = useHouseholdContext()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const { from, to, label } = getMonthRange(cursor.year, cursor.month)

  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const { data: calc, isLoading } = useQuery({
    queryKey: ['mealRate', household.id, from, to],
    queryFn: () => getMealRate(household.id, from, to),
  })

  // MealCalculationDto carries no currency field (contributions can be logged in any 3-letter
  // code) — BDT is the only currency in practical use at MVP, so it's the display default here.
  const currency = 'BDT'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to={`/h/${household.id}/meals`} className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="text-xl font-semibold text-ink">Meal settlement</h1>
      </div>

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

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : !calc || calc.mealRate === null ? (
        <EmptyState icon={<Bowl width={28} height={28} />} title="No meals recorded yet" description="Once meal counts are logged this period, the settlement will show here." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile label="Food cost" value={formatMoney(calc.foodCost, currency)} />
            <SummaryTile label="Meal rate" value={calc.mealRate.toFixed(2)} />
            <SummaryTile label="Contributions" value={formatMoney(calc.totalContributions, currency)} />
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-muted">
                  <th className="p-3 font-medium">Member</th>
                  <th className="p-3 font-medium">Units</th>
                  <th className="p-3 font-medium">Cost</th>
                  <th className="p-3 font-medium">Contribution</th>
                  <th className="p-3 font-medium text-right">Give/take</th>
                </tr>
              </thead>
              <tbody>
                {calc.members.map((m) => (
                  <tr key={m.userId} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-ink">{nameByUser.get(m.userId) ?? '—'}</td>
                    <td className="p-3 text-ink">{m.mealUnits}</td>
                    <td className="p-3 text-ink">{formatMoney(m.mealCost, currency)}</td>
                    <td className="p-3 text-ink">{formatMoney(m.contribution, currency)}</td>
                    <td className={`p-3 text-right font-medium ${m.giveTake >= 0 ? 'text-primary' : 'text-danger'}`}>
                      {m.giveTake >= 0 ? '+' : ''}
                      {formatMoney(m.giveTake, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <GiveTakeStrip
            items={calc.members.map((m) => ({ name: nameByUser.get(m.userId) ?? '—', giveTake: m.giveTake }))}
            currency={currency}
          />
        </>
      )}
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-semibold text-ink">{value}</p>
    </Card>
  )
}
