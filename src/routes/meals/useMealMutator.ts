import { useQueryClient } from '@tanstack/react-query'
import { clearMealEntry, setMealCount } from '@/lib/api/meals'
import { enqueueMealMutation } from '@/lib/offlineQueue'
import { ApiError } from '@/lib/api/client'
import type { DailyMealEntryDto } from '@/lib/api/types'
import { toast } from '@/lib/toast'

/**
 * Optimistically writes a meal-grid cell, then reconciles online or queues offline. The endpoint
 * is a pure upsert keyed by (household, date, userId), so an optimistic write can never conflict —
 * it's either confirmed by the server or replayed later by the offline queue (§6).
 */
export function useMealMutator(householdId: string, from: string, to: string) {
  const queryClient = useQueryClient()
  const queryKey = ['meals', householdId, from, to]

  function applyOptimistic(entry: DailyMealEntryDto | null, userId: string, date: string) {
    queryClient.setQueryData<DailyMealEntryDto[]>(queryKey, (old) => {
      const rest = (old ?? []).filter((e) => !(e.userId === userId && e.date === date))
      return entry ? [...rest, entry] : rest
    })
  }

  function invalidateDerived() {
    queryClient.invalidateQueries({ queryKey: ['mealRate', householdId] })
    queryClient.invalidateQueries({ queryKey: ['settlement', householdId] })
  }

  async function setCount(userId: string, date: string, count: number, notes?: string) {
    const optimistic: DailyMealEntryDto = {
      id: `optimistic-${userId}-${date}`,
      householdId,
      userId,
      date,
      count,
      notes: notes ?? null,
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    applyOptimistic(optimistic, userId, date)

    if (!navigator.onLine) {
      await enqueueMealMutation({ kind: 'set', householdId, date, userId, count, notes })
      invalidateDerived()
      return
    }
    try {
      const saved = await setMealCount(householdId, date, userId, { count, notes })
      applyOptimistic(saved, userId, date)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
        queryClient.invalidateQueries({ queryKey })
      } else {
        await enqueueMealMutation({ kind: 'set', householdId, date, userId, count, notes })
      }
    }
    invalidateDerived()
  }

  async function clearEntry(userId: string, date: string) {
    applyOptimistic(null, userId, date)

    if (!navigator.onLine) {
      await enqueueMealMutation({ kind: 'clear', householdId, date, userId })
      invalidateDerived()
      return
    }
    try {
      await clearMealEntry(householdId, date, userId)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
        queryClient.invalidateQueries({ queryKey })
      } else {
        await enqueueMealMutation({ kind: 'clear', householdId, date, userId })
      }
    }
    invalidateDerived()
  }

  return { setCount, clearEntry }
}
