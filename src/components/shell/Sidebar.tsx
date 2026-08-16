/*
 * Sidebar — the persistent 240px white shell sidebar (Task 4 Part A, spec §6.1).
 *
 * Chrome only: brand logo (real Konteks assets), the workspace box — the
 * single persistent boxed container (AC6) —, the workspace and system
 * controls with chevron-right affordances (AC7; the system floating menu
 * itself is Part B), recent sessions newest-first with system + time
 * (AC10), the "View all" control that navigates to session history while
 * the sidebar stays untouched (AC11), the collapse toggle to the 64px icon
 * rail (AC12), the user row that opens the account menu (Task 12, AC42),
 * and the sliders icon beside it that opens Customize on the agents tab
 * with a keyboard-focusable tooltip (AC9). No "All Systems" page or
 * link exists anywhere here (AC14).
 */
import { useState } from 'react'
import { ILLUSTRATIVE_DATA_NOTE, RECENT_SESSIONS, WORKSPACE } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from './OverlayLifecycle'

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

/** Double chevron pointing the direction the sidebar will move (AC12). */
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      data-icon={collapsed ? 'expand-sidebar' : 'collapse-sidebar'}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={collapsed ? 'M7 3.5 11.5 8 7 12.5M3.5 3.5 8 8l-4.5 4.5' : 'M9 3.5 4.5 8 9 12.5M12.5 3.5 8 8l4.5 4.5'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const { beginOverlayChain } = useOverlayLifecycle()
  const collapsed = state.sidebarCollapsed
  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
  const [customizeTooltipShown, setCustomizeTooltipShown] = useState(false)

  return (
    <nav aria-label="Sidebar" className={collapsed ? 'kx-sidebar kx-sidebar--rail' : 'kx-sidebar'}>
      <div className="kx-sidebar__top">
        <div className="kx-sidebar__logo">
          <img
            className="kx-sidebar__logo-img"
            src={collapsed ? LOGO_RAIL_SRC : LOGO_EXPANDED_SRC}
            alt="Konteks"
            width={collapsed ? 32 : 118}
            height={collapsed ? 32 : 26}
          />
        </div>
        <button
          type="button"
          className="kx-icon-btn kx-sidebar__collapse"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
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
          onClick={(event) => {
            beginOverlayChain(event.currentTarget)
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'workspace-menu' } })
          }}
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
        onClick={(event) => {
          beginOverlayChain(event.currentTarget)
          dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'system-menu' } })
        }}
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
          {RECENT_SESSIONS.map((session) => {
            const system = state.systems.find((entry) => entry.id === session.systemId)
            return (
              <li key={session.id} className="kx-sidebar__session">
                <span className="kx-sidebar__session-title">{session.title}</span>
                <span className="kx-sidebar__session-meta">
                  <span className="kx-sidebar__session-system">
                    {system ? system.name : session.systemId}
                  </span>
                  <span className="kx-sidebar__session-time">{session.time}</span>
                </span>
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
          onClick={(event) => {
            beginOverlayChain(event.currentTarget)
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'account-menu' } })
          }}
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

      {/* AC46 — the single visible illustrative-data marker (sidebar footer). */}
      <p className="kx-illustrative-note kx-sidebar__note" data-testid="illustrative-data-note">
        {ILLUSTRATIVE_DATA_NOTE}
      </p>
    </nav>
  )
}
