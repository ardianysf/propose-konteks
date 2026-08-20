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
import Sidebar from './Sidebar'
import SystemMenu from './SystemMenu'
import WorkspaceMenu from './WorkspaceMenu'
import { OverlayLifecycleProvider } from './OverlayLifecycle'
import CreateSystemModal from '../context/CreateSystemModal'
import ManualRepositoryModal from '../context/ManualRepositoryModal'
import RepositorySelectorModal from '../context/RepositorySelectorModal'
import SystemMapModal from '../system/SystemMapModal'
import CustomizeModal from '../customize/CustomizeModal'
import LearnedDrawer from '../reviews/LearnedDrawer'
import AccountMenu from '../account/AccountMenu'
import SettingsModal from '../account/SettingsModal'
import NewSessionPage from '../../pages/NewSessionPage'
import SessionHistoryPage from '../../pages/SessionHistoryPage'
import SessionDetailPage from '../../pages/SessionDetailPage'
import { useMockup } from '../../state/MockupContext'
import './AppShell.css'

export default function AppShell() {
  const { state, dispatch } = useMockup()

  // The repository-sourced Create System modal nests above the still-
  // mounted (suspended) repository selector instead of replacing it.
  const repositorySuspended =
    state.overlay.kind === 'create-system-modal' && state.overlay.source === 'repository-modal'

  return (
    <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
      <div className={state.sidebarCollapsed ? 'kx-app kx-app--rail' : 'kx-app'}>
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
        {state.overlay.kind === 'system-map' && <SystemMapModal />}
        {state.overlay.kind === 'customize' && <CustomizeModal />}
        {state.overlay.kind === 'learned' && <LearnedDrawer />}
        {state.overlay.kind === 'account-menu' && <AccountMenu />}
        {state.overlay.kind === 'settings' && <SettingsModal />}
      </div>
    </OverlayLifecycleProvider>
  )
}
