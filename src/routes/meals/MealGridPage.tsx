import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { listMeals } from '@/lib/api/meals'
import { canAddEntry, canRecordMealForOthers } from '@/lib/permissions'
import { getMonthRange, dayOfMonthIso, todayIso } from '@/lib/format'
import { useMealMutator } from './useMealMutator'
import { MealCellSheet } from './MealCellSheet'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { ChevronLeft, ChevronRight, Users as UsersIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface CellTarget {
  userId: string
  memberName: string
  date: string
}

interface BulkTarget {
  date: string
}

export function MealGridPage() {
  const { household, currentUserId } = useHouseholdContext()
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const { from, to, label, daysInMonth } = getMonthRange(cursor.year, cursor.month)
  const today = todayIso()

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', household.id],
    queryFn: () => listMembers(household.id),
  })
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ['meals', household.id, from, to],
    queryFn: () => listMeals(household.id, { from, to }),
  })

  const entryMap = useMemo(() => {
    const map = new Map<string, { count: number; notes: string | null }>()
    for (const e of entries ?? []) map.set(`${e.userId}|${e.date}`, { count: e.count, notes: e.notes })
    return map
  }, [entries])

  const { setCount, clearEntry } = useMealMutator(household.id, from, to)
  const [cellTarget, setCellTarget] = useState<CellTarget | null>(null)
  const [bulkTarget, setBulkTarget] = useState<BulkTarget | null>(null)
  const [isBulkSaving, setIsBulkSaving] = useState(false)

  const canEditOthers = canRecordMealForOthers(household.callerRole)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const canEditOwnCell = canAddEntry(household.callerRole)

  function canEditCell(userId: string) {
    return (userId === currentUserId && canEditOwnCell) || canEditOthers
  }

  async function handleBulkSet(count: number) {
    if (!bulkTarget || !members) return
    setIsBulkSaving(true)
    try {
      await Promise.all(members.map((m) => setCount(m.userId, bulkTarget.date, count)))
    } finally {
      setIsBulkSaving(false)
      setBulkTarget(null)
    }
  }

  const isLoading = membersLoading || entriesLoading

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Meal grid</h1>
        <Link to={`/h/${household.id}/meals/settlement`}>
          <Button variant="secondary" size="sm">
            Settlement
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Previous month"
        >
          <ChevronLeft />
        </button>
        <p className="font-medium text-ink">{label}</p>
        <button
          onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
          className="rounded-pill p-2 text-muted hover:bg-surface-muted"
          aria-label="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-36 border-b border-r border-border bg-surface-muted p-2 text-left font-medium text-ink">
                  Member
                </th>
                {days.map((day) => {
                  const date = dayOfMonthIso(cursor.year, cursor.month, day)
                  const isFuture = date > today
                  return (
                    <th key={day} className="min-w-10 border-b border-border bg-surface-muted p-1 text-center font-normal text-muted">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{day}</span>
                        {canEditOthers && !isFuture && (
                          <button
                            onClick={() => setBulkTarget({ date })}
                            aria-label={`Set count for everyone on day ${day}`}
                            className="rounded-pill p-0.5 text-muted hover:bg-surface hover:text-primary"
                          >
                            <UsersIcon width={12} height={12} />
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => (
                <tr key={member.userId}>
                  <td className="sticky left-0 z-10 border-r border-b border-border bg-surface p-2 font-medium text-ink">
                    <span className="block max-w-32 truncate">{member.name}</span>
                  </td>
                  {days.map((day) => {
                    const date = dayOfMonthIso(cursor.year, cursor.month, day)
                    const isFuture = date > today
                    const entry = entryMap.get(`${member.userId}|${date}`)
                    const editable = !isFuture && canEditCell(member.userId)
                    return (
                      <td key={day} className="border-b border-border p-0.5 text-center">
                        <button
                          disabled={!editable}
                          onClick={() => setCellTarget({ userId: member.userId, memberName: member.name, date })}
                          className={cn(
                            'h-9 w-9 rounded-md text-xs font-medium',
                            isFuture && 'text-border',
                            !isFuture && !entry && editable && 'text-muted hover:bg-surface-muted',
                            !isFuture && !entry && !editable && 'text-border',
                            entry && entry.count > 0 && 'bg-primary-soft text-primary',
                            entry && entry.count === 0 && 'bg-surface-muted text-muted',
                          )}
                        >
                          {!isFuture && entry ? entry.count : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted">
        Empty = no entry recorded. <span className="rounded-pill bg-surface-muted px-1.5 py-0.5">0</span> = explicitly excluded that day.
      </p>

      {cellTarget && (
        <MealCellSheet
          open
          title={`${cellTarget.memberName} · ${cellTarget.date}`}
          currentCount={entryMap.get(`${cellTarget.userId}|${cellTarget.date}`)?.count ?? null}
          hasEntry={entryMap.has(`${cellTarget.userId}|${cellTarget.date}`)}
          isSaving={false}
          onClose={() => setCellTarget(null)}
          onSet={async (count) => {
            await setCount(cellTarget.userId, cellTarget.date, count)
            setCellTarget(null)
          }}
          onClear={async () => {
            await clearEntry(cellTarget.userId, cellTarget.date)
            setCellTarget(null)
          }}
        />
      )}

      {bulkTarget && (
        <MealCellSheet
          open
          title={`Set count for everyone · ${bulkTarget.date}`}
          currentCount={null}
          hasEntry={false}
          isSaving={isBulkSaving}
          onClose={() => setBulkTarget(null)}
          onSet={handleBulkSet}
          onClear={() => setBulkTarget(null)}
        />
      )}
    </div>
  )
}
