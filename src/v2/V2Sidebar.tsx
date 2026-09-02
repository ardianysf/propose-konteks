/*
 * V2Sidebar — the redesigned /v2 navigation surface (CLEAN pass).
 *
 * Same data, same responsive contract as before (320px expanded / 64px
 * rail / forced rail 761–1280px / ≤760px off-canvas drawer), decluttered
 * to six resting groups:
 *   1. Brand row — wordmark + quiet collapse control (rail: logo is the
 *      expand trigger).
 *   2. ONE context trigger — active system over "Workspace · plan";
 *      opens V2ContextPopover (replaces the two stacked switcher rows
 *      AND the shell-mounted Workspace/System menus).
 *   3. New session — full-width solid primary action.
 *   4. Sessions — quiet nav row to the session history.
 *   5. Recent — static rows with a persistent "system · time" meta
 *      line; only the pin control is interactive (revealed on hover /
 *      focus-within; pinned state stays visible).
 *   6. Footer — account row only, opening V2AccountPopover (the theme
 *      segmented control, Customize, and the catalog deep-link all live
 *      in that popover now, not in the resting sidebar).
 *
 * The two popovers are mutually exclusive via one local `popover` state
 * — they no longer route through the reducer overlay union. All classes
 * are namespaced .kx-v2-* (see v2.css); colors come only from --kx-*
 * tokens.
 */
import { useEffect, useRef, useState } from 'react'
import { RECENT_SESSIONS } from '../data/mockData'
import { createV2Workspace, resolveV2WorkspaceIn, V2_WORKSPACES, type V2Workspace } from './v2Workspaces'
import { useMockup } from '../state/MockupContext'
import {
  CatalogIcon,
  ChevronDown,
  ClockIcon,
  NewSessionIcon,
  PanelCollapseIcon,
  PinIcon,
  SearchIcon,
  SlidersIcon,
  TaskChevronIcon,
  TicketIcon,
} from './icons'
import V2ContextPopover from './V2ContextPopover'
import V2AccountPopover from './V2AccountPopover'
import V2SearchPalette from './V2SearchPalette'

const LOGO_EXPANDED_SRC = '/assets/konteks/logo-text-main.png'
const LOGO_RAIL_SRC = '/assets/konteks/web-topbar-icon-128.png'

// ILLUSTRATIVE — user identity is placeholder data, not a production fact
const USER_NAME = 'Refactory Admin'
const USER_INITIALS = 'RA'

type Popover = 'none' | 'context' | 'account'

export default function V2Sidebar() {
  const { state, dispatch } = useMockup()
  const collapsed = state.sidebarCollapsed

  // "All systems" context: the whole active workspace is selected
  // instead of one system. Any real SET_ACTIVE_SYSTEM (popover row,
  // search palette, session flows) clears it — the effect below keeps
  // the flag honest no matter where the dispatch came from.
  const [allSystemsActive, setAllSystemsActive] = useState(false)
  const prevSystemRef = useRef(state.activeSystemId)
  useEffect(() => {
    if (state.activeSystemId !== prevSystemRef.current) {
      prevSystemRef.current = state.activeSystemId
      setAllSystemsActive(false)
    }
  }, [state.activeSystemId])

  // Popovers are mutually exclusive by construction: one local slot.
  const [popover, setPopover] = useState<Popover>('none')

  // v2-only workspace selector state. The shared reducer has no
  // workspace concept, so the demo workspace list (static seed +
  // workspaces created through the popover's add-workspace flow) and
  // the active id live HERE — one owner keeps the identity card, the
  // rail avatar, and the popover list consistent. V2ContextPopover is
  // this sidebar's direct child, so the shared state flows through the
  // existing props (no context needed).
  const [workspaces, setWorkspaces] = useState<V2Workspace[]>(V2_WORKSPACES)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(V2_WORKSPACES[0].id)
  const activeWorkspace = resolveV2WorkspaceIn(workspaces, activeWorkspaceId)

  const selectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId)
    // Carry-over: if the active system does not belong to the target
    // workspace, fall back to that workspace's first known system so the
    // UI never shows an out-of-scope pairing.
    const workspace = resolveV2WorkspaceIn(workspaces, workspaceId)
    if (!workspace.systemIds.includes(state.activeSystemId)) {
      const first = workspace.systemIds.find((id) =>
        state.systems.some((system) => system.id === id),
      )
      if (first) dispatch({ type: 'SET_ACTIVE_SYSTEM', systemId: first })
    }
  }

  // Append a workspace and make it active. New workspaces start with
  // zero systems — no carry-over dispatch happens, so the identity
  // card falls to its no-system placeholder instead of an out-of-scope
  // system pairing.
  const createWorkspace = (name: string) => {
    const workspace = createV2Workspace(name, workspaces)
    setWorkspaces((previous) => [...previous, workspace])
    setActiveWorkspaceId(workspace.id)
  }

  // Context shown on the identity card: either one system or the whole
  // active workspace. The system line is scoped to the workspace — a
  // workspace with zero known systems (e.g. a freshly created one)
  // shows a placeholder rather than an out-of-scope system name.
  const workspaceSystems = state.systems.filter((system) =>
    activeWorkspace.systemIds.includes(system.id),
  )
  const contextName =
    (allSystemsActive
      ? 'All systems'
      : (workspaceSystems.find((system) => system.id === state.activeSystemId) ??
        workspaceSystems[0])?.name) ?? 'No systems yet'

  // Sessions disclosure — the chevron row expands/collapses the recent
  // items beneath it (the standalone "Recent" section is gone).
  const [sessionsOpen, setSessionsOpen] = useState(true)

  // Rail layout: the manual toggle OR the forced 761–1280px band. Both
  // switch the DOM (not just CSS) so the rail affordances — clock-icon
  // Sessions navigation and the bottom Search — behave identically
  // everywhere. (jsdom has no real matchMedia; the guard keeps tests on
  // the expanded layout.)
  const [forcedBand, setForcedBand] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(min-width: 761px) and (max-width: 1280px)')
    const sync = () => setForcedBand(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  const railLayout = collapsed || forcedBand

  // Search palette — opened from the brand-row search button or ⌘K.
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Focus return: the popover unmounts before the trigger can be
  // focused safely (its containment would pull focus back while
  // mounted), so the refocus happens in an effect after unmount.
  const contextTriggerRef = useRef<HTMLButtonElement>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)
  const pendingFocusRef = useRef<Exclude<Popover, 'none'> | null>(null)
  useEffect(() => {
    if (!pendingFocusRef.current) return
    const which = pendingFocusRef.current
    pendingFocusRef.current = null
    const trigger = which === 'context' ? contextTriggerRef.current : accountTriggerRef.current
    trigger?.focus()
  })

  const closePopover = (which: Exclude<Popover, 'none'>) => {
    pendingFocusRef.current = which
    setPopover('none')
  }
  const togglePopover = (which: Exclude<Popover, 'none'>) => {
    setPopover((current) => (current === which ? 'none' : which))
  }

  // Outside-click dismissal (desktop). The desktop scrim is
  // pointer-transparent, so dismissal is a document listener instead:
  // clicking anywhere outside the open popover closes it WITHOUT the
  // trigger focus-return (focus stays where the user clicked). Clicks
  // inside the popover root, or on either trigger, are ignored here —
  // the triggers' own toggle handles open/switch/close, so clicking the
  // other trigger while one popover is open switches directly to it.
  useEffect(() => {
    if (popover === 'none') return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.kx-v2-pop')) return
      if (contextTriggerRef.current?.contains(target)) return
      if (accountTriggerRef.current?.contains(target)) return
      setPopover('none')
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [popover])

  // Pinned recent sessions — local UI state: pinned rows float to the top
  // of the list (keeping their relative order), unpinned follow unchanged.
  const [pinnedIds, setPinnedIds] = useState<ReadonlySet<string>>(new Set())
  const togglePinned = (sessionId: string) => {
    setPinnedIds((previous) => {
      const next = new Set(previous)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }
  const orderedSessions = [
    ...RECENT_SESSIONS.filter((session) => pinnedIds.has(session.id)),
    ...RECENT_SESSIONS.filter((session) => !pinnedIds.has(session.id)),
  ]

  // Per-session task-children disclosure — sessions carrying taskSessions
  // show their own chevron; expanded state persists across route changes.
  // The rail hides the whole sessions group, so the rows hide with it.
  const [expandedTaskIds, setExpandedTaskIds] = useState<ReadonlySet<string>>(new Set())
  const toggleTaskExpanded = (sessionId: string) => {
    setExpandedTaskIds((previous) => {
      const next = new Set(previous)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  return (
    <nav
      aria-label="Sidebar"
      className={collapsed ? 'kx-v2-sidebar kx-v2-sidebar--rail' : 'kx-v2-sidebar'}
    >
      {/* 1 — Brand row: wordmark left, quiet collapse control flush right.
          In the rail the brand area itself becomes the expand trigger. */}
      <div className="kx-v2-brand">
        {collapsed ? (
          <button
            type="button"
            className="kx-v2-brand__expand"
            aria-label="Expand sidebar"
            data-testid="v2-sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <img className="kx-v2-brand__img" src={LOGO_RAIL_SRC} alt="" width={32} height={32} />
            <span className="kx-v2-brand__expand-icon" aria-hidden="true">
              <PanelCollapseIcon collapsed />
            </span>
          </button>
        ) : (
          <>
            {/* Square mark — hidden in the expanded sidebar (the wordmark
                carries the brand); the forced-rail band swaps visibility so
                the 64px rail never shows a squeezed wordmark. */}
            <img
              className="kx-v2-brand__img kx-v2-brand__img--square"
              src={LOGO_RAIL_SRC}
              alt="Konteks"
              width={32}
              height={32}
            />
            <img
              className="kx-v2-brand__img kx-v2-brand__img--wordmark"
              src={LOGO_EXPANDED_SRC}
              alt=""
              width={118}
              height={26}
            />
          </>
        )}
        {!railLayout && (
          <button
            type="button"
            className="kx-v2-iconbtn kx-v2-brand__search"
            aria-label="Search"
            aria-keyshortcuts="Meta+K Control+K"
            data-testid="v2-search-trigger"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
          </button>
        )}
        {!railLayout && (
          <button
            type="button"
            className="kx-v2-iconbtn kx-v2-brand__collapse"
            aria-label="Collapse sidebar"
            data-testid="v2-sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <PanelCollapseIcon collapsed={false} />
          </button>
        )}
      </div>

      {/* Rail: Search sits directly BELOW the brand — the same top slot
          it occupies next to the wordmark in the expanded sidebar. */}
      {railLayout && (
        <button
          type="button"
          className="kx-v2-iconbtn kx-v2-rail-search"
          aria-label="Search"
          aria-keyshortcuts="Meta+K Control+K"
          data-testid="v2-search-rail-trigger"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon />
        </button>
      )}

      {/* 2 — One context trigger: active system over the workspace/plan
          summary. Opens the combined context popover. */}
      <button
        ref={contextTriggerRef}
        type="button"
        className="kx-v2-context"
        aria-label={`${contextName} — open workspace and systems`}
        aria-haspopup="dialog"
        aria-expanded={popover === 'context'}
        data-testid="v2-context-trigger"
        onClick={() => togglePopover('context')}
      >
        <span className="kx-v2-context__mark" aria-hidden="true">
          {activeWorkspace.name[0]}
        </span>
        <span className="kx-v2-context__copy">
          <span className="kx-v2-context__system">{contextName}</span>
          <span className="kx-v2-context__plan">{activeWorkspace.name}</span>
        </span>
        <span className="kx-v2-context__chevron" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {/* One visual menu language: identical row height, icon tile,
          gap, color, and label position for all three actions. */}
      <button
        type="button"
        className={
          state.route === 'new-session'
            ? 'kx-v2-menuitem kx-v2-menuitem--active'
            : 'kx-v2-menuitem'
        }
        aria-label="New session"
        aria-current={state.route === 'new-session' ? 'page' : undefined}
        data-testid="v2-new-session-trigger"
        onClick={() => dispatch({ type: 'NAVIGATE', route: 'new-session' })}
      >
        <span className="kx-v2-menuitem__icon" aria-hidden="true">
          <NewSessionIcon />
        </span>
        <span className="kx-v2-menuitem__label">New session</span>
      </button>

      <button
        type="button"
        className="kx-v2-menuitem"
        data-testid="v2-customize-trigger"
        onClick={() =>
          dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'customize', destination: { section: 'agents' } } })
        }
      >
        <span className="kx-v2-menuitem__icon" aria-hidden="true">
          <SlidersIcon />
        </span>
        <span className="kx-v2-menuitem__label">Customize</span>
      </button>

      <a className="kx-v2-menuitem" href="/catalog" data-testid="v2-catalog-trigger">
        <span className="kx-v2-menuitem__icon" aria-hidden="true">
          <CatalogIcon />
        </span>
        <span className="kx-v2-menuitem__label">Component catalog</span>
      </a>

      {/* Sessions has exactly one chevron at the far right. The text area
          navigates to the session list; the chevron independently toggles
          the child sessions and rotates to reflect the disclosure state.
          In the rail it collapses to a single CLOCK icon that navigates
          straight to the session list. */}
      <div className="kx-v2-sessions-block">
        <div className={railLayout ? 'kx-v2-sessions-row kx-v2-sessions-row--rail' : 'kx-v2-sessions-row'}>
          {railLayout ? (
            <button
              type="button"
              className="kx-v2-sessions-rail"
              aria-label="Sessions"
              aria-current={state.route === 'session-history' ? 'page' : undefined}
              data-testid="v2-sessions-rail"
              onClick={() => dispatch({ type: 'NAVIGATE', route: 'session-history' })}
            >
              <ClockIcon />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="kx-v2-sessions-label"
                aria-current={state.route === 'session-history' ? 'page' : undefined}
                data-testid="v2-sessions-trigger"
                onClick={() => dispatch({ type: 'NAVIGATE', route: 'session-history' })}
              >
                Sessions
              </button>
              <button
                type="button"
                className="kx-v2-sessions-toggle"
                aria-label={sessionsOpen ? 'Collapse sessions' : 'Expand sessions'}
                aria-expanded={sessionsOpen}
                aria-controls="kx-v2-sessions-group"
                data-testid="v2-sessions-toggle"
                onClick={() => setSessionsOpen((open) => !open)}
              >
                <span
                  className={
                    sessionsOpen
                      ? 'kx-v2-sessions-toggle__icon kx-v2-sessions-toggle__icon--open'
                      : 'kx-v2-sessions-toggle__icon'
                  }
                  aria-hidden="true"
                >
                  <ChevronDown />
                </span>
              </button>
            </>
          )}
        </div>

      {sessionsOpen && (
        <div id="kx-v2-sessions-group" className="kx-v2-sessions-group">
          <ul className="kx-v2-recent__list">
            {orderedSessions.map((session) => {
              const system = state.systems.find((entry) => entry.id === session.systemId)
              const pinned = pinnedIds.has(session.id)
              const tasks = session.taskSessions
              const tasksExpanded = expandedTaskIds.has(session.id)
              // The parent row stays visually associated with the open
              // task session page while one of its children is active.
              const ownsActiveTask =
                state.route === 'task-session-detail' &&
                (tasks?.some((task) => task.id === state.activeTaskSessionId) ?? false)
              return (
                <li
                  key={session.id}
                  className={
                    ownsActiveTask
                      ? 'kx-v2-recent__item kx-v2-recent__item--task-active'
                      : 'kx-v2-recent__item'
                  }
                >
                  <div className="kx-v2-recent__row">
                    <span className="kx-v2-recent__title" title={session.title}>
                      {session.title}
                    </span>
                    {tasks && tasks.length > 0 && (
                      <button
                        type="button"
                        className={
                          tasksExpanded
                            ? 'kx-v2-recent__tasks kx-v2-recent__tasks--open'
                            : 'kx-v2-recent__tasks'
                        }
                        aria-expanded={tasksExpanded}
                        aria-label={
                          tasksExpanded
                            ? `Collapse task sessions for ${session.title}`
                            : `Expand task sessions for ${session.title}`
                        }
                        data-testid="v2-session-tasks-toggle"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleTaskExpanded(session.id)
                          if (event.detail > 0) event.currentTarget.blur()
                        }}
                      >
                        <TaskChevronIcon />
                      </button>
                    )}
                    <button
                      type="button"
                      className="kx-v2-recent__pin"
                      aria-pressed={pinned}
                      aria-label={pinned ? 'Unpin session' : 'Pin session'}
                      title={pinned ? 'Unpin session' : 'Pin session'}
                      onClick={(event) => {
                        event.stopPropagation()
                        togglePinned(session.id)
                        // Mouse clicks must not leave focus on the pin —
                        // :focus-within would freeze the control revealed
                        // after the pointer leaves. Keyboard activation keeps
                        // focus so keyboard users retain the reveal.
                        if (event.detail > 0) event.currentTarget.blur()
                      }}
                    >
                      <PinIcon pinned={pinned} />
                    </button>
                  </div>
                  <span className="kx-v2-recent__meta">
                    {system ? system.name : session.systemId} · {session.time}
                  </span>
                  {/* Nested task-session rows (tickets) — children of their
                      parent session row. Clicking one dispatches
                      NAVIGATE_TASK_SESSION; the in-progress ticket carries
                      the attention dot. Buttons (not list items) keep the
                      five-row listitem contract intact. */}
                  {tasks && tasks.length > 0 && tasksExpanded && (
                    <div className="kx-v2-task-list">
                      {tasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          className="kx-v2-task-row"
                          aria-current={
                            state.route === 'task-session-detail' &&
                            state.activeTaskSessionId === task.id
                              ? 'page'
                              : undefined
                          }
                          data-testid="v2-task-row"
                          onClick={() =>
                            dispatch({ type: 'NAVIGATE_TASK_SESSION', taskSessionId: task.id })
                          }
                        >
                          <span className="kx-v2-task-row__icon" aria-hidden="true">
                            <TicketIcon />
                          </span>
                          <span className="kx-v2-task-row__label">
                            {task.code} · {task.title}
                          </span>
                          {task.status === 'IN_PROGRESS' && (
                            <span className="kx-v2-task-row__dot" aria-hidden="true" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
      </div>

      {/* 6 — Footer cluster (hairline divider above): just the account
          row opening its popover. Theme lives inside the account popover. */}
      <div className="kx-v2-footer">
        <button
          ref={accountTriggerRef}
          type="button"
          className="kx-v2-account"
          aria-label="Open account menu"
          aria-haspopup="dialog"
          aria-expanded={popover === 'account'}
          data-testid="v2-account-trigger"
          onClick={() => togglePopover('account')}
        >
          <span className="kx-v2-avatar kx-v2-avatar--user" aria-hidden="true">
            {USER_INITIALS}
          </span>
          <span className="kx-v2-account__name">{USER_NAME}</span>
          <ChevronDown />
        </button>
      </div>

      {/* Popovers — mounted at the sidebar root, mutually exclusive. */}
      <V2ContextPopover
        open={popover === 'context'}
        onClose={() => closePopover('context')}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={selectWorkspace}
        onCreateWorkspace={createWorkspace}
        allSystemsActive={allSystemsActive}
        onSelectAllSystems={() => setAllSystemsActive(true)}
      />
      <V2AccountPopover open={popover === 'account'} onClose={() => closePopover('account')} />
      <V2SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}
