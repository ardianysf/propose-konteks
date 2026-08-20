/*
 * Theme runtime contract (src/theme.ts) — the persisted preference,
 * 'system' resolution via prefers-color-scheme, the <html data-theme>
 * stamp, and the subscriber/matchMedia listener lifecycle.
 *
 * jsdom lacks window.matchMedia, so this file installs ONE shared stub
 * MediaQueryList for the whole file (setup.ts only registers jest-dom
 * matchers — no global matchMedia stub exists). A single shared MQL is
 * required because initTheme() wires its module-level change listener
 * exactly once and never unwires it: per-test stubs would leave the
 * listener bound to a discarded MQL. The stub exposes setMatches()
 * (silent) and emitChange() (notifies listeners) so each test controls
 * the OS scheme explicitly. localStorage and <html data-theme> are reset
 * per test so nothing leaks between tests or out of this file.
 */
import {
  applyTheme,
  getStoredPreference,
  initTheme,
  resolveTheme,
  STORAGE_KEY,
  subscribeTheme,
  type ThemePreference,
} from './theme'

// ---------------------------------------------------------------------------
// Shared matchMedia stub
// ---------------------------------------------------------------------------

type ChangeHandler = (event: { matches: boolean }) => void

interface StubMediaQueryList extends MediaQueryList {
  /** Set the OS scheme without notifying listeners. */
  setMatches(matches: boolean): void
  /** Fire a prefers-color-scheme change at all attached listeners. */
  emitChange(matches: boolean): void
}

function createMatchMediaStub() {
  let matches = false
  const listeners = new Set<ChangeHandler>()

  const mql: Partial<StubMediaQueryList> = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, handler: unknown) => {
      listeners.add(handler as ChangeHandler)
    },
    removeEventListener: (_type: string, handler: unknown) => {
      listeners.delete(handler as ChangeHandler)
    },
    // Legacy API surface some code paths still use.
    addListener: (handler: unknown) => listeners.add(handler as ChangeHandler),
    removeListener: (handler: unknown) => listeners.delete(handler as ChangeHandler),
    setMatches: (next: boolean) => {
      matches = next
    },
    emitChange: (next: boolean) => {
      matches = next
      for (const handler of [...listeners]) handler({ matches: next })
    },
  }

  const stub = vi.fn(() => mql as MediaQueryList)
  return { mql: mql as StubMediaQueryList, stub, listeners }
}

const media = createMatchMediaStub()
const realMatchMedia = window.matchMedia

beforeAll(() => {
  window.matchMedia = media.stub as unknown as typeof window.matchMedia
})

afterAll(() => {
  window.matchMedia = realMatchMedia
})

beforeEach(() => {
  media.mql.setMatches(false)
})

afterEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// getStoredPreference
// ---------------------------------------------------------------------------

describe('getStoredPreference', () => {
  it("returns 'system' when localStorage is empty", () => {
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(getStoredPreference()).toBe('system')
  })

  it.each<ThemePreference>(['light', 'dark', 'system'])(
    "returns the stored valid value '%s'",
    (pref) => {
      window.localStorage.setItem(STORAGE_KEY, pref)
      expect(getStoredPreference()).toBe(pref)
    },
  )

  it.each(['invalid', 'DARK', '', 'auto', '0'])(
    "falls back to 'system' for the invalid stored value %j",
    (raw) => {
      window.localStorage.setItem(STORAGE_KEY, raw)
      expect(getStoredPreference()).toBe('system')
    },
  )

  it('never throws when localStorage access throws (quota/security errors)', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    expect(() => getStoredPreference()).not.toThrow()
    expect(getStoredPreference()).toBe('system')
    expect(getItem).toHaveBeenCalledWith(STORAGE_KEY)
  })
})

// ---------------------------------------------------------------------------
// resolveTheme
// ---------------------------------------------------------------------------

describe('resolveTheme', () => {
  it("resolves 'dark' and 'light' to themselves regardless of the OS scheme", () => {
    media.mql.setMatches(true)
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')

    media.mql.setMatches(false)
    expect(resolveTheme('dark')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
  })

  it('resolves system to dark when (prefers-color-scheme: dark) matches', () => {
    media.mql.setMatches(true)
    expect(resolveTheme('system')).toBe('dark')
  })

  it('resolves system to light when (prefers-color-scheme: dark) does not match', () => {
    media.mql.setMatches(false)
    expect(resolveTheme('system')).toBe('light')
  })
})

// ---------------------------------------------------------------------------
// applyTheme
// ---------------------------------------------------------------------------

describe('applyTheme', () => {
  it('stamps the RESOLVED theme on <html data-theme> and persists the RAW preference', () => {
    media.mql.setMatches(true)
    const resolved = applyTheme('system')
    expect(resolved).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    // The raw preference — not the resolved value — is what persists.
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('system')
  })

  it('stamps and persists explicit preferences verbatim', () => {
    media.mql.setMatches(true)
    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('light')

    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark')
  })

  it('still applies the visual theme when persistence throws (private mode)', () => {
    media.mql.setMatches(true)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    expect(() => applyTheme('dark')).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// initTheme
// ---------------------------------------------------------------------------

describe('initTheme', () => {
  it('applies the stored preference on init', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it("applies 'system' resolved against the current OS scheme on init", () => {
    media.mql.setMatches(true)
    window.localStorage.setItem(STORAGE_KEY, 'system')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('re-applies the resolved theme when the OS scheme flips in system mode', () => {
    window.localStorage.setItem(STORAGE_KEY, 'system')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('light')

    media.mql.emitChange(true)
    expect(document.documentElement.dataset.theme).toBe('dark')

    media.mql.emitChange(false)
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('ignores OS scheme flips when an explicit preference is stored', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark')
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')

    media.mql.emitChange(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('does not stack duplicate matchMedia listeners across repeated initTheme calls', () => {
    window.localStorage.setItem(STORAGE_KEY, 'system')
    initTheme()
    initTheme()
    initTheme()

    // Exactly one change listener is ever attached to the media query list,
    // no matter how many times initTheme runs.
    expect(media.listeners.size).toBe(1)

    // A scheme flip therefore re-applies the theme exactly once.
    const applySpy = vi.fn()
    const unsubscribe = subscribeTheme(applySpy)
    applySpy.mockClear()
    media.mql.emitChange(true)
    expect(applySpy).toHaveBeenCalledTimes(1)
    expect(applySpy).toHaveBeenCalledWith('system', 'dark')
    unsubscribe()
  })
})

// ---------------------------------------------------------------------------
// subscribeTheme
// ---------------------------------------------------------------------------

describe('subscribeTheme', () => {
  it('notifies subscribers with (pref, resolved) on every applyTheme', () => {
    media.mql.setMatches(true)
    const cb = vi.fn()
    const unsubscribe = subscribeTheme(cb)

    applyTheme('system')
    expect(cb).toHaveBeenCalledWith('system', 'dark')

    applyTheme('light')
    expect(cb).toHaveBeenCalledWith('light', 'light')
    expect(cb).toHaveBeenCalledTimes(2)

    unsubscribe()
  })

  it('stops notifying after unsubscribe', () => {
    const cb = vi.fn()
    const unsubscribe = subscribeTheme(cb)

    applyTheme('dark')
    expect(cb).toHaveBeenCalledTimes(1)

    unsubscribe()
    applyTheme('light')
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
