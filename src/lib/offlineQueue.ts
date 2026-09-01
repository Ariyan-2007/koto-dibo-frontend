import { useMemo } from 'react'
import { get, set } from 'idb-keyval'
import { create } from 'zustand'
import { ApiError } from '@/lib/api/client'
import { clearMealEntry, setMealCount } from '@/lib/api/meals'

// Offline queue for PUT/DELETE .../meals/{date}/{userId} — the highest-value offline path per
// MVP_FRONTEND_BLUEPRINT.md §6. The endpoint is a pure upsert keyed by (household, date, userId),
// so replaying queued mutations in order is naturally last-write-wins with no conflict resolution.

type MealMutation =
  | { id: string; kind: 'set'; householdId: string; date: string; userId: string; count: number; notes?: string }
  | { id: string; kind: 'clear'; householdId: string; date: string; userId: string }

// Plain Omit collapses a union to its shared keys, dropping variant-specific fields (count, notes).
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never

const QUEUE_KEY = 'koto-dibo:meal-mutation-queue'

interface OfflineQueueState {
  pendingCount: number
  isReplaying: boolean
  queue: MealMutation[]
  setPendingCount: (count: number) => void
  setReplaying: (replaying: boolean) => void
  setQueue: (queue: MealMutation[]) => void
}

export const useOfflineQueueStore = create<OfflineQueueState>((set) => ({
  pendingCount: 0,
  isReplaying: false,
  queue: [],
  setPendingCount: (count) => set({ pendingCount: count }),
  setReplaying: (isReplaying) => set({ isReplaying }),
  setQueue: (queue) => set({ queue }),
}))

async function getQueue(): Promise<MealMutation[]> {
  return (await get(QUEUE_KEY)) ?? []
}

async function saveQueue(queue: MealMutation[]): Promise<void> {
  await set(QUEUE_KEY, queue)
  useOfflineQueueStore.getState().setPendingCount(queue.length)
  useOfflineQueueStore.getState().setQueue(queue)
}

/** Which meal-grid cells (keyed `userId|date`) have a queued-but-unconfirmed write for this
 * household — lets the grid show a per-cell "pending sync" dot alongside the global OfflineBadge. */
export function usePendingMealKeys(householdId: string): Set<string> {
  const queue = useOfflineQueueStore((s) => s.queue)
  return useMemo(() => {
    const keys = new Set<string>()
    for (const m of queue) {
      if (m.householdId === householdId) keys.add(`${m.userId}|${m.date}`)
    }
    return keys
  }, [queue, householdId])
}

export async function enqueueMealMutation(mutation: DistributiveOmit<MealMutation, 'id'>): Promise<void> {
  const queue = await getQueue()
  queue.push({ ...mutation, id: crypto.randomUUID() } as MealMutation)
  await saveQueue(queue)
  if (navigator.onLine) void replayMealQueue()
}

export async function initOfflineQueue(): Promise<void> {
  const queue = await getQueue()
  useOfflineQueueStore.getState().setPendingCount(queue.length)
  useOfflineQueueStore.getState().setQueue(queue)
  window.addEventListener('online', () => void replayMealQueue())
  if (navigator.onLine) void replayMealQueue()
}

let isReplayingNow = false

export async function replayMealQueue(): Promise<void> {
  if (isReplayingNow) return
  isReplayingNow = true
  useOfflineQueueStore.getState().setReplaying(true)
  try {
    let queue = await getQueue()
    while (queue.length > 0) {
      const mutation = queue[0]
      try {
        if (mutation.kind === 'set') {
          await setMealCount(mutation.householdId, mutation.date, mutation.userId, {
            count: mutation.count,
            notes: mutation.notes,
          })
        } else {
          await clearMealEntry(mutation.householdId, mutation.date, mutation.userId)
        }
      } catch (err) {
        if (!(err instanceof ApiError)) {
          // Network failure — still offline (or backend unreachable). Stop and retry later.
          break
        }
        // A rejected request (e.g. validation) can never succeed on retry — drop it and move on.
      }
      queue = queue.slice(1)
      await saveQueue(queue)
    }
  } finally {
    isReplayingNow = false
    useOfflineQueueStore.getState().setReplaying(false)
  }
}
