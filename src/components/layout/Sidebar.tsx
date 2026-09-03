import { Link, NavLink } from 'react-router-dom'
import type { HouseholdDto } from '@/lib/api/types'
import { navItems } from './nav'
import { HouseholdSwitcher } from './HouseholdSwitcher'
import { OfflineBadge } from './OfflineBadge'
import { Wallet } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export function Sidebar({ household }: { household: HouseholdDto }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border md:flex">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-primary font-bn text-[13px] text-white">৳</div>
        <span className="font-heading text-[15px] font-semibold tracking-tight">KOTO DIBO</span>
      </div>

      <div className="border-b border-border px-1 py-1">
        <HouseholdSwitcher current={household} />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {navItems(household.id).map(({ to, label, bn, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[14px] font-heading font-semibold',
                isActive ? 'bg-primary text-white' : 'text-ink hover:bg-surface-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon width={17} height={17} />
                <span>{label}</span>
                <span className={cn('bn ml-auto text-[11px]', isActive ? 'text-white/70' : 'text-muted')}>{bn}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border p-3">
        <Link
          to="/expenses"
          className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium text-primary hover:bg-primary-soft"
        >
          <Wallet width={17} height={17} />
          Personal finance
        </Link>
        <OfflineBadge />
      </div>
    </aside>
  )
}
