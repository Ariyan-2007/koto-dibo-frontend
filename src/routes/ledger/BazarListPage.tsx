import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { cancelBazar, createBazar, createBazarFor, listBazar, updateBazar } from '@/lib/api/bazar'
import type { BazarPurchaseDto } from '@/lib/api/types'
import { canAddBazarForOthers, canAddEntry, canEditEntry } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { currentMonthKey } from '@/lib/ledger/period'
import { LedgerEntryCard } from '@/components/ledger/LedgerEntryCard'
import { LedgerFormSheet, type LedgerFormValues } from '@/components/ledger/LedgerFormSheet'
import { MonthEndReconciliationCard } from '@/components/ledger/MonthEndReconciliationCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Cart, Plus, Wallet } from '@/components/ui/icons'

export function BazarListPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState<'create' | 'leftover' | BazarPurchaseDto | null>(null)
  const [cancelTarget, setCancelTarget] = useState<BazarPurchaseDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { data: entries, isLoading } = useQuery({
    queryKey: ['bazar', household.id],
    queryFn: () => listBazar(household.id),
  })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const hasLeftoverThisMonth = useMemo(
    () => (entries ?? []).some((e) => e.status === 'Active' && e.amount < 0 && e.date.slice(0, 7) === currentMonthKey()),
    [entries],
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bazar', household.id] })

  const canAddForOthers = canAddBazarForOthers(household.callerRole)

  const createMutation = useMutation({
    mutationFn: ({ userId, ...values }: LedgerFormValues) => {
      const input = { ...values, note: values.note || undefined }
      return userId && userId !== currentUserId ? createBazarFor(household.id, userId, input) : createBazar(household.id, input)
    },
    onSuccess: (created) => {
      invalidate()
      toast.success(created.amount < 0 ? 'Leftover recorded' : 'Bazar entry added')
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

  const editingEntry = formOpen && formOpen !== 'create' && formOpen !== 'leftover' ? formOpen : null
  const isLeftoverMode = formOpen === 'leftover'

  return (
    <div className="flex flex-col gap-3">
      {canAddEntry(household.callerRole) && !hasLeftoverThisMonth && (
        <MonthEndReconciliationCard
          household={household}
          onRecordLeftover={() => {
            setFieldErrors({})
            setFormOpen('leftover')
          }}
        />
      )}

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
        <EmptyState icon={<Cart width={28} height={28} />} title="No Bazar Entries Yet" />
      )}

      {canAddEntry(household.callerRole) && (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setFieldErrors({})
              setFormOpen('create')
            }}
            icon={<Plus width={18} height={18} />}
          >
            Add Bazar Entry
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setFieldErrors({})
              setFormOpen('leftover')
            }}
            icon={<Wallet width={18} height={18} />}
          >
            Record Leftover
          </Button>
        </div>
      )}

      <LedgerFormSheet
        open={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={editingEntry ? 'Edit Bazar Entry' : isLeftoverMode ? 'Record Leftover' : 'New Bazar Entry'}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        fieldErrors={fieldErrors}
        signMode={isLeftoverMode ? 'negative' : 'positive'}
        amountLabel={isLeftoverMode ? 'Leftover amount' : undefined}
        amountHint={isLeftoverMode ? "Recorded as a negative entry — it reduces this month's food-cost baseline, not adds to it." : undefined}
        noteLabel={isLeftoverMode ? "What's this for?" : 'Note'}
        showMemberPicker={canAddForOthers && formOpen === 'create'}
        members={members}
        currentUserId={currentUserId}
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
        title="Cancel This Entry?"
        description="It stays visible in the list, struck through, but no longer counts toward the ledger."
        confirmLabel="Cancel Entry"
        danger
        isLoading={cancelMutation.isPending}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
