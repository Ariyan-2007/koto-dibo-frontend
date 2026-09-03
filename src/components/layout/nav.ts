import { Home, Cart, Bowl, Scale, Settings } from '@/components/ui/icons'

export function navItems(householdId: string) {
  return [
    { to: `/h/${householdId}`, label: 'Position', bn: 'অবস্থান', icon: Home, end: true },
    { to: `/h/${householdId}/ledger`, label: 'Ledger', bn: 'খাতা', icon: Cart },
    { to: `/h/${householdId}/meals`, label: 'Meals', bn: 'খাবার', icon: Bowl },
    { to: `/h/${householdId}/bill-splits`, label: 'Splits', bn: 'ভাগ', icon: Scale },
    { to: `/h/${householdId}/settings`, label: 'More', bn: 'আরও', icon: Settings },
  ]
}
