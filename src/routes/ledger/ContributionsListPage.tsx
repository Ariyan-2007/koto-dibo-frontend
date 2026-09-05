import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { deleteContribution, createContribution, createContributionFor, listContributions, updateContribution } from '@/lib/api/contributions'
import type { ContributionDto } from '@/lib/api/types'
import { canAddContributionForOthers, canAddEntry, canEditEntry } from '@/lib/permissions'
import { ApiError } from '@/lib/api/client'
import { toast, errorMessage } from '@/lib/toast'
import { LedgerEntryCard } from '@/components/ledger/LedgerEntryCard'
import { LedgerFormSheet, type LedgerFormValues } from '@/components/ledger/LedgerFormSheet'
import { LedgerFilterSheet, activeLedgerFilterCount, type LedgerFilterValues } from '@/components/ledger/LedgerFilterSheet'
import { MemberFilterTabs } from '@/components/ledger/MemberFilterTabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { Wallet, Plus, Filter } from '@/components/ui/icons'
import { formatMoney } from '@/lib/format'

export function ContributionsListPage() {
  const { household, currentUserId } = useHouseholdContext()
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState<'create' | ContributionDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContributionDto | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [selectedMember, setSelectedMember] = useState<string | 'all'>('all')
  const [filter, setFilter] = useState<LedgerFilterValues>({})
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['contributions', household.id, filter],
    queryFn: () => listContributions(household.id, filter),
  })
  const { data: members } = useQuery({ queryKey: ['members', household.id], queryFn: () => listMembers(household.id) })
  const nameByUser = useMemo(() => new Map((members ?? []).map((m) => [m.userId, m.name])), [members])

  const sortedEntries = useMemo(
    () => [...(entries ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [entries],
  )

  const memberTabs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of sortedEntries) counts.set(e.contributedByUserId, (counts.get(e.contributedByUserId) ?? 0) + 1)
    return (members ?? [])
      .map((m) => ({ userId: m.userId, label: m.userId === currentUserId ? 'You' : m.name, count: counts.get(m.userId) ?? 0 }))
      .sort((a, b) => (a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : a.label.localeCompare(b.label)))
  }, [members, sortedEntries, currentUserId])

  const visibleEntries = useMemo(
    () => (selectedMember === 'all' ? sortedEntries : sortedEntries.filter((e) => e.contributedByUserId === selectedMember)),
    [sortedEntries, selectedMember],
  )
  const visibleTotal = useMemo(
    () => visibleEntries.filter((e) => e.status === 'Active').reduce((sum, e) => sum + e.amount, 0),
    [visibleEntries],
  )
  const selectedLabel = selectedMember === 'all' ? null : (memberTabs.find((m) => m.userId === selectedMember)?.label ?? null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['contributions', household.id] })

  const canAddForOthers = canAddContributionForOthers(household.callerRole)

  const createMutation = useMutation({
    mutationFn: ({ userId, ...values }: LedgerFormValues) => {
      const input = { ...values, notes: values.note || undefined }
      return userId && userId !== currentUserId ? createContributionFor(household.id, userId, input) : createContribution(household.id, input)
    },
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteContribution(household.id, id),
    onSuccess: () => {
      invalidate()
      toast.success('Contribution deleted')
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(errorMessage(err))
      setDeleteTarget(null)
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
  const filterCount = activeLedgerFilterCount(filter)

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setFiltersOpen(true)}
        aria-label="Filter contributions"
        className="relative self-end rounded-sm p-2.5 text-muted hover:bg-surface-muted hover:text-ink"
      >
        <Filter width={18} height={18} />
        {filterCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-pill bg-primary text-[10px] font-semibold text-on-primary">
            {filterCount}
          </span>
        )}
      </button>

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
                entry={{ ...entry, note: entry.notes }}
                byName={nameByUser.get(entry.contributedByUserId) ?? '—'}
                recordedByName={
                  entry.createdByUserId !== entry.contributedByUserId ? (nameByUser.get(entry.createdByUserId) ?? '—') : undefined
                }
                householdId={household.id}
                canEdit={entry.sourceType !== 'AutoFromBazar' && canEditEntry(household.callerRole, entry.contributedByUserId, currentUserId)}
                onEdit={() => {
                  setFieldErrors({})
                  setFormOpen(entry)
                }}
                onDelete={() => setDeleteTarget(entry)}
              />
            ))
          ) : (
            <EmptyState icon={<Wallet width={28} height={28} />} title={`No Contributions From ${selectedLabel}`} />
          )}
        </>
      ) : (
        <EmptyState
          icon={<Wallet width={28} height={28} />}
          title={filterCount > 0 ? 'No Matching Contributions' : 'No Contributions Yet'}
          description={filterCount > 0 ? 'Try widening your filters.' : undefined}
        />
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
          Add Contribution
        </Button>
      )}

      <LedgerFormSheet
        open={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={editingEntry ? 'Edit Contribution' : 'New Contribution'}
        noteLabel="Notes"
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        fieldErrors={fieldErrors}
        showMemberPicker={canAddForOthers && formOpen === 'create'}
        members={members}
        currentUserId={currentUserId}
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

      <LedgerFilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter Contributions" value={filter} onApply={setFilter} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Permanently Delete This Contribution?"
        description="This cannot be undone."
        confirmLabel="Delete Permanently"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
