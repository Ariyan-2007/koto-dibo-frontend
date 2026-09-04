import { api } from './client'
import type { FinancialEntryStatus, HouseholdBalanceDto, HouseholdLedgerTransactionDto } from './types'

export function getHouseholdBalance(householdId: string) {
  return api.get<HouseholdBalanceDto>(`/households/${householdId}/balance`)
}

export function listHouseholdLedgerTransactions(
  householdId: string,
  filter?: { from?: string; to?: string; status?: FinancialEntryStatus },
) {
  return api.get<HouseholdLedgerTransactionDto[]>(`/households/${householdId}/balance/transactions`, filter)
}
