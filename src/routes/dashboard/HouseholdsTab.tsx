import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { listHouseholds } from '@/lib/api/households'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Home, Plus, Users } from '@/components/ui/icons'
import { CreateHouseholdSheet } from '@/routes/households/CreateHouseholdSheet'

export function HouseholdsTab() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: households, isLoading } = useQuery({ queryKey: ['households'], queryFn: listHouseholds })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-primary-active uppercase">Koto Dibo</p>
          <h1 className="mt-0.5 font-heading text-[26px] font-semibold text-ink">Your households</h1>
        </div>
        <Link to="/join" className="text-sm font-medium text-primary">
          Have a code? Join →
        </Link>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : households && households.length > 0 ? (
        <div className="flex flex-col gap-3">
          {households.map((h) => (
            <Link key={h.id} to={`/h/${h.id}`}>
              <Card className="flex items-center gap-3 p-4 hover:border-primary focus-visible:outline-none focus-visible:shadow-focus">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary">
                  <Home width={20} height={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading font-semibold text-ink">{h.name}</p>
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

      <Button onClick={() => setCreateOpen(true)} framed icon={<Plus width={18} height={18} />}>
        New household
      </Button>

      <CreateHouseholdSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
