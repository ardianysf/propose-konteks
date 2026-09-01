/*
 * V2Shell — the /v2 application frame.
 *
 * Mirrors AppShell.tsx's architecture exactly: the OverlayLifecycleProvider
 * owns focus-return + Escape for reducer overlays; the root grid carries
 * the same state classes (`kx-app`, `kx-app--rail`, `kx-app--mobile-open`,
 * `kx-app--sheet-open`). The anchored Workspace/System/Account menus are
 * GONE from /v2 — the sidebar's own V2ContextPopover/V2AccountPopover
 * replace them. AppShell.css is still imported (not edited) to supply the
 * shared frame; every V2-specific visual rule lives in v2.css under
 * `.kx-v2-*`.
 */
import { lazy, Suspense, useEffect } from 'react'
import V2Sidebar from './V2Sidebar'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import CreateSystemModal from '../components/context/CreateSystemModal'
import ManualRepositoryModal from '../components/context/ManualRepositoryModal'
import RepositorySelectorModal from '../components/context/RepositorySelectorModal'
import CustomizeModal from '../components/customize/CustomizeModal'
import LearnedDrawer from '../components/reviews/LearnedDrawer'
import SettingsModal from '../components/account/SettingsModal'
import NewSessionPage from '../pages/NewSessionPage'
import SessionHistoryPage from '../pages/SessionHistoryPage'
import SessionDetailPage from '../pages/SessionDetailPage'
import TaskSessionDetailPage from '../pages/TaskSessionDetailPage'
import SessionStreamDemoPage from '../pages/SessionStreamDemoPage'
import SessionStreamDetailPage from '../pages/SessionStreamDetailPage'
import SystemMapSkeleton from '../components/system/SystemMapSkeleton'
import { useMockup } from '../state/MockupContext'
import '../components/shell/AppShell.css'
import '../components/shell/shared.css'

const SystemMapModal = lazy(() => import('../components/system/SystemMapModal'))

export default function V2Shell() {
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

  // Same class composition contract as AppShell — the reused overlay CSS
  // keys off these exact classes (rail anchoring, mobile sheets, z-order).
  const appClassName = [
    'kx-app',
    'kx-v2-root',
    state.sidebarCollapsed && 'kx-app--rail',
    mobileOpen && 'kx-app--mobile-open',
    state.overlay.kind === 'learned' && 'kx-app--sheet-open',
  ]
    .filter(Boolean)
    .join(' ')

  // The repository-sourced Create System modal nests above the still-
  // mounted (suspended) repository selector instead of replacing it.
  const repositorySuspended =
    state.overlay.kind === 'create-system-modal' && state.overlay.source === 'repository-modal'

  return (
    <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
      <div className={appClassName}>
        {/* Mobile hamburger — chrome and behavior reuse AppShell.css as-is. */}
        <button
          type="button"
          className="kx-app__mobile-toggle"
          aria-label="Toggle sidebar"
          aria-expanded={mobileOpen}
          data-testid="v2-mobile-sidebar-toggle"
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
        {/* Mobile drawer scrim — mounted only while the drawer is open. */}
        {mobileOpen && (
          <div
            className="kx-app__mobile-scrim"
            aria-hidden="true"
            data-testid="v2-mobile-scrim"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR_MOBILE' })}
          />
        )}
        <V2Sidebar />
        <main className="kx-main">
          {/* Route switch — the page components render unchanged; the
              task-session route renders the shared TaskSessionDetailPage. */}
          {state.route === 'new-session' ? (
            <NewSessionPage />
          ) : state.route === 'session-detail' ? (
            <SessionDetailPage />
          ) : state.route === 'task-session-detail' ? (
            <TaskSessionDetailPage />
          ) : state.route === 'session-demo' ? (
            <SessionStreamDemoPage />
          ) : state.route === 'session-stream-detail' ? (
            <SessionStreamDetailPage />
          ) : (
            <SessionHistoryPage />
          )}
        </main>
        {/* Overlay union slot — exactly one overlay at a time, mounted
            exactly as AppShell mounts them (same components, same lazy
            boundary, same nesting exception for the repository flow).
            The sidebar popovers live inside V2Sidebar, not here. */}
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
        {state.overlay.kind === 'settings' && <SettingsModal />}
      </div>
    </OverlayLifecycleProvider>
  )
}
