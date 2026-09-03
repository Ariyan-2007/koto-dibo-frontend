import { formatMoney } from '@/lib/format'
import type { BudgetVsActualPointDto } from '@/lib/api/types'

/** Two fixed-identity series (never re-colored by rank) — planned in neutral, actual in primary,
 * flipping to danger only for the one point that overspent. Legend shown per the 2-series rule. */
export function BudgetVsActualChart({ points, currency }: { points: BudgetVsActualPointDto[]; currency: string }) {
  if (points.length === 0) return null

  const max = Math.max(1, ...points.flatMap((p) => [p.budget, p.actual]))

  return (
    <div>
      <div className="flex items-end gap-3 overflow-x-auto pb-1">
        {points.map((p) => {
          const over = p.actual > p.budget && p.budget > 0
          return (
            <div key={p.label} className="flex shrink-0 flex-col items-center gap-1">
              <div className="flex h-24 items-end gap-1">
                <Bar heightPct={(p.budget / max) * 100} color="var(--color-border)" value={formatMoney(p.budget, currency)} title={`${p.label} · Planned`} />
                <Bar
                  heightPct={(p.actual / max) * 100}
                  color={over ? 'var(--color-danger)' : 'var(--color-primary)'}
                  value={formatMoney(p.actual, currency)}
                  title={`${p.label} · Actual`}
                />
              </div>
              <span className="text-[10px] text-muted">{p.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--color-border)' }} /> Planned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-danger" /> Actual (over)
        </span>
      </div>
    </div>
  )
}

function Bar({ heightPct, color, value, title }: { heightPct: number; color: string; value: string; title: string }) {
  return (
    <div
      className="w-3.5 rounded-t-sm"
      style={{ height: `${Math.max(2, heightPct)}%`, background: color }}
      title={`${title}: ${value}`}
    />
  )
}
