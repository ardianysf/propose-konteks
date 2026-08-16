/*
 * AppShell — the persistent application frame (Task 4, spec §6).
 *
 * The .kx-app grid: the persistent <Sidebar /> on the left (never remounts
 * across routes, AC11) and the <main> canvas hosting the route content on
 * the right. Anchored overlay menus — the system floating menu today,
 * later the profile/component menus, modals, and drawer — mount inside
 * this grid so they float right of the sidebar, never behind a modal
 * backdrop (§6.2). Route content is a placeholder until the page tasks
 * (Task 5+) land.
 */
import Sidebar from './Sidebar'
import SystemMenu from './SystemMenu'
import WorkspaceMenu from './WorkspaceMenu'
import { useMockup } from '../../state/MockupContext'

export default function AppShell() {
  const { state } = useMockup()

  return (
    <div className={state.sidebarCollapsed ? 'kx-app kx-app--rail' : 'kx-app'}>
      <Sidebar />
      <main className="kx-main">
        {/* Minimal route placeholder — real pages arrive with the page
            tasks (Task 5+). Overlays mount on top of this. */}
        <section className="kx-page-placeholder">
          <h1>{state.route === 'session-history' ? 'Session history' : 'New session'}</h1>
          <p>Route placeholder — page content arrives with the page tasks.</p>
        </section>
      </main>
      {/* Overlay union slot — exactly one overlay at a time; the workspace
          and system menus are the wired kinds. Later tasks add the others. */}
      {state.overlay.kind === 'workspace-menu' && <WorkspaceMenu />}
      {state.overlay.kind === 'system-menu' && <SystemMenu />}
    </div>
  )
}
