import { get, set, del } from 'idb-keyval'

// The refresh token must survive a PWA process kill/relaunch, so it lives in IndexedDB rather
// than memory or localStorage (per MVP_FRONTEND_BLUEPRINT.md §0.1 / §6).
const REFRESH_TOKEN_KEY = 'koto-dibo:refresh-token'

export function getStoredRefreshToken(): Promise<string | undefined> {
  return get(REFRESH_TOKEN_KEY)
}

export function setStoredRefreshToken(token: string): Promise<void> {
  return set(REFRESH_TOKEN_KEY, token)
}

export function clearStoredRefreshToken(): Promise<void> {
  return del(REFRESH_TOKEN_KEY)
}
