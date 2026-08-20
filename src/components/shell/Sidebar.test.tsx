import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { getAggregatedCss } from '../../test/cssAggregate'
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

import NewSessionPage from '../../pages/NewSessionPage'

function renderSidebar(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <Sidebar />
          {state.route === 'new-session' ? <NewSessionPage /> : null}
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
const css = getAggregatedCss()

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

  it('renders the sidebar minimize/maximize control in its own brand row — not the page header (AC12)', () => {
    renderSidebar()
    const nav = getSidebarNav()
    const toggle = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(nav.contains(toggle)).toBe(true)
    expect(toggle).toHaveAttribute('data-testid', 'sidebar-toggle')
    // The New Session page header no longer carries the toggle.
    const header = screen.getByTestId('new-session-header')
    expect(header.querySelector('[data-testid="sidebar-toggle"]')).toBeNull()
    expect(within(header).queryByRole('button', { name: /sidebar/i })).toBeNull()
  })

  it('uses the real Konteks logo assets — expanded logo by default, rail icon when collapsed', () => {
    renderSidebar()
    const logo = screen.getByRole('img', { name: 'Konteks' })
    expect(logo).toHaveAttribute('src', '/assets/konteks/logo-text-main.png')
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    // In the rail the logo area becomes the expand button; the rail icon
    // is decorative inside it (the button carries the accessible name).
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    const railImg = expandBtn.querySelector('img.kx-sidebar__logo-img')
    expect(railImg).not.toBeNull()
    expect(railImg).toHaveAttribute('src', '/assets/konteks/web-topbar-icon-128.png')
    fireEvent.click(expandBtn)
    expect(screen.getByRole('img', { name: 'Konteks' })).toHaveAttribute(
      'src',
      '/assets/konteks/logo-text-main.png',
    )
  })

  it('rail logo area is the maximize control — hover/focus swaps the icon for the expand chevron', () => {
    const { bucket } = renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: /collapse sidebar/i }))
    expect(bucket.current?.sidebarCollapsed).toBe(true)

    // In the rail the top-right toggle stands down; the only sidebar
    // toggle left is the logo-area expand button with the rail icon at rest.
    expect(screen.queryByRole('button', { name: /collapse sidebar/i })).toBeNull()
    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    expect(expandBtn).toHaveClass('kx-sidebar__logo--expand')
    expect(expandBtn).toHaveAttribute('data-testid', 'sidebar-toggle')
    expect(expandBtn.querySelector('img.kx-sidebar__logo-img')).not.toBeNull()

    // The hover/focus expand-chevron layer exists, aria-hidden, and the CSS
    // reveals it on hover/focus while the resting img prevents layout shift.
    const layer = expandBtn.querySelector('.kx-sidebar__logo-expand-icon')
    expect(layer).not.toBeNull()
    expect(layer).toHaveAttribute('aria-hidden', 'true')
    expect(layer!.querySelector('svg[data-icon="expand-sidebar"]')).not.toBeNull()
    expect(css).toMatch(/\.kx-sidebar__logo-expand-icon\s*\{[^}]*opacity: 0/)
    expect(css).toMatch(
      /\.kx-sidebar__logo--expand:hover \.kx-sidebar__logo-expand-icon[^{]*\{[^}]*opacity: 1/,
    )
    expect(css).toMatch(
      /\.kx-sidebar__logo--expand:focus-visible \.kx-sidebar__logo-expand-icon[^{]*\{[^}]*opacity: 1/,
    )

    // Clicking the logo area expands the sidebar through TOGGLE_SIDEBAR.
    fireEvent.click(expandBtn)
    expect(bucket.current?.sidebarCollapsed).toBe(false)
    expect(screen.getByRole('button', { name: /collapse sidebar/i })).toBeInTheDocument()
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

  it('hover-reveal rows: full-title tooltip (aria-hidden) + expand wrapper carrying system chip and time', () => {
    renderSidebar()
    const list = screen.getByRole('list', { name: 'Recent sessions' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(RECENT_SESSIONS.length)
    RECENT_SESSIONS.forEach((session, index) => {
      const system = SYSTEMS.find((entry) => entry.id === session.systemId)!
      const row = rows[index]

      // Tooltip host wiring — the shared CSS-only hover/focus-within reveal.
      expect(row).toHaveClass('kx-sidebar__session', 'kx-tooltip-host')

      // The tooltip repeats the FULL (untruncated) title, aria-hidden so
      // screen readers hear the row text only once. It sits outside the
      // expandable region so it never gets clipped by the 0fr collapse.
      const tooltip = row.querySelector('.kx-tooltip.kx-sidebar__session-tooltip')
      expect(tooltip).not.toBeNull()
      expect(tooltip).toHaveAttribute('aria-hidden', 'true')
      expect(tooltip!.textContent).toBe(session.title)

      // The one-line resting title lives inside the title row, beside the
      // pin control.
      const title = row.querySelector(
        ':scope > .kx-sidebar__session-title-row > .kx-sidebar__session-title',
      )
      expect(title).not.toBeNull()
      expect(title!.textContent).toBe(session.title)

      // Every row carries its pin-to-top toggle inside the title row.
      const pin = row.querySelector(
        ':scope > .kx-sidebar__session-title-row > .kx-sidebar__session-pin',
      )
      expect(pin).not.toBeNull()
      expect(pin).toHaveAttribute('aria-pressed', 'false')

      // The meta line lives inside the two-level expand wrapper.
      const expand = row.querySelector(':scope > .kx-sidebar__session-expand')
      expect(expand).not.toBeNull()
      const inner = expand!.querySelector(':scope > .kx-sidebar__session-expand-inner')
      expect(inner).not.toBeNull()
      const meta = inner!.querySelector(':scope > .kx-sidebar__session-meta')
      expect(meta).not.toBeNull()
      expect(meta!.querySelector('.kx-sidebar__session-system')).toHaveTextContent(system.name)
      expect(meta!.querySelector('.kx-sidebar__session-time')).toHaveTextContent(session.time)
    })
  })

  it('ships the CSS-only smooth expand: 0fr collapsed by default, 1fr + meta fade on hover and focus-within', () => {
    // jsdom applies no styles, so the motion contract is asserted against
    // the committed stylesheet (same source-string convention as the rail
    // and tooltip assertions above).

    // Collapsed by default, with the grid-template-rows transition driving
    // the enterprise-grade smooth open/close.
    expect(css).toMatch(
      /\.kx-sidebar__session-expand\s*\{[^}]*display: grid;[^}]*grid-template-rows: 0fr;[^}]*transition: grid-template-rows 0\.18s ease/,
    )
    // The inner wrapper clips the 0fr row so the collapsed state hides fully.
    expect(css).toMatch(
      /\.kx-sidebar__session-expand-inner\s*\{[^}]*min-height: 0;[^}]*overflow: hidden/,
    )
    // Hover AND keyboard focus-within both open the row (AC45 convention).
    expect(css).toMatch(
      /\.kx-sidebar__session:hover \.kx-sidebar__session-expand,\s*\.kx-sidebar__session:focus-within \.kx-sidebar__session-expand\s*\{[^}]*grid-template-rows: 1fr/,
    )
    // The meta line fades in alongside the expansion.
    expect(css).toMatch(/\.kx-sidebar__session-meta\s*\{[^}]*opacity: 0;[^}]*transition: opacity 0\.15s ease/)
    expect(css).toMatch(
      /\.kx-sidebar__session:hover \.kx-sidebar__session-meta,\s*\.kx-sidebar__session:focus-within \.kx-sidebar__session-meta\s*\{[^}]*opacity: 1/,
    )
    // The full-title tooltip uses the shared host mechanism and stays
    // inside the 312px sidebar: left-pinned, wrapping, max-width 260px,
    // inheriting the base tooltip's dark-theme-safe ink/raised pairing.
    expect(css).toMatch(
      /\.kx-sidebar__session-tooltip\s*\{[^}]*left: 0;[^}]*transform: none;[^}]*max-width: 260px;[^}]*white-space: normal;[^}]*text-align: left/,
    )
    // Tighter resting rows than the old two-line layout.
    expect(css).toMatch(/\.kx-sidebar__session-list\s*\{[^}]*gap: 1px/)
    expect(css).toMatch(/\.kx-sidebar__session\s*\{[^}]*padding: 5px 8px/)
  })

  it('pin-to-top: clicking a row pin moves it to the top of the list, toggles aria-pressed, and stays visible without hover', () => {
    renderSidebar()
    const list = screen.getByRole('list', { name: 'Recent sessions' })
    const rows = () => within(list).getAllByRole('listitem')
    const titleOf = (row: HTMLElement) =>
      row.querySelector('.kx-sidebar__session-title')!.textContent

    // Resting order: newest-first, nothing pinned.
    expect(titleOf(rows()[0])).toBe('EDP Integration Fix - Mobile')
    expect(titleOf(rows().at(-1)!)).toBe('Validate delivery evidence')

    // Pin the last session — it floats to the top; the rest keep order.
    const lastPin = within(rows().at(-1)!).getByRole('button', { name: 'Pin session' })
    expect(lastPin).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(lastPin)
    expect(titleOf(rows()[0])).toBe('Validate delivery evidence')
    expect(titleOf(rows()[1])).toBe('EDP Integration Fix - Mobile')
    expect(titleOf(rows().at(-1)!)).toBe('Map frontend dependencies')

    // aria-pressed + label flip on the pinned row; the pin glyph is decorative.
    const pinnedRow = rows()[0]
    const pinnedPin = within(pinnedRow).getByRole('button', { name: 'Unpin session' })
    expect(pinnedPin).toHaveAttribute('aria-pressed', 'true')
    expect(pinnedPin).toHaveAttribute('title', 'Unpin session')
    const pinSvg = pinnedPin.querySelector('svg[data-icon="pin"]')
    expect(pinSvg).not.toBeNull()
    expect(pinSvg).toHaveAttribute('aria-hidden', 'true')

    // Pinning a second row adds it to the pinned group, which keeps the
    // original list order — the older pin stays above the newer one.
    fireEvent.click(within(rows()[2]).getByRole('button', { name: 'Pin session' }))
    expect(titleOf(rows()[0])).toBe('Review attendance integration')
    expect(titleOf(rows()[1])).toBe('Validate delivery evidence')

    // Unpinning returns the row to its original position.
    fireEvent.click(within(rows()[1]).getByRole('button', { name: 'Unpin session' }))
    expect(titleOf(rows()[0])).toBe('Review attendance integration')
    expect(titleOf(rows().at(-1)!)).toBe('Validate delivery evidence')

    // CSS contract: the pin hides at rest, reveals on row hover/focus-within,
    // and stays visible (accent color) while aria-pressed=true.
    expect(css).toMatch(/\.kx-sidebar__session-pin\s*\{[^}]*opacity: 0;/)
    expect(css).toMatch(
      /\.kx-sidebar__session:hover \.kx-sidebar__session-pin,\s*\.kx-sidebar__session:focus-within \.kx-sidebar__session-pin,\s*\.kx-sidebar__session-pin\[aria-pressed='true'\]\s*\{[^}]*opacity: 1/,
    )
    expect(css).toMatch(
      /\.kx-sidebar__session-pin\[aria-pressed='true'\][^{]*\{[^}]*color: var\(--kx-accent-text-aa\)/,
    )
  })

  it('pin click regression: a mouse click blurs the pin so :focus-within never freezes the row expanded; keyboard activation keeps focus', () => {
    renderSidebar()
    const list = screen.getByRole('list', { name: 'Recent sessions' })
    const row = within(list).getAllByRole('listitem')[0]
    const pin = within(row).getByRole('button', { name: 'Pin session' })

    // Mouse path — fireEvent.click defaults to detail 0 (keyboard-like), so
    // simulate a real mouse click with detail: 1. The handler must blur the
    // pin: otherwise :focus-within would keep the meta line expanded forever
    // after the mouse leaves (verified browser bug).
    fireEvent.click(pin, { detail: 1 })
    expect(pin).toHaveAttribute('aria-pressed', 'true')
    expect(document.activeElement).not.toBe(pin)
    expect(document.activeElement).toBe(document.body)
    expect(row.matches(':focus-within')).toBe(false)

    // Same on unpin — focus must not strand on the pin either way.
    const unpin = within(row).getByRole('button', { name: 'Unpin session' })
    fireEvent.click(unpin, { detail: 1 })
    expect(document.activeElement).not.toBe(unpin)
    expect(row.matches(':focus-within')).toBe(false)

    // Keyboard path — detail 0 (the fireEvent.click default) keeps focus on
    // the pin so keyboard users retain the focus-within row expansion.
    // fireEvent does not move focus, so focus the button the way real
    // keyboard activation arrives, then activate.
    pin.focus()
    fireEvent.click(pin)
    expect(pin).toHaveAttribute('aria-pressed', 'true')
    expect(document.activeElement).toBe(pin)
    // jsdom does not implement :focus-within state matching — the focused
    // pin inside the row IS the browser :focus-within condition, and the
    // keyboard-retained focus is what keeps the row expanded (CSS rule
    // asserted in the pin-to-top test above).
    expect(row.contains(document.activeElement)).toBe(true)
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

  it('collapse toggles the rail-width class through TOGGLE_SIDEBAR and restores 312px (AC12)', () => {
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

  it('forced-rail CSS stands the in-sidebar top-right toggle down (AC12/AC44)', () => {
    const start = css.indexOf('@media (max-width: 1280px)')
    expect(start).toBeGreaterThanOrEqual(0)
    const block = css.slice(start).replace(/\s+/g, ' ')
    expect(block).toContain('.kx-sidebar__toggle { display: none; }')
    expect(block).not.toContain('.kx-new-session__sidebar-toggle')
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
