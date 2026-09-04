import { api } from './client'
import type { AcceptInviteResultDto, HouseholdInviteDto, HouseholdRole, InvitePreviewDto } from './types'

export function createInvite(
  householdId: string,
  input: { email?: string; role: HouseholdRole; expiresInHours?: number },
) {
  const baseUrl = `${window.location.origin}/invites`
  return api.post<HouseholdInviteDto>(`/households/${householdId}/invites`, { ...input, baseUrl })
}

export function listInvites(householdId: string) {
  return api.get<HouseholdInviteDto[]>(`/households/${householdId}/invites`)
}

export function revokeInvite(householdId: string, inviteId: string) {
  return api.post<void>(`/households/${householdId}/invites/${inviteId}/revoke`)
}

export function previewInvite(code: string) {
  return api.get<InvitePreviewDto>(`/invites/${code}`)
}

export function acceptInvite(code: string) {
  return api.post<AcceptInviteResultDto>(`/invites/${code}/accept`)
}
