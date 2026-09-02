import { api } from './client'
import type { BazarFundingSource, BazarPurchaseDto, FinancialEntryStatus } from './types'

export interface BazarInput {
  date: string
  amount: number
  currency: string
  note?: string
  fundingSource?: BazarFundingSource
}

export function listBazar(householdId: string, filter?: { from?: string; to?: string; status?: FinancialEntryStatus }) {
  return api.get<BazarPurchaseDto[]>(`/households/${householdId}/bazar`, filter)
}

export function getBazar(householdId: string, purchaseId: string) {
  return api.get<BazarPurchaseDto>(`/households/${householdId}/bazar/${purchaseId}`)
}

export function createBazar(householdId: string, input: BazarInput) {
  return api.post<BazarPurchaseDto>(`/households/${householdId}/bazar`, input)
}

export function createBazarFor(householdId: string, userId: string, input: BazarInput) {
  return api.post<BazarPurchaseDto>(`/households/${householdId}/bazar/${userId}`, input)
}

export function updateBazar(householdId: string, purchaseId: string, input: Partial<BazarInput>) {
  return api.patch<BazarPurchaseDto>(`/households/${householdId}/bazar/${purchaseId}`, input)
}

export function cancelBazar(householdId: string, purchaseId: string) {
  return api.post<BazarPurchaseDto>(`/households/${householdId}/bazar/${purchaseId}/cancel`)
}
