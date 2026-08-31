import type { ApiErrorEnvelope, AuthResponse } from './types'
import { getAccessToken, useAuthStore } from '@/lib/auth/authStore'
import { getStoredRefreshToken } from '@/lib/auth/tokenStorage'

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]> | null

  constructor(envelope: ApiErrorEnvelope) {
    super(envelope.title)
    this.name = 'ApiError'
    this.status = envelope.status
    this.errors = envelope.errors
  }

  /** Validation errors come back keyed PascalCase (e.g. "Amount") even though bodies are camelCase. */
  fieldError(field: string): string | undefined {
    if (!this.errors) return undefined
    const pascal = field.charAt(0).toUpperCase() + field.slice(1)
    return this.errors[pascal]?.[0] ?? this.errors[field]?.[0]
  }
}

// A 401 must trigger a single-flight silent refresh — concurrent 401s queue behind one
// in-flight refresh call rather than firing N parallel refreshes (§0.1).
let refreshPromise: Promise<string | null> | null = null

async function performRefresh(): Promise<string | null> {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) {
    useAuthStore.getState().clear()
    return null
  }
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      // Reuse/expiry triggers backend-side family revocation — treat any failure as full logout.
      useAuthStore.getState().clear()
      return null
    }
    const auth = (await res.json()) as AuthResponse
    useAuthStore.getState().setSession(auth)
    return auth.accessToken
  } catch {
    useAuthStore.getState().clear()
    return null
  }
}

function refreshSession(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/** Called once at app bootstrap to silently restore a session from the persisted refresh token. */
export async function bootstrapSession(): Promise<void> {
  const refreshToken = await getStoredRefreshToken()
  if (!refreshToken) {
    useAuthStore.getState().finishBootstrapping()
    return
  }
  await refreshSession()
}

interface RequestOptions {
  method?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE}${path}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function rawRequest(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const url = buildUrl(path, options.query)
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

async function toApiError(res: Response): Promise<ApiError> {
  try {
    const envelope = (await res.json()) as ApiErrorEnvelope
    return new ApiError(envelope)
  } catch {
    return new ApiError({ status: res.status, title: res.statusText || 'Request failed', errors: null })
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isAuthEndpoint = path.startsWith('/auth/')
  let token = getAccessToken()
  let res = await rawRequest(path, options, token)

  if (res.status === 401 && !isAuthEndpoint) {
    token = await refreshSession()
    if (token) {
      res = await rawRequest(path, options, token)
    }
  }

  if (!res.ok) {
    throw await toApiError(res)
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => apiRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
}
