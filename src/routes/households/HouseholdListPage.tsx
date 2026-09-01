import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listHouseholds } from '@/lib/api/households'
import { logout } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Home, LogOut, Plus, Users } from '@/components/ui/icons'
import { CreateHouseholdSheet } from './CreateHouseholdSheet'

export function HouseholdListPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clear)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: households, isLoading } = useQuery({ queryKey: ['households'], queryFn: listHouseholds })

  async function handleLogout() {
    await logout()
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Your Households</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <LogOut width={16} height={16} />
          Log Out
        </button>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : households && households.length > 0 ? (
        <div className="flex flex-col gap-3">
          {households.map((h) => (
            <Link key={h.id} to={`/h/${h.id}`}>
              <Card className="flex items-center gap-3 p-4 hover:border-primary focus-visible:outline-none focus-visible:shadow-focus">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Home width={20} height={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{h.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <Users width={13} height={13} />
                    {h.memberCount} member{h.memberCount === 1 ? '' : 's'}
                    {h.type && ` · ${h.type}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={h.callerRole === 'Owner' ? 'primary' : 'muted'}>{h.callerRole}</Badge>
                  {h.status === 'Archived' && <Badge tone="danger">Archived</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Home width={28} height={28} />}
          title="No Households Yet"
          description="Create one to start tracking bazar, meals, and bills together."
        />
      )}

      <Button onClick={() => setCreateOpen(true)} className="fixed bottom-6 right-6 shadow-card" icon={<Plus width={18} height={18} />}>
        New Household
      </Button>

      <CreateHouseholdSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
