/*
 * AppShell — the persistent application frame (Task 4, spec §6).
 *
 * The .kx-app grid: the persistent <Sidebar /> on the left (never remounts
 * across routes, AC11) and the <main> canvas hosting the route content on
 * the right. Anchored overlay menus — the system floating menu today,
 * later the profile/component menus, modals, and drawer — mount inside
 * this grid so they float right of the sidebar, never behind a modal
 * backdrop (§6.2). The new-session page (Task 5) and the Session
 * History page (Task 11) render here, swapped by the route.
 */
import { lazy, Suspense, useEffect } from 'react'
import Sidebar from './Sidebar'
import SystemMenu from './SystemMenu'
import WorkspaceMenu from './WorkspaceMenu'
import { OverlayLifecycleProvider } from './OverlayLifecycle'
import CreateSystemModal from '../context/CreateSystemModal'
import ManualRepositoryModal from '../context/ManualRepositoryModal'
import RepositorySelectorModal from '../context/RepositorySelectorModal'
import CustomizeModal from '../customize/CustomizeModal'
import LearnedDrawer from '../reviews/LearnedDrawer'
import AccountMenu from '../account/AccountMenu'
import SettingsModal from '../account/SettingsModal'
import NewSessionPage from '../../pages/NewSessionPage'
import SessionHistoryPage from '../../pages/SessionHistoryPage'
import SessionDetailPage from '../../pages/SessionDetailPage'
import { useMockup } from '../../state/MockupContext'
import SystemMapSkeleton from '../system/SystemMapSkeleton'
import './AppShell.css'

export default function AppShell() {
  const { state, dispatch } = useMockup()
  const mobileOpen = state.sidebarMobileOpen

  // Escape closes the mobile reveal drawer while it is open. Window-level
  // listener so it works wherever focus sits; mounted only while open.
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dispatch({ type: 'TOGGLE_SIDEBAR_MOBILE' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, dispatch])

  // The app classes compose independently: rail (collapse state),
  // mobile-open (reveal drawer). Desktop styling ignores the latter.
  const appClassName = [
    'kx-app',
    state.sidebarCollapsed && 'kx-app--rail',
    mobileOpen && 'kx-app--mobile-open',
  ]
    .filter(Boolean)
    .join(' ')

  // The repository-sourced Create System modal nests above the still-
  // mounted (suspended) repository selector instead of replacing it.
  const repositorySuspended =
    state.overlay.kind === 'create-system-modal' && state.overlay.source === 'repository-modal'

  // Lazy-loaded SystemMapModal with Suspense fallback
  const SystemMapModal = lazy(() => import('../system/SystemMapModal'))

  return (
    <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
      <div className={appClassName}>
        {/* Hamburger — mobile-only chrome (≤760px per AppShell.css; hidden
            on desktop). aria-expanded mirrors the reveal drawer; the icon
            is a decorative 3-line glyph (aria-hidden). */}
        <button
          type="button"
          className="kx-app__mobile-toggle"
          aria-label="Toggle sidebar"
          aria-expanded={mobileOpen}
          data-testid="mobile-sidebar-toggle"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR_MOBILE' })}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              d="M2 4h12M2 8h12M2 12h12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* Mobile drawer scrim — mounted ONLY while the reveal drawer is
            open (sidebarMobileOpen), so the desktop DOM never contains it.
            ≤760px it becomes a transparent fixed layer (AppShell.css) that
            sits below the drawer (z 45 < 50) but above the shifted main
            canvas: any tap outside the sidebar closes the drawer. Above
            760px it would be display:none anyway, but it is never even
            rendered there — the hamburger that opens the drawer is
            desktop-hidden and no other control sets the state. */}
        {mobileOpen && (
          <div
            className="kx-app__mobile-scrim"
            aria-hidden="true"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR_MOBILE' })}
          />
        )}
        <Sidebar />
        <main className="kx-main">
          {/* Route switch — the new-session page (Task 5), the dedicated
              Session History page (Task 11), and the Session Detail page (Task 13). Overlays mount on top of this. */}
          {state.route === 'new-session' ? (
            <NewSessionPage />
          ) : state.route === 'session-detail' ? (
            <SessionDetailPage />
          ) : (
            <SessionHistoryPage />
          )}
        </main>
        {/* Overlay union slot — exactly one overlay at a time; the anchored
            menus, the Task 7 context modals (repo selector, manual repo
            form, Create System), the Task 9 Customize shell, and the Task 10
            Konteks Learned drawer are the wired kinds. Later tasks add the
            rest. One nesting exception: while the repository-sourced Create
            System modal is open, the repository selector stays mounted and
            suspended behind it, so cancel/escape/create can return to it
            without losing its reducer-backed draft/search state. */}
        {state.overlay.kind === 'workspace-menu' && <WorkspaceMenu />}
        {state.overlay.kind === 'system-menu' && <SystemMenu />}
        {(state.overlay.kind === 'repository-modal' || repositorySuspended) && (
          <RepositorySelectorModal suspended={repositorySuspended} />
        )}
        {state.overlay.kind === 'manual-repo-modal' && <ManualRepositoryModal />}
        {state.overlay.kind === 'create-system-modal' && <CreateSystemModal />}
        {state.overlay.kind === 'system-map' && (
          <Suspense fallback={<SystemMapSkeleton />}>
            <SystemMapModal />
          </Suspense>
        )}
        {state.overlay.kind === 'customize' && <CustomizeModal />}
        {state.overlay.kind === 'learned' && <LearnedDrawer />}
        {state.overlay.kind === 'account-menu' && <AccountMenu />}
        {state.overlay.kind === 'settings' && <SettingsModal />}
      </div>
    </OverlayLifecycleProvider>
  )
}
