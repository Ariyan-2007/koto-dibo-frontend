import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'koto-dibo:theme'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getStoredMode(): ThemeMode {
  const stored = localStorage.getItem(THEME_KEY)
  return isThemeMode(stored) ? stored : 'system'
}

const darkMedia = window.matchMedia('(prefers-color-scheme: dark)')

function isEffectivelyDark(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && darkMedia.matches)
}

/** Mobile browser chrome / PWA status bar color — unlike the CSS custom properties, this can't
 * react to a media query on its own, so it's kept in sync from JS instead. */
function applyThemeColorMeta(mode: ThemeMode) {
  document.getElementById('theme-color-meta')?.setAttribute('content', isEffectivelyDark(mode) ? '#0d1117' : '#faf9f5')
}

/** 'system' removes the override entirely so the `prefers-color-scheme` media query in index.css
 * keeps following the OS live, including a change while the app is open — no listener needed for
 * the CSS side; the theme-color meta tag still needs one, registered once below. */
function applyTheme(mode: ThemeMode) {
  if (mode === 'system') {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = mode
  }
  applyThemeColorMeta(mode)
}

interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: getStoredMode(),
  setMode: (mode) => {
    localStorage.setItem(THEME_KEY, mode)
    applyTheme(mode)
    set({ mode })
  },
}))

/** Called once at app bootstrap, before first paint, to avoid a flash of the wrong theme. */
export function bootstrapTheme(): void {
  applyTheme(getStoredMode())
  darkMedia.addEventListener('change', () => {
    if (useThemeStore.getState().mode === 'system') applyThemeColorMeta('system')
  })
}
