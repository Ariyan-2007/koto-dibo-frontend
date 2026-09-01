import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useHouseholdContext } from '@/routes/HouseholdLayout'
import { listMembers } from '@/lib/api/households'
import { listMeals } from '@/lib/api/meals'
import { canAddEntry, canRecordMealForOthers } from '@/lib/permissions'
import { getMonthRange, dayOfMonthIso, todayIso } from '@/lib/format'
import { usePendingMealKeys } from '@/lib/offlineQueue'
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

/** Bangladesh's weekend is Friday–Saturday — shading it gives the desktop grid the visual
 * rhythm of a real spreadsheet instead of a flat wall of numbers. */
function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00`).getDay()
  return day === 5 || day === 6
}

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
function dayInitial(date: string): string {
  return DAY_INITIALS[new Date(`${date}T00:00:00`).getDay()]
}

function cellKey(userId: string, date: string): string {
  return `${userId}|${date}`
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
    for (const e of entries ?? []) map.set(cellKey(e.userId, e.date), { count: e.count, notes: e.notes })
    return map
  }, [entries])

  const pendingKeys = usePendingMealKeys(household.id)
  const { setCount, clearEntry } = useMealMutator(household.id, from, to)
  const [cellTarget, setCellTarget] = useState<CellTarget | null>(null)
  const [bulkTarget, setBulkTarget] = useState<BulkTarget | null>(null)
  const [isBulkSaving, setIsBulkSaving] = useState(false)
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set())

  const canEditOthers = canRecordMealForOthers(household.callerRole)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const memberList = members ?? []

  const canEditOwnCell = canAddEntry(household.callerRole)

  function canEditCell(userId: string) {
    return (userId === currentUserId && canEditOwnCell) || canEditOthers
  }

  function dateForDay(day: number) {
    return dayOfMonthIso(cursor.year, cursor.month, day)
  }

  function rowTotal(userId: string) {
    let total = 0
    for (const day of days) {
      total += entryMap.get(cellKey(userId, dateForDay(day)))?.count ?? 0
    }
    return total
  }

  function dayTotal(day: number) {
    const date = dateForDay(day)
    let total = 0
    for (const m of memberList) total += entryMap.get(cellKey(m.userId, date))?.count ?? 0
    return total
  }

  const grandTotal = useMemo(() => days.reduce((sum, day) => sum + dayTotal(day), 0), [days, memberList, entryMap])

  async function handleBulkSet(count: number) {
    if (!bulkTarget || !memberList.length) return
    setIsBulkSaving(true)
    try {
      await Promise.all(memberList.map((m) => setCount(m.userId, bulkTarget.date, count)))
    } finally {
      setIsBulkSaving(false)
      setBulkTarget(null)
    }
  }

  async function commitCell(userId: string, date: string, rawValue: string) {
    const key = cellKey(userId, date)
    const trimmed = rawValue.trim()
    const existing = entryMap.get(key)

    if (trimmed === '') {
      if (!existing) return
      setSavingKeys((s) => new Set(s).add(key))
      try {
        await clearEntry(userId, date)
      } finally {
        setSavingKeys((s) => {
          const next = new Set(s)
          next.delete(key)
          return next
        })
      }
      return
    }

    const value = Math.max(0, Number(trimmed))
    if (!Number.isFinite(value) || (existing && existing.count === value)) return

    setSavingKeys((s) => new Set(s).add(key))
    try {
      await setCount(userId, date, value)
    } finally {
      setSavingKeys((s) => {
        const next = new Set(s)
        next.delete(key)
        return next
      })
    }
  }

  // Excel-style arrow-key/Enter navigation across the desktop grid — see inputRefs below.
  const inputRefs = useRef(new Map<string, HTMLInputElement>())

  function focusCell(rowIndex: number, dayIndex: number) {
    if (rowIndex < 0 || rowIndex >= memberList.length || dayIndex < 0 || dayIndex >= days.length) return
    const key = cellKey(memberList[rowIndex].userId, dateForDay(days[dayIndex]))
    inputRefs.current.get(key)?.focus()
  }

  function handleGridKeyDown(e: KeyboardEvent<HTMLInputElement>, rowIndex: number, dayIndex: number) {
    const input = e.currentTarget
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        focusCell(rowIndex - 1, dayIndex)
        break
      case 'ArrowDown':
        e.preventDefault()
        focusCell(rowIndex + 1, dayIndex)
        break
      case 'ArrowLeft':
        if (input.selectionStart === 0) {
          e.preventDefault()
          focusCell(rowIndex, dayIndex - 1)
        }
        break
      case 'ArrowRight':
        if (input.selectionEnd === input.value.length) {
          e.preventDefault()
          focusCell(rowIndex, dayIndex + 1)
        }
        break
      case 'Enter':
        e.preventDefault()
        input.blur()
        focusCell(rowIndex + 1, dayIndex)
        break
      case 'Escape': {
        const userId = memberList[rowIndex].userId
        const date = dateForDay(days[dayIndex])
        const existing = entryMap.get(cellKey(userId, date))
        input.value = existing ? String(existing.count) : ''
        input.blur()
        break
      }
    }
  }

  const isLoading = membersLoading || entriesLoading

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Meal Grid</h1>
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
        <>
          {/* Mobile — tap a cell to open the quick-pick sheet (unchanged touch-first flow). */}
          <div className="overflow-x-auto rounded-lg border border-border md:hidden">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-36 border-b border-r border-border bg-surface-muted p-2 text-left font-medium text-ink">
                    Member
                  </th>
                  {days.map((day) => {
                    const date = dateForDay(day)
                    const isFuture = date > today
                    return (
                      <th key={day} className="min-w-10 border-b border-border bg-surface-muted p-1 text-center font-normal text-muted">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{day}</span>
                          <span className="text-[10px] uppercase leading-none text-muted/70">{dayInitial(date)}</span>
                          {canEditOthers && !isFuture && (
                            <button
                              onClick={() => setBulkTarget({ date })}
                              aria-label={`Set count for everyone on day ${day}`}
                              className="rounded-pill p-1 text-muted hover:bg-surface hover:text-primary"
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
                {memberList.map((member) => (
                  <tr key={member.userId}>
                    <td className="sticky left-0 z-10 border-r border-b border-border bg-surface p-2 font-medium text-ink">
                      <span className="block max-w-32 truncate">{member.name}</span>
                    </td>
                    {days.map((day) => {
                      const date = dateForDay(day)
                      const isFuture = date > today
                      const key = cellKey(member.userId, date)
                      const entry = entryMap.get(key)
                      const editable = !isFuture && canEditCell(member.userId)
                      const isPending = pendingKeys.has(key)
                      return (
                        <td key={day} className="relative border-b border-border p-0.5 text-center">
                          <button
                            disabled={!editable}
                            onClick={() => setCellTarget({ userId: member.userId, memberName: member.name, date })}
                            className={cn(
                              'h-10 w-10 rounded-md text-sm font-medium',
                              isFuture && 'text-border',
                              !isFuture && !entry && editable && 'text-muted hover:bg-surface-muted',
                              !isFuture && !entry && !editable && 'text-border',
                              entry && entry.count > 0 && 'bg-primary-soft text-primary',
                              entry && entry.count === 0 && 'bg-surface-muted text-muted',
                            )}
                          >
                            {!isFuture && entry ? entry.count : ''}
                          </button>
                          {isPending && (
                            <span
                              aria-label="Pending sync"
                              title="Saved on this device — will sync once you're back online"
                              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-pill bg-danger"
                            />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Desktop — type directly into a cell, just like a spreadsheet. */}
          <div className="hidden md:block">
            <p className="mb-2 text-xs text-muted">
              Click a cell and type a number. Press <span className="font-medium text-ink">Enter</span> to move down, use the arrow
              keys to move around, or clear a cell with <span className="font-medium text-ink">Delete</span> — just like a
              spreadsheet.
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-40 border-b border-r border-border bg-surface-muted p-2 text-left font-medium text-ink">
                      Member
                    </th>
                    {days.map((day) => {
                      const date = dateForDay(day)
                      const isFuture = date > today
                      const isToday = date === today
                      return (
                        <th
                          key={day}
                          className={cn(
                            'min-w-11 border-b border-border p-1 text-center font-normal text-muted',
                            isWeekend(date) ? 'bg-surface-muted/70' : 'bg-surface-muted',
                            isToday && 'bg-primary-soft text-primary font-semibold',
                          )}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span>{day}</span>
                            <span className={cn('text-[10px] uppercase leading-none', isToday ? 'text-primary' : 'text-muted/70')}>
                              {dayInitial(date)}
                            </span>
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
                    <th className="sticky right-0 z-20 min-w-16 border-b border-l-2 border-border bg-surface-muted p-2 text-center font-medium text-ink">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {memberList.map((member, rowIndex) => (
                    <tr key={member.userId}>
                      <td className="sticky left-0 z-10 border-r border-b border-border bg-surface p-2 font-medium text-ink">
                        <span className="block max-w-36 truncate">{member.name}</span>
                      </td>
                      {days.map((day, dayIndex) => {
                        const date = dateForDay(day)
                        const isFuture = date > today
                        const isToday = date === today
                        const key = cellKey(member.userId, date)
                        const entry = entryMap.get(key)
                        const editable = !isFuture && canEditCell(member.userId)
                        const isSaving = savingKeys.has(key)
                        const isPending = pendingKeys.has(key)

                        return (
                          <td
                            key={day}
                            className={cn(
                              'relative border-b border-border p-0',
                              isWeekend(date) && 'bg-surface-muted/30',
                              isToday && 'bg-primary-soft/20',
                            )}
                          >
                            {editable ? (
                              <input
                                key={`${key}|${entry?.count ?? 'e'}`}
                                ref={(el) => {
                                  if (el) inputRefs.current.set(key, el)
                                  else inputRefs.current.delete(key)
                                }}
                                type="number"
                                inputMode="decimal"
                                step="0.5"
                                min="0"
                                defaultValue={entry ? entry.count : ''}
                                disabled={isSaving}
                                onFocus={(e) => e.currentTarget.select()}
                                onBlur={(e) => void commitCell(member.userId, date, e.target.value)}
                                onKeyDown={(e) => handleGridKeyDown(e, rowIndex, dayIndex)}
                                aria-label={`${member.name}, day ${day}`}
                                className={cn(
                                  'h-11 w-11 [appearance:textfield] border-0 bg-transparent text-center text-sm font-medium text-ink tabular-nums',
                                  'focus:outline-none focus:bg-surface focus:shadow-focus focus:ring-2 focus:ring-primary',
                                  'disabled:opacity-50',
                                  '[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                                )}
                              />
                            ) : (
                              <div
                                className={cn(
                                  'flex h-11 w-11 items-center justify-center text-sm tabular-nums',
                                  isFuture ? 'text-border' : 'text-muted',
                                )}
                              >
                                {!isFuture && entry ? entry.count : ''}
                              </div>
                            )}
                            {isPending && (
                              <span
                                aria-label="Pending sync"
                                title="Saved on this device — will sync once you're back online"
                                className="absolute right-1 top-1 h-1.5 w-1.5 rounded-pill bg-danger"
                              />
                            )}
                          </td>
                        )
                      })}
                      <td className="sticky right-0 z-10 border-b border-l-2 border-border bg-surface p-2 text-center font-semibold text-ink tabular-nums">
                        {rowTotal(member.userId) || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="sticky left-0 z-10 border-r border-t-2 border-border bg-surface-muted p-2 font-medium text-ink">
                      Day Total
                    </td>
                    {days.map((day) => (
                      <td key={day} className="border-t-2 border-border bg-surface-muted p-2 text-center text-ink tabular-nums">
                        {dayTotal(day) || ''}
                      </td>
                    ))}
                    <td className="sticky right-0 z-10 border-l-2 border-t-2 border-border bg-surface-muted p-2 text-center font-semibold text-ink tabular-nums">
                      {grandTotal || ''}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-muted">
        Empty = no entry recorded. <span className="rounded-pill bg-surface-muted px-1.5 py-0.5">0</span> = explicitly excluded that
        day.
        {pendingKeys.size > 0 && (
          <>
            {' '}
            <span className="inline-block h-1.5 w-1.5 rounded-pill bg-danger align-middle" /> = saved on this device, syncing once
            you're back online.
          </>
        )}
      </p>

      {cellTarget && (
        <MealCellSheet
          open
          title={`${cellTarget.memberName} · ${cellTarget.date}`}
          currentCount={entryMap.get(cellKey(cellTarget.userId, cellTarget.date))?.count ?? null}
          hasEntry={entryMap.has(cellKey(cellTarget.userId, cellTarget.date))}
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
