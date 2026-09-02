import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { archiveHousehold, leaveHousehold, restoreHousehold, updateHousehold } from '@/lib/api/households'
import { logout, logoutAll } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/auth/authStore'
import { useHouseholdStore } from '@/lib/household/householdStore'
import { canManageHousehold } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { InputField, TextareaField } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Link } from 'react-router-dom'
import { Users, LogOut, ChevronRight, UserPlus } from '@/components/ui/icons'

export function HouseholdSettingsPage() {
  const { household } = useHouseholdContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const clearAuth = useAuthStore((s) => s.clear)
  const clearHousehold = useHouseholdStore((s) => s.clearHousehold)
  const canManage = canManageHousehold(household.callerRole)

  const [name, setName] = useState(household.name)
  const [description, setDescription] = useState(household.description ?? '')
  const [type, setType] = useState(household.type ?? '')
  const [nameError, setNameError] = useState<string | undefined>()
  const [confirmAction, setConfirmAction] = useState<'archive' | 'restore' | 'leave' | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => updateHousehold(household.id, { name, description: description || undefined, type: type || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', household.id] })
      toast.success('Household updated')
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) setNameError(err.fieldError('name'))
      else toast.error(errorMessage(err))
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => archiveHousehold(household.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', household.id] })
      toast.success('Household archived')
      setConfirmAction(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setConfirmAction(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: () => restoreHousehold(household.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', household.id] })
      toast.success('Household restored')
      setConfirmAction(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setConfirmAction(null)
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveHousehold(household.id),
    onSuccess: () => {
      clearHousehold()
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success('You left the household')
      navigate('/households', { replace: true })
    },
    onError: (err) => {
      // e.g. "Transfer ownership first" when the Owner leaves with other active members remaining.
      toast.error(errorMessage(err))
      setConfirmAction(null)
    },
  })

  function onSave(e: FormEvent) {
    e.preventDefault()
    setNameError(undefined)
    saveMutation.mutate()
  }

  async function handleLogout() {
    await logout()
    clearAuth()
    navigate('/login', { replace: true })
  }

  async function handleLogoutAll() {
    await logoutAll().catch(() => undefined)
    clearAuth()
    navigate('/login', { replace: true })
  }

  const isLastActiveOwner = household.callerRole === 'Owner' && household.memberCount === 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Household Settings</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge tone="primary">{household.callerRole}</Badge>
          {household.status === 'Archived' && <Badge tone="danger">Archived</Badge>}
        </div>
      </div>

      <Link to={`/h/${household.id}/settings/members`}>
        <Card className="flex items-center justify-between p-4">
          <span className="flex items-center gap-2 font-medium text-ink">
            <Users width={18} height={18} />
            Members
          </span>
          <ChevronRight width={18} height={18} className="text-muted" />
        </Card>
      </Link>

      {canManage && (
        <Link to={`/h/${household.id}/settings/invite`}>
          <Card className="flex items-center justify-between p-4">
            <span className="flex items-center gap-2 font-medium text-ink">
              <UserPlus width={18} height={18} />
              Invite Member
            </span>
            <ChevronRight width={18} height={18} className="text-muted" />
          </Card>
        </Link>
      )}

      <Card className="p-5">
        <h2 className="mb-1 font-medium text-ink">Household Details</h2>
        {!canManage && (
          <p className="mb-3 text-xs text-muted">Only the Owner or a Manager can change these settings.</p>
        )}
        <form onSubmit={onSave} className="mt-3 flex flex-col gap-4">
          <InputField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            disabled={!canManage}
            required
          />
          <InputField label="Type" value={type} onChange={(e) => setType(e.target.value)} disabled={!canManage} />
          <TextareaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canManage}
          />
          {canManage && (
            <Button type="submit" isLoading={saveMutation.isPending} className="self-start">
              Save Changes
            </Button>
          )}
        </form>
      </Card>

      {canManage && (
        <Card className="p-5">
          <h2 className="mb-1 font-medium text-ink">Archive</h2>
          <p className="mb-3 text-sm text-muted">
            {household.status === 'Archived'
              ? 'Restore to resume membership changes and new entries.'
              : 'Blocks membership changes until restored. Existing data is kept.'}
          </p>
          <Button
            variant="secondary"
            onClick={() => setConfirmAction(household.status === 'Archived' ? 'restore' : 'archive')}
          >
            {household.status === 'Archived' ? 'Restore Household' : 'Archive Household'}
          </Button>
        </Card>
      )}

      <Card className="p-5">
        <h2 className="mb-3 font-medium text-ink">Account</h2>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={handleLogout} icon={<LogOut width={16} height={16} />} className="justify-start">
            Log Out
          </Button>
          <Button variant="ghost" onClick={handleLogoutAll} className="justify-start text-danger">
            Log Out of All Devices
          </Button>
          <Button variant="ghost" onClick={() => setConfirmAction('leave')} className="justify-start text-danger">
            Leave Household
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmAction === 'archive'}
        title="Archive This Household?"
        description="No one will be able to add entries or change membership until it's restored."
        confirmLabel="Archive"
        danger
        isLoading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'restore'}
        title="Restore This Household?"
        confirmLabel="Restore"
        isLoading={restoreMutation.isPending}
        onConfirm={() => restoreMutation.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === 'leave'}
        title={isLastActiveOwner ? 'Leave and Archive This Household?' : 'Leave This Household?'}
        description={
          isLastActiveOwner
            ? "You're the only member — leaving will archive the household."
            : household.callerRole === 'Owner'
              ? 'Transfer ownership to another member first — the owner can\'t leave while others remain.'
              : "You'll lose access to its ledgers, meals, and bill splits."
        }
        confirmLabel="Leave"
        danger
        isLoading={leaveMutation.isPending}
        onConfirm={() => leaveMutation.mutate()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
