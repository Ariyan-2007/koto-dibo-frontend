import { formatMoney, formatPercent } from '@/lib/format'

export interface MagnitudeItem {
  key: string
  label: string
  amount: number
  percentageOfTotal: number
  sublabel?: string
}

/** One hue, sized by magnitude — identity comes from the label text, not a rotating color, since
 * these are ranked amounts (topCategories/topMerchants) rather than distinct comparable series. */
export function MagnitudeBarList({ items, currency }: { items: MagnitudeItem[]; currency: string }) {
  const max = Math.max(1, ...items.map((i) => i.amount))

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => (
        <div key={item.key}>
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate text-ink">
              {item.label}
              {item.sublabel && <span className="ml-1.5 text-muted">{item.sublabel}</span>}
            </span>
            <span className="shrink-0 text-muted">
              {formatMoney(item.amount, currency)} · {formatPercent(item.percentageOfTotal)}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-[2px] bg-surface-muted">
            <div className="h-1.5 rounded-[2px] bg-primary" style={{ width: `${(item.amount / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
