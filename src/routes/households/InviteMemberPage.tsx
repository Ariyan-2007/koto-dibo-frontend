import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { createInvite, listInvites, revokeInvite } from '@/lib/api/invites'
import type { HouseholdInviteDto, HouseholdRole } from '@/lib/api/types'
import { canManageHousehold } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import { InputField, SelectField } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ArrowLeft, Copy, Maximize, QrCode, Share, UserPlus, X } from '@/components/ui/icons'

const INVITE_ROLES: HouseholdRole[] = ['Manager', 'Member', 'Viewer']

const EXPIRY_OPTIONS: { label: string; hours: number }[] = [
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days (default)', hours: 168 },
  { label: '30 days', hours: 720 },
]

function isExpired(invite: HouseholdInviteDto): boolean {
  return new Date(invite.expiresAt).getTime() < Date.now()
}

function expiryLabel(invite: HouseholdInviteDto): string {
  if (isExpired(invite)) return 'Expired'
  const days = Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'Expires today'
  return `Expires in ${days} day${days === 1 ? '' : 's'}`
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Could not copy — copy the ${label.toLowerCase()} manually`)
  }
}

export function InviteMemberPage() {
  const { household } = useHouseholdContext()
  const queryClient = useQueryClient()
  const canManage = canManageHousehold(household.callerRole)

  const [createOpen, setCreateOpen] = useState(false)
  const [viewInvite, setViewInvite] = useState<HouseholdInviteDto | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<HouseholdInviteDto | null>(null)

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites', household.id],
    queryFn: () => listInvites(household.id),
    enabled: canManage,
  })

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(household.id, inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', household.id] })
      toast.success('Invite revoked')
      setRevokeTarget(null)
      setViewInvite(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setRevokeTarget(null)
    },
  })

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link to={`/h/${household.id}/settings`} className="text-muted hover:text-ink">
            <ArrowLeft width={20} height={20} />
          </Link>
          <h1 className="font-heading text-[22px] font-semibold text-ink">Invite member</h1>
        </div>
        <Card className="p-5 text-sm text-muted">Only the Owner or a Manager can invite members to this household.</Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link to={`/h/${household.id}/settings`} className="text-muted hover:text-ink">
          <ArrowLeft width={20} height={20} />
        </Link>
        <h1 className="font-heading text-[22px] font-semibold text-ink">Invite member</h1>
      </div>

      <Button onClick={() => setCreateOpen(true)} icon={<UserPlus width={18} height={18} />} className="self-start">
        Create Invite
      </Button>

      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Pending Invites</h2>
        {isLoading ? (
          <SkeletonList rows={2} />
        ) : invites && invites.length > 0 ? (
          <div className="flex flex-col gap-2">
            {invites.map((invite) => (
              <Card key={invite.id} className="flex items-center justify-between gap-3 p-4">
                <button className="min-w-0 flex-1 text-left" onClick={() => setViewInvite(invite)}>
                  <p className="flex items-center gap-2 truncate font-mono font-medium text-ink">{invite.code}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {invite.role}
                    {invite.email && ` · ${invite.email}`} · {expiryLabel(invite)}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={isExpired(invite) ? 'muted' : 'primary'}>{isExpired(invite) ? 'Expired' : 'Pending'}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => setViewInvite(invite)}>
                    <QrCode width={16} height={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UserPlus width={28} height={28} />}
            title="No Pending Invites"
            description="Create one to bring a new member onto this household, by code or by QR."
          />
        )}
      </div>

      <CreateInviteSheet
        householdId={household.id}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(invite) => setViewInvite(invite)}
      />

      <InviteDetailSheet
        invite={viewInvite}
        householdName={household.name}
        onClose={() => setViewInvite(null)}
        onRevoke={(invite) => setRevokeTarget(invite)}
      />

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke This Invite?"
        description="Anyone who scans the QR or types this code afterward won't be able to join with it. This can't be undone."
        confirmLabel="Revoke"
        danger
        isLoading={revokeMutation.isPending}
        onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  )
}

function CreateInviteSheet({
  householdId,
  open,
  onClose,
  onCreated,
}: {
  householdId: string
  open: boolean
  onClose: () => void
  onCreated: (invite: HouseholdInviteDto) => void
}) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<HouseholdRole>('Member')
  const [expiresInHours, setExpiresInHours] = useState(168)
  const [error, setError] = useState<string | undefined>()

  const mutation = useMutation({
    mutationFn: () => createInvite(householdId, { email: email.trim() || undefined, role, expiresInHours }),
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: ['invites', householdId] })
      toast.success('Invite created')
      setEmail('')
      setRole('Member')
      setExpiresInHours(168)
      onClose()
      onCreated(invite)
    },
    onError: (err) => {
      if (err instanceof ApiError && err.errors) {
        setError(err.fieldError('email'))
      } else {
        toast.error(errorMessage(err))
      }
    },
  })

  return (
    <Sheet open={open} onClose={onClose} title="Create Invite">
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          setError(undefined)
          mutation.mutate()
        }}
        className="flex flex-col gap-4"
      >
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as HouseholdRole)}>
          {INVITE_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Expires"
          value={expiresInHours}
          onChange={(e) => setExpiresInHours(Number(e.target.value))}
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.hours} value={o.hours}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Email (optional)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          hint="We'll send them the link — but anyone with the code or QR can still redeem it."
        />
        <Button type="submit" isLoading={mutation.isPending} className="w-full">
          Create Invite
        </Button>
      </form>
    </Sheet>
  )
}

function InviteDetailSheet({
  invite,
  householdName,
  onClose,
  onRevoke,
}: {
  invite: HouseholdInviteDto | null
  householdName: string
  onClose: () => void
  onRevoke: (invite: HouseholdInviteDto) => void
}) {
  const [fullscreenQr, setFullscreenQr] = useState(false)

  if (!invite) return null
  const expired = isExpired(invite)

  async function shareInvite() {
    if (!invite) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${householdName} on Koto Dibo`,
          text: `Join "${householdName}" on Koto Dibo — use code ${invite.code} or open the link.`,
          url: invite.inviteLink,
        })
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
    } else {
      copyText(invite.inviteLink, 'Link')
    }
  }

  return (
    <>
      <Sheet open={!!invite} onClose={onClose} title="Invite Details">
        <div className="flex flex-col items-center gap-4">
          {invite.qrCodeUrl && (
            <button
              onClick={() => setFullscreenQr(true)}
              className="group relative overflow-hidden rounded-lg border border-border p-2"
            >
              <img src={invite.qrCodeUrl} alt="Invite QR code" className="h-48 w-48" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
                <Maximize width={20} height={20} />
              </span>
            </button>
          )}

          <div className="corner-frame flex items-center gap-2 border border-border bg-surface-muted px-6 py-3 text-primary">
            <span className="font-heading text-2xl font-semibold tracking-widest text-ink">{invite.code}</span>
            <Button variant="ghost" size="sm" onClick={() => copyText(invite.code, 'Code')} aria-label="Copy code">
              <Copy width={16} height={16} />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted">
            <Badge tone={expired ? 'muted' : 'primary'}>{expired ? 'Expired' : 'Pending'}</Badge>
            <span>{invite.role}</span>
            <span>·</span>
            <span>{expiryLabel(invite)}</span>
          </div>

          <div className="flex w-full gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => copyText(invite.inviteLink, 'Link')} icon={<Copy width={16} height={16} />}>
              Copy Link
            </Button>
            <Button variant="secondary" className="flex-1" onClick={shareInvite} icon={<Share width={16} height={16} />}>
              Share
            </Button>
          </div>

          {!expired && (
            <Button variant="ghost" className="w-full text-danger" onClick={() => onRevoke(invite)}>
              Revoke Invite
            </Button>
          )}
        </div>
      </Sheet>

      {fullscreenQr && invite.qrCodeUrl && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center gap-6 bg-black/90 p-6">
          <button
            onClick={() => setFullscreenQr(false)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-pill p-2 text-white hover:bg-white/10"
            style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <X width={24} height={24} />
          </button>
          <img src={invite.qrCodeUrl} alt="Invite QR code" className="w-full max-w-sm rounded-lg bg-white p-4" />
          <p className="text-center text-white">
            Scan to join <span className="font-semibold">{householdName}</span>
          </p>
        </div>
      )}
    </>
  )
}
