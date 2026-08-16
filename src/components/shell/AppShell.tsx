/*
 * AppShell — the persistent application frame (Task 4, spec §6).
 *
 * The .kx-app grid: the persistent <Sidebar /> on the left (never remounts
 * across routes, AC11) and the <main> canvas hosting the route content on
 * the right. Anchored overlay menus — the system floating menu today,
 * later the profile/component menus, modals, and drawer — mount inside
 * this grid so they float right of the sidebar, never behind a modal
 * backdrop (§6.2). The new-session page renders here (Task 5); session
 * history keeps a placeholder until Task 11.
 */
import Sidebar from './Sidebar'
import SystemMenu from './SystemMenu'
import WorkspaceMenu from './WorkspaceMenu'
import CreateSystemModal from '../context/CreateSystemModal'
import ManualRepositoryModal from '../context/ManualRepositoryModal'
import RepositorySelectorModal from '../context/RepositorySelectorModal'
import NewSessionPage from '../../pages/NewSessionPage'
import { useMockup } from '../../state/MockupContext'

export default function AppShell() {
  const { state } = useMockup()

  return (
    <div className={state.sidebarCollapsed ? 'kx-app kx-app--rail' : 'kx-app'}>
      <Sidebar />
      <main className="kx-main">
        {/* Route switch — the new-session page (Task 5); session history
            keeps its placeholder until Task 11. Overlays mount on top of
            this. */}
        {state.route === 'new-session' ? (
          <NewSessionPage />
        ) : (
          <section className="kx-page-placeholder">
            <h1>Session history</h1>
            <p>Route placeholder — page content arrives with the page tasks.</p>
          </section>
        )}
      </main>
      {/* Overlay union slot — exactly one overlay at a time; the anchored
          menus and the Task 7 context modals (repo selector, manual repo
          form, Create System) are the wired kinds. Later tasks add the
          rest. */}
      {state.overlay.kind === 'workspace-menu' && <WorkspaceMenu />}
      {state.overlay.kind === 'system-menu' && <SystemMenu />}
      {state.overlay.kind === 'repository-modal' && <RepositorySelectorModal />}
      {state.overlay.kind === 'manual-repo-modal' && <ManualRepositoryModal />}
      {state.overlay.kind === 'create-system-modal' && <CreateSystemModal />}
    </div>
  )
}
