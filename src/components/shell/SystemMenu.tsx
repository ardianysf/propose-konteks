/*
 * SystemMenu — the system floating menu (Task 4 Part B, spec §6.2).
 *
 * An anchored .kx-menu that opens to the right of the sidebar's system
 * control (AC7/AC13): no modal backdrop, no header — the pinned "All
 * systems" scope row, a labeled search that filters through the store's
 * systems search slot, a scrolling list of system rows (inline neutral
 * icon + name + repository count, no avatar imagery — AC8), and a sticky
 * "Create new system" footer that dispatches the create-system overlay
 * (AC13). Selecting a system commits it to the store and closes the menu.
 */
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from './OverlayLifecycle'

/** Grid-of-four — the same neutral system glyph the sidebar control uses. */
function SystemIcon() {
  return (
    <svg
      data-icon="system"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.25" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="8.75" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="2.25" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
      <rect x="8.75" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
    </svg>
  )
}

/** Plus — marks the create affordance in the sticky footer (AC13). */
function PlusIcon() {
  return (
    <svg
      data-icon="plus"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3v10M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SystemMenu() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const query = state.search.systems.trim().toLowerCase()
  const visibleSystems = query
    ? state.systems.filter((system) => system.name.toLowerCase().includes(query))
    : state.systems

  return (
    <div role="menu" aria-label="Systems" className="kx-menu kx-system-menu">
      {/* Labeled search — filters through the store's systems search slot. */}
      <div className="kx-system-menu__search">
        <input
          type="search"
          className="kx-input kx-system-menu__search-input"
          aria-label="Search systems"
          placeholder="Search systems"
          value={state.search.systems}
          onChange={(event) =>
            dispatch({ type: 'SET_SEARCH', list: 'systems', value: event.target.value })
          }
        />
      </div>

      {/* Pinned scope row — presentational, survives every list state. */}
      <div className="kx-system-menu__all">
        <span className="kx-system-menu__all-icon" aria-hidden="true">
          <SystemIcon />
        </span>
        <span className="kx-system-menu__all-label">All systems</span>
      </div>

      {/* The only scrolling region — the footer never scrolls away. */}
      <div className="kx-system-menu__list">
        {visibleSystems.length === 0 ? (
          <p className="kx-system-menu__empty">No systems match your search.</p>
        ) : (
          visibleSystems.map((system) => {
            const active = system.id === state.activeSystemId
            const count = system.repoIds.length
            return (
              <button
                key={system.id}
                type="button"
                role="menuitem"
                className={
                  active ? 'kx-system-menu__item kx-system-menu__item--active' : 'kx-system-menu__item'
                }
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_SYSTEM', systemId: system.id })
                  dismissOverlay()
                }}
              >
                <span className="kx-system-menu__item-icon" aria-hidden="true">
                  <SystemIcon />
                </span>
                <span className="kx-system-menu__item-copy">
                  <span className="kx-system-menu__item-name">{system.name}</span>
                  <span className="kx-system-menu__item-count">
                    {count} {count === 1 ? 'repository' : 'repositories'}
                  </span>
                </span>
              </button>
            )
          })
        )}
      </div>

      {/* Sticky footer — always mounted, even when the list filters empty. */}
      <div className="kx-system-menu__footer">
        <button
          type="button"
          role="menuitem"
          className="kx-system-menu__create"
          onClick={() =>
            dispatch({
              type: 'OPEN_OVERLAY',
              overlay: { kind: 'create-system-modal', source: 'system-menu' },
            })
          }
        >
          <PlusIcon />
          <span className="kx-system-menu__create-label">Create new system</span>
        </button>
      </div>
    </div>
  )
}
