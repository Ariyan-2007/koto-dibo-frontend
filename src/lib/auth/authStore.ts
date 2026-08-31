import { create } from 'zustand'
import type { AuthResponse } from '@/lib/api/types'
import { clearStoredRefreshToken, setStoredRefreshToken } from './tokenStorage'

interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthState {
  accessToken: string | null
  expiresAt: string | null
  user: AuthUser | null
  /** True until the app has attempted a silent refresh from the persisted refresh token. */
  isBootstrapping: boolean
  setSession: (auth: AuthResponse) => void
  clear: () => void
  finishBootstrapping: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: null,
  user: null,
  isBootstrapping: true,
  setSession: (auth) => {
    // Refresh tokens rotate on every use — always persist the new one, discard the old.
    void setStoredRefreshToken(auth.refreshToken)
    set({
      accessToken: auth.accessToken,
      expiresAt: auth.expiresAt,
      user: { id: auth.userId, name: auth.name, email: auth.email },
      isBootstrapping: false,
    })
  },
  clear: () => {
    void clearStoredRefreshToken()
    set({ accessToken: null, expiresAt: null, user: null, isBootstrapping: false })
  },
  finishBootstrapping: () => set({ isBootstrapping: false }),
}))

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}
