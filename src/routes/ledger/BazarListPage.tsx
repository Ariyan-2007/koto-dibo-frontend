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
import { MemberFilterTabs } from '@/components/ledger/MemberFilterTabs'
import { MonthEndReconciliationCard } from '@/components/ledger/MonthEndReconciliationCard'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Cart, Plus, Wallet } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'

export function BazarListPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState<'create' | 'leftover' | BazarPurchaseDto | null>(null)
  const [cancelTarget, setCancelTarget] = useState<BazarPurchaseDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | undefined>()
  const [selectedMember, setSelectedMember] = useState<string | 'all'>('all')

  const { data: entries, isLoading } = useQuery({
    queryKey: ['bazar', household.id],
    queryFn: () => listBazar(household.id),
  })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [entries],
  )

  const memberTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of sortedEntries) counts.set(e.purchasedByUserId, (counts.get(e.purchasedByUserId) ?? 0) + 1)
    return (members ?? [])
      .map((m) => ({ userId: m.userId, label: m.userId === currentUserId ? 'You' : m.name, count: counts.get(m.userId) ?? 0 }))
      .sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : a.label.localeCompare(b.label)))
  }, [members, sortedEntries, currentUserId])

  const visibleEntries = useMemo(
    () => (selectedMember === 'all' ? sortedEntries : sortedEntries.filter((e) => e.purchasedByUserId === selectedMember)),
    [sortedEntries, selectedMember],
  )
  const visibleTotal = useMemo(
    () => visibleEntries.filter((e) => e.status === 'Active').reduce((sum, e) => sum + e.amount, 0),
    [visibleEntries],
  )
  const selectedLabel = selectedMember === 'all' ? null : (memberTabs.find((m) => m.userId === selectedMember)?.label ?? null)

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
    if (err instanceof ApiError && err.status === 409) {
      // Balance changed between the fetch and submit — show the server's own message inline
      // rather than a generic failure toast.
      setFormError(err.message)
    } else if (err instanceof ApiError && err.errors) {
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
            setFormError(undefined)
            setFormOpen('leftover')
          }}
        />
      )}

      {isLoading ? (
        <SkeletonList />
      ) : sortedEntries.length > 0 ? (
        <>
          <MemberFilterTabs options={memberTabs} selected={selectedMember} onSelect={setSelectedMember} totalCount={sortedEntries.length} />

          {visibleEntries.length > 0 && (
            <p className="px-1 text-xs text-muted">
              {visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'}
              {selectedLabel && ` from ${selectedLabel}`} · {formatMoney(visibleTotal, 'BDT')} total
            </p>
          )}

          {visibleEntries.length > 0 ? (
            visibleEntries.map((entry) => (
              <LedgerEntryCard
                key={entry.id}
                entry={entry}
                byName={nameByUser.get(entry.purchasedByUserId) ?? '—'}
                householdId={household.id}
                canEdit={canEditEntry(household.callerRole, entry.purchasedByUserId, currentUserId)}
                onEdit={() => {
                  setFieldErrors({})
                  setFormError(undefined)
                  setFormOpen(entry)
                }}
                onCancel={() => setCancelTarget(entry)}
              />
            ))
          ) : (
            <EmptyState icon={<Cart width={28} height={28} />} title={`No Bazar Entries From ${selectedLabel}`} />
          )}
        </>
      ) : (
        <EmptyState icon={<Cart width={28} height={28} />} title="No Bazar Entries Yet" />
      )}

      {canAddEntry(household.callerRole) && (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setFieldErrors({})
              setFormError(undefined)
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
              setFormError(undefined)
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
        formError={formError}
        signMode={isLeftoverMode ? 'negative' : 'positive'}
        amountLabel={isLeftoverMode ? 'Leftover amount' : undefined}
        amountHint={isLeftoverMode ? "Recorded as a negative entry — it reduces this month's food-cost baseline, not adds to it." : undefined}
        noteLabel={isLeftoverMode ? "What's this for?" : 'Note'}
        showMemberPicker={canAddForOthers && formOpen === 'create'}
        showFundingSourceChoice={!isLeftoverMode}
        householdId={household.id}
        members={members}
        currentUserId={currentUserId}
        initial={
          editingEntry
            ? {
                date: editingEntry.date,
                amount: editingEntry.amount,
                currency: editingEntry.currency,
                note: editingEntry.note ?? '',
                fundingSource: editingEntry.fundingSource,
              }
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
