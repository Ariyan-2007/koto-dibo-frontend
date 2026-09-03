import { formatMoney, formatMonthDay } from '@/lib/format'
import type { SpendingTrendPointDto } from '@/lib/api/types'

const WIDTH = 320
const HEIGHT = 100
const PAD = 8

/** Single-series line + area wash (sequential form — magnitude over time, one hue) per the
 * dataviz mark spec: 2px line, ~10% area fill, no dual axis, sparse direct labels. */
export function SpendingTrendChart({ points, currency }: { points: SpendingTrendPointDto[]; currency: string }) {
  if (points.length === 0) return null

  const max = Math.max(1, ...points.map((p) => p.amount))
  const stepX = points.length > 1 ? (WIDTH - PAD * 2) / (points.length - 1) : 0
  const xy = points.map((p, i) => ({
    x: PAD + i * stepX,
    y: HEIGHT - PAD - (p.amount / max) * (HEIGHT - PAD * 2),
    point: p,
  }))

  const linePath = xy.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${xy[xy.length - 1].x.toFixed(1)},${HEIGHT - PAD} L${xy[0].x.toFixed(1)},${HEIGHT - PAD} Z`
  const showMarkers = points.length <= 14

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: 100 }} preserveAspectRatio="none" role="img" aria-label="Spending trend">
        <path d={areaPath} style={{ fill: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {showMarkers &&
          xy.map((c, i) => (
            <circle key={i} cx={c.x} cy={c.y} r={3} fill="var(--color-primary)" stroke="var(--color-surface)" strokeWidth={1.5}>
              <title>
                {formatMonthDay(c.point.date)}: {formatMoney(c.point.amount, currency)}
              </title>
            </circle>
          ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{formatMonthDay(points[0].date)}</span>
        {points.length > 2 && <span>{formatMonthDay(points[Math.floor(points.length / 2)].date)}</span>}
        <span>{formatMonthDay(points[points.length - 1].date)}</span>
      </div>
    </div>
  )
}
