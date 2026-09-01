import { create } from 'zustand'
import { getMealRate } from '@/lib/api/meals'
import { listBillSplits, getBillSplitSettlement } from '@/lib/api/billSplits'
import type { BillSplitSettlementDto, MealCalculationDto } from '@/lib/api/types'
import { isMonthKeyClosed, monthKeyRange } from './period'

export interface LedgerPeriod {
  status: 'closed' | 'open'
  meal: MealCalculationDto
  billSplits: BillSplitSettlementDto[]
  fetchedAt: number
}

interface HouseholdLedger {
  periods: Record<string, LedgerPeriod>
  /** Earliest month key found to have zero meal/contribution/bill-split activity — the boundary
   * past which backward pagination stops (§5.2: "stop once a fetched month has zero entries"). */
  earliestPeriod: string | null
  loading: Record<string, boolean>
}

interface LedgerStoreState {
  byHousehold: Record<string, HouseholdLedger>
  loadPeriod: (householdId: string, monthKey: string, opts?: { force?: boolean }) => Promise<void>
}

function emptyHousehold(): HouseholdLedger {
  return { periods: {}, earliestPeriod: null, loading: {} }
}

function isPeriodEmpty(meal: MealCalculationDto, billSplits: BillSplitSettlementDto[]): boolean {
  return meal.totalMealUnits === 0 && meal.totalContributions === 0 && billSplits.length === 0
}

// This store fetches directly through the API layer rather than react-query — closed months are
// permanently cached (never refetched) while the open month is always refreshed, which is a
// caching policy react-query's staleTime doesn't express per-key without extra plumbing anyway.
export const useHouseholdLedgerStore = create<LedgerStoreState>((set, get) => ({
  byHousehold: {},

  loadPeriod: async (householdId, monthKey, opts) => {
    const force = opts?.force ?? false
    const household = get().byHousehold[householdId] ?? emptyHousehold()
    const existing = household.periods[monthKey]

    if (existing?.status === 'closed' && !force) return
    if (household.loading[monthKey] && !force) return

    set((s) => {
      const current = s.byHousehold[householdId] ?? emptyHousehold()
      return { byHousehold: { ...s.byHousehold, [householdId]: { ...current, loading: { ...current.loading, [monthKey]: true } } } }
    })

    try {
      const { from, to } = monthKeyRange(monthKey)
      const [meal, billSplitDtos] = await Promise.all([
        getMealRate(householdId, from, to),
        listBillSplits(householdId, { from, to, status: 'Active' }),
      ])
      const billSplits = await Promise.all(billSplitDtos.map((b) => getBillSplitSettlement(householdId, b.id)))

      set((s) => {
        const current = s.byHousehold[householdId] ?? emptyHousehold()
        const loading = { ...current.loading }
        delete loading[monthKey]
        const period: LedgerPeriod = { status: isMonthKeyClosed(monthKey) ? 'closed' : 'open', meal, billSplits, fetchedAt: Date.now() }
        const empty = isPeriodEmpty(meal, billSplits)
        const earliestPeriod =
          empty && (current.earliestPeriod === null || monthKey > current.earliestPeriod) ? monthKey : current.earliestPeriod
        return {
          byHousehold: {
            ...s.byHousehold,
            [householdId]: { periods: { ...current.periods, [monthKey]: period }, loading, earliestPeriod },
          },
        }
      })
    } catch {
      set((s) => {
        const current = s.byHousehold[householdId] ?? emptyHousehold()
        const loading = { ...current.loading }
        delete loading[monthKey]
        return { byHousehold: { ...s.byHousehold, [householdId]: { ...current, loading } } }
      })
    }
  },
}))
