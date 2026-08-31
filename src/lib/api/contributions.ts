import { api } from './client'
import type { ContributionDto, FinancialEntryStatus } from './types'

export interface ContributionInput {
  date: string
  amount: number
  currency: string
  notes?: string
}

export function listContributions(householdId: string, filter?: { from?: string; to?: string; status?: FinancialEntryStatus }) {
  return api.get<ContributionDto[]>(`/households/${householdId}/contributions`, filter)
}

export function getContribution(householdId: string, contributionId: string) {
  return api.get<ContributionDto>(`/households/${householdId}/contributions/${contributionId}`)
}

export function createContribution(householdId: string, input: ContributionInput) {
  return api.post<ContributionDto>(`/households/${householdId}/contributions`, input)
}

export function updateContribution(householdId: string, contributionId: string, input: Partial<ContributionInput>) {
  return api.patch<ContributionDto>(`/households/${householdId}/contributions/${contributionId}`, input)
}

export function cancelContribution(householdId: string, contributionId: string) {
  return api.post<ContributionDto>(`/households/${householdId}/contributions/${contributionId}/cancel`)
}
