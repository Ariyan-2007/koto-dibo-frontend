import { api } from './client'
import type { BillSplitDto, BillSplitMemberInputDto, BillSplitMethod, BillSplitSettlementDto, FinancialEntryStatus, FixedChargeDto } from './types'

export interface CreateBillSplitInput {
  title: string
  splitMethod: BillSplitMethod
  periodFrom: string
  periodTo: string
  currency: string
  tariffCountry?: string
  tariffProvider?: string
  mainMeterUsage?: number
  totalAmount?: number
  memberInputs: BillSplitMemberInputDto[]
  /** Only accepted for `TariffMetered` ("Electricity Bill (Postpaid)") — ignored, never persisted, for the other two methods. */
  fixedCharges?: FixedChargeDto[]
  notes?: string
}

export interface UpdateBillSplitInput {
  title?: string
  mainMeterUsage?: number
  totalAmount?: number
  memberInputs?: BillSplitMemberInputDto[]
  /** Full replacement array — omit to leave existing charges untouched, there's no add/remove-one endpoint. */
  fixedCharges?: FixedChargeDto[]
  notes?: string
}

export function listBillSplits(householdId: string, filter?: { from?: string; to?: string; status?: FinancialEntryStatus }) {
  return api.get<BillSplitDto[]>(`/households/${householdId}/bill-splits`, filter)
}

export function getBillSplit(householdId: string, billSplitId: string) {
  return api.get<BillSplitDto>(`/households/${householdId}/bill-splits/${billSplitId}`)
}

export function createBillSplit(householdId: string, input: CreateBillSplitInput) {
  return api.post<BillSplitDto>(`/households/${householdId}/bill-splits`, input)
}

export function updateBillSplit(householdId: string, billSplitId: string, input: UpdateBillSplitInput) {
  return api.patch<BillSplitDto>(`/households/${householdId}/bill-splits/${billSplitId}`, input)
}

export function cancelBillSplit(householdId: string, billSplitId: string) {
  return api.post<BillSplitDto>(`/households/${householdId}/bill-splits/${billSplitId}/cancel`)
}

export function getBillSplitSettlement(householdId: string, billSplitId: string) {
  return api.get<BillSplitSettlementDto>(`/households/${householdId}/bill-splits/${billSplitId}/settlement`)
}
