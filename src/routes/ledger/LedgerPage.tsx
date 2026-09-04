import { NavLink, Outlet } from 'react-router-dom'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { cn } from '@/lib/cn'

export function LedgerPage() {
  const context = useHouseholdContext()
  const { household } = context
  const base = `/h/${household.id}/ledger`

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">Household · Ledger</p>
        <h1 className="mt-0.5 font-heading text-[26px] font-semibold text-ink">Shared household ledger</h1>
      </div>
      <div className="inline-flex self-start overflow-hidden rounded-sm border border-border">
        {[
          { to: `${base}/bazar`, label: 'Bazar' },
          { to: `${base}/contributions`, label: 'Contributions' },
          { to: `${base}/transactions`, label: 'Transactions' },
        ].map((tab, i) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'px-4 py-1.5 text-center font-heading text-[13px] font-semibold',
                i > 0 && 'border-l border-border',
                isActive ? 'bg-primary text-white' : 'text-ink hover:bg-surface-muted',
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
