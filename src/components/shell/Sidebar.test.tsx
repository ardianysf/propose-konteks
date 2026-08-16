import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Sidebar from './Sidebar'
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

function renderSidebar() {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <Sidebar />
        <main data-testid="route">{state.route}</main>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getSidebarNav = () => screen.getByRole('navigation', { name: 'Sidebar' })

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

  it('View all navigates to session history while the sidebar element stays byte-identical (AC11)', () => {
    const { bucket } = renderSidebar()
    const nav = getSidebarNav()
    const before = nav.outerHTML
    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(bucket.current?.route).toBe('session-history')
    expect(screen.getByTestId('route')).toHaveTextContent('session-history')
    expect(nav.outerHTML).toBe(before)
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

  it('contains no All Systems page or link — navigation stays inside the sidebar (AC14)', () => {
    renderSidebar()
    const nav = getSidebarNav()
    expect(screen.queryByText(/all systems/i)).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link')).not.toBeInTheDocument()
    expect(nav.querySelectorAll('a')).toHaveLength(0)
  })
})
