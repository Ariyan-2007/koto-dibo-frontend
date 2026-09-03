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
                'relative flex flex-1 flex-col items-center gap-1 py-2.5 font-heading text-[10px] font-semibold tracking-wide uppercase',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 bg-primary" />}
                <Icon width={21} height={21} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
