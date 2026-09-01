import { useCallback, useEffect, useMemo } from 'react'
import { useHouseholdLedgerStore } from './householdLedgerStore'
import { cumulativeFundBalance, cumulativeMemberBalance } from './ledgerSelectors'
import { currentMonthKey, monthKeyFromDate, previousMonthKey } from './period'

/**
 * The running-ledger view from §5.2: lazily fetches one calendar month at a time (backward from
 * "now"), caches closed months forever, and always keeps the current month fresh. `householdCreatedAt`
 * additionally caps backward pagination at the household's own start date.
 */
export function useHouseholdLedger(householdId: string, householdCreatedAt?: string) {
  const entry = useHouseholdLedgerStore((s) => s.byHousehold[householdId])
  const loadPeriod = useHouseholdLedgerStore((s) => s.loadPeriod)

  const periods = useMemo(() => entry?.periods ?? {}, [entry])
  const earliestPeriod = entry?.earliestPeriod ?? null
  const loadedKeys = useMemo(() => Object.keys(periods).sort(), [periods])
  const oldestLoaded = loadedKeys[0] ?? null
  const createdAtMonthKey = householdCreatedAt ? monthKeyFromDate(new Date(householdCreatedAt)) : null
  const nowKey = currentMonthKey()

  useEffect(() => {
    loadPeriod(householdId, nowKey)
  }, [householdId, nowKey, loadPeriod])

  const hasMoreHistory =
    oldestLoaded !== null &&
    (earliestPeriod === null || oldestLoaded > earliestPeriod) &&
    (createdAtMonthKey === null || oldestLoaded > createdAtMonthKey)

  const loadEarlier = useCallback(() => {
    if (oldestLoaded === null) return
    const candidate = previousMonthKey(oldestLoaded)
    if (earliestPeriod !== null && candidate <= earliestPeriod) return
    if (createdAtMonthKey !== null && candidate < createdAtMonthKey) return
    loadPeriod(householdId, candidate)
  }, [oldestLoaded, earliestPeriod, createdAtMonthKey, loadPeriod, householdId])

  const refreshCurrentMonth = useCallback(() => loadPeriod(householdId, nowKey, { force: true }), [householdId, nowKey, loadPeriod])

  const isLoadingMonth = useCallback((key: string) => !!entry?.loading[key], [entry])

  return {
    periods,
    loadedKeys,
    hasMoreHistory,
    loadEarlier,
    refreshCurrentMonth,
    isLoadingMonth,
    isLoadingAny: Object.values(entry?.loading ?? {}).some(Boolean),
    currentMonthKey: nowKey,
    memberBalance: (userId: string, asOfMonthKey: string = nowKey) => cumulativeMemberBalance(periods, userId, asOfMonthKey),
    fundBalance: (asOfMonthKey: string = nowKey) => cumulativeFundBalance(periods, asOfMonthKey),
  }
}
