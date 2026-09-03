import type {
  BudgetCategoryStatus,
  BudgetHealthStatus,
  BudgetPeriodType,
  ExpensePaymentMethod,
  RecurrenceFrequency,
} from '@/lib/api/types'

export const PAYMENT_METHOD_LABEL: Record<ExpensePaymentMethod, string> = {
  Cash: 'Cash',
  BankAccount: 'Bank Account',
  CreditCard: 'Credit Card',
  MobileWallet: 'Mobile Wallet',
  Other: 'Other',
}

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABEL) as ExpensePaymentMethod[]

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  Daily: 'Daily',
  Weekly: 'Weekly',
  Biweekly: 'Every 2 Weeks',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Yearly: 'Yearly',
}

export const FREQUENCIES = Object.keys(FREQUENCY_LABEL) as RecurrenceFrequency[]

export const PERIOD_TYPE_LABEL: Record<BudgetPeriodType, string> = {
  Weekly: 'Weekly',
  Monthly: 'Monthly',
  Yearly: 'Yearly',
  Custom: 'Custom',
}

export const PERIOD_TYPES = Object.keys(PERIOD_TYPE_LABEL) as BudgetPeriodType[]

type Tone = 'primary' | 'muted' | 'danger' | 'warning'

// Category status is a live, per-envelope read (never stored) — "NoBudget" means nothing was ever
// allocated here, distinct from "OnTrack" at 0% usage.
export const BUDGET_CATEGORY_STATUS_LABEL: Record<BudgetCategoryStatus, string> = {
  NoBudget: 'No Budget',
  OnTrack: 'On Track',
  Warning: 'Near Limit',
  Overspent: 'Overspent',
}

export const BUDGET_CATEGORY_STATUS_TONE: Record<BudgetCategoryStatus, Tone> = {
  NoBudget: 'muted',
  OnTrack: 'primary',
  Warning: 'warning',
  Overspent: 'danger',
}

export const BUDGET_HEALTH_LABEL: Record<BudgetHealthStatus, string> = {
  NoBudget: 'No Budget',
  Healthy: 'Healthy',
  Warning: 'Warning',
  Overspending: 'Overspending',
  Critical: 'Critical',
}

export const BUDGET_HEALTH_TONE: Record<BudgetHealthStatus, Tone> = {
  NoBudget: 'muted',
  Healthy: 'primary',
  Warning: 'warning',
  Overspending: 'danger',
  Critical: 'danger',
}

// Icon strings come from the seeded system-default tree (e.g. "utensils", "car") plus whatever a
// user's own custom category was tagged with — there's no icon-asset endpoint, so this is a small
// best-effort emoji map with a generic fallback rather than a full icon library dependency.
const CATEGORY_ICON_EMOJI: Record<string, string> = {
  utensils: '🍽️',
  car: '🚗',
  home: '🏠',
  bolt: '⚡',
  'heart-pulse': '❤️',
  'graduation-cap': '🎓',
  film: '🎬',
  'shopping-bag': '🛍️',
  plane: '✈️',
  repeat: '🔁',
  sparkles: '✨',
  shield: '🛡️',
  'credit-card': '💳',
  users: '👨‍👩‍👧',
  ellipsis: '⋯',
}

export function categoryIcon(icon: string | null | undefined): string {
  if (!icon) return '🏷️'
  return CATEGORY_ICON_EMOJI[icon] ?? '🏷️'
}
