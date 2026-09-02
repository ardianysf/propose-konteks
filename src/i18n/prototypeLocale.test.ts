import {
  getLocalePreference,
  LOCALE_STORAGE_KEY,
  readPreference,
  resetPrototypeLocaleForTests,
  resolveLocale,
  setLocalePreference,
} from './prototypeLocale'

describe('prototype locale preference', () => {
  beforeEach(() => { localStorage.clear(); resetPrototypeLocaleForTests() })

  it('resolves Auto from the browser language', () => {
    expect(resolveLocale('auto', 'id-ID')).toBe('id')
    expect(resolveLocale('auto', 'en-US')).toBe('en')
  })

  it('persists explicit locale under the Konteks key', () => {
    setLocalePreference('id')
    expect(getLocalePreference()).toBe('id')
    expect(readPreference()).toBe('id')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('id')
    expect(document.documentElement.lang).toBe('id')
  })

  it('falls back to Auto for invalid stored data', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr')
    expect(readPreference()).toBe('auto')
  })
})
