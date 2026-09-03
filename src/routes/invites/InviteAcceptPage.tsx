import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { previewInvite, acceptInvite } from '@/lib/api/invites'
import { ApiError } from '@/lib/api/client'
import { AuthLayout } from '@/routes/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast, errorMessage } from '@/lib/toast'

function StatusMessage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="text-sm text-muted">{description}</p>
      <Link to="/join" className="text-sm font-medium text-primary">
        Have another code?
      </Link>
    </div>
  )
}

export function InviteAcceptPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const normalizedCode = code?.trim() ?? ''

  const {
    data: preview,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invite-preview', normalizedCode],
    queryFn: () => previewInvite(normalizedCode),
    enabled: !!normalizedCode,
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptInvite(normalizedCode),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success(`Joined ${result.householdName}`)
      navigate(`/h/${result.householdId}`, { replace: true })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })

  let body: ReactNode

  if (!normalizedCode) {
    body = <StatusMessage title="Invalid Link" description="That invite link is missing a code." />
  } else if (isLoading) {
    body = (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mx-auto h-5 w-1/2" />
        <Skeleton className="h-11 w-full" />
      </div>
    )
  } else if (isError) {
    const notFound = error instanceof ApiError && error.status === 404
    body = (
      <StatusMessage
        title={notFound ? 'Invite Not Found' : 'Something Went Wrong'}
        description={notFound ? "That invite code doesn't exist. Double-check it and try again." : errorMessage(error)}
      />
    )
  } else if (preview) {
    if (preview.status === 'Accepted') {
      body = <StatusMessage title="Already Used" description="This invite has already been redeemed." />
    } else if (preview.status === 'Revoked') {
      body = <StatusMessage title="No Longer Valid" description="This invite has been revoked by a household admin." />
    } else if (preview.status === 'Expired') {
      body = <StatusMessage title="Invite Expired" description="Ask whoever sent it for a new one." />
    } else if (preview.callerIsAlreadyMember) {
      body = (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-medium text-ink">You're Already In</p>
          <p className="text-sm text-muted">You're already a member of {preview.householdName}.</p>
          <Button onClick={() => navigate(`/h/${preview.householdId}`)} className="w-full">
            Go to Household
          </Button>
        </div>
      )
    } else {
      body = (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-ink">
            <span className="font-semibold">{preview.invitedByName}</span> invited you to join{' '}
            <span className="font-semibold">{preview.householdName}</span> as a{' '}
            <span className="font-semibold">{preview.role}</span>
          </p>
          <Button onClick={() => acceptMutation.mutate()} isLoading={acceptMutation.isPending} framed className="w-full">
            Join {preview.householdName}
          </Button>
        </div>
      )
    }
  }

  return (
    <AuthLayout>
      <h2 className="mb-5 text-center text-lg font-semibold text-ink">Household Invite</h2>
      {body}
    </AuthLayout>
  )
}
