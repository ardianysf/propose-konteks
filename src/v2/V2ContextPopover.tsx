/*
 * V2ContextPopover — ONE calm panel replacing the old workspace + system
 * menus: a workspace identity row, a locally-searchable system list, and
 * a sticky create-system action. Mounted at V2Sidebar's root; the parent
 * owns the open state, the panel owns Escape, scrim dismissal, and focus
 * containment. Desktop ≥761px: anchored panel right of the sidebar (left
 * 76px in rail mode). ≤760px: full-width bottom sheet above the drawer.
 */
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useMockup } from '../state/MockupContext'
import { useOverlayLifecycle } from '../components/shell/OverlayLifecycle'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import { resolveV2WorkspaceIn, type V2Workspace } from './v2Workspaces'
import { CheckIcon, ChevronDown, GridIcon, PlusIcon, SystemIcon, SystemMapIcon, XIcon } from './icons'

interface V2ContextPopoverProps {
  open: boolean
  onClose: () => void
  /** Live workspace list (static seed + created workspaces) — owned by V2Sidebar. */
  workspaces: V2Workspace[]
  activeWorkspaceId: string
  onSelectWorkspace: (workspaceId: string) => void
  /** Creates a workspace from a raw name draft and makes it active. */
  onCreateWorkspace: (name: string) => void
  allSystemsActive: boolean
  onSelectAllSystems: () => void
}

export default function V2ContextPopover({
  open,
  onClose,
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  allSystemsActive,
  onSelectAllSystems,
}: V2ContextPopoverProps) {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const rootRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  // Drill-in workspace list: tapping the workspace identity row opens a
  // floating list; its height is capped so many workspaces scroll.
  const [workspaceListOpen, setWorkspaceListOpen] = useState(false)

  // Add-workspace draft row — swaps the END-OF-LIST "Add new workspace"
  // row in the workspace flyout for an inline name input. Confirm (Enter /
  // check) creates + activates the workspace; cancel (Escape / X) discards
  // the draft and returns the Add row.
  const [addingWorkspace, setAddingWorkspace] = useState(false)
  const [draftName, setDraftName] = useState('')
  const draftInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (addingWorkspace) draftInputRef.current?.focus()
  }, [addingWorkspace])

  const cancelAddWorkspace = () => {
    setAddingWorkspace(false)
    setDraftName('')
  }
  const confirmAddWorkspace = () => {
    onCreateWorkspace(draftName)
    setAddingWorkspace(false)
    setDraftName('')
  }

  // Any way the flyout CLOSES — outside-click, the identity-row toggle,
  // Escape, or selecting a row — cancels an open add-workspace draft, so
  // reopening shows the Add row instead of resurrecting stale draft text.
  useEffect(() => {
    if (!workspaceListOpen) cancelAddWorkspace()
  }, [workspaceListOpen])

  // Focus is contained inside the panel while it is mounted (no-op when
  // closed: the hook skips an unconnected root).
  useFocusContainment(rootRef)

  // Escape closes — document-level so it works wherever focus sits.
  // Escape cancels the add-workspace draft FIRST; a second Escape closes
  // the FLYOUT; only another (or one with neither open) dismisses the
  // whole popover.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (addingWorkspace) {
        cancelAddWorkspace()
        return
      }
      if (workspaceListOpen) {
        setWorkspaceListOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, workspaceListOpen, addingWorkspace])

  if (!open) return null

  const selectWorkspace = (workspaceId: string) => {
    onSelectWorkspace(workspaceId)
    setWorkspaceListOpen(false)
    // Selecting a row while a draft is open discards the draft — the
    // flyout must never reopen mid-draft after a switch.
    cancelAddWorkspace()
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
            setWorkspaceListOpen(false)
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
            onClick={() => setWorkspaceListOpen((openState) => !openState)}
          >
            <span className="kx-v2-pop__ws-avatar" aria-hidden="true">
              {activeWorkspace.name[0]}
            </span>
            <span className="kx-v2-pop__workspace-copy">
              <span className="kx-v2-pop__workspace-name">{activeWorkspace.name}</span>
              <span className="kx-v2-pop__workspace-planline">
                <span className="kx-v2-pop__workspace-plan">{activeWorkspace.plan}</span>
                <span className="kx-v2-pop__ws-role">{activeWorkspace.role.toUpperCase()}</span>
              </span>
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
                  const members = state.systems.filter((system) =>
                    workspace.systemIds.includes(system.id),
                  )
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
                        <span className="kx-v2-pop__ws-meta">
                          {members.length} {members.length === 1 ? 'system' : 'systems'}
                        </span>
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
                  row of the workspace list itself. In draft mode the same
                  position swaps for the inline name input; the panel footer
                  below keeps only "Create new system". */}
              {addingWorkspace ? (
                <div className="kx-v2-pop__add" data-testid="v2-popover-add-workspace-form">
                  <input
                    ref={draftInputRef}
                    type="text"
                    className="kx-v2-pop__search"
                    placeholder="Workspace name…"
                    aria-label="New workspace name"
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        confirmAddWorkspace()
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="kx-v2-pop__add-btn kx-v2-pop__add-btn--confirm"
                    aria-label="Add workspace"
                    data-testid="v2-popover-add-workspace-confirm"
                    onClick={confirmAddWorkspace}
                  >
                    <CheckIcon />
                  </button>
                  <button
                    type="button"
                    className="kx-v2-pop__add-btn"
                    aria-label="Cancel adding workspace"
                    data-testid="v2-popover-add-workspace-cancel"
                    onClick={cancelAddWorkspace}
                  >
                    <XIcon />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="kx-v2-pop__ws-add"
                  data-testid="v2-popover-add-workspace"
                  onClick={() => setAddingWorkspace(true)}
                >
                  <span className="kx-v2-pop__ws-add-icon" aria-hidden="true">
                    <PlusIcon />
                  </span>
                  <span className="kx-v2-pop__ws-add-label">Add new workspace</span>
                </button>
              )}
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
