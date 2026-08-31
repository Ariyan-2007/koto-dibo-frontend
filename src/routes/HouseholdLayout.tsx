import { useEffect } from 'react'
import { Navigate, Outlet, useOutletContext, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHousehold } from '@/lib/api/households'
import { useHouseholdStore } from '@/lib/household/householdStore'
import { useAuthStore } from '@/lib/auth/authStore'
import { AppShell } from '@/components/layout/AppShell'
import type { HouseholdDto } from '@/lib/api/types'

interface HouseholdContext {
  household: HouseholdDto
  currentUserId: string
}

export function useHouseholdContext() {
  return useOutletContext<HouseholdContext>()
}

export function HouseholdLayout() {
  const { householdId } = useParams<{ householdId: string }>()
  const selectHousehold = useHouseholdStore((s) => s.selectHousehold)
  const currentUserId = useAuthStore((s) => s.user?.id ?? '')

  const { data: household, isLoading, isError } = useQuery({
    queryKey: ['household', householdId],
    queryFn: () => getHousehold(householdId!),
    enabled: !!householdId,
  })

  useEffect(() => {
    if (household) selectHousehold(household)
  }, [household, selectHousehold])

  if (!householdId) return <Navigate to="/households" replace />

  if (isError) {
    // 404 covers both "doesn't exist" and "not a member" — either way, back to the switcher.
    return <Navigate to="/households" replace />
  }

  if (isLoading || !household) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AppShell household={household}>
      <Outlet context={{ household, currentUserId } satisfies HouseholdContext} />
    </AppShell>
  )
}
