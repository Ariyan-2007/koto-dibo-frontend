import { api } from './client'
import type { AuthResponse } from './types'
import { getDeviceId, getDeviceName } from '@/lib/device'
import { getStoredRefreshToken } from '@/lib/auth/tokenStorage'

export function register(input: { name: string; email: string; password: string }) {
  return api.post<AuthResponse>('/auth/register', {
    ...input,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  })
}

export function login(input: { email: string; password: string }) {
  return api.post<AuthResponse>('/auth/login', {
    ...input,
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
  })
}

export async function logout(): Promise<void> {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) return
  await api.post<void>('/auth/logout', { refreshToken }).catch(() => undefined)
}

export function logoutAll() {
  return api.post<void>('/auth/logout-all')
}
