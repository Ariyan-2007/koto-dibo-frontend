import { api } from './client'
import type { ExpenseCategoryDto } from './types'

export interface ExpenseCategoryInput {
  name: string
  parentCategoryId?: string
  icon?: string
}

export interface UpdateExpenseCategoryInput {
  name?: string
  icon?: string
  isActive?: boolean
}

export function listExpenseCategories(includeInactive = false) {
  return api.get<ExpenseCategoryDto[]>('/expense-categories', { includeInactive: includeInactive ? 'true' : undefined })
}

export function createExpenseCategory(input: ExpenseCategoryInput) {
  return api.post<ExpenseCategoryDto>('/expense-categories', input)
}

export function updateExpenseCategory(id: string, input: UpdateExpenseCategoryInput) {
  return api.patch<ExpenseCategoryDto>(`/expense-categories/${id}`, input)
}

/** Soft-delete (`IsActive: false`) — the caller must own it, system defaults can't be deleted. */
export function deactivateExpenseCategory(id: string) {
  return api.delete<void>(`/expense-categories/${id}`)
}
