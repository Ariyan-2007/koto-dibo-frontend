import { Card } from '@/components/ui/Card'
import { formatMoney } from '@/lib/format'

interface GiveTakeItem {
  name: string
  giveTake: number
}

export function GiveTakeStrip({ items, currency }: { items: GiveTakeItem[]; currency: string }) {
  const owed = items.filter((i) => i.giveTake > 0).sort((a, b) => b.giveTake - a.giveTake)
  const owes = items.filter((i) => i.giveTake < 0).sort((a, b) => a.giveTake - b.giveTake)
  const settled = items.filter((i) => i.giveTake === 0)

  if (items.length === 0) return null

  return (
    <Card className="p-4">
      <h3 className="mb-3 font-heading text-[15px] font-semibold text-ink">Who owes whom</h3>
      <div className="flex flex-col gap-0 divide-y divide-border">
        {owed.map((i) => (
          <Row key={i.name} name={i.name} label="is owed" value={i.giveTake} currency={currency} tone="primary" />
        ))}
        {owes.map((i) => (
          <Row key={i.name} name={i.name} label="owes the household" value={-i.giveTake} currency={currency} tone="danger" />
        ))}
        {settled.map((i) => (
          <Row key={i.name} name={i.name} label="is settled up" value={0} currency={currency} tone="muted" />
        ))}
      </div>
    </Card>
  )
}

function Row({
  name,
  label,
  value,
  currency,
  tone,
}: {
  name: string
  label: string
  value: number
  currency: string
  tone: 'primary' | 'danger' | 'muted'
}) {
  const toneClass = tone === 'primary' ? 'text-primary-active' : tone === 'danger' ? 'text-danger' : 'text-muted'
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-ink">
        <span className="font-semibold">{name}</span> <span className="text-muted">{label}</span>
      </span>
      <span className={`font-num font-heading font-semibold ${toneClass}`}>{value === 0 ? '—' : formatMoney(value, currency)}</span>
    </div>
  )
}
