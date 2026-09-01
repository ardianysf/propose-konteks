/*
 * SessionHistoryPage — the dedicated Session History route (Task 11, spec §13).
 *
 * Header + labelled filters (search / mode / system) above a flat,
 * newest-first list sourced from SESSION_HISTORY. Each row keeps the
 * title first, the Mode · System · Component metadata below it, and the
 * relative time in its own next column; a hover-only inline three-dot
 * action reveals a local action menu on row hover or keyboard focus.
 * The list region swaps between the ready rows, the demo loading
 * skeleton, the demo empty state, and the designed no-results state
 * (AC43). No fetch, no emoji, fully semantic.
 */
import { useEffect, useRef, useState } from 'react'
import { ILLUSTRATIVE_DATA_NOTE, SESSION_HISTORY, type SessionMode } from '../data/mockData'
import { ATTENDANCE_REVIEW_HISTORY_ID } from '../components/session/stream/attendanceReviewStory'
import { useMockup } from '../state/MockupContext'
import type { MockupAction } from '../state/mockupReducer'
import './SessionHistoryPage.css'

const MODE_LABELS: Record<SessionMode, string> = {
  engineering: 'Engineering',
  qa: 'QA',
  planning: 'Planning',
}

const MENU_ITEMS = ['Open session', 'Rename', 'Delete session'] as const

type ModeFilter = 'all' | SessionMode

/** Three-dot — inline SVG, no emoji. */
function MoreIcon() {
  return (
    <svg
      data-icon="more"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
    </svg>
  )
}

export default function SessionHistoryPage() {
  const { state, dispatch } = useMockup()
  const [query, setQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all')
  const [systemFilter, setSystemFilter] = useState('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Escape handling lives at the document level while a menu is open so it
  // works regardless of whether focus is still on the trigger or has moved
  // to a menu item. Close the open menu and hand focus back to its trigger.
  useEffect(() => {
    if (openMenuId === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpenMenuId(null)
        triggerRefs.current[openMenuId]?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openMenuId])

  const systems = state.systems
  const q = query.trim().toLowerCase()

  // Newest first — sort defensively so the page never depends on the
  // source array's incidental order.
  const visibleSessions =
    state.demoVariant === 'ready'
      ? [...SESSION_HISTORY]
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .filter((entry) => {
            if (modeFilter !== 'all' && entry.mode !== modeFilter) return false
            if (systemFilter !== 'all' && entry.systemId !== systemFilter) return false
            if (!q) return true
            const system = systems.find((candidate) => candidate.id === entry.systemId)
            const haystack = [
              entry.title,
              MODE_LABELS[entry.mode],
              system ? system.name : entry.systemId,
              entry.componentName,
            ]
              .join(' ')
              .toLowerCase()
            return haystack.includes(q)
          })
      : []

  const clearFilters = () => {
    setQuery('')
    setModeFilter('all')
    setSystemFilter('all')
  }

  return (
    <section className="kx-history" aria-label="Session history">
      <header className="kx-history__head">
        <div className="kx-history__title-row">
          <h1 className="kx-history__title">Session history</h1>
          {/* Discrete entry point to the response-stream demo route. */}
          <button
            type="button"
            className="kx-history__demo-link"
            onClick={() => dispatch({ type: 'NAVIGATE', route: 'session-demo' })}
          >
            Response flow demo
          </button>
        </div>
        <div className="kx-history__filters" role="search" aria-label="Filter sessions">
          <label className="kx-history__field">
            <span className="kx-history__field-label">Search sessions</span>
            <input
              type="search"
              className="kx-input kx-history__search"
              placeholder="Search title or metadata"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="kx-history__field">
            <span className="kx-history__field-label">Mode</span>
            <select
              className="kx-input kx-history__select"
              value={modeFilter}
              onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
            >
              <option value="all">All modes</option>
              <option value="engineering">Engineering</option>
              <option value="qa">QA</option>
              <option value="planning">Planning</option>
            </select>
          </label>
          <label className="kx-history__field">
            <span className="kx-history__field-label">System</span>
            <select
              className="kx-input kx-history__select"
              value={systemFilter}
              onChange={(event) => setSystemFilter(event.target.value)}
            >
              <option value="all">All systems</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="kx-history__body">
        {state.demoVariant === 'loading' ? (
          <div className="kx-history__loading" data-testid="history-loading" aria-label="Loading sessions">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="kx-history__skeleton" />
            ))}
          </div>
        ) : state.demoVariant === 'empty' ? (
          <div className="kx-history__empty" data-testid="history-empty">
            <p className="kx-history__empty-title">No sessions yet</p>
            <p className="kx-history__empty-hint">Sessions you run will appear here.</p>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="kx-history__empty kx-history__empty--no-results" data-testid="history-no-results">
            <p className="kx-history__empty-title">No sessions match your filters</p>
            <p className="kx-history__empty-hint">Try a different search or clear the filters.</p>
            <div className="kx-history__empty-actions">
              <button
                type="button"
                className="kx-history__open"
                disabled
                aria-describedby="kx-history-no-results-note"
              >
                Open session
              </button>
              <button type="button" className="kx-history__clear" onClick={clearFilters}>
                Clear filters
              </button>
              <span id="kx-history-no-results-note" className="kx-visually-hidden">
                No matching session to open.
              </span>
            </div>
          </div>
        ) : (
          <ul className="kx-history__list" aria-label="Session history">
            {visibleSessions.map((entry) => {
              const system = systems.find((candidate) => candidate.id === entry.systemId)
              const open = openMenuId === entry.id
              return (
                <li key={entry.id} className="kx-history__row" data-testid={`history-row-${entry.id}`}>
                  <button
                    type="button"
                    className="kx-history__row-button"
                    data-testid="history-row"
                    onClick={() => {
                      // The attendance-review entry opens its stream-variant
                      // detail page; every other session stays classic.
                      dispatch({
                        type: 'NAVIGATE',
                        route:
                          entry.id === ATTENDANCE_REVIEW_HISTORY_ID
                            ? 'session-stream-detail'
                            : 'session-detail',
                      } as MockupAction)
                    }}
                  >
                    <div className="kx-history__row-main">
                      <span className="kx-history__row-title">{entry.title}</span>
                      <span className="kx-history__row-meta">
                        {MODE_LABELS[entry.mode]} · {system ? system.name : entry.systemId} · {entry.componentName}
                      </span>
                    </div>
                    <span className="kx-history__row-time">{entry.time}</span>
                  </button>
                  <div className="kx-history__row-actions">
                    <button
                      ref={(element) => {
                        triggerRefs.current[entry.id] = element
                      }}
                      type="button"
                      className="kx-history__action"
                      aria-haspopup="menu"
                      aria-expanded={open}
                      aria-label={`Actions for ${entry.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenMenuId(open ? null : entry.id)
                      }}
                    >
                      <MoreIcon />
                    </button>
                    {open && (
                      <div
                        className="kx-history__menu"
                        role="menu"
                        aria-label={`Actions for ${entry.title}`}
                      >
                        {MENU_ITEMS.map((label) => (
                          <button
                            key={label}
                            type="button"
                            role="menuitem"
                            className="kx-history__menuitem"
                            onClick={() => setOpenMenuId(null)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* AC46 — the single visible illustrative-data marker for this page. */}
      <p className="kx-illustrative-note" data-testid="illustrative-data-note">
        {ILLUSTRATIVE_DATA_NOTE}
      </p>
    </section>
  )
}
