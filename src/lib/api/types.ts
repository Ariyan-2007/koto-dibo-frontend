// Mirrors the backend's actual JSON casing (camelCase bodies), verified against the live
// /swagger/v1/swagger.json — not the PascalCase shown in MVP_FRONTEND_BLUEPRINT.md's prose.

export type HouseholdRole = 'Owner' | 'Manager' | 'Member' | 'Viewer'
export type HouseholdStatus = 'Active' | 'Archived'
export type FinancialEntryStatus = 'Active' | 'Cancelled'
export type BillSplitMethod = 'TariffMetered' | 'EqualSplit' | 'WeightedSplit'
export type BazarFundingSource = 'Personal' | 'HouseholdFund'
export type ContributionSourceType = 'Manual' | 'AutoFromBazar'

export interface AuthResponse {
  accessToken: string
  expiresAt: string
  refreshToken: string
  userId: string
  name: string
  email: string
}

export interface HouseholdDto {
  id: string
  name: string
  description: string | null
  type: string | null
  status: HouseholdStatus
  ownerUserId: string
  memberCount: number
  callerRole: HouseholdRole
  createdAt: string
  updatedAt: string
  archivedAt: string | null
}

export interface HouseholdMemberDto {
  userId: string
  name: string
  email: string
  role: HouseholdRole
  joinedAt: string
}

export type HouseholdInviteStatus = 'Pending' | 'Accepted' | 'Revoked' | 'Expired'

export interface HouseholdInviteDto {
  id: string
  householdId: string
  invitedByUserId: string
  code: string
  role: HouseholdRole
  email: string | null
  status: HouseholdInviteStatus
  inviteLink: string
  qrCodeUrl: string | null
  expiresAt: string
  createdAt: string
}

export interface InvitePreviewDto {
  code: string
  householdId: string
  householdName: string
  role: HouseholdRole
  invitedByName: string
  status: HouseholdInviteStatus
  expiresAt: string
  callerIsAlreadyMember: boolean
}

export interface AcceptInviteResultDto {
  householdId: string
  householdName: string
  member: HouseholdMemberDto
}

export interface BazarPurchaseDto {
  id: string
  householdId: string
  purchasedByUserId: string
  date: string
  amount: number
  currency: string
  note: string | null
  fundingSource: BazarFundingSource
  linkedContributionId: string | null
  status: FinancialEntryStatus
  createdAt: string
  updatedAt: string
}

export interface ContributionDto {
  id: string
  householdId: string
  contributedByUserId: string
  date: string
  amount: number
  currency: string
  notes: string | null
  sourceType: ContributionSourceType
  sourceBazarPurchaseId: string | null
  status: FinancialEntryStatus
  createdAt: string
  updatedAt: string
}

export interface HouseholdBalanceDto {
  householdId: string
  totalContributions: number
  totalSpentFromFund: number
  currentBalance: number
  currency: string
  asOf: string
}

export interface DailyMealEntryDto {
  id: string
  householdId: string
  userId: string
  date: string
  count: number
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface MealMemberCostDto {
  userId: string
  mealUnits: number
  mealCost: number
  contribution: number
  giveTake: number
}

export interface MealCalculationDto {
  from: string
  to: string
  foodCost: number
  totalMealUnits: number
  mealRate: number | null
  totalContributions: number
  members: MealMemberCostDto[]
  calculationVersion: string
}

export interface BillSplitMemberInputDto {
  userId: string
  value: number
}

export interface FixedChargeDto {
  label: string
  amount: number
}

export interface BillSplitDto {
  id: string
  householdId: string
  createdByUserId: string
  title: string
  splitMethod: BillSplitMethod
  periodFrom: string
  periodTo: string
  currency: string
  tariffCountry: string | null
  tariffProvider: string | null
  mainMeterUsage: number | null
  totalAmount: number | null
  memberInputs: BillSplitMemberInputDto[]
  fixedCharges: FixedChargeDto[]
  notes: string | null
  status: FinancialEntryStatus
  createdAt: string
  updatedAt: string
}

export interface BillSplitBandDto {
  fromUnits: number
  toUnits: number | null
  ratePerUnit: number
  unitsInBand: number
  attributedUnits: number
  sharedUnits: number
  cost: number
}

export interface BillSplitMemberSettlementDto {
  userId: string
  usage: number | null
  attributedCost: number
  sharedCost: number
  fixedChargeShare: number
  totalOwed: number
}

export interface BillSplitSettlementDto {
  billSplitId: string
  totalAmount: number
  attributedCost: number
  sharedCost: number
  fixedChargesTotal: number
  bands: BillSplitBandDto[]
  members: BillSplitMemberSettlementDto[]
  calculationVersion: string
}

export interface HouseholdMemberSettlementDto {
  userId: string
  mealGiveTake: number
  billSplitOwed: number
  netBalance: number
}

export interface HouseholdSettlementDto {
  householdId: string
  from: string
  to: string
  totalMealGiveTake: number
  totalBillSplitOwed: number
  members: HouseholdMemberSettlementDto[]
  calculationVersion: string
}

export interface ExpenseDto {
  id: string
  amount: number
  category: string
  description: string
  date: string
}

export interface BudgetDto {
  id: string
  period: string
  amount: number
}

export interface ApiErrorEnvelope {
  status: number
  title: string
  errors: Record<string, string[]> | null
}
