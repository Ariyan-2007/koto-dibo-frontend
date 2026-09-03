import { api } from './client'
import type { DashboardComparisonPeriod, DashboardPeriodPreset, DashboardResponse } from './types'

export type DashboardQuery = {
  preset?: DashboardPeriodPreset
  from?: string
  to?: string
  budgetId?: string
  currency?: string
  comparisonPeriod?: DashboardComparisonPeriod
}

export function getBudgetDashboard(query: DashboardQuery = {}) {
  return api.get<DashboardResponse>('/budget-dashboard', query)
}
