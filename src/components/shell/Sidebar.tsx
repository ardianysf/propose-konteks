/*
 * Sidebar — the persistent 320px white shell sidebar (Task 4 Part A, spec §6.1).
 *
 * Chrome only: brand logo (real Konteks assets), the workspace box — the
 * single persistent boxed container (AC6) —, the workspace and system
 * controls with chevron-right affordances (AC7; the system floating menu
 * itself is Part B), recent sessions newest-first with system + time
 * (AC10), the "View all" control that navigates to session history while
 * the sidebar stays untouched (AC11), the New session route control
 * between the system control and Recent sessions, the collapse toggle to
 * the 64px icon rail (AC12), the user row that opens the account menu
 * (Task 12, AC42), the sliders icon beside it that opens Customize on
 * the agents tab with a keyboard-focusable tooltip (AC9), and the catalog
 * icon link beside that — a plain deep-link to the separate /catalog Vite
 * entry (never a reducer route) opening in a new tab. No "All Systems"
 * page or link exists anywhere here (AC14). The workspace, system, and
 * account triggers toggle their own overlay on a repeated click and
 * replace any other open overlay (focus returns to the root trigger).
 */
import { useState, type MouseEvent } from 'react'
import { RECENT_SESSIONS, WORKSPACE } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import CollapseIcon from './CollapseIcon'
import { useOverlayLifecycle } from './OverlayLifecycle'
import './Sidebar.css'

/** Pin — outline (unpinned) / filled (pinned) glyph, 14×14 currentColor. */
function PinIcon({ pinned }: { pinned: boolean }) {
  return (
    <svg
      data-icon="pin"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.5 2.5 13.5 6.5 12 8l-.75-.75-2.19 2.19.44 2.56-1.5 1.5-2.5-2.5-2.75 2.75-.75-.75L5 11.25 2.5 8.75 4 7.25l2.56.44L8.75 5.5 8 4.75l1.5-2.25Z"
        fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Ticket — the task-session row glyph (same drawing as the task
 * session page banner). */
function TicketIcon() {
  return (
    <svg
      data-icon="ticket"
      viewBox="0 0 16 16"
      width="13"
      height="13"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 4v8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Chevron-right — doubles as the task-children disclosure glyph; the
 * open state rotates it 90° via the CSS class on its wrapping button. */
function TaskChevronIcon() {
  return (
    <svg
      data-icon="task-chevron"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const LOGO_EXPANDED_SRC = '/assets/konteks/logo-text-main.png'
const LOGO_RAIL_SRC = '/assets/konteks/web-topbar-icon-128.png'

// ILLUSTRATIVE — user identity is placeholder data, not a production fact (spec AC46)
const USER_NAME = 'Refactory Admin'
const USER_INITIALS = 'RA'

/** Chevron-right — marks controls whose menus open to the right (AC7). */
function ChevronRight() {
  return (
    <svg
      className="kx-sidebar__chevron"
      data-icon="chevron-right"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Double chevron — the shared minimize/maximize glyph (AC12) lives in
 * the shared CollapseIcon module, used by the sidebar's own toggle. */

/** Square + plus — the New session route control's icon. */
function NewSessionIcon() {
  return (
    <svg
      data-icon="new-session"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2.25"
        y="2.25"
        width="11.5"
        height="11.5"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 5.5v5M5.5 8h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** 3×3 dots — the component-catalog deep-link glyph, echoing the inline
 * system 2×2-grid icon pattern. */
function CatalogIcon() {
  return (
    <svg
      data-icon="catalog"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="3" cy="3" r="1.4" fill="currentColor" />
      <circle cx="8" cy="3" r="1.4" fill="currentColor" />
      <circle cx="13" cy="3" r="1.4" fill="currentColor" />
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
      <circle cx="3" cy="13" r="1.4" fill="currentColor" />
      <circle cx="8" cy="13" r="1.4" fill="currentColor" />
      <circle cx="13" cy="13" r="1.4" fill="currentColor" />
    </svg>
  )
}

/** Sliders — inline SVG, no emoji (AC9). */
function SlidersIcon() {
  return (
    <svg
      data-icon="sliders"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 4.25h6.6M12.4 4.25H14M2 8h1.6M7.4 8H14M2 11.75h8.6M13.4 11.75H14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="4.25" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="5.5" cy="8" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="11.5" cy="11.75" r="1.9" fill="var(--kx-raised)" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function Sidebar() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain, dismissOverlay } = useOverlayLifecycle()
  const collapsed = state.sidebarCollapsed
  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
  const [customizeTooltipShown, setCustomizeTooltipShown] = useState(false)
  const [catalogTooltipShown, setCatalogTooltipShown] = useState(false)
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

  // Task-session children disclosure — local UI state: sessions carrying
  // taskSessions render a chevron control that expands their nested ticket
  // rows. The state persists across route changes (never auto-collapsed),
  // and the rail hides the whole Recent section so the rows hide with it.
  const [expandedTaskIds, setExpandedTaskIds] = useState<ReadonlySet<string>>(new Set())
  const toggleTaskExpanded = (sessionId: string) => {
    setExpandedTaskIds((previous) => {
      const next = new Set(previous)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  /** Toggle contract shared by the reducer-overlay menu triggers: a second
   * click on the same trigger dismisses its own overlay (restoring focus to
   * the trigger through the lifecycle); any other state opens/replaces. */
  const openMenuOrToggle = (
    event: MouseEvent<HTMLButtonElement>,
    kind: 'workspace-menu' | 'system-menu' | 'account-menu',
  ) => {
    if (state.overlay.kind === kind) {
      dismissOverlay()
      return
    }
    beginOverlayChain(event.currentTarget)
    dispatch({ type: 'OPEN_OVERLAY', overlay: { kind } })
  }

  return (
    <nav aria-label="Sidebar" className={collapsed ? 'kx-sidebar kx-sidebar--rail' : 'kx-sidebar'}>
      <div className="kx-sidebar__top">
        {/* Brand row — logo left, sidebar minimize control right (AC12).
            In the rail the top-right toggle stands down and the logo area
            itself becomes the maximize control: hover/focus swaps the
            Konteks icon for the expand chevron, click expands (see CSS). */}
        {collapsed ? (
          <button
            type="button"
            className="kx-sidebar__logo kx-sidebar__logo--expand"
            aria-label="Expand sidebar"
            data-testid="sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <img
              className="kx-sidebar__logo-img"
              src={LOGO_RAIL_SRC}
              alt=""
              width={32}
              height={32}
            />
            <span className="kx-sidebar__logo-expand-icon" aria-hidden="true">
              <CollapseIcon collapsed />
            </span>
          </button>
        ) : (
          <div className="kx-sidebar__logo">
            <img
              className="kx-sidebar__logo-img"
              src={LOGO_EXPANDED_SRC}
              alt="Konteks"
              width={118}
              height={26}
            />
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            className="kx-icon-btn kx-sidebar__toggle"
            aria-label="Collapse sidebar"
            data-testid="sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <CollapseIcon collapsed={false} />
          </button>
        )}
      </div>

      {/* The workspace box — the ONLY persistent boxed container in the
          sidebar (AC6). The control opens the workspace floating menu to
          the right, completing the chevron-right contract (AC7); the menu
          itself is WorkspaceMenu. */}
      <div className="kx-sidebar-box kx-sidebar__workspace">
        <button
          type="button"
          className="kx-sidebar__control"
          aria-label={`${WORKSPACE.name} workspace`}
          aria-haspopup="menu"
          aria-expanded={state.overlay.kind === 'workspace-menu'}
          onClick={(event) => openMenuOrToggle(event, 'workspace-menu')}
        >
          <span className="kx-sidebar__workspace-avatar" aria-hidden="true">
            {WORKSPACE.name[0]}
          </span>
          <span className="kx-sidebar__control-copy">
            <span className="kx-sidebar__control-caption">Workspace</span>
            <span className="kx-sidebar__control-name">{WORKSPACE.name}</span>
          </span>
          <ChevronRight />
        </button>
      </div>

      {/* System control — opens the system floating menu to the right
          (AC7/AC13); the menu UI itself arrives in Part B. */}
      <button
        type="button"
        className="kx-sidebar__control kx-sidebar__system"
        aria-label={`${activeSystem.name} — open system menu`}
        aria-haspopup="menu"
        aria-expanded={state.overlay.kind === 'system-menu'}
        onClick={(event) => openMenuOrToggle(event, 'system-menu')}
      >
        <span className="kx-sidebar__system-icon">
          <svg data-icon="system" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
            <rect x="2.25" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
            <rect x="8.75" y="2.25" width="5" height="5" rx="1.5" fill="currentColor" />
            <rect x="2.25" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
            <rect x="8.75" y="8.75" width="5" height="5" rx="1.5" fill="currentColor" />
          </svg>
        </span>
        <span className="kx-sidebar__control-copy">
          <span className="kx-sidebar__control-caption">System</span>
          <span className="kx-sidebar__control-name">{activeSystem.name}</span>
        </span>
        <ChevronRight />
      </button>

      {/* New session — the persistent route control between the system
          control and Recent sessions. It navigates to the new-session
          route (closing any open overlay through the lifecycle so the
          route is clean), carries aria-current="page" while active, and
          collapses to a centered icon in the manual/forced rail with the
          label hidden but the accessible name kept via aria-label. */}
      {/* New session — the persistent route control between the system
          control and Recent sessions. It navigates to the new-session
          route (closing any open overlay through the lifecycle so the
          route is clean), carries aria-current="page" while active, and
          collapses to a centered icon in the manual/forced rail with the
          label hidden but the accessible name kept via aria-label. The
          sidebar minimize/maximize control lives in the sidebar's own
          brand row (top-right expanded; logo hover/focus in the rail). */}
      <button
        type="button"
        className={
          state.route === 'new-session'
            ? 'kx-sidebar__new-session kx-sidebar__new-session--active'
            : 'kx-sidebar__new-session'
        }
        aria-label="New session"
        aria-current={state.route === 'new-session' ? 'page' : undefined}
        data-testid="new-session-trigger"
        onClick={() => {
          if (state.overlay.kind !== 'none') dismissOverlay()
          dispatch({ type: 'NAVIGATE', route: 'new-session' })
        }}
      >
        <span className="kx-sidebar__new-session-icon" aria-hidden="true">
          <NewSessionIcon />
        </span>
        <span className="kx-sidebar__new-session-label">New session</span>
      </button>

      <section className="kx-sidebar__recent">
        <div className="kx-sidebar__recent-head">
          <span className="kx-sidebar__label">Recent sessions</span>
          <button
            type="button"
            className="kx-sidebar__view-all"
            onClick={() => dispatch({ type: 'NAVIGATE', route: 'session-history' })}
          >
            View all
          </button>
        </div>
        <ul className="kx-sidebar__session-list" aria-label="Recent sessions">
          {orderedSessions.map((session) => {
            const system = state.systems.find((entry) => entry.id === session.systemId)
            const pinned = pinnedIds.has(session.id)
            const tasks = session.taskSessions
            const tasksExpanded = expandedTaskIds.has(session.id)
            // The parent row stays visually associated with the open task
            // session page while one of its children is the active task.
            const ownsActiveTask =
              state.route === 'task-session-detail' &&
              (tasks?.some((task) => task.id === state.activeTaskSessionId) ?? false)
            return (
              <li
                key={session.id}
                className={
                  ownsActiveTask
                    ? 'kx-sidebar__session kx-sidebar__session--task-active kx-tooltip-host'
                    : 'kx-sidebar__session kx-tooltip-host'
                }
              >
                {/* Full-title tooltip — CSS reveals it on hover/focus-within;
                    aria-hidden so screen readers hear the row text only once. */}
                <span className="kx-tooltip kx-sidebar__session-tooltip" aria-hidden="true">
                  {session.title}
                </span>
                <div className="kx-sidebar__session-title-row">
                  <span className="kx-sidebar__session-title">{session.title}</span>
                  {tasks && tasks.length > 0 && (
                    <button
                      type="button"
                      className={
                        tasksExpanded
                          ? 'kx-sidebar__session-tasks kx-sidebar__session-tasks--open'
                          : 'kx-sidebar__session-tasks'
                      }
                      aria-expanded={tasksExpanded}
                      aria-label={
                        tasksExpanded
                          ? `Collapse task sessions for ${session.title}`
                          : `Expand task sessions for ${session.title}`
                      }
                      data-testid="sidebar-session-tasks-toggle"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleTaskExpanded(session.id)
                        // Same focus contract as the pin: a mouse click must
                        // not strand :focus-within and freeze the row open.
                        if (event.detail > 0) event.currentTarget.blur()
                      }}
                    >
                      <TaskChevronIcon />
                    </button>
                  )}
                  <button
                    type="button"
                    className="kx-sidebar__session-pin"
                    aria-pressed={pinned}
                    aria-label={pinned ? 'Unpin session' : 'Pin session'}
                    title={pinned ? 'Unpin session' : 'Pin session'}
                    onClick={(event) => {
                      event.stopPropagation()
                      togglePinned(session.id)
                      // Mouse clicks (detail > 0) must not leave focus on the
                      // pin — :focus-within would freeze the row expanded even
                      // after the mouse leaves. Keyboard activation
                      // (detail === 0) keeps focus so keyboard users retain
                      // the focus-within expansion.
                      if (event.detail > 0) event.currentTarget.blur()
                    }}
                  >
                    <PinIcon pinned={pinned} />
                  </button>
                </div>
                {/* Collapsed by default; expands on hover/focus-within via the
                    grid-template-rows 0fr→1fr transition (CSS-only). */}
                <div className="kx-sidebar__session-expand">
                  <div className="kx-sidebar__session-expand-inner">
                    <span className="kx-sidebar__session-meta">
                      <span className="kx-sidebar__session-system">
                        {system ? system.name : session.systemId}
                      </span>
                      <span className="kx-sidebar__session-time">{session.time}</span>
                    </span>
                  </div>
                </div>
                {/* Nested task-session rows (tickets) — indented beneath the
                    parent session. Clicking one selects that task session and
                    routes to its detail page in a single NAVIGATE_TASK_SESSION
                    transition; the in-progress ticket carries the attention
                    dot. Hidden in the rail together with the whole Recent
                    section. */}
                {tasks && tasks.length > 0 && tasksExpanded && (
                  <div className="kx-sidebar__task-list">
                    {tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="kx-sidebar__task-row"
                        aria-current={
                          state.route === 'task-session-detail' &&
                          state.activeTaskSessionId === task.id
                            ? 'page'
                            : undefined
                        }
                        data-testid="sidebar-task-row"
                        onClick={() =>
                          dispatch({ type: 'NAVIGATE_TASK_SESSION', taskSessionId: task.id })
                        }
                      >
                        <span className="kx-sidebar__task-icon" aria-hidden="true">
                          <TicketIcon />
                        </span>
                        <span className="kx-sidebar__task-label">
                          {task.code} · {task.title}
                        </span>
                        {task.status === 'IN_PROGRESS' && (
                          <span className="kx-sidebar__task-dot" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <div className="kx-sidebar__user">
        {/* User row — opens the account menu (Task 12, spec §14, AC42).
            The sliders button beside it stays the separate Customize
            trigger and must never open the account menu (AC9). */}
        <button
          type="button"
          className="kx-sidebar__user-trigger"
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={state.overlay.kind === 'account-menu'}
          data-testid="account-trigger"
          onClick={(event) => openMenuOrToggle(event, 'account-menu')}
        >
          <span className="kx-sidebar__user-avatar" aria-hidden="true">
            {USER_INITIALS}
          </span>
          <span className="kx-sidebar__user-name">{USER_NAME}</span>
        </button>
        <button
          type="button"
          className="kx-icon-btn kx-tooltip-host kx-sidebar__customize"
          aria-label="Customize"
          onClick={(event) => {
            beginOverlayChain(event.currentTarget)
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'customize', destination: { section: 'agents' } } })
          }}
          onMouseEnter={() => setCustomizeTooltipShown(true)}
          onMouseLeave={() => setCustomizeTooltipShown(false)}
          onFocus={() => setCustomizeTooltipShown(true)}
          onBlur={() => setCustomizeTooltipShown(false)}
        >
          <SlidersIcon />
          <span className="kx-tooltip kx-sidebar__tooltip" role="tooltip" hidden={!customizeTooltipShown}>
            Customize
          </span>
        </button>
        {/* Catalog deep-link — opens the separate /catalog Vite entry in a
            new tab (dev/preview middleware + vercel.json rewrite /catalog*
            to catalog.html, so the absolute href works everywhere). */}
        <a
          className="kx-icon-btn kx-tooltip-host kx-sidebar__catalog"
          href="/catalog"
          target="_blank"
          rel="noreferrer"
          aria-label="Component catalog"
          data-testid="catalog-link"
          onMouseEnter={() => setCatalogTooltipShown(true)}
          onMouseLeave={() => setCatalogTooltipShown(false)}
          onFocus={() => setCatalogTooltipShown(true)}
          onBlur={() => setCatalogTooltipShown(false)}
        >
          <CatalogIcon />
          <span className="kx-tooltip kx-sidebar__tooltip" role="tooltip" hidden={!catalogTooltipShown}>
            Component catalog
          </span>
        </a>
      </div>
    </nav>
  )
}
