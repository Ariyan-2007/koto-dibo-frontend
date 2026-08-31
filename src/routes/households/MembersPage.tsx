import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { addMember, changeMemberRole, listMembers, removeMember } from '@/lib/api/households'
import type { HouseholdMemberDto, HouseholdRole } from '@/lib/api/types'
import { canChangeRole, canManageHousehold, canRemoveMember } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Sheet } from '@/components/ui/Sheet'
import { InputField, SelectField } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Plus } from '@/components/ui/icons'
import { Link } from 'react-router-dom'

const ROLES: HouseholdRole[] = ['Manager', 'Member', 'Viewer']

export function MembersPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const canManage = canManageHousehold(household.callerRole)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<HouseholdMemberDto | null>(null)

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', household.id],
    queryFn: () => listMembers(household.id),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(household.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', household.id] })
      toast.success('Member removed')
      setRemoveTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setRemoveTarget(null)
    },
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: HouseholdRole }) => changeMemberRole(household.id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', household.id] })
      toast.success('Role updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to={`/h/${household.id}/settings`} className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="text-xl font-semibold text-ink">Members</h1>
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : (
        <div className="flex flex-col gap-2">
          {(members ?? []).map((m) => (
            <Card key={m.userId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">
                  {m.name}
                  {m.userId === currentUserId && <span className="text-muted"> (you)</span>}
                </p>
                <p className="truncate text-xs text-muted">{m.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canManage && canChangeRole(household.callerRole, m.role) ? (
                  <select
                    value={m.role}
                    onChange={(e) => roleMutation.mutate({ userId: m.userId, role: e.target.value as HouseholdRole })}
                    className="h-9 rounded-md border border-border bg-surface px-2 text-sm text-ink"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone={m.role === 'Owner' ? 'primary' : 'muted'}>{m.role}</Badge>
                )}
                {canManage && canRemoveMember(household.callerRole, m.role) && (
                  <Button variant="ghost" size="sm" className="text-danger" onClick={() => setRemoveTarget(m)}>
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {canManage && (
        <Button onClick={() => setAddOpen(true)} icon={<Plus width={18} height={18} />} className="self-start">
          Add member
        </Button>
      )}

      <AddMemberSheet householdId={household.id} open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.name ?? 'this member'}?`}
        description="They'll lose access to this household's ledgers, meals, and bill splits."
        confirmLabel="Remove"
        danger
        isLoading={removeMutation.isPending}
        onConfirm={() => removeTarget && removeMutation.mutate(removeTarget.userId)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  )
}

function AddMemberSheet({ householdId, open, onClose }: { householdId: string; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<HouseholdRole>('Member')
  const [error, setError] = useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: () => addMember(householdId, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', householdId] })
      toast.success('Member added')
      setEmail('')
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.message)
      else setError(errorMessage(err))
    },
  })

  return (
    <Sheet open={open} onClose={onClose} title="Add member">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError(undefined)
          mutation.mutate()
        }}
        className="flex flex-col gap-4"
      >
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          hint={!error ? 'Must be an existing Koto Dibo user.' : undefined}
          required
          autoFocus
        />
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as HouseholdRole)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
        <Button type="submit" isLoading={mutation.isPending} className="w-full">
          Add
        </Button>
      </form>
    </Sheet>
  )
}
