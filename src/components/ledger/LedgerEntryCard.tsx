import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Pencil, Trash } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { formatMoney, formatDate } from '@/lib/format'

export interface LedgerEntryView {
  id: string
  date: string
  amount: number
  currency: string
  note: string | null
  status: 'Active' | 'Cancelled'
}

export function LedgerEntryCard({
  entry,
  byName,
  canEdit,
  onEdit,
  onCancel,
}: {
  entry: LedgerEntryView
  byName: string
  canEdit: boolean
  onEdit: () => void
  onCancel: () => void
}) {
  const cancelled = entry.status === 'Cancelled'
  const isLeftover = entry.amount < 0

  return (
    <Card className={cn('flex items-center gap-3 p-4', cancelled && 'opacity-50', isLeftover && !cancelled && 'border-primary/40 bg-primary-soft/30')}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn('font-medium text-ink', cancelled && 'line-through', isLeftover && !cancelled && 'text-primary')}>
            {formatMoney(entry.amount, entry.currency)}
          </p>
          {isLeftover && !cancelled && <Badge tone="primary">Leftover</Badge>}
          {cancelled && <Badge tone="danger">Cancelled</Badge>}
        </div>
        <p className="truncate text-xs text-muted">
          {formatDate(entry.date)} · {byName}
          {entry.note && ` · ${entry.note}`}
        </p>
      </div>
      {canEdit && !cancelled && (
        <div className="flex shrink-0 gap-1">
          <button onClick={onEdit} aria-label="Edit" className="rounded-pill p-3 text-muted hover:bg-surface-muted hover:text-ink">
            <Pencil width={16} height={16} />
          </button>
          <button onClick={onCancel} aria-label="Cancel entry" className="rounded-pill p-3 text-muted hover:bg-danger-soft hover:text-danger">
            <Trash width={16} height={16} />
          </button>
        </div>
      )}
    </Card>
  )
}
