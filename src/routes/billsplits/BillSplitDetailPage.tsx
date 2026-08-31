import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { cancelBillSplit, getBillSplit, getBillSplitSettlement } from '@/lib/api/billSplits'
import { canEditEntry } from '@/lib/permissions'
import { toast, errorMessage } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Pencil, Trash } from '@/components/ui/icons'
import { BandStack } from '@/components/billsplit/BandStack'
import { EditBillSplitSheet } from './EditBillSplitSheet'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'

const METHOD_LABEL: Record<string, string> = {
  TariffMetered: 'Tariff metered',
  EqualSplit: 'Equal split',
  WeightedSplit: 'Weighted split',
}

export function BillSplitDetailPage() {
  const { household, currentUserId } = useHouseholdContext()
  const { billSplitId } = useParams<{ billSplitId: string }>()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const { data: billSplit, isLoading } = useQuery({
    queryKey: ['billSplit', billSplitId],
    queryFn: () => getBillSplit(household.id, billSplitId!),
    enabled: !!billSplitId,
  })

  // Computed fresh on every call — nothing cached server-side, so refetch after any edit (§4).
  const { data: settlement, isLoading: settlementLoading } = useQuery({
    queryKey: ['billSplitSettlement', billSplitId],
    queryFn: () => getBillSplitSettlement(household.id, billSplitId!),
    enabled: !!billSplitId && billSplit?.status === 'Active',
  })

  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const cancelMutation = useMutation({
    mutationFn: () => cancelBillSplit(household.id, billSplitId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billSplit', billSplitId] })
      queryClient.invalidateQueries({ queryKey: ['billSplits', household.id] })
      toast.success('Bill split cancelled')
      setCancelOpen(false)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setCancelOpen(false)
    },
  })

  if (isLoading || !billSplit) {
    return <SkeletonList rows={4} />
  }

  const canEdit = billSplit.status === 'Active' && canEditEntry(household.callerRole, billSplit.createdByUserId, currentUserId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to={`/h/${household.id}/bill-splits`} className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className={cn('flex-1 truncate text-xl font-semibold text-ink', billSplit.status === 'Cancelled' && 'line-through')}>
          {billSplit.title}
        </h1>
        {canEdit && (
          <>
            <button onClick={() => setEditOpen(true)} className="rounded-pill p-2 text-muted hover:bg-surface-muted hover:text-ink">
              <Pencil width={18} height={18} />
            </button>
            <button onClick={() => setCancelOpen(true)} className="rounded-pill p-2 text-muted hover:bg-danger-soft hover:text-danger">
              <Trash width={18} height={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge tone="primary">{METHOD_LABEL[billSplit.splitMethod]}</Badge>
        {billSplit.status === 'Cancelled' && <Badge tone="danger">Cancelled</Badge>}
        <span className="text-sm text-muted">
          {formatDate(billSplit.periodFrom)} – {formatDate(billSplit.periodTo)}
        </span>
      </div>

      {billSplit.notes && <p className="text-sm text-muted">{billSplit.notes}</p>}

      {settlementLoading ? (
        <SkeletonList rows={3} />
      ) : billSplit.status === 'Cancelled' ? (
        <p className="text-sm text-muted">Cancelled bill splits have no settlement.</p>
      ) : settlement ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile label="Total" value={formatMoney(settlement.totalAmount, billSplit.currency)} />
            <SummaryTile label="Attributed" value={formatMoney(settlement.attributedCost, billSplit.currency)} />
            <SummaryTile label="Shared" value={formatMoney(settlement.sharedCost, billSplit.currency)} />
          </div>

          {billSplit.splitMethod === 'TariffMetered' && settlement.bands.length > 0 && (
            <BandStack bands={settlement.bands} currency={billSplit.currency} />
          )}

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-muted">
                  <th className="p-3 font-medium">Member</th>
                  {billSplit.splitMethod === 'TariffMetered' && <th className="p-3 font-medium">Usage</th>}
                  <th className="p-3 font-medium">Attributed</th>
                  <th className="p-3 font-medium">Shared</th>
                  <th className="p-3 font-medium text-right">Owed</th>
                </tr>
              </thead>
              <tbody>
                {settlement.members.map((m) => (
                  <tr key={m.userId} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-ink">{nameByUser.get(m.userId) ?? '—'}</td>
                    {billSplit.splitMethod === 'TariffMetered' && <td className="p-3 text-ink">{m.usage ?? '—'}</td>}
                    <td className="p-3 text-ink">{formatMoney(m.attributedCost, billSplit.currency)}</td>
                    <td className="p-3 text-ink">{formatMoney(m.sharedCost, billSplit.currency)}</td>
                    <td className="p-3 text-right font-medium text-ink">{formatMoney(m.totalOwed, billSplit.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : null}

      <EditBillSplitSheet householdId={household.id} billSplit={billSplit} open={editOpen} onClose={() => setEditOpen(false)} />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this bill split?"
        description="It stays visible, struck through, but no longer counts toward anyone's balance."
        confirmLabel="Cancel split"
        danger
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setCancelOpen(false)}
      />
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
