import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatMoney } from '@/lib/format'
import { useHouseholdLedger } from '@/lib/ledger/useHouseholdLedger'
import { isNearMonthEnd } from '@/lib/ledger/period'
import { Wallet } from '@/components/ui/icons'
import type { HouseholdDto } from '@/lib/api/types'

/** Prompts recording the month's Bazar "Leftover" entry before it closes (§5.2 month-end
 * reconciliation) — the parent only renders this while no leftover has been recorded yet. */
export function MonthEndReconciliationCard({ household, onRecordLeftover }: { household: HouseholdDto; onRecordLeftover: () => void }) {
  const ledger = useHouseholdLedger(household.id, household.createdAt)
  const ready = !!ledger.periods[ledger.currentMonthKey]

  if (!isNearMonthEnd() || !ready) return null

  const balance = ledger.fundBalance(ledger.currentMonthKey)
  if (balance === 0) return null

  return (
    <Card className="flex items-center gap-3 border-primary/40 bg-primary-soft/40 p-4">
      <Wallet width={20} height={20} className="shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">This month is almost over</p>
        <p className="text-xs text-muted">
          Unspent shopping cash so far: <span className="font-medium text-ink">{formatMoney(balance, 'BDT')}</span>. Record it as a
          Leftover entry so it carries into next month's baseline.
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={onRecordLeftover} className="shrink-0">
        Record
      </Button>
    </Card>
  )
}
