/*
 * V2ContextPopover — ONE calm panel replacing the old workspace + system
 * menus: a workspace identity row, a locally-searchable system list, and
 * a sticky create-system action. Mounted at V2Sidebar's root; the parent
 * owns the open state, the panel owns Escape, scrim dismissal, and focus
 * containment. Desktop ≥761px: anchored panel right of the sidebar (left
 * 76px in rail mode). ≤760px: full-width bottom sheet above the drawer.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { WORKSPACE } from '../data/mockData'
import { useMockup } from '../state/MockupContext'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import { PlusIcon, SystemIcon, SystemMapIcon } from './icons'

interface V2ContextPopoverProps {
  open: boolean
  onClose: () => void
}

export default function V2ContextPopover({ open, onClose }: V2ContextPopoverProps) {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  // Focus is contained inside the panel while it is mounted (no-op when
  // closed: the hook skips an unconnected root).
  useFocusContainment(rootRef)

  // Escape closes — document-level so it works wherever focus sits.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
  const needle = query.trim().toLowerCase()
  const systems = needle
    ? state.systems.filter((system) => system.name.toLowerCase().includes(needle))
    : state.systems

  const openOverlayAndClose = (
    event: MouseEvent<HTMLElement>,
    overlay:
      | { kind: 'create-system-modal'; source: 'system-menu' }
      | { kind: 'system-map'; systemId: string },
  ) => {
    beginOverlayChain(event.currentTarget)
    dispatch({ type: 'OPEN_OVERLAY', overlay })
    onClose()
  }

  const selectSystem = (systemId: string) => {
    dispatch({ type: 'SET_ACTIVE_SYSTEM', systemId })
    onClose()
  }

  return (
    <div
      className={state.sidebarCollapsed ? 'kx-v2-pop kx-v2-pop--rail' : 'kx-v2-pop'}
      data-testid="v2-context-popover"
    >
      {/* Scrim — transparent click-catcher on desktop; ink tint on mobile. */}
      <div className="kx-v2-pop__scrim" aria-hidden="true" onClick={onClose} />
      <div
        ref={rootRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Workspace and systems"
        className="kx-v2-pop__panel"
      >
        <span className="kx-v2-pop__handle" aria-hidden="true" />

        <p className="kx-v2-pop__label" id="kx-v2-pop-workspace-label">
          Workspace
        </p>
        <button
          type="button"
          className="kx-v2-pop__workspace kx-v2-pop__workspace--selected"
          data-testid="v2-popover-workspace"
          onClick={onClose}
        >
          <span className="kx-v2-pop__workspace-name">{WORKSPACE.name}</span>
          <span className="kx-v2-pop__workspace-plan">{WORKSPACE.plan}</span>
        </button>

        <div className="kx-v2-pop__divider" role="presentation" />

        <p className="kx-v2-pop__label" aria-hidden="true">
          Systems
        </p>
        <input
          type="text"
          className="kx-v2-pop__search"
          placeholder="Search systems…"
          aria-label="Search systems"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="kx-v2-pop__all" aria-hidden="true">
          All systems
        </div>
        <ul className="kx-v2-pop__list" aria-label="Systems">
          {systems.map((system) => {
            const active = system.id === activeSystem.id
            const count = system.repoIds.length
            return (
              <li key={system.id} className="kx-v2-pop__system-row">
                <button
                  type="button"
                  className={
                    active ? 'kx-v2-pop__system kx-v2-pop__system--active' : 'kx-v2-pop__system'
                  }
                  aria-current={active ? 'true' : undefined}
                  onClick={() => selectSystem(system.id)}
                >
                  <span className="kx-v2-pop__system-icon" aria-hidden="true">
                    <SystemIcon />
                  </span>
                  <span className="kx-v2-pop__system-name">{system.name}</span>
                  <span className="kx-v2-pop__system-count">
                    {count} {count === 1 ? 'repo' : 'repos'}
                  </span>
                </button>
                <button
                  type="button"
                  className="kx-v2-pop__map"
                  aria-label={`System map for ${system.name}`}
                  title={`System map for ${system.name}`}
                  onClick={(event) =>
                    openOverlayAndClose(event, { kind: 'system-map', systemId: system.id })
                  }
                >
                  <SystemMapIcon />
                </button>
              </li>
            )
          })}
        </ul>

        <div className="kx-v2-pop__footer">
          <button
            type="button"
            className="kx-v2-pop__create"
            data-testid="v2-popover-create-system"
            onClick={(event) =>
              openOverlayAndClose(event, { kind: 'create-system-modal', source: 'system-menu' })
            }
          >
            <span className="kx-v2-pop__row-icon" aria-hidden="true">
              <PlusIcon />
            </span>
            <span className="kx-v2-pop__row-label">Create new system</span>
          </button>
        </div>
      </div>
    </div>
  )
}
