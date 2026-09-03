import { api } from './client'
import type { ExpenseDto, ExpenseSortField, PagedResult } from './types'

export interface ExpenseInput {
  amount: number
  currency?: string
  categoryId: string
  merchant?: string
  description?: string
  notes?: string
  date: string
  paymentMethod?: string
  tags?: string[]
  receiptUrl?: string
}

export interface ExpenseListFilter {
  categoryId?: string
  from?: string
  to?: string
  minAmount?: number
  maxAmount?: number
  merchant?: string
  paymentMethod?: string
  tag?: string
  isRecurring?: boolean
  search?: string
  sortBy?: ExpenseSortField
  sortDescending?: boolean
  page?: number
  pageSize?: number
}

export function listExpenses(filter: ExpenseListFilter = {}) {
  const { isRecurring, sortDescending, ...rest } = filter
  return api.get<PagedResult<ExpenseDto>>('/expenses', {
    ...rest,
    isRecurring: isRecurring === undefined ? undefined : String(isRecurring),
    sortDescending: sortDescending === undefined ? undefined : String(sortDescending),
  })
}

export function getExpense(id: string) {
  return api.get<ExpenseDto>(`/expenses/${id}`)
}

export function createExpense(input: ExpenseInput) {
  return api.post<ExpenseDto>('/expenses', input)
}

export function updateExpense(id: string, input: Partial<ExpenseInput>) {
  return api.patch<ExpenseDto>(`/expenses/${id}`, input)
}

/** Soft-deleted server-side (`Status: "Cancelled"`) — never actually removed. */
export function deleteExpense(id: string) {
  return api.delete<ExpenseDto>(`/expenses/${id}`)
}
