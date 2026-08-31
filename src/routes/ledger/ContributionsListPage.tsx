import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { cancelContribution, createContribution, listContributions, updateContribution } from '@/lib/api/contributions'
import type { ContributionDto } from '@/lib/api/types'
import { canAddEntry, canEditEntry } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { LedgerEntryCard } from '@/components/ledger/LedgerEntryCard'
import { LedgerFormSheet, type LedgerFormValues } from '@/components/ledger/LedgerFormSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Wallet, Plus } from '@/components/ui/icons'

export function ContributionsListPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState<'create' | ContributionDto | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ContributionDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: entries, isLoading } = useQuery({
    queryKey: ['contributions', household.id],
    queryFn: () => listContributions(household.id),
  })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contributions', household.id] })

  const createMutation = useMutation({
    mutationFn: (values: LedgerFormValues) => createContribution(household.id, { ...values, notes: values.note || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Contribution added')
      setFormOpen(null)
    },
    onError: (err) => handleFormError(err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: LedgerFormValues }) =>
      updateContribution(household.id, id, { ...values, notes: values.note || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Contribution updated')
      setFormOpen(null)
    },
    onError: (err) => handleFormError(err),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelContribution(household.id, id),
    onSuccess: () => {
      invalidate()
      toast.success('Entry cancelled')
      setCancelTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setCancelTarget(null)
    },
  })

  function handleFormError(err: unknown) {
    if (err instanceof ApiError && err.errors) {
      setFieldErrors({
        date: err.fieldError('date') ?? '',
        amount: err.fieldError('amount') ?? '',
        currency: err.fieldError('currency') ?? '',
        note: err.fieldError('notes') ?? '',
      })
    } else {
      toast.error(errorMessage(err))
    }
  }

  const editingEntry = formOpen && formOpen !== 'create' ? formOpen : null

  return (
    <div className="flex flex-col gap-3">
      {isLoading ? (
        <SkeletonList />
      ) : entries && entries.length > 0 ? (
        entries.map((entry) => (
          <LedgerEntryCard
            key={entry.id}
            entry={{ ...entry, note: entry.notes }}
            byName={nameByUser.get(entry.contributedByUserId) ?? '—'}
            canEdit={canEditEntry(household.callerRole, entry.contributedByUserId, currentUserId)}
            onEdit={() => {
              setFieldErrors({})
              setFormOpen(entry)
            }}
            onCancel={() => setCancelTarget(entry)}
          />
        ))
      ) : (
        <EmptyState icon={<Wallet width={28} height={28} />} title="No contributions yet" />
      )}

      {canAddEntry(household.callerRole) && (
        <Button
          onClick={() => {
            setFieldErrors({})
            setFormOpen('create')
          }}
          icon={<Plus width={18} height={18} />}
          className="self-start"
        >
          Add contribution
        </Button>
      )}

      <LedgerFormSheet
        open={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={editingEntry ? 'Edit contribution' : 'New contribution'}
        noteLabel="Notes"
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        fieldErrors={fieldErrors}
        initial={
          editingEntry
            ? { date: editingEntry.date, amount: editingEntry.amount, currency: editingEntry.currency, note: editingEntry.notes ?? '' }
            : undefined
        }
        onSubmit={(values) => {
          if (editingEntry) updateMutation.mutate({ id: editingEntry.id, values })
          else createMutation.mutate(values)
        }}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this entry?"
        description="It stays visible in the list, struck through, but no longer counts toward the ledger."
        confirmLabel="Cancel entry"
        danger
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
