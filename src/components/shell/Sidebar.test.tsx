import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import Sidebar from './Sidebar'
import { OverlayLifecycleProvider } from './OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import { initialState, mockupReducer, type MockupState } from '../../state/mockupReducer'
import { RECENT_SESSIONS, SYSTEMS, WORKSPACE } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — Sidebar under the real reducer via the mockup context, with a
// state bucket capturing the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderSidebar(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <Sidebar />
          <main data-testid="route">{state.route}</main>
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getSidebarNav = () => screen.getByRole('navigation', { name: 'Sidebar' })

// jsdom does not load stylesheets, so rail treatment is verified against
// the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Sidebar contract (Task 4 Part A — spec §6.1, AC6/7/9/10/11/12/14)
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  it('renders as a semantic navigation landmark using buttons for its controls', () => {
    renderSidebar()
    const nav = getSidebarNav()
    expect(nav).toHaveClass('kx-sidebar')
    expect(screen.getByRole('button', { name: /refactory/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bsi - hris/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument()
  })

  it('uses the real Konteks logo assets — expanded logo by default, rail icon when collapsed', () => {
    renderSidebar()
    const logo = screen.getByRole('img', { name: 'Konteks' })
    expect(logo).toHaveAttribute('src', '/assets/konteks/logo-text-main.png')
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(logo).toHaveAttribute('src', '/assets/konteks/web-topbar-icon-128.png')
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(logo).toHaveAttribute('src', '/assets/konteks/logo-text-main.png')
  })

  it('marks exactly one persistent boxed container — the workspace box (AC6)', () => {
    renderSidebar()
    const nav = getSidebarNav()
    const boxed = nav.querySelectorAll('.kx-sidebar-box')
    expect(boxed).toHaveLength(1)
    expect(boxed[0]).toHaveClass('kx-sidebar__workspace')
    expect(boxed[0]).toHaveTextContent(WORKSPACE.name)
    expect(boxed[0]).toHaveTextContent(/workspace/i)
  })

  it('workspace and system controls each expose an accessible chevron-right affordance (AC7)', () => {
    renderSidebar()
    const workspaceBtn = screen.getByRole('button', { name: /refactory/i })
    const systemBtn = screen.getByRole('button', { name: /bsi - hris/i })
    for (const control of [workspaceBtn, systemBtn]) {
      const chevrons = control.querySelectorAll('svg[data-icon="chevron-right"]')
      expect(chevrons).toHaveLength(1)
      expect(chevrons[0]).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('system control dispatches OPEN_OVERLAY system-menu', () => {
    const { bucket } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /bsi - hris/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'system-menu' })
  })

  it('workspace and system controls toggle their own overlay on a second click and expose aria-expanded', async () => {
    const { bucket } = renderSidebar()
    const workspaceBtn = screen.getByRole('button', { name: /refactory/i })
    const systemBtn = screen.getByRole('button', { name: /bsi - hris/i })

    // aria-expanded tracks the open state of each control's own menu.
    expect(workspaceBtn).toHaveAttribute('aria-expanded', 'false')
    expect(systemBtn).toHaveAttribute('aria-expanded', 'false')

    // Second click on the same trigger dismisses its own overlay through
    // the lifecycle and restores focus to the trigger.
    fireEvent.click(workspaceBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'workspace-menu' })
    expect(workspaceBtn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(workspaceBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(workspaceBtn).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(workspaceBtn).toHaveFocus())

    fireEvent.click(systemBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'system-menu' })
    expect(systemBtn).toHaveAttribute('aria-expanded', 'true')
    expect(workspaceBtn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(systemBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(systemBtn).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(systemBtn).toHaveFocus())
  })

  it('account control toggles its own overlay on a second click and exposes aria-expanded', async () => {
    const { bucket } = renderSidebar()
    const accountBtn = screen.getByTestId('account-trigger')

    expect(accountBtn).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(accountBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'account-menu' })
    expect(accountBtn).toHaveAttribute('aria-expanded', 'true')

    // Second click on the same trigger dismisses through the lifecycle
    // and restores focus to the trigger.
    fireEvent.click(accountBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(accountBtn).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(accountBtn).toHaveFocus())

    // Reopening after the toggle still works.
    fireEvent.click(accountBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'account-menu' })
    expect(accountBtn).toHaveAttribute('aria-expanded', 'true')
  })

  it('cross-trigger clicks still replace the open overlay instead of toggling', () => {
    const { bucket } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /refactory/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'workspace-menu' })

    // A different trigger replaces the open overlay — replacement
    // behavior is preserved; only the same trigger toggles.
    fireEvent.click(screen.getByRole('button', { name: /bsi - hris/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'system-menu' })

    fireEvent.click(screen.getByRole('button', { name: /refactory/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'workspace-menu' })
  })

  it('workspace control dispatches OPEN_OVERLAY workspace-menu (AC7)', () => {
    const { bucket } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /refactory/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'workspace-menu' })
  })

  it('renders recent sessions newest-first, each row showing system and time (AC10)', () => {
    renderSidebar()
    const list = screen.getByRole('list', { name: 'Recent sessions' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(RECENT_SESSIONS.length)
    RECENT_SESSIONS.forEach((session, index) => {
      const system = SYSTEMS.find((entry) => entry.id === session.systemId)!
      expect(system).toBeDefined()
      expect(rows[index]).toHaveTextContent(session.title)
      expect(rows[index]).toHaveTextContent(system.name)
      expect(rows[index]).toHaveTextContent(session.time)
    })
    // mockData recentSessions is verified newest-first in mockupReducer.test —
    // the sidebar must preserve that order, newest at the top.
    expect(rows[0]).toHaveTextContent('EDP Integration Fix - Mobile')
    expect(rows.at(-1)).toHaveTextContent('Validate delivery evidence')
  })

  it('View all navigates to session history while the sidebar element stays byte-identical apart from the nav-active state (AC11)', () => {
    const { bucket } = renderSidebar()
    const nav = getSidebarNav()
    // The only allowed DOM delta is the New session control's
    // aria-current="page" route state — the sidebar never remounts.
    const stripNavState = (html: string) =>
      html.replace(' aria-current="page"', '').replace(' kx-sidebar__new-session--active', '')
    const before = nav.outerHTML
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(bucket.current?.route).toBe('session-history')
    expect(screen.getByTestId('route')).toHaveTextContent('session-history')
    expect(nav.outerHTML).toBe(stripNavState(before))
    expect(screen.getByTestId('new-session-trigger')).not.toHaveAttribute('aria-current')
  })

  // -------------------------------------------------------------------------
  // New session route control (between the system control and Recent
  // sessions)
  // -------------------------------------------------------------------------

  it('renders the New session control between the system control and Recent sessions with a decorative icon', () => {
    renderSidebar()
    const nav = getSidebarNav()
    const button = screen.getByTestId('new-session-trigger')
    expect(button).toHaveAccessibleName('New session')
    expect(button).toHaveTextContent('New session')

    // A square/plus session icon, decorative like the other shell icons.
    const icon = button.querySelector('svg[data-icon="new-session"]')
    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')

    // Document order: workspace box → system control → New session →
    // Recent sessions.
    const system = screen.getByRole('button', { name: /bsi - hris/i })
    const recent = nav.querySelector('.kx-sidebar__recent')!
    const follows = (a: Element, b: Element) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    expect(follows(system, button)).toBe(true)
    expect(follows(button, recent)).toBe(true)
  })

  it('New session dispatches NAVIGATE new-session and marks itself aria-current=page as a semantics-only active state (no resting background)', () => {
    const { bucket } = renderSidebar({ route: 'session-history' })
    const button = screen.getByTestId('new-session-trigger')
    expect(button).not.toHaveAttribute('aria-current')
    expect(button).not.toHaveClass('kx-sidebar__new-session--active')

    fireEvent.click(button)
    expect(bucket.current?.route).toBe('new-session')
    expect(screen.getByTestId('route')).toHaveTextContent('new-session')
    expect(button).toHaveAttribute('aria-current', 'page')
    expect(button).toHaveClass('kx-sidebar__new-session', 'kx-sidebar__new-session--active')

    // CSS convention: the resting control paints NOTHING — base and
    // active-route backgrounds stay transparent; only the hover/focus
    // hover affordance may fill pale. The icon chip stays semantic
    // (accent glyph color) but paints no resting background either.
    expect(css).toMatch(/\.kx-sidebar__new-session\s*\{[^}]*background: transparent/)
    expect(css).toMatch(
      /\.kx-sidebar__new-session:hover,\s*\.kx-sidebar__new-session:focus-visible\s*\{[^}]*background: var\(--kx-pale\)/,
    )
    expect(css).not.toMatch(/\.kx-sidebar__new-session--active[^{]*\{[^}]*background/)
    expect(css).toMatch(/\.kx-sidebar__new-session-icon\s*\{[^}]*background: transparent/)
    expect(css).not.toMatch(/\.kx-sidebar__new-session-icon\s*\{[^}]*background: var\(--kx-pale\)/)
  })

  it('New session closes an open overlay through the lifecycle so the route is clean and focus stays safe', async () => {
    const { bucket } = renderSidebar()
    const systemBtn = screen.getByRole('button', { name: /bsi - hris/i })
    fireEvent.click(systemBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'system-menu' })

    fireEvent.click(screen.getByTestId('new-session-trigger'))
    expect(bucket.current?.route).toBe('new-session')
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    // Focus safety: the lifecycle restores focus to the overlay's origin
    // trigger — it is never dropped onto a removed overlay element.
    await waitFor(() => expect(systemBtn).toHaveFocus())
  })

  it('keeps the New session control visible in the manual rail — only the label hides (CSS convention)', () => {
    const { bucket } = renderSidebar()
    const button = screen.getByTestId('new-session-trigger')
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(bucket.current?.sidebarCollapsed).toBe(true)

    // The control survives the rail with its accessible name intact.
    expect(screen.getByTestId('new-session-trigger')).toBe(button)
    expect(button).toHaveAccessibleName('New session')
    expect(button.querySelector('.kx-sidebar__new-session-label')).not.toBeNull()

    // The rail CSS keeps the button/icon and hides only the label.
    expect(css).toMatch(/\.kx-sidebar--rail \.kx-sidebar__new-session\s*\{[^}]*justify-content: center/)
    expect(css).toMatch(/\.kx-sidebar--rail \.kx-sidebar__new-session-label\s*\{[^}]*display: none/)
    expect(css).not.toMatch(/\.kx-sidebar--rail \.kx-sidebar__new-session\s*\{[^}]*display: none/)
  })

  it('collapse toggles the rail-width class through TOGGLE_SIDEBAR and restores 240px (AC12)', () => {
    const { bucket } = renderSidebar()
    const nav = getSidebarNav()
    expect(nav).toHaveClass('kx-sidebar')
    expect(nav).not.toHaveClass('kx-sidebar--rail')
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(bucket.current?.sidebarCollapsed).toBe(true)
    expect(nav).toHaveClass('kx-sidebar', 'kx-sidebar--rail')
    fireEvent.click(screen.getByRole('button', { name: /expand sidebar/i }))
    expect(bucket.current?.sidebarCollapsed).toBe(false)
    expect(nav).not.toHaveClass('kx-sidebar--rail')
  })

  it('user row carries an inline sliders icon whose Customize tooltip shows on keyboard focus and whose click opens Customize on agents (AC9)', () => {
    const { bucket } = renderSidebar()
    const customizeBtn = screen.getByRole('button', { name: 'Customize' })
    const sliders = customizeBtn.querySelector('svg[data-icon="sliders"]')
    expect(sliders).not.toBeNull()
    expect(sliders).toHaveAttribute('aria-hidden', 'true')

    const tooltip = customizeBtn.querySelector('[role="tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip).toHaveTextContent('Customize')
    expect(tooltip).not.toBeVisible()

    fireEvent.mouseEnter(customizeBtn)
    expect(tooltip).toBeVisible()
    fireEvent.mouseLeave(customizeBtn)
    expect(tooltip).not.toBeVisible()

    fireEvent.focus(customizeBtn) // keyboard focus reaches the control (AC45)
    expect(tooltip).toBeVisible()
    fireEvent.blur(customizeBtn)
    expect(tooltip).not.toBeVisible()

    fireEvent.click(customizeBtn)
    expect(bucket.current?.overlay).toEqual({ kind: 'customize', tab: 'agents' })
  })

  it('uses no emoji anywhere in the sidebar chrome', () => {
    renderSidebar()
    expect(getSidebarNav().textContent).not.toMatch(EMOJI)
  })

  it('renders no illustrative-data marker — the sidebar carries no marker', () => {
    renderSidebar()
    expect(screen.queryByTestId('illustrative-data-note')).not.toBeInTheDocument()
    expect(getSidebarNav().querySelectorAll('.kx-illustrative-note')).toHaveLength(0)
    expect(getSidebarNav().textContent).not.toContain('Illustrative data')
    // The shared CSS note style survives for the page-level markers.
    expect(css).not.toContain('.kx-sidebar__note')
  })

  it('contains no All Systems page or link — navigation stays inside the sidebar (AC14)', () => {
    renderSidebar()
    const nav = getSidebarNav()
    expect(screen.queryByText(/all systems/i)).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link')).not.toBeInTheDocument()
    expect(nav.querySelectorAll('a')).toHaveLength(0)
  })
})
