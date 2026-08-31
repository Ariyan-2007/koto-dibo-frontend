import { api } from './client'
import type { HouseholdSettlementDto } from './types'

export function getHouseholdSettlement(householdId: string, from: string, to: string) {
  return api.get<HouseholdSettlementDto>(`/households/${householdId}/settlement`, { from, to })
}
