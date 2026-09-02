import { api } from './client'
import type { ExpenseDto } from './types'

export interface ExpenseInput {
  amount: number
  category: string
  description: string
  date: string
}

export function listExpenses(filter?: { from?: string; to?: string }) {
  return api.get<ExpenseDto[]>('/expenses', filter)
}

export function getExpense(id: string) {
  return api.get<ExpenseDto>(`/expenses/${id}`)
}

export function createExpense(input: ExpenseInput) {
  return api.post<ExpenseDto>('/expenses', input)
}
