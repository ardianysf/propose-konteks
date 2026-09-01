/*
 * V2ContextPopover — ONE calm panel replacing the old workspace + system
 * menus: a workspace identity row, a locally-searchable system list, and
 * a sticky create-system action. Mounted at V2Sidebar's root; the parent
 * owns the open state (and the workspace flyout's open state), the panel
 * owns Escape, scrim dismissal, and focus containment. Desktop ≥761px:
 * anchored panel right of the sidebar (left 76px in rail mode). ≤760px:
 * full-width bottom sheet above the drawer.
 *
 * The identity row is the only place a system count appears: its meta
 * line reads "plan · ROLE · N systems" for the ACTIVE workspace (plus a
 * muted one-line description when the workspace has one). The flyout
 * rows below stay lean — avatar, name, role chip, active check — and the
 * end-of-list "Add new workspace" row opens the create-workspace MODAL
 * (rendered by V2Sidebar) instead of an inline draft.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMockup } from '../state/MockupContext'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import { resolveV2WorkspaceIn, type V2Workspace } from './v2Workspaces'
import { CheckIcon, ChevronDown, GridIcon, PlusIcon, SystemIcon, SystemMapIcon } from './icons'

interface V2ContextPopoverProps {
  open: boolean
  onClose: () => void
  /** Live workspace list (static seed + created workspaces) — owned by V2Sidebar. */
  workspaces: V2Workspace[]
  activeWorkspaceId: string
  /** Workspace flyout open state — also owned by V2Sidebar, so the
   * create-workspace modal can close the flyout on confirm while the
   * panel itself stays open. */
  workspaceListOpen: boolean
  onSetWorkspaceListOpen: (open: boolean) => void
  onSelectWorkspace: (workspaceId: string) => void
  /** Opens the create-workspace modal (owned by V2Sidebar). */
  onOpenCreateWorkspace: () => void
  /** True while the create-workspace modal is open: the panel's Escape
   * handling and focus containment stand down so the modal owns both. */
  createModalOpen: boolean
  allSystemsActive: boolean
  onSelectAllSystems: () => void
}

export default function V2ContextPopover({
  open,
  onClose,
  workspaces,
  activeWorkspaceId,
  workspaceListOpen,
  onSetWorkspaceListOpen,
  onSelectWorkspace,
  onOpenCreateWorkspace,
  createModalOpen,
  allSystemsActive,
  onSelectAllSystems,
}: V2ContextPopoverProps) {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  // Focus is contained inside the panel while it is mounted (no-op when
  // closed: the hook skips an unconnected root; stood down while the
  // create-workspace modal is open above).
  useFocusContainment(rootRef, { active: !createModalOpen })

  // Escape closes — document-level so it works wherever focus sits.
  // Escape closes the FLYOUT first; another (or one with the flyout
  // closed) dismisses the whole popover. While the create-workspace
  // modal is open, the modal owns Escape — this listener stands down.
  useEffect(() => {
    if (!open || createModalOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (workspaceListOpen) {
        onSetWorkspaceListOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, workspaceListOpen, onSetWorkspaceListOpen, createModalOpen])

  if (!open) return null

  const selectWorkspace = (workspaceId: string) => {
    onSelectWorkspace(workspaceId)
    onSetWorkspaceListOpen(false)
  }

  const activeWorkspace = resolveV2WorkspaceIn(workspaces, activeWorkspaceId)
  const workspaceSystems = state.systems.filter((system) =>
    activeWorkspace.systemIds.includes(system.id),
  )
  const needle = query.trim().toLowerCase()
  const systems = needle
    ? workspaceSystems.filter((system) => system.name.toLowerCase().includes(needle))
    : workspaceSystems

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

  // Switching workspace keeps the panel OPEN so the systems list is seen
  // re-scoping live; the identity card behind updates in the same frame.

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
        onMouseDown={(event) => {
          // Clicking anywhere outside the flyout (and outside its trigger)
          // dismisses the flyout without closing the panel.
          const target = event.target as HTMLElement
          if (
            workspaceListOpen &&
            !target.closest('.kx-v2-pop__ws-flyout') &&
            !target.closest('[data-testid="v2-popover-workspace"]')
          ) {
            onSetWorkspaceListOpen(false)
          }
        }}
      >
        <span className="kx-v2-pop__handle" aria-hidden="true" />

        <p className="kx-v2-pop__label" id="kx-v2-pop-workspace-label">
          Workspace
        </p>
        <div className="kx-v2-pop__wswrap">
          <button
            type="button"
            className="kx-v2-pop__workspace"
            aria-haspopup="listbox"
            aria-expanded={workspaceListOpen}
            data-testid="v2-popover-workspace"
            onClick={() => onSetWorkspaceListOpen(!workspaceListOpen)}
          >
            <span className="kx-v2-pop__ws-avatar" aria-hidden="true">
              {activeWorkspace.name[0]}
            </span>
            <span className="kx-v2-pop__workspace-copy">
              <span className="kx-v2-pop__workspace-name">{activeWorkspace.name}</span>
              {/* Identity meta carries the workspace's system count —
                  the only place a count appears in the workspace UI. */}
              <span className="kx-v2-pop__workspace-planline">
                <span className="kx-v2-pop__workspace-plan">{activeWorkspace.plan}</span>
                <span className="kx-v2-pop__plan-sep" aria-hidden="true">
                  {' · '}
                </span>
                <span className="kx-v2-pop__ws-role">{activeWorkspace.role.toUpperCase()}</span>
                <span className="kx-v2-pop__plan-sep" aria-hidden="true">
                  {' · '}
                </span>
                <span className="kx-v2-pop__workspace-count">
                  {workspaceSystems.length}{' '}
                  {workspaceSystems.length === 1 ? 'system' : 'systems'}
                </span>
              </span>
              {activeWorkspace.description.trim() !== '' && (
                <span className="kx-v2-pop__workspace-desc" title={activeWorkspace.description}>
                  {activeWorkspace.description}
                </span>
              )}
            </span>
            <span
              className={
                workspaceListOpen
                  ? 'kx-v2-pop__workspace-chevron kx-v2-pop__workspace-chevron--open'
                  : 'kx-v2-pop__workspace-chevron'
              }
              aria-hidden="true"
            >
              <ChevronDown />
            </span>
          </button>
          {workspaceListOpen && (
            <div className="kx-v2-pop__ws-flyout">
              <ul
                className="kx-v2-pop__ws-list"
                role="listbox"
                aria-label="Workspaces"
                data-testid="v2-popover-workspace-list"
              >
                {workspaces.map((workspace) => {
                  const active = workspace.id === activeWorkspaceId
                  return (
                    <li
                      key={workspace.id}
                      role="option"
                      aria-selected={active}
                      className="kx-v2-pop__ws-row"
                    >
                      <button
                        type="button"
                        className={
                          active ? 'kx-v2-pop__ws kx-v2-pop__ws--active' : 'kx-v2-pop__ws'
                        }
                        data-testid={`v2-popover-workspace-${workspace.id}`}
                        onClick={() => selectWorkspace(workspace.id)}
                      >
                        <span className="kx-v2-pop__ws-avatar" aria-hidden="true">
                          {workspace.name[0]}
                        </span>
                        <span className="kx-v2-pop__ws-name">{workspace.name}</span>
                        <span className="kx-v2-pop__ws-role">{workspace.role.toUpperCase()}</span>
                        {active && (
                          <span className="kx-v2-pop__ws-check" aria-hidden="true">
                            <CheckIcon />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
              {/* End-of-list action row: "Add new workspace" is the last
                  row of the workspace list itself; it opens the
                  create-workspace modal (V2Sidebar). The panel footer
                  below keeps only "Create new system". */}
              <button
                type="button"
                className="kx-v2-pop__ws-add"
                data-testid="v2-popover-add-workspace"
                onClick={onOpenCreateWorkspace}
              >
                <span className="kx-v2-pop__ws-add-icon" aria-hidden="true">
                  <PlusIcon />
                </span>
                <span className="kx-v2-pop__ws-add-label">Add new workspace</span>
              </button>
            </div>
          )}
        </div>

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
          In {activeWorkspace.name}
        </div>
        <ul className="kx-v2-pop__list" aria-label="Systems">
          {!needle && (
            <li className="kx-v2-pop__system-row">
              <button
                type="button"
                className={
                  allSystemsActive
                    ? 'kx-v2-pop__system kx-v2-pop__system--active'
                    : 'kx-v2-pop__system'
                }
                aria-current={allSystemsActive ? 'true' : undefined}
                data-testid="v2-popover-all-systems"
                onClick={onSelectAllSystems}
              >
                <span className="kx-v2-pop__system-icon" aria-hidden="true">
                  <GridIcon />
                </span>
                <span className="kx-v2-pop__system-name">All systems</span>
                <span className="kx-v2-pop__system-count">
                  {workspaceSystems.length} systems
                </span>
              </button>
            </li>
          )}
          {systems.map((system) => {
            // While "All systems" is the context, no single system row
            // carries the current mark — exactly one selection at a time.
            const active = !allSystemsActive && system.id === state.activeSystemId
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
