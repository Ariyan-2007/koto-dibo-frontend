import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { LogOut } from '@/components/ui/icons'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-4 py-3.5 md:px-8">
          <div className="font-bn grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-primary text-[13px] text-on-primary">৳</div>
          <h1 className="font-heading text-[15px] font-semibold tracking-tight text-ink">KOTO DIBO</h1>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <LogOut width={16} height={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-3xl px-4 pt-5 md:px-8 md:pt-8"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-5 inline-flex overflow-hidden rounded-sm border border-border">
          {TABS.map((tab, i) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  'px-4 py-1.5 text-center font-heading text-[13px] font-semibold',
                  i > 0 && 'border-l border-border',
                  isActive ? 'bg-primary text-on-primary' : 'text-ink hover:bg-surface-muted',
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
