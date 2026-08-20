/*
 * Theme state (dark theme + selector).
 *
 * Theme lives outside MockupState: it is a real user preference persisted
 * to localStorage, not mockup scenario state. `applyTheme` resolves the
 * preference ('system' via prefers-color-scheme) and stamps the result on
 * <html data-theme="…">, which src/styles/tokens.css keys its dark palette
 * block off. index.html runs a tiny inline equivalent before module load so
 * reloads in dark mode never flash light.
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']

export const STORAGE_KEY = 'konteks-theme'

const MEDIA_QUERY = '(prefers-color-scheme: dark)'

/** Resolve a preference to a concrete theme ('system' via matchMedia). */
export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') {
    return typeof window !== 'undefined' && window.matchMedia(MEDIA_QUERY).matches
      ? 'dark'
      : 'light'
  }
  return pref
}

/** Read the stored preference (default 'system'); never throws on storage errors. */
export function getStoredPreference(): ThemePreference {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
  } catch {
    return 'system'
  }
}

type ThemeListener = (pref: ThemePreference, resolved: ResolvedTheme) => void

const listeners = new Set<ThemeListener>()

/** Subscribe to preference changes (menu UI sync). Returns an unsubscribe fn. */
export function subscribeTheme(cb: ThemeListener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

let mediaListenerAttached = false

/** Re-apply the stored preference when the OS scheme flips (system mode only). */
function handleSystemChange() {
  if (getStoredPreference() === 'system') {
    applyTheme('system')
  }
}

/** Stamp the resolved theme on <html> and persist the preference. */
export function applyTheme(pref: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(pref)
  document.documentElement.dataset.theme = resolved
  try {
    window.localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // Storage may be unavailable (private mode) — the visual theme still applies.
  }
  for (const cb of listeners) cb(pref, resolved)
  return resolved
}

/** Apply the stored preference; wire the system-scheme listener once. */
export function initTheme(): void {
  applyTheme(getStoredPreference())
  if (!mediaListenerAttached) {
    mediaListenerAttached = true
    window.matchMedia(MEDIA_QUERY).addEventListener('change', handleSystemChange)
  }
}
