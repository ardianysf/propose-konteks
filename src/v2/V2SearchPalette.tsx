/*
 * V2SearchPalette — the ⌘K-style search component for /v2.
 *
 * Opened from the sidebar's brand-row search button or ⌘K/Ctrl+K.
 * One centered palette over a scrim: a borderless input, then grouped
 * results — recent sessions (activate: set the history search + navigate
 * to session-history) and systems (activate: set the active system).
 * Arrow keys move the active row; Enter activates it; Escape closes.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { RECENT_SESSIONS } from '../data/mockData'
import { useMockup } from '../state/MockupContext'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import { SearchIcon, SessionsIcon, SystemIcon } from './icons'

interface V2SearchPaletteProps {
  open: boolean
  onClose: () => void
}

type Result =
  | { kind: 'session'; id: string; title: string; meta: string }
  | { kind: 'system'; id: string; name: string; meta: string }

export default function V2SearchPalette({ open, onClose }: V2SearchPaletteProps) {
  const { state, dispatch } = useMockup()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useFocusContainment(rootRef)

  // Reset on open; focus the input.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      inputRef.current?.focus()
    }
  }, [open])

  // Escape closes (document-level, mirroring the popovers).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    const sessions: Result[] = RECENT_SESSIONS.filter((session) => {
      const system = state.systems.find((entry) => entry.id === session.systemId)
      const haystack = `${session.title} ${system?.name ?? ''}`.toLowerCase()
      return !q || haystack.includes(q)
    }).map((session) => ({
      kind: 'session' as const,
      id: session.id,
      title: session.title,
      meta: session.time,
    }))
    const systems: Result[] = state.systems
      .filter((system) => !q || system.name.toLowerCase().includes(q))
      .map((system) => ({
        kind: 'system' as const,
        id: system.id,
        name: system.name,
        meta: `${system.repoIds.length} ${system.repoIds.length === 1 ? 'repo' : 'repos'}`,
      }))
    return [...sessions, ...systems]
  }, [query, state.systems])

  useEffect(() => {
    setActiveIndex((index) => Math.min(index, Math.max(results.length - 1, 0)))
  }, [results.length])

  if (!open) return null

  const activate = (result: Result) => {
    if (result.kind === 'session') {
      // Hand the query to the history page's own search — the palette is a
      // launcher, the history list is the result surface.
      dispatch({ type: 'SET_SEARCH', list: 'sessions', value: result.title })
      dispatch({ type: 'NAVIGATE', route: 'session-history' })
    } else {
      dispatch({ type: 'SET_ACTIVE_SYSTEM', systemId: result.id })
    }
    onClose()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        results.length ? (index - 1 + results.length) % results.length : 0,
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const result = results[activeIndex]
      if (result) activate(result)
    }
  }

  const sessionResults = results.filter((result) => result.kind === 'session')
  const systemResults = results.filter((result) => result.kind === 'system')

  return (
    <div className="kx-v2-search" data-testid="v2-search-palette">
      <div className="kx-v2-search__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={rootRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="kx-v2-search__panel"
        onKeyDown={onKeyDown}
      >
        <div className="kx-v2-search__input-row">
          <span className="kx-v2-search__glyph" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            className="kx-v2-search__input"
            placeholder="Search sessions and systems…"
            aria-label="Search sessions and systems"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="kx-v2-search__results" role="listbox" aria-label="Results">
          {results.length === 0 && (
            <p className="kx-v2-search__empty">No matches for “{query.trim()}”.</p>
          )}
          {sessionResults.length > 0 && (
            <span className="kx-v2-search__label">Sessions</span>
          )}
          {sessionResults.map((result) => {
            const index = results.indexOf(result)
            return (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? 'kx-v2-search__row kx-v2-search__row--active'
                    : 'kx-v2-search__row'
                }
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => activate(result)}
              >
                <span className="kx-v2-search__row-icon" aria-hidden="true">
                  <SessionsIcon />
                </span>
                <span className="kx-v2-search__row-title">{result.title}</span>
                <span className="kx-v2-search__row-meta">{result.meta}</span>
              </button>
            )
          })}
          {systemResults.length > 0 && <span className="kx-v2-search__label">Systems</span>}
          {systemResults.map((result) => {
            const index = results.indexOf(result)
            return (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? 'kx-v2-search__row kx-v2-search__row--active'
                    : 'kx-v2-search__row'
                }
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => activate(result)}
              >
                <span className="kx-v2-search__row-icon" aria-hidden="true">
                  <SystemIcon />
                </span>
                <span className="kx-v2-search__row-title">{result.name}</span>
                <span className="kx-v2-search__row-meta">{result.meta}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
