import { api } from './client'
import type { HouseholdDto, HouseholdMemberDto, HouseholdRole } from './types'

export function listHouseholds() {
  return api.get<HouseholdDto[]>('/households')
}

export function getHousehold(id: string) {
  return api.get<HouseholdDto>(`/households/${id}`)
}

export function createHousehold(input: { name: string; description?: string; type?: string }) {
  return api.post<HouseholdDto>('/households', input)
}

export function updateHousehold(id: string, input: { name?: string; description?: string; type?: string }) {
  return api.patch<HouseholdDto>(`/households/${id}`, input)
}

export function archiveHousehold(id: string) {
  return api.post<HouseholdDto>(`/households/${id}/archive`)
}

export function restoreHousehold(id: string) {
  return api.post<HouseholdDto>(`/households/${id}/restore`)
}

export function listMembers(householdId: string) {
  return api.get<HouseholdMemberDto[]>(`/households/${householdId}/members`)
}

export function addMember(householdId: string, input: { email: string; role: HouseholdRole }) {
  return api.post<HouseholdMemberDto>(`/households/${householdId}/members`, input)
}

export function removeMember(householdId: string, userId: string) {
  return api.delete<void>(`/households/${householdId}/members/${userId}`)
}

export function changeMemberRole(householdId: string, userId: string, role: HouseholdRole) {
  return api.patch<HouseholdMemberDto>(`/households/${householdId}/members/${userId}/role`, { role })
}

export function leaveHousehold(householdId: string) {
  return api.post<void>(`/households/${householdId}/leave`)
}
