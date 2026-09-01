import { NavLink, Outlet } from 'react-router-dom'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { cn } from '@/lib/cn'

export function LedgerPage() {
  const context = useHouseholdContext()
  const { household } = context
  const base = `/h/${household.id}/ledger`

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-ink">Shared Household Ledger</h1>
      <div className="flex gap-1 rounded-md bg-surface-muted p-1">
        {[
          { to: `${base}/bazar`, label: 'Bazar' },
          { to: `${base}/contributions`, label: 'Contributions' },
        ].map((tab) => (
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
      <Outlet context={context} />
    </div>
  )
}
