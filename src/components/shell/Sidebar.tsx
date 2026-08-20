/*
 * Sidebar — the persistent 312px white shell sidebar (Task 4 Part A, spec §6.1).
 *
 * Chrome only: brand logo (real Konteks assets), the workspace box — the
 * single persistent boxed container (AC6) —, the workspace and system
 * controls with chevron-right affordances (AC7; the system floating menu
 * itself is Part B), recent sessions newest-first with system + time
 * (AC10), the "View all" control that navigates to session history while
 * the sidebar stays untouched (AC11), the New session route control
 * between the system control and Recent sessions, the collapse toggle to
 * the 64px icon rail (AC12), the user row that opens the account menu
 * (Task 12, AC42), and the sliders icon beside it that opens Customize on
 * the agents tab with a keyboard-focusable tooltip (AC9). No "All Systems"
 * page or link exists anywhere here (AC14). The workspace, system, and
 * account triggers toggle their own overlay on a repeated click and
 * replace any other open overlay (focus returns to the root trigger).
 */
import { useState, type MouseEvent } from 'react'
import { RECENT_SESSIONS, WORKSPACE } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import CollapseIcon from './CollapseIcon'
import { useOverlayLifecycle } from './OverlayLifecycle'

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
            return (
              <li key={session.id} className="kx-sidebar__session kx-tooltip-host">
                {/* Full-title tooltip — CSS reveals it on hover/focus-within;
                    aria-hidden so screen readers hear the row text only once. */}
                <span className="kx-tooltip kx-sidebar__session-tooltip" aria-hidden="true">
                  {session.title}
                </span>
                <div className="kx-sidebar__session-title-row">
                  <span className="kx-sidebar__session-title">{session.title}</span>
                  <button
                    type="button"
                    className="kx-sidebar__session-pin"
                    aria-pressed={pinned}
                    aria-label={pinned ? 'Unpin session' : 'Pin session'}
                    title={pinned ? 'Unpin session' : 'Pin session'}
                    onClick={(event) => {
                      event.stopPropagation()
                      togglePinned(session.id)
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
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'customize', tab: 'agents' } })
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
      </div>
    </nav>
  )
}
