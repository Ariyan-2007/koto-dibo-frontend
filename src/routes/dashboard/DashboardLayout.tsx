import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { LogOut } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '/households', label: 'Households' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/budgets', label: 'Budgets' },
]

export function DashboardLayout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clear)

  async function handleLogout() {
    await logout()
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 pt-safe backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4 md:px-8">
          <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <LogOut width={16} height={16} />
            Log Out
          </button>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-3xl px-4 pt-5 md:px-8 md:pt-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
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
