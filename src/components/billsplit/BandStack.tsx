import { Card } from '@/components/ui/Card'
import type { BillSplitBandDto } from '@/lib/api/types'
import { formatMoney } from '@/lib/format'

export function BandStack({ bands, currency }: { bands: BillSplitBandDto[]; currency: string }) {
  return (
    <Card className="p-5">
      <h2 className="mb-1 font-medium text-ink">Why it cost this much</h2>
      <p className="mb-4 text-sm text-muted">Band stack — attributed usage is billed first against the cheapest units.</p>
      <div className="flex flex-col gap-3">
        {bands.map((band, i) => {
          const attributedPct = band.unitsInBand > 0 ? (band.attributedUnits / band.unitsInBand) * 100 : 0
          const sharedPct = band.unitsInBand > 0 ? (band.sharedUnits / band.unitsInBand) * 100 : 0
          return (
            <div key={i}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">
                  {band.fromUnits}–{band.toUnits ?? '∞'} units
                  <span className="ml-2 text-muted">@ {band.ratePerUnit}/unit</span>
                </span>
                <span className="font-medium text-ink">{formatMoney(band.cost, currency)}</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-pill bg-surface-muted">
                <div className="h-full bg-primary" style={{ width: `${attributedPct}%` }} title="attributed to sub-meters" />
                <div className="h-full bg-border" style={{ width: `${sharedPct}%` }} title="shared" />
              </div>
              <p className="mt-1 text-xs text-muted">
                {band.attributedUnits} attributed to sub-meters · {band.sharedUnits} shared
              </p>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-pill bg-primary" /> Attributed to sub-meters
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-pill bg-border" /> Shared
        </span>
      </div>
    </Card>
  )
}
