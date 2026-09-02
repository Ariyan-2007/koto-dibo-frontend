import { api } from './client'
import type { BudgetDto } from './types'

export interface BudgetInput {
  period: string
  amount: number
}

export function listBudgets() {
  return api.get<BudgetDto[]>('/budget')
}

export function getBudget(id: string) {
  return api.get<BudgetDto>(`/budget/${id}`)
}

export function createBudget(input: BudgetInput) {
  return api.post<BudgetDto>('/budget', input)
}
