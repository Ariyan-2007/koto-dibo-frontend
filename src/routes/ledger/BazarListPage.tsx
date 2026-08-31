import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { cancelBazar, createBazar, listBazar, updateBazar } from '@/lib/api/bazar'
import type { BazarPurchaseDto } from '@/lib/api/types'
import { canAddEntry, canEditEntry } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { LedgerEntryCard } from '@/components/ledger/LedgerEntryCard'
import { LedgerFormSheet, type LedgerFormValues } from '@/components/ledger/LedgerFormSheet'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Cart, Plus } from '@/components/ui/icons'

export function BazarListPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState<'create' | BazarPurchaseDto | null>(null)
  const [cancelTarget, setCancelTarget] = useState<BazarPurchaseDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: entries, isLoading } = useQuery({
    queryKey: ['bazar', household.id],
    queryFn: () => listBazar(household.id),
  })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bazar', household.id] })

  const createMutation = useMutation({
    mutationFn: (values: LedgerFormValues) => createBazar(household.id, { ...values, note: values.note || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Bazar entry added')
      setFormOpen(null)
    },
    onError: (err) => handleFormError(err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: LedgerFormValues }) =>
      updateBazar(household.id, id, { ...values, note: values.note || undefined }),
    onSuccess: () => {
      invalidate()
      toast.success('Bazar entry updated')
      setFormOpen(null)
    },
    onError: (err) => handleFormError(err),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBazar(household.id, id),
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
        note: err.fieldError('note') ?? '',
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
            entry={entry}
            byName={nameByUser.get(entry.purchasedByUserId) ?? '—'}
            canEdit={canEditEntry(household.callerRole, entry.purchasedByUserId, currentUserId)}
            onEdit={() => {
              setFieldErrors({})
              setFormOpen(entry)
            }}
            onCancel={() => setCancelTarget(entry)}
          />
        ))
      ) : (
        <EmptyState icon={<Cart width={28} height={28} />} title="No bazar entries yet" />
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
          Add bazar entry
        </Button>
      )}

      <LedgerFormSheet
        open={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={editingEntry ? 'Edit bazar entry' : 'New bazar entry'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        fieldErrors={fieldErrors}
        initial={
          editingEntry
            ? { date: editingEntry.date, amount: editingEntry.amount, currency: editingEntry.currency, note: editingEntry.note ?? '' }
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
