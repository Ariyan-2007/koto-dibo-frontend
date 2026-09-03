import { api } from './client'
import type { ExpenseDto, RecurringExpenseDto } from './types'

export interface RecurringExpenseInput {
  amount: number
  currency?: string
  categoryId: string
  merchant?: string
  description?: string
  notes?: string
  paymentMethod?: string
  tags?: string[]
  frequency: string
  startDate: string
  endDate?: string
}

export interface UpdateRecurringExpenseInput {
  amount?: number
  currency?: string
  categoryId?: string
  merchant?: string
  description?: string
  notes?: string
  paymentMethod?: string
  tags?: string[]
  endDate?: string
  isActive?: boolean
}

export function listRecurringExpenses(includeInactive = false) {
  return api.get<RecurringExpenseDto[]>('/recurring-expenses', { includeInactive: includeInactive ? 'true' : undefined })
}

export function getRecurringExpense(id: string) {
  return api.get<RecurringExpenseDto>(`/recurring-expenses/${id}`)
}

export function createRecurringExpense(input: RecurringExpenseInput) {
  return api.post<RecurringExpenseDto>('/recurring-expenses', input)
}

/** `Frequency`/`StartDate` are immutable — deactivate and create a new one to change cadence. */
export function updateRecurringExpense(id: string, input: UpdateRecurringExpenseInput) {
  return api.patch<RecurringExpenseDto>(`/recurring-expenses/${id}`, input)
}

export function deactivateRecurringExpense(id: string) {
  return api.post<RecurringExpenseDto>(`/recurring-expenses/${id}/deactivate`)
}

/** Manual catch-up trigger alongside the backend's 30-min sweep — idempotent either way. */
export function generateDueRecurringExpenses() {
  return api.post<ExpenseDto[]>('/recurring-expenses/generate-due')
}
