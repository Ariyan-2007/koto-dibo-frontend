import { Home, Cart, Bowl, Scale, Settings } from '@/components/ui/icons'

export function navItems(householdId: string) {
  return [
    { to: `/h/${householdId}`, label: 'Home', icon: Home, end: true },
    { to: `/h/${householdId}/ledger`, label: 'Ledger', icon: Cart },
    { to: `/h/${householdId}/meals`, label: 'Meals', icon: Bowl },
    { to: `/h/${householdId}/bill-splits`, label: 'Splits', icon: Scale },
    { to: `/h/${householdId}/settings`, label: 'More', icon: Settings },
  ]
}
