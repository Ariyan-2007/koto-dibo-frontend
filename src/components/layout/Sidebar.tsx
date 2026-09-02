import { Link, NavLink } from 'react-router-dom'
import type { HouseholdDto } from '@/lib/api/types'
import { navItems } from './nav'
import { HouseholdSwitcher } from './HouseholdSwitcher'
import { OfflineBadge } from './OfflineBadge'
import { Wallet } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function Sidebar({ household }: { household: HouseholdDto }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="border-b border-border px-3 py-4">
        <HouseholdSwitcher current={household} />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems(household.id).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-surface-muted',
              )
            }
          >
            <Icon width={19} height={19} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          to="/expenses"
          className="mb-2 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          <Wallet width={19} height={19} />
          Personal Finance
        </Link>
        <OfflineBadge />
      </div>
    </aside>
  )
}
