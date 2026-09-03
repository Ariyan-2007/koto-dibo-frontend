import { api } from './client'
import type { BudgetAdjustmentDto, BudgetDto, BudgetStatus, BudgetSummaryDto } from './types'

export interface BudgetCategoryInput {
  categoryId: string
  plannedAmount: number
  rolloverEnabled: boolean
  notes?: string
}

export interface CreateBudgetInput {
  name: string
  description?: string
  currency?: string
  periodType: string
  startDate: string
  /** Required only when `periodType` is `Custom` — the other period types auto-derive it. */
  endDate?: string
  notes?: string
  categories?: BudgetCategoryInput[]
}

export interface UpdateBudgetInput {
  name?: string
  description?: string
  notes?: string
  status?: BudgetStatus
}

export interface AdjustBudgetCategoryInput {
  /** Signed delta against `PlannedAmount` — positive increases, negative decreases. */
  delta: number
  reason?: string
}

export interface TransferBudgetCategoryInput {
  toCategoryAllocationId: string
  amount: number
  reason?: string
}

export interface RolloverBudgetInput {
  name?: string
  startDate?: string
  endDate?: string
}

export function listBudgets(filter?: { status?: BudgetStatus; from?: string; to?: string }) {
  return api.get<BudgetSummaryDto[]>('/budgets', filter)
}

export function getBudget(id: string) {
  return api.get<BudgetDto>(`/budgets/${id}`)
}

export function createBudget(input: CreateBudgetInput) {
  return api.post<BudgetDto>('/budgets', input)
}

/** `Status` transitions are validated server-side against the lifecycle graph — gate the UI accordingly. */
export function updateBudget(id: string, input: UpdateBudgetInput) {
  return api.patch<BudgetDto>(`/budgets/${id}`, input)
}

export function addBudgetCategory(budgetId: string, input: BudgetCategoryInput) {
  return api.post<BudgetDto>(`/budgets/${budgetId}/categories`, input)
}

export function adjustBudgetCategory(budgetId: string, allocationId: string, input: AdjustBudgetCategoryInput) {
  return api.post<BudgetDto>(`/budgets/${budgetId}/categories/${allocationId}/adjust`, input)
}

export function transferBudgetCategory(budgetId: string, allocationId: string, input: TransferBudgetCategoryInput) {
  return api.post<BudgetDto>(`/budgets/${budgetId}/categories/${allocationId}/transfer`, input)
}

export function getBudgetCategoryAdjustments(budgetId: string, allocationId: string) {
  return api.get<BudgetAdjustmentDto[]>(`/budgets/${budgetId}/categories/${allocationId}/adjustments`)
}

/** Creates the next period's budget — planned amounts copy forward, `RolloverEnabled` categories
 * also carry their (possibly negative) `Remaining` into the new period's `RolloverAmount`. */
export function rolloverBudget(id: string, input: RolloverBudgetInput = {}) {
  return api.post<BudgetDto>(`/budgets/${id}/rollover`, input)
}
