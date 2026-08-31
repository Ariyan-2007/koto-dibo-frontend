import { NavLink } from 'react-router-dom'
import { navItems } from './nav'
import { cn } from '@/lib/cn'

export function BottomNav({ householdId }: { householdId: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-safe md:hidden">
      <div className="flex justify-around">
        {navItems(householdId).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            <Icon width={22} height={22} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
