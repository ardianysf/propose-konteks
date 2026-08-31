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
import { resolveV2Workspace, V2_WORKSPACES } from './v2Workspaces'
import { useMockup } from '../state/MockupContext'
import CollapseIcon from '../components/shell/CollapseIcon'
import {
  CatalogIcon,
  ChevronDown,
  NewSessionIcon,
  PinIcon,
  SearchIcon,
  SlidersIcon,
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
  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]

  // Popovers are mutually exclusive by construction: one local slot.
  const [popover, setPopover] = useState<Popover>('none')

  // v2-only workspace selector state. The shared reducer has no
  // workspace concept, so the active demo workspace lives here and
  // flows into the identity card, the rail avatar, and the popover.
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(V2_WORKSPACES[0].id)
  const activeWorkspace = resolveV2Workspace(activeWorkspaceId)

  const selectWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId)
    // Carry-over: if the active system does not belong to the target
    // workspace, fall back to that workspace's first known system so the
    // UI never shows an out-of-scope pairing.
    const workspace = resolveV2Workspace(workspaceId)
    if (!workspace.systemIds.includes(state.activeSystemId)) {
      const first = workspace.systemIds.find((id) =>
        state.systems.some((system) => system.id === id),
      )
      if (first) dispatch({ type: 'SET_ACTIVE_SYSTEM', systemId: first })
    }
  }

  // Sessions disclosure — the chevron row expands/collapses the recent
  // items beneath it (the standalone "Recent" section is gone).
  const [sessionsOpen, setSessionsOpen] = useState(true)

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
              <CollapseIcon collapsed />
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
        {!collapsed && (
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
        {!collapsed && (
          <button
            type="button"
            className="kx-v2-iconbtn kx-v2-brand__collapse"
            aria-label="Collapse sidebar"
            data-testid="v2-sidebar-toggle"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          >
            <CollapseIcon collapsed={false} />
          </button>
        )}
      </div>

      {/* 2 — One context trigger: active system over the workspace/plan
          summary. Opens the combined context popover. */}
      <button
        ref={contextTriggerRef}
        type="button"
        className="kx-v2-context"
        aria-label={`${activeSystem.name} — open workspace and systems`}
        aria-haspopup="dialog"
        aria-expanded={popover === 'context'}
        data-testid="v2-context-trigger"
        onClick={() => togglePopover('context')}
      >
        <span className="kx-v2-context__mark" aria-hidden="true">
          {activeWorkspace.name[0]}
        </span>
        <span className="kx-v2-context__copy">
          <span className="kx-v2-context__system">{activeSystem.name}</span>
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
          dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'customize', tab: 'agents' } })
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
          the child sessions and rotates to reflect the disclosure state. */}
      <div className="kx-v2-sessions-block">
        <div className="kx-v2-sessions-row">
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
        </div>

      {sessionsOpen && (
        <div id="kx-v2-sessions-group" className="kx-v2-sessions-group">
          <ul className="kx-v2-recent__list">
            {orderedSessions.map((session) => {
              const system = state.systems.find((entry) => entry.id === session.systemId)
              const pinned = pinnedIds.has(session.id)
              return (
                <li key={session.id} className="kx-v2-recent__item">
                  <div className="kx-v2-recent__row">
                    <span className="kx-v2-recent__title" title={session.title}>
                      {session.title}
                    </span>
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
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={selectWorkspace}
      />
      <V2AccountPopover open={popover === 'account'} onClose={() => closePopover('account')} />
      <V2SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}
