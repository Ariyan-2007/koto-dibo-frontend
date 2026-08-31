import { api } from './client'
import type { DailyMealEntryDto, MealCalculationDto } from './types'

export function listMeals(householdId: string, filter?: { from?: string; to?: string; userId?: string }) {
  return api.get<DailyMealEntryDto[]>(`/households/${householdId}/meals`, filter)
}

export function getMealRate(householdId: string, from: string, to: string) {
  return api.get<MealCalculationDto>(`/households/${householdId}/meals/rate`, { from, to })
}

export function setMealCount(householdId: string, date: string, userId: string, input: { count: number; notes?: string }) {
  return api.put<DailyMealEntryDto>(`/households/${householdId}/meals/${date}/${userId}`, input)
}

export function clearMealEntry(householdId: string, date: string, userId: string) {
  return api.delete<void>(`/households/${householdId}/meals/${date}/${userId}`)
}
