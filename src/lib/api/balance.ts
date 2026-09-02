import { api } from './client'
import type { HouseholdBalanceDto } from './types'

export function getHouseholdBalance(householdId: string) {
  return api.get<HouseholdBalanceDto>(`/households/${householdId}/balance`)
}
