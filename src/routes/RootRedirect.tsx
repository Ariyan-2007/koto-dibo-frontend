import { Navigate } from 'react-router-dom'
import { useHouseholdStore } from '@/lib/household/householdStore'

export function RootRedirect() {
  const selectedHouseholdId = useHouseholdStore((s) => s.selectedHouseholdId)
  if (selectedHouseholdId) return <Navigate to={`/h/${selectedHouseholdId}`} replace />
  return <Navigate to="/households" replace />
}
