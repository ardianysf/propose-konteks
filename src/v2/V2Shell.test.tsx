/*
 * V2Shell tests — the /v2 navigation surface contract.
 *
 * Renders the real V2App (MockupProvider -> V2Shell -> V2Sidebar + pages)
 * the way App.test.tsx renders <App /> for the production shell, asserting:
 *   - the frame is exactly one <nav> landmark + one <main>, and each
 *     route's page renders inside it;
 *   - the exact navigation labels ("New session", "Sessions", "Recent",
 *     "Refactory · Team plan", "Refactory Admin");
 *   - NAVIGATE dispatches proven through rendered page changes;
 *   - the sidebar's own V2ContextPopover / V2AccountPopover (the shell
 *     mounts no Workspace/System/Account menus anymore) open exclusively
 *     via one local state slot, close on Escape, and return focus to
 *     their trigger;
 *   - the account popover's theme segmented control drives src/theme.ts's
 *     <html data-theme> stamp (Dark -> dark, System -> resolved scheme); and
 *   - the chrome carries no emoji.
 *
 * jsdom lacks window.matchMedia (theme.ts 'system' resolution needs it),
 * so this file installs ONE shared stub MediaQueryList per theme.test.ts's
 * convention (a single shared MQL because initTheme wires its module-level
 * change listener exactly once). localStorage and <html data-theme> are
 * reset per test so nothing leaks between tests.
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import V2App from './V2App'
import { initTheme } from '../theme'
import { SYSTEMS } from '../data/mockData'

// ---------------------------------------------------------------------------
// Shared matchMedia stub (jsdom lacks window.matchMedia)
// ---------------------------------------------------------------------------

type ChangeHandler = (event: { matches: boolean }) => void

interface StubMediaQueryList extends MediaQueryList {
  /** Set the OS scheme without notifying listeners. */
  setMatches(matches: boolean): void
  /** Fire a prefers-color-scheme change at all attached listeners. */
  emitChange(matches: boolean): void
}

function createMatchMediaStub() {
  let matches = false
  const listeners = new Set<ChangeHandler>()

  const mql: Partial<StubMediaQueryList> = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_type: string, handler: unknown) => {
      listeners.add(handler as ChangeHandler)
    },
    removeEventListener: (_type: string, handler: unknown) => {
      listeners.delete(handler as ChangeHandler)
    },
    addListener: (handler: unknown) => listeners.add(handler as ChangeHandler),
    removeListener: (handler: unknown) => listeners.delete(handler as ChangeHandler),
    setMatches: (next: boolean) => {
      matches = next
    },
    emitChange: (next: boolean) => {
      matches = next
      for (const handler of [...listeners]) handler({ matches: next })
    },
  }

  return { mql: mql as StubMediaQueryList, stub: vi.fn(() => mql as MediaQueryList) }
}

const media = createMatchMediaStub()
const realMatchMedia = window.matchMedia

beforeAll(() => {
  window.matchMedia = media.stub as unknown as typeof window.matchMedia
  // The entry module (src/v2/main.tsx) runs initTheme before mounting;
  // replicate that here so theme.ts's once-attached MediaQueryList change
  // listener exists and system-scheme flips re-resolve the stamp.
  initTheme()
})

afterAll(() => {
  window.matchMedia = realMatchMedia
})

beforeEach(() => {
  media.mql.setMatches(false)
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
})

// Same no-emoji convention as Sidebar.test.tsx: astral-plane pictographs,
// the dingbats/misc-symbol blocks, and the variation selector.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getNav = () => screen.getByRole('navigation')
const getContextPopover = () => screen.getByRole('dialog', { name: 'Workspace and systems' })
const getAccountPopover = () => screen.getByRole('dialog', { name: 'Account menu' })
const newSessionHeading = () => screen.getByRole('heading', { name: 'New session', level: 1 })
const historyHeading = () => screen.getByRole('heading', { name: 'Session history', level: 1 })

/** The V2 sidebar triggers (nav rows + the two popover openers). */
const TRIGGERS = {
  context: 'v2-context-trigger',
  newSession: 'v2-new-session-trigger',
  sessions: 'v2-sessions-trigger',
  account: 'v2-account-trigger',
} as const

// ---------------------------------------------------------------------------
// Frame + routes
// ---------------------------------------------------------------------------

describe('V2Shell frame', () => {
  it('renders exactly one <nav> landmark and one <main> region', () => {
    const { container } = render(<V2App />)
    expect(container.querySelectorAll('nav')).toHaveLength(1)
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
    expect(getNav()).toHaveClass('kx-v2-sidebar')
    expect(container.querySelectorAll('main.kx-main')).toHaveLength(1)
    // Same shell composition contract as AppShell: one .kx-app grid root
    // carrying the v2 namespace class, with hamburger chrome present.
    const app = container.querySelector('.kx-app')
    expect(app).toHaveClass('kx-v2-root')
    expect(container.querySelector('.kx-app__mobile-toggle')).not.toBeNull()
  })

  it('renders new-session by default; Sessions navigates while its chevron independently toggles children', () => {
    render(<V2App />)

    // Default route: the New Session page inside <main>.
    expect(newSessionHeading()).toBeInTheDocument()

    // Chevron owns disclosure — label/navigation is a separate control.
    const toggle = screen.getByTestId('v2-sessions-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('EDP Integration Fix - Mobile')).toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('EDP Integration Fix - Mobile')).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    // The Sessions text/area navigates to session-history.
    fireEvent.click(screen.getByTestId(TRIGGERS.sessions))
    expect(historyHeading()).toBeInTheDocument()

    // A history row -> session-detail.
    fireEvent.click(screen.getAllByTestId('history-row')[0])
    expect(screen.getByTestId('session-detail')).toBeInTheDocument()

    // New session -> back to the New Session page.
    fireEvent.click(screen.getByTestId(TRIGGERS.newSession))
    expect(newSessionHeading()).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Session history', level: 1 }),
    ).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Exact navigation labels
// ---------------------------------------------------------------------------

describe('V2Sidebar labels', () => {
  it('rail layout swaps Sessions to a clock that navigates and parks Search at the bottom', () => {
    render(<V2App />)

    // Expanded: label + toggle, no rail pieces.
    expect(screen.getByTestId(TRIGGERS.sessions)).toBeInTheDocument()
    expect(screen.queryByTestId('v2-sessions-rail')).not.toBeInTheDocument()
    expect(screen.queryByTestId('v2-search-rail-trigger')).not.toBeInTheDocument()

    // Collapse into the rail.
    fireEvent.click(screen.getByTestId('v2-sidebar-toggle'))
    const railSessions = screen.getByTestId('v2-sessions-rail')
    expect(railSessions).toHaveAccessibleName('Sessions')
    expect(screen.queryByTestId(TRIGGERS.sessions)).not.toBeInTheDocument()
    expect(screen.queryByTestId('v2-sessions-toggle')).not.toBeInTheDocument()

    // The clock navigates straight to the session list.
    fireEvent.click(railSessions)
    expect(historyHeading()).toBeInTheDocument()
    expect(railSessions).toHaveAttribute('aria-current', 'page')

    // Bottom search opens the palette from the rail.
    fireEvent.click(screen.getByTestId('v2-search-rail-trigger'))
    expect(screen.getByTestId('v2-search-palette')).toBeInTheDocument()

    // Rail search sits directly BELOW the brand and ABOVE the context
    // card — the same top slot it holds beside the wordmark when
    // expanded.
    const railSearch = screen.getByTestId('v2-search-rail-trigger')
    const brand = screen.getByTestId('v2-sidebar-toggle')
    const context = screen.getByTestId(TRIGGERS.context)
    const follows = (a: Element, b: Element) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    expect(follows(brand, railSearch)).toBe(true)
    expect(follows(railSearch, context)).toBe(true)
  })

  it('renders the exact navigation labels', () => {
    render(<V2App />)
    expect(screen.getByRole('button', { name: 'New session' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sessions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse sessions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Customize' })).toBeInTheDocument()
    expect(screen.getByText('Component catalog')).toBeInTheDocument()
    expect(screen.queryByText('Recent')).not.toBeInTheDocument()
    expect(screen.queryByText('View all')).not.toBeInTheDocument()
    // The context trigger names the active system over the workspace/plan
    // summary; the account row names the user.
    expect(screen.getByText('BSI - HRIS')).toBeInTheDocument()
    expect(screen.getByText('Refactory')).toBeInTheDocument()
    expect(screen.getByText('Refactory Admin')).toBeInTheDocument()
  })

  it('marks New session as current by default and moves aria-current to Sessions after navigating', () => {
    render(<V2App />)
    const newSession = screen.getByTestId(TRIGGERS.newSession)
    const sessions = screen.getByTestId(TRIGGERS.sessions)
    expect(newSession).toHaveAttribute('aria-current', 'page')
    expect(sessions).not.toHaveAttribute('aria-current')

    fireEvent.click(sessions)
    expect(newSession).not.toHaveAttribute('aria-current')
    expect(sessions).toHaveAttribute('aria-current', 'page')
  })

  it('renders the popover triggers with dialog semantics and collapsed state', () => {
    render(<V2App />)
    for (const testid of [TRIGGERS.context, TRIGGERS.account]) {
      const trigger = screen.getByTestId(testid)
      expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders recent sessions with the persistent "system - time" secondary line', () => {
    render(<V2App />)
    const list = screen.getByRole('list')
    const rows = within(list).getAllByRole('listitem')
    // The full recent-sessions set renders (pins only reorder, never drop).
    expect(rows).toHaveLength(5)
    // First row: newest session under BSI - HRIS two hours ago.
    expect(rows[0]).toHaveTextContent('EDP Integration Fix - Mobile')
    expect(rows[0]).toHaveTextContent(
      `${SYSTEMS.find((system) => system.id === 'bsi-hris')!.name} \u00B7 2h ago`,
    )
    // Every row carries a meta line in the "system - time" shape.
    for (const row of rows) {
      expect(row.textContent).toMatch(/\u00B7/)
    }
  })

  it('expands task-session children and a task-row click opens the task session page with the active id set', () => {
    render(<V2App />)
    const list = screen.getByRole('list')
    const rows = within(list).getAllByRole('listitem')
    // The five-row listitem contract is untouched — task rows are buttons
    // inside the parent li, never nested list items.
    expect(rows).toHaveLength(5)

    // Only the parent carrying taskSessions (Validate delivery evidence,
    // the last row) renders the per-session disclosure.
    for (const row of rows.slice(0, -1)) {
      expect(within(row).queryByTestId('v2-session-tasks-toggle')).not.toBeInTheDocument()
    }
    const parent = rows.at(-1)!
    const toggle = within(parent).getByTestId('v2-session-tasks-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('v2-task-row')).not.toBeInTheDocument()

    // Expanding reveals the nested ticket rows; TKT-3 carries the
    // attention dot (IN_PROGRESS), the completed ones do not.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const taskRows = within(parent).getAllByTestId('v2-task-row')
    expect(taskRows).toHaveLength(3)
    const tkt3 = taskRows[2]
    expect(tkt3).toHaveTextContent('TKT-3 · Persist discount on completed orders')
    expect(tkt3.querySelector('svg[data-icon="ticket"]')).not.toBeNull()
    expect(tkt3.querySelector('.kx-v2-task-row__dot')).not.toBeNull()
    expect(taskRows[0].querySelector('.kx-v2-task-row__dot')).toBeNull()

    // Clicking TKT-3 routes to the shared task session page with the
    // active task id set; the active row carries aria-current=page and
    // the parent row stays visually associated with the open task page.
    fireEvent.click(tkt3)
    expect(screen.getByTestId('task-session-detail')).toBeInTheDocument()
    expect(tkt3).toHaveAttribute('aria-current', 'page')
    expect(parent).toHaveClass('kx-v2-recent__item--task-active')

    // "Back to plan" returns to the regular session-detail route.
    fireEvent.click(screen.getByTestId('task-back-to-plan'))
    expect(screen.getByTestId('session-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('task-session-detail')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Context popover — ONE panel for workspace + systems
// ---------------------------------------------------------------------------

describe('V2ContextPopover', () => {
  it('opens from the context trigger: workspace row drills into a floating listbox, systems scoped, create sticky', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))

    const popover = getContextPopover()
    expect(screen.getByTestId(TRIGGERS.context)).toHaveAttribute('aria-expanded', 'true')

    // The workspace identity row is collapsed by default — no list yet.
    const wsRow = screen.getByTestId('v2-popover-workspace')
    expect(wsRow).toHaveAttribute('aria-haspopup', 'listbox')
    expect(wsRow).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()

    // Tapping it opens the floating LIST — listbox semantics, not radio.
    fireEvent.click(wsRow)
    const list = screen.getByTestId('v2-popover-workspace-list')
    expect(list).toHaveAttribute('role', 'listbox')
    const options = within(list).getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(within(list).getByRole('option', { name: /Refactory/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(
      within(list).getByRole('option', { name: /MPM Digital/ }),
    ).toHaveAttribute('aria-selected', 'false')

    // ...the systems list is scoped to the active workspace...
    expect(within(popover).getByText('In Refactory')).toBeInTheDocument()
    expect(within(popover).getAllByText('BSI - HRIS').length).toBeGreaterThanOrEqual(1)
    expect(within(popover).queryByText('Hanoman')).not.toBeInTheDocument()
    // ...and the sticky create-system action.
    expect(within(popover).getByText('Create new system')).toBeInTheDocument()
  })

  it('switches workspace from the floating list: flyout closes, card + systems re-scope, panel stays open', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))

    // Open the flyout and switch to MPM Digital.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    fireEvent.click(screen.getByTestId('v2-popover-workspace-ws-mpm'))

    // The flyout closed; the panel itself stays open.
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    const popover = getContextPopover()
    expect(popover).toBeInTheDocument()

    // The identity card behind the panel now names the new workspace.
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('MPM Digital')

    // The systems list re-scoped: MPM systems in, BSI out.
    expect(within(popover).getByText('In MPM Digital')).toBeInTheDocument()
    expect(within(popover).getByText('MPM - Mytok')).toBeInTheDocument()
    expect(within(popover).queryByText('BSI Canteen')).not.toBeInTheDocument()

    // Carry-over: the active system moved into the new workspace.
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('MPM - Mytok')

    // Switching back restores the Refactory pairing.
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    fireEvent.click(screen.getByTestId('v2-popover-workspace-ws-refactory'))
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('Refactory')
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('BSI - HRIS')
  })

  it('Escape closes the flyout first, the panel only on the second press', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    fireEvent.click(screen.getByTestId('v2-popover-workspace'))
    expect(screen.getByTestId('v2-popover-workspace-list')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-popover-workspace-list')).not.toBeInTheDocument()
    expect(getContextPopover()).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-context-popover')).not.toBeInTheDocument()
  })

  it('selects All systems within the workspace as the context, and a system row re-narrows', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    const popover = getContextPopover()

    // The All-systems row leads the list, scoped to the workspace only —
    // Hanoman (another workspace) never appears.
    const allRow = within(popover).getByTestId('v2-popover-all-systems')
    expect(within(allRow).getByText('2 systems')).toBeInTheDocument()
    expect(within(popover).queryByText('Hanoman')).not.toBeInTheDocument()

    // Selecting it makes it current and the identity card follows.
    fireEvent.click(allRow)
    expect(allRow).toHaveAttribute('aria-current', 'true')
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('All systems')
    // The specific-system mark is released.
    expect(
      within(popover).getByRole('button', { name: 'BSI - HRIS 3 repos' }),
    ).not.toHaveAttribute('aria-current')

    // Choosing a concrete system again re-narrows the card.
    fireEvent.click(within(popover).getByRole('button', { name: 'BSI Canteen 2 repos' }))
    expect(screen.getByTestId(TRIGGERS.context).textContent).toContain('BSI Canteen')
  })

  it('filters the system list from the local search field', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    const popover = getContextPopover()

    fireEvent.change(within(popover).getByPlaceholderText('Search systems…'), {
      target: { value: 'BSI' },
    })
    expect(within(popover).getAllByText('BSI - HRIS').length).toBeGreaterThanOrEqual(1)
    expect(within(popover).queryByText('Hanoman')).not.toBeInTheDocument()
  })

  it('closes on Escape through its document-level listener and restores trigger focus', async () => {
    render(<V2App />)
    const trigger = screen.getByTestId(TRIGGERS.context)
    fireEvent.click(trigger)
    expect(getContextPopover()).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    // Focus returns to the origin trigger, never dropped on a removed node.
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('closes on scrim dismissal', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    const wrapper = screen.getByTestId('v2-context-popover')
    fireEvent.click(wrapper.querySelector('.kx-v2-pop__scrim')!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes on outside-pointer dismissal without stealing focus back to the trigger', async () => {
    render(<V2App />)
    const trigger = screen.getByTestId(TRIGGERS.context)
    fireEvent.click(trigger)
    expect(getContextPopover()).toBeInTheDocument()

    // A pointer-down on arbitrary page chrome (outside the popover and
    // away from the triggers) must close the popover — and must NOT run
    // the trigger focus-return, unlike Escape/scrim dismissal.
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => expect(document.activeElement).not.toBe(trigger))
  })

  it('switches popovers directly when the other trigger is clicked while one is open', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    expect(getContextPopover()).toBeInTheDocument()

    // The outside-pointer path ignores triggers on purpose: the account
    // trigger's own toggle takes over and swaps the open popover.
    fireEvent.mouseDown(screen.getByTestId(TRIGGERS.account))
    fireEvent.click(screen.getByTestId(TRIGGERS.account))
    expect(screen.getByTestId('v2-account-popover')).toBeInTheDocument()
    expect(screen.queryByTestId('v2-context-popover')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Account popover — Customize/catalog/settings live here now
// ---------------------------------------------------------------------------

describe('V2AccountPopover', () => {
  it('opens from the footer account row with the settings/logout rows (customize and catalog moved to the sidebar)', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.account))

    const popover = getAccountPopover()
    expect(screen.getByTestId(TRIGGERS.account)).toHaveAttribute('aria-expanded', 'true')
    for (const label of ['Settings', 'Billing', 'Integrations', 'Keyboard shortcuts', 'Log out']) {
      expect(within(popover).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    expect(within(popover).queryByText('Customize')).not.toBeInTheDocument()
    expect(within(popover).queryByText('Component catalog')).not.toBeInTheDocument()
  })

  it('sidebar menu rows: Customize opens the customize modal, Component catalog links to /catalog', async () => {
    render(<V2App />)

    // Catalog — plain anchor to the catalog page.
    const catalog = screen.getByTestId('v2-catalog-trigger')
    expect(catalog).toHaveAttribute('href', '/catalog')

    // Customize — dispatches the customize overlay and the modal mounts.
    fireEvent.click(screen.getByTestId('v2-customize-trigger'))
    expect(await screen.findByTestId('customize-modal')).toBeInTheDocument()
  })

  it('hands Account integrations into Customize Connections', async () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId(TRIGGERS.account))
    fireEvent.click(within(getAccountPopover()).getByRole('button', { name: 'Integrations' }))
    expect(await screen.findByRole('dialog', { name: 'Customize' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Connections' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'MCP servers' })).toHaveAttribute('aria-selected', 'true')
  })

  it('closes on Escape and restores trigger focus', async () => {
    render(<V2App />)
    const trigger = screen.getByTestId(TRIGGERS.account)
    fireEvent.click(trigger)
    expect(getAccountPopover()).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

// ---------------------------------------------------------------------------
// Popover exclusivity — one local state slot, never both
// ---------------------------------------------------------------------------

describe('V2Shell popover exclusivity', () => {
  it('opening the account popover closes the context popover and vice-versa', () => {
    render(<V2App />)

    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    expect(getContextPopover()).toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TRIGGERS.account))
    expect(getAccountPopover()).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Workspace and systems' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId(TRIGGERS.context))
    expect(getContextPopover()).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Account menu' })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Mobile reveal drawer (V2Shell's own Escape path)
// ---------------------------------------------------------------------------

describe('V2Shell mobile drawer', () => {
  it('hamburger opens the drawer with a scrim, and Escape closes it', () => {
    render(<V2App />)
    const toggle = screen.getByTestId('v2-mobile-sidebar-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('v2-mobile-scrim')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('v2-mobile-scrim')).toBeInTheDocument()

    // V2Shell's window-level Escape listener closes the drawer.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByTestId('v2-mobile-scrim')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Theme segmented control (inside the account popover) — wired to
// src/theme.ts
// ---------------------------------------------------------------------------

describe('V2 account popover theme segmented control', () => {
  it('clicking Dark stamps <html data-theme="dark"> and persists the dark preference', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-account-trigger'))
    const dark = screen.getByTestId('v2-theme-dark')
    expect(dark).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(dark)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('konteks-theme')).toBe('dark')
    expect(dark).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('v2-theme-light')).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking Light returns to the light stamp', () => {
    window.localStorage.setItem('konteks-theme', 'dark')
    document.documentElement.dataset.theme = 'dark'
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-account-trigger'))

    fireEvent.click(screen.getByTestId('v2-theme-light'))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('konteks-theme')).toBe('light')
  })

  it('clicking System returns to system behavior — the stamp resolves through prefers-color-scheme', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-account-trigger'))
    fireEvent.click(screen.getByTestId('v2-theme-dark'))
    expect(document.documentElement.dataset.theme).toBe('dark')

    // jsdom stub reads matches=false, so the resolved system theme is
    // light — while the stored preference itself becomes 'system'.
    fireEvent.click(screen.getByTestId('v2-theme-system'))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('konteks-theme')).toBe('system')
    expect(screen.getByTestId('v2-theme-system')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('v2-theme-dark')).toHaveAttribute('aria-pressed', 'false')

    // Flipping the OS scheme while in system mode re-resolves the stamp:
    // theme.ts listens for the MediaQueryList 'change' event, so drive the
    // stub's change notification (matches=true -> resolved dark). The
    // notification reaches the sidebar's subscription inside act().
    act(() => {
      media.mql.emitChange(true)
    })
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('renders the control as a labelled group of exactly three preference buttons', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-account-trigger'))
    const group = screen.getByRole('group', { name: 'Theme' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((button) => button.getAttribute('data-testid'))).toEqual([
      'v2-theme-light',
      'v2-theme-dark',
      'v2-theme-system',
    ])
  })
})

// ---------------------------------------------------------------------------
// Craft floor — no emoji in the navigation chrome
// ---------------------------------------------------------------------------

describe('V2Sidebar craft floor', () => {
  it('uses no emoji anywhere in the nav chrome', () => {
    const { container } = render(<V2App />)
    expect(getNav().textContent).not.toMatch(EMOJI)
    // ...and none in the shell chrome either.
    const appText = container.querySelector('.kx-app')!.textContent ?? ''
    expect(appText).not.toMatch(EMOJI)
  })

  it('renders the context trigger as ONE row — mark, then system name over the plan line', () => {
    render(<V2App />)
    const trigger = screen.getByTestId(TRIGGERS.context)
    // The mark carries the workspace initial.
    expect(within(trigger).getByText('R')).toBeInTheDocument()
    const systemName = within(trigger).getByText('BSI - HRIS')
    const planLine = within(trigger).getByText('Refactory')
    const follows = (a: Element, b: Element) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    expect(follows(systemName, planLine)).toBe(true)
    // Both lines live in the single __copy stack of the one trigger row.
    expect(systemName.closest('.kx-v2-context__copy')).toBe(
      planLine.closest('.kx-v2-context__copy'),
    )
  })
})

// ---------------------------------------------------------------------------
// Search palette (⌘K) — the brand-row search button
// ---------------------------------------------------------------------------

describe('V2SearchPalette', () => {
  it('opens from the search button, filters sessions and systems, and closes on Escape', () => {
    render(<V2App />)
    expect(screen.queryByTestId('v2-search-palette')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('v2-search-trigger'))
    const palette = screen.getByTestId('v2-search-palette')
    const inPalette = within(palette)
    expect(palette).toBeInTheDocument()
    expect(screen.getByLabelText('Search sessions and systems')).toHaveFocus()

    // Unfiltered: both groups render.
    expect(inPalette.getByText('Sessions', { selector: '.kx-v2-search__label' })).toBeInTheDocument()
    expect(inPalette.getByText('Systems', { selector: '.kx-v2-search__label' })).toBeInTheDocument()
    expect(inPalette.getByText('EDP Integration Fix - Mobile')).toBeInTheDocument()
    expect(inPalette.getByText('BSI - HRIS')).toBeInTheDocument()

    // Type a query: filtering applies.
    fireEvent.change(screen.getByLabelText('Search sessions and systems'), {
      target: { value: 'canteen' },
    })
    expect(inPalette.queryByText('EDP Integration Fix - Mobile')).not.toBeInTheDocument()
    expect(inPalette.getByText('BSI Canteen')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('v2-search-palette')).not.toBeInTheDocument()
  })

  it('activating a session result navigates to session-history with the search applied', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-search-trigger'))
    fireEvent.click(within(screen.getByTestId('v2-search-palette')).getByText('EDP Integration Fix - Mobile'))
    expect(screen.getByRole('heading', { name: 'Session history', level: 1 })).toBeInTheDocument()
    expect(screen.queryByTestId('v2-search-palette')).not.toBeInTheDocument()
  })
})
