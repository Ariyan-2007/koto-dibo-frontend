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
  createdByUserId: string
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
  createdByUserId: string
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

export type LedgerEntryType = 'Contribution' | 'BazarPurchase'
export type LedgerDirection = 'In' | 'Out'

/** The unified Bazar+Contribution feed behind `HouseholdBalanceDto` (MVP_FRONTEND_BLUEPRINT.md §2.3). */
export interface HouseholdLedgerTransactionDto {
  id: string
  householdId: string
  entryType: LedgerEntryType
  direction: LedgerDirection
  /** Sum this, not `amount` — each row's actual signed effect on `CurrentBalance`. */
  balanceImpact: number
  date: string
  amount: number
  currency: string
  userId: string
  createdByUserId: string
  sourceType: BazarFundingSource | ContributionSourceType
  linkedEntryId: string | null
  note: string | null
  status: FinancialEntryStatus
  createdAt: string
  updatedAt: string
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

// ---- Phase 7: Personal Expenses & Budget (not household-scoped) ----

export type ExpensePaymentMethod = 'Cash' | 'BankAccount' | 'CreditCard' | 'MobileWallet' | 'Other'
export type ExpenseSortField = 'Date' | 'Amount' | 'CreatedAt' | 'Merchant' | 'Category'
export type RecurrenceFrequency = 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly' | 'Yearly'
export type BudgetPeriodType = 'Weekly' | 'Monthly' | 'Yearly' | 'Custom'
export type BudgetStatus = 'Draft' | 'Active' | 'Completed' | 'Archived'
export type BudgetCategoryStatus = 'NoBudget' | 'OnTrack' | 'Warning' | 'Overspent'
export type BudgetHealthStatus = 'NoBudget' | 'Healthy' | 'Warning' | 'Overspending' | 'Critical'
export type BudgetAdjustmentType = 'Initial' | 'Increase' | 'Decrease' | 'Rollover' | 'TransferIn' | 'TransferOut'
export type DashboardPeriodPreset = 'Today' | 'ThisWeek' | 'ThisMonth' | 'LastMonth' | 'ThisYear' | 'Custom'
export type DashboardComparisonPeriod = 'None' | 'PreviousPeriod' | 'SamePeriodLastYear'
export type DashboardTrend = 'Increased' | 'Decreased' | 'Stable'

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface ExpenseCategoryDto {
  id: string
  parentCategoryId: string | null
  name: string
  icon: string | null
  isSystemDefault: boolean
  isActive: boolean
}

export interface ExpenseDto {
  id: string
  amount: number
  currency: string
  categoryId: string
  categoryName: string
  merchant: string | null
  description: string | null
  notes: string | null
  date: string
  paymentMethod: ExpensePaymentMethod
  tags: string[]
  receiptUrl: string | null
  recurringExpenseId: string | null
  isRecurringGenerated: boolean
  status: FinancialEntryStatus
  createdAt: string
  updatedAt: string
}

export interface RecurringExpenseDto {
  id: string
  amount: number
  currency: string
  categoryId: string
  categoryName: string
  merchant: string | null
  description: string | null
  notes: string | null
  paymentMethod: ExpensePaymentMethod
  tags: string[]
  frequency: RecurrenceFrequency
  startDate: string
  endDate: string | null
  nextOccurrenceDate: string
  lastGeneratedDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BudgetCategoryDto {
  id: string
  categoryId: string
  categoryName: string
  plannedAmount: number
  rolloverEnabled: boolean
  rolloverAmount: number
  totalAvailable: number
  spent: number
  remaining: number
  variance: number
  usagePercentage: number | null
  status: BudgetCategoryStatus
  notes: string | null
}

export interface BudgetDto {
  id: string
  name: string
  description: string | null
  currency: string
  periodType: BudgetPeriodType
  startDate: string
  endDate: string
  status: BudgetStatus
  notes: string | null
  totalPlanned: number
  totalRollover: number
  totalAvailable: number
  totalSpent: number
  totalRemaining: number
  totalOverspent: number
  utilizationPercentage: number | null
  health: BudgetHealthStatus
  categories: BudgetCategoryDto[]
  createdAt: string
  updatedAt: string
}

/** Returned by `GET /api/budgets` — omits the per-category breakdown `BudgetDto` carries. */
export interface BudgetSummaryDto {
  id: string
  name: string
  currency: string
  periodType: BudgetPeriodType
  startDate: string
  endDate: string
  status: BudgetStatus
  totalPlanned: number
  totalAvailable: number
  totalSpent: number
  totalRemaining: number
  utilizationPercentage: number | null
  health: BudgetHealthStatus
}

export interface BudgetAdjustmentDto {
  id: string
  budgetCategoryAllocationId: string
  type: BudgetAdjustmentType
  amount: number
  balanceAfter: number
  relatedCategoryAllocationId: string | null
  reason: string | null
  createdAt: string
}

export interface DashboardPeriodDto {
  from: string
  to: string
  preset: string
}

export interface DashboardSummaryDto {
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  totalOverspent: number
  budgetUtilizationPercentage: number | null
  expenseCount: number
  averageExpense: number
}

export interface DashboardBudgetDto {
  hasBudget: boolean
  id: string | null
  name: string | null
  status: BudgetStatus | null
  health: BudgetHealthStatus
}

export interface DashboardExpensesDto {
  count: number
  totalAmount: number
  averageAmount: number
  recentExpenses: ExpenseDto[]
}

export interface BudgetVsActualPointDto {
  label: string
  budget: number
  actual: number
}

export interface CategoryBreakdownDto {
  categoryId: string
  categoryName: string
  budget: number
  spent: number
  remaining: number
  variance: number
  utilizationPercentage: number | null
  status: BudgetCategoryStatus
  percentageOfTotalSpending: number | null
}

export interface SpendingTrendPointDto {
  date: string
  amount: number
}

export interface TopCategoryDto {
  categoryId: string
  categoryName: string
  amount: number
  percentageOfTotal: number
}

export interface TopMerchantDto {
  merchant: string
  amount: number
  transactionCount: number
  percentageOfTotal: number
}

export interface UpcomingExpenseDto {
  recurringExpenseId: string
  description: string | null
  merchant: string | null
  categoryName: string
  amount: number
  nextOccurrenceDate: string
  daysUntilDue: number
}

export interface DashboardComparisonDto {
  previousFrom: string
  previousTo: string
  currentSpending: number
  previousSpending: number
  spendingChange: number
  spendingChangePercentage: number | null
  currentBudget: number
  previousBudget: number
  budgetChange: number
  budgetChangePercentage: number | null
  trend: DashboardTrend
}

export interface DashboardInsightsDto {
  highestSpendingCategory: string | null
  mostFrequentCategory: string | null
  highestExpenseAmount: number | null
  highestExpenseDescription: string | null
  averageExpense: number
  overspendingCategoriesCount: number
  categoriesApproachingLimit: string[]
  categoriesSignificantlyUnderBudget: string[]
  recurringExpensesTotal: number
  fixedExpensesTotal: number
  variableExpensesTotal: number
}

export interface DashboardResponse {
  period: DashboardPeriodDto
  summary: DashboardSummaryDto
  budget: DashboardBudgetDto
  expenses: DashboardExpensesDto
  budgetVsActual: BudgetVsActualPointDto[]
  categoryBreakdown: CategoryBreakdownDto[]
  spendingTrend: SpendingTrendPointDto[]
  topCategories: TopCategoryDto[]
  topMerchants: TopMerchantDto[]
  overspending: CategoryBreakdownDto[]
  upcomingExpenses: UpcomingExpenseDto[]
  comparison: DashboardComparisonDto | null
  insights: DashboardInsightsDto
}

export interface ApiErrorEnvelope {
  status: number
  title: string
  errors: Record<string, string[]> | null
}
