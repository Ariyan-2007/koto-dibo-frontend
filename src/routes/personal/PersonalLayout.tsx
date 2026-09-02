import { Link, NavLink, Outlet } from 'react-router-dom'
import { ArrowLeft } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/personal/expenses', label: 'Expenses' },
  { to: '/personal/budget', label: 'Budget' },
]

/** Personal Expenses & Budget — per-user, not household-scoped (§Phase 7), so this owns its
 * own page frame instead of nesting inside HouseholdLayout's AppShell. */
export function PersonalLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 pt-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-4 md:px-8">
          <Link to="/households" className="text-muted hover:text-ink" aria-label="Back to households">
            <ArrowLeft width={20} height={20} />
          </Link>
          <h1 className="text-lg font-semibold text-ink">Personal Finance</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-5 md:px-8 md:pt-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        <div className="mb-5 flex gap-1 rounded-md bg-surface-muted p-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'flex-1 rounded-md py-2 text-center text-sm font-medium',
                  isActive ? 'bg-surface text-primary shadow-sm' : 'text-muted',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
        <Outlet />
      </main>
    </div>
  )
}
