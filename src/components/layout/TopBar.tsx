import type { HouseholdDto } from '@/lib/api/types'
import { HouseholdSwitcher } from './HouseholdSwitcher'
import { OfflineBadge } from './OfflineBadge'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function TopBar({ household }: { household: HouseholdDto }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-2 pt-safe backdrop-blur md:hidden">
      <HouseholdSwitcher current={household} />
      <div className="flex shrink-0 items-center gap-2 pr-3">
        <OfflineBadge />
        <ThemeToggle />
      </div>
    </header>
  )
}
