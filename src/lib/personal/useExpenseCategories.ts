import { useQuery } from '@tanstack/react-query'
import { listExpenseCategories } from '@/lib/api/expenseCategories'

/** Shared across every Phase 7 screen that needs the caller's category tree (system defaults +
 * their own) — one cached query instead of each form/list refetching independently. */
export function useExpenseCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['expenseCategories', includeInactive],
    queryFn: () => listExpenseCategories(includeInactive),
    staleTime: 5 * 60_000,
  })
}
