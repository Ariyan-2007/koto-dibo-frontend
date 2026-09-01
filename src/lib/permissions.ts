import type { HouseholdRole } from '@/lib/api/types'

// Mirrors HouseholdRolePolicy server-side so the UI never offers an action the API would reject
// (MVP_FRONTEND_BLUEPRINT.md §0.4).

export function canAddEntry(role: HouseholdRole): boolean {
  return role === 'Owner' || role === 'Manager' || role === 'Member'
}

export function canEditEntry(role: HouseholdRole, ownerId: string, currentUserId: string): boolean {
  if (role === 'Owner' || role === 'Manager') return true
  if (role === 'Member') return ownerId === currentUserId
  return false
}

export function canRecordMealForOthers(role: HouseholdRole): boolean {
  return role === 'Owner' || role === 'Manager'
}

export function canAddBazarForOthers(role: HouseholdRole): boolean {
  return role === 'Owner' || role === 'Manager'
}

export function canManageHousehold(role: HouseholdRole): boolean {
  return role === 'Owner' || role === 'Manager'
}

export function canRemoveMember(actorRole: HouseholdRole, targetRole: HouseholdRole): boolean {
  if (targetRole === 'Owner') return false
  if (actorRole === 'Owner') return true
  if (actorRole === 'Manager') return targetRole !== 'Manager'
  return false
}

export function canChangeRole(actorRole: HouseholdRole, targetRole: HouseholdRole): boolean {
  return canRemoveMember(actorRole, targetRole)
}
