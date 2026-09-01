import type { LedgerPeriod } from './householdLedgerStore'

// Pure reductions over cached periods, recomputed on read — never stored redundantly (§5.2).

export function cumulativeMemberBalance(periods: Record<string, LedgerPeriod>, userId: string, asOfMonthKey: string): number {
  let total = 0
  for (const [key, period] of Object.entries(periods)) {
    if (key > asOfMonthKey) continue
    const mealGiveTake = period.meal.members.find((m) => m.userId === userId)?.giveTake ?? 0
    const billOwed = period.billSplits.reduce((sum, b) => sum + (b.members.find((m) => m.userId === userId)?.totalOwed ?? 0), 0)
    total += mealGiveTake - billOwed
  }
  return total
}

/** Should match a manually-recorded Bazar "Leftover" entry at month-end (§Phase 2) — surfaced
 * side by side with it as a reconciliation check, not as a standalone number. */
export function cumulativeFundBalance(periods: Record<string, LedgerPeriod>, asOfMonthKey: string): number {
  let total = 0
  for (const [key, period] of Object.entries(periods)) {
    if (key > asOfMonthKey) continue
    total += period.meal.totalContributions - period.meal.foodCost
  }
  return total
}
