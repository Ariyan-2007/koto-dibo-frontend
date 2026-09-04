import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { getHouseholdBalance, listHouseholdLedgerTransactions } from '@/lib/api/balance'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList, Skeleton } from '@/components/ui/Skeleton'
import { History, ArrowUpRight, ArrowDownRight } from '@/components/ui/icons'
import { formatMoney, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const SOURCE_LABEL: Record<string, string> = {
  Personal: 'Personal',
  HouseholdFund: 'From household fund',
  Manual: 'Manual',
  AutoFromBazar: 'Auto-generated',
}

/** Phase 2's unified ledger feed (§2.3) — Bazar + Contribution rows merged into one chronological
 * history, each carrying `BalanceImpact` (its actual signed effect on the pool), rather than the
 * frontend re-deriving that from two separate lists. */
export function TransactionsListPage() {
  const { household } = useHouseholdContext()

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['ledgerTransactions', household.id],
    queryFn: () => listHouseholdLedgerTransactions(household.id),
  })
  const { data: balance } = useQuery({ queryKey: ['householdBalance', household.id], queryFn: () => getHouseholdBalance(household.id) })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const sorted = useMemo(
    () => [...(transactions ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [transactions],
  )

  return (
    <div className="flex flex-col gap-3">
      <Card plain className="corner-frame flex items-center justify-between p-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest text-primary-active uppercase">Household fund</p>
          <p className="font-heading text-[17px] font-semibold text-ink">Current balance</p>
        </div>
        {!balance ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className={cn('font-num font-heading text-[22px] font-semibold', balance.currentBalance >= 0 ? 'text-primary' : 'text-danger')}>
            {formatMoney(balance.currentBalance, balance.currency)}
          </p>
        )}
      </Card>

      {isLoading ? (
        <SkeletonList />
      ) : sorted.length > 0 ? (
        sorted.map((tx) => {
          const cancelled = tx.status === 'Cancelled'
          const ownerName = nameByUser.get(tx.userId) ?? '—'
          const recordedByName = tx.createdByUserId !== tx.userId ? (nameByUser.get(tx.createdByUserId) ?? '—') : undefined
          const linkTo =
            tx.linkedEntryId && (tx.entryType === 'BazarPurchase' ? `/h/${household.id}/ledger/contributions` : `/h/${household.id}/ledger/bazar`)

          return (
            <Card key={tx.id} className={cn('flex items-center gap-3 p-4', cancelled && 'opacity-50')}>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-sm',
                  tx.direction === 'In' ? 'bg-primary-soft text-primary-active' : 'bg-danger-soft text-danger',
                )}
              >
                {tx.direction === 'In' ? <ArrowUpRight width={16} height={16} /> : <ArrowDownRight width={16} height={16} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('font-medium text-ink', cancelled && 'line-through')}>{formatMoney(tx.amount, tx.currency)}</p>
                  <Badge tone="muted">{tx.entryType === 'BazarPurchase' ? 'Bazar' : 'Contribution'}</Badge>
                  {SOURCE_LABEL[tx.sourceType] && <Badge tone="muted">{SOURCE_LABEL[tx.sourceType]}</Badge>}
                  {cancelled && <Badge tone="danger">Cancelled</Badge>}
                </div>
                <p className="truncate text-xs text-muted">
                  {formatDate(tx.date)} · {ownerName}
                  {recordedByName && ` · Recorded by ${recordedByName}`}
                  {tx.note && ` · ${tx.note}`}
                </p>
                {linkTo && (
                  <Link to={linkTo} className="text-xs text-primary hover:underline">
                    View linked entry
                  </Link>
                )}
              </div>
              <p
                className={cn(
                  'font-num shrink-0 text-sm font-semibold',
                  tx.balanceImpact > 0 ? 'text-primary-active' : tx.balanceImpact < 0 ? 'text-danger' : 'text-muted',
                )}
              >
                {tx.balanceImpact > 0 ? '+' : ''}
                {formatMoney(tx.balanceImpact, tx.currency)}
              </p>
            </Card>
          )
        })
      ) : (
        <EmptyState icon={<History width={28} height={28} />} title="No Transactions Yet" description="Bazar purchases and contributions will show up here as one combined history." />
      )}
    </div>
  )
}
