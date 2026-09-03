import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { cancelBillSplit, getBillSplit, getBillSplitSettlement } from '@/lib/api/billSplits'
import { canEditEntry } from '@/lib/permissions'
import { toast, errorMessage } from '@/lib/toast'
import { BILL_SPLIT_METHOD_LABEL } from '@/lib/billsplit/labels'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InfoTip } from '@/components/ui/InfoTip'
import { ArrowLeft, Pencil, Trash } from '@/components/ui/icons'
import { BandStack } from '@/components/billsplit/BandStack'
import { EditBillSplitSheet } from './EditBillSplitSheet'
import { formatDate, formatMoney } from '@/lib/format'
import { cn } from '@/lib/cn'

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
        <h1 className={cn('flex-1 truncate font-heading text-[22px] font-semibold text-ink', billSplit.status === 'Cancelled' && 'line-through')}>
          {billSplit.title}
        </h1>
        {canEdit && (
          <>
            <button
              onClick={() => setEditOpen(true)}
              aria-label="Edit bill split"
              className="rounded-sm p-3 text-muted hover:bg-surface-muted hover:text-ink"
            >
              <Pencil width={18} height={18} />
            </button>
            <button
              onClick={() => setCancelOpen(true)}
              aria-label="Cancel bill split"
              className="rounded-sm p-3 text-muted hover:bg-danger-soft hover:text-danger"
            >
              <Trash width={18} height={18} />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge tone="primary">{BILL_SPLIT_METHOD_LABEL[billSplit.splitMethod]}</Badge>
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

          {billSplit.splitMethod === 'TariffMetered' && billSplit.fixedCharges.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-1 font-medium text-ink">Fixed Charges</h2>
              <p className="mb-3 text-sm text-muted">Constant fees billed per connection, split equally across active members — not usage-based.</p>
              <div className="flex flex-col gap-2">
                {billSplit.fixedCharges.map((fc, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-ink">{fc.label}</span>
                    <span className="font-medium text-ink">{formatMoney(fc.amount, billSplit.currency)}</span>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span className="text-ink">Total</span>
                  <span className="text-ink">{formatMoney(settlement.fixedChargesTotal, billSplit.currency)}</span>
                </div>
              </div>
            </Card>
          )}

          <Card className="overflow-x-auto">
            <table className="w-full min-w-125 text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-muted">
                  <th className="p-3 font-medium">Member</th>
                  {billSplit.splitMethod === 'TariffMetered' && <th className="p-3 font-medium">Usage</th>}
                  <th className="p-3 font-medium">
                    Attributed
                    <InfoTip label="Attributed">The portion of the bill driven by this member's own metered usage.</InfoTip>
                  </th>
                  <th className="p-3 font-medium">
                    Shared
                    <InfoTip label="Shared">
                      Common-area usage no sub-meter captures, split equally across everyone in the household.
                    </InfoTip>
                  </th>
                  {billSplit.splitMethod === 'TariffMetered' && (
                    <th className="p-3 font-medium">
                      Fixed Fee
                      <InfoTip label="Fixed Fee">
                        Flat charges like VAT or meter rent — split equally, regardless of how much electricity each person used.
                      </InfoTip>
                    </th>
                  )}
                  <th className="p-3 font-medium text-right">Owed</th>
                </tr>
              </thead>
              <tbody>
                {settlement.members.map((m) => (
                  <tr key={m.userId} className="border-b border-border last:border-0">
                    <td className="max-w-32 truncate p-3 font-medium text-ink">{nameByUser.get(m.userId) ?? 'Former member'}</td>
                    {billSplit.splitMethod === 'TariffMetered' && <td className="p-3 text-ink">{m.usage ?? '—'}</td>}
                    <td className="p-3 text-ink">{formatMoney(m.attributedCost, billSplit.currency)}</td>
                    <td className="p-3 text-ink">{formatMoney(m.sharedCost, billSplit.currency)}</td>
                    {billSplit.splitMethod === 'TariffMetered' && (
                      <td className="p-3 text-ink">{formatMoney(m.fixedChargeShare, billSplit.currency)}</td>
                    )}
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
        title="Cancel This Bill Split?"
        description="It stays visible, struck through, but no longer counts toward anyone's balance."
        confirmLabel="Cancel Split"
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
