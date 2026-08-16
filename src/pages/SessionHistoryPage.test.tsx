import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SessionHistoryPage from './SessionHistoryPage'
import AppShell from '../components/shell/AppShell'
import App from '../App'
import { MockupContext, useMockup } from '../state/MockupContext'
import { initialState, mockupReducer, type MockupState } from '../state/mockupReducer'
import { SESSION_HISTORY } from '../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the page under the real reducer via the mockup context, with a
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

function renderSessionHistoryPage(search = '') {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState(search))
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <SessionHistoryPage />
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

function renderAppShell(search = '') {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState(search))
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <AppShell />
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

/** Collapse whitespace the way a rendered text node would. */
const textOf = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim()

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Page header + labelled filters
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — header and filters', () => {
  it('renders a dedicated page region with the Session history heading and labelled search/mode/system filters', () => {
    renderSessionHistoryPage()
    expect(screen.getByRole('region', { name: 'Session history' })).toHaveClass('kx-history')
    expect(screen.getByRole('heading', { name: 'Session history' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search sessions' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Mode' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'System' })).toBeInTheDocument()
  })

  it('offers the mode options and a system option for every system', () => {
    renderSessionHistoryPage()
    const mode = screen.getByRole('combobox', { name: 'Mode' })
    expect(within(mode).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'All modes',
      'Engineering',
      'Planning',
    ])

    const system = screen.getByRole('combobox', { name: 'System' })
    const options = within(system).getAllByRole('option')
    expect(options[0]).toHaveTextContent('All systems')
    expect(options.some((option) => option.textContent === 'BSI - HRIS')).toBe(true)
    expect(options.some((option) => option.textContent === 'BSI Canteen')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// List ordering + flat row layout
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — list and row layout', () => {
  it('lists SESSION_HISTORY newest-first with one flat row per session', () => {
    const { container } = renderSessionHistoryPage()
    const list = screen.getByRole('list', { name: 'Session history' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(SESSION_HISTORY.length)

    const expectedTitles = [...SESSION_HISTORY]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .map((entry) => entry.title)
    const titles = Array.from(container.querySelectorAll('.kx-history__row-title')).map((el) => el.textContent)
    expect(titles).toEqual(expectedTitles)
    expect(rows[0]).toHaveTextContent('EDP Integration Fix - Mobile')
  })

  it('lays out each row as title → Mode · System · Component metadata, then a separate time column', () => {
    const { container } = renderSessionHistoryPage()
    const first = container.querySelector('.kx-history__row') as HTMLElement

    const main = first.querySelector('.kx-history__row-main') as HTMLElement
    const title = main.querySelector('.kx-history__row-title') as HTMLElement | null
    const meta = main.querySelector('.kx-history__row-meta') as HTMLElement | null
    const time = first.querySelector('.kx-history__row-time') as HTMLElement | null
    const actions = first.querySelector('.kx-history__row-actions') as HTMLElement

    // Title first, metadata below it in the exact Mode · System · Component order.
    expect(textOf(title)).toBe('EDP Integration Fix - Mobile')
    expect(textOf(meta)).toBe('Engineering · BSI - HRIS · hris-web')
    expect(follows(title!, meta!)).toBe(true)

    // Time lives in its own next column — after the main copy, before actions,
    // and never inside the main metadata cell.
    expect(textOf(time)).toBe('2h ago')
    expect(follows(main, time!)).toBe(true)
    expect(follows(time!, actions)).toBe(true)
    expect(main).not.toContainElement(time!)
  })
})

// ---------------------------------------------------------------------------
// Three-dot action + local menu
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — three-dot action and local menu', () => {
  it('gives every row an inline-SVG three-dot action with the hover-only class', () => {
    renderSessionHistoryPage()
    const rows = within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')

    for (const row of rows) {
      const action = row.querySelector('.kx-history__action')
      expect(action).not.toBeNull()
      expect(action).toHaveClass('kx-history__action')
      expect(action).toHaveAttribute('aria-haspopup', 'menu')
      expect(action).toHaveAttribute('aria-expanded', 'false')
      const svg = action!.querySelector('svg[data-icon="more"]')
      expect(svg).not.toBeNull()
      expect(svg).toHaveAttribute('aria-hidden', 'true')
      expect(row.textContent).not.toMatch(EMOJI)
    }
  })

  it('defines hover-only action visibility in components.css (opacity 0 / pointer-events none, revealed on row hover and focus-within)', () => {
    const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
    expect(css).toMatch(/\.kx-history__action\s*\{[^}]*opacity:\s*0;/)
    expect(css).toMatch(/\.kx-history__action\s*\{[^}]*pointer-events:\s*none;/)
    expect(css).toContain('.kx-history__row:hover .kx-history__action')
    expect(css).toContain('.kx-history__row:focus-within .kx-history__action')
  })

  it('opens a local action menu from the three-dot button and closes it on selection', () => {
    renderSessionHistoryPage()
    const rows = within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')
    const action = within(rows[0]).getByRole('button', { name: 'Actions for EDP Integration Fix - Mobile' })

    fireEvent.click(action)
    expect(action).toHaveAttribute('aria-expanded', 'true')

    const menu = screen.getByRole('menu', { name: 'Actions for EDP Integration Fix - Mobile' })
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Open session',
      'Rename',
      'Delete session',
    ])

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Rename' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(action).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps at most one local action menu open at a time', () => {
    renderSessionHistoryPage()
    const rows = within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')

    fireEvent.click(within(rows[0]).getByRole('button', { name: /^Actions for/ }))
    fireEvent.click(within(rows[1]).getByRole('button', { name: /^Actions for/ }))

    expect(screen.getAllByRole('menu')).toHaveLength(1)
    expect(screen.getByRole('menu', { name: /Review attendance integration/ })).toBeInTheDocument()
    expect(screen.queryByRole('menu', { name: /EDP Integration Fix - Mobile/ })).not.toBeInTheDocument()
  })

  it('closes the open menu and restores focus to the trigger when Escape is pressed while the trigger is still focused', () => {
    renderSessionHistoryPage()
    const rows = within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')
    const action = within(rows[0]).getByRole('button', { name: 'Actions for EDP Integration Fix - Mobile' })

    fireEvent.click(action)
    expect(screen.getByRole('menu', { name: 'Actions for EDP Integration Fix - Mobile' })).toBeInTheDocument()

    // Immediately after opening, focus is still on the three-dot trigger.
    action.focus()
    expect(action).toHaveFocus()

    fireEvent.keyDown(action, { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(action).toHaveAttribute('aria-expanded', 'false')
    expect(action).toHaveFocus()
  })

  it('closes the open menu and restores focus to the row trigger when Escape is pressed on a menu item', () => {
    renderSessionHistoryPage()
    const rows = within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')
    const action = within(rows[0]).getByRole('button', { name: 'Actions for EDP Integration Fix - Mobile' })

    fireEvent.click(action)
    const menu = screen.getByRole('menu', { name: 'Actions for EDP Integration Fix - Mobile' })
    const firstItem = within(menu).getByRole('menuitem', { name: 'Open session' })

    firstItem.focus()
    expect(firstItem).toHaveFocus()

    fireEvent.keyDown(firstItem, { key: 'Escape' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(action).toHaveAttribute('aria-expanded', 'false')
    expect(action).toHaveFocus()
  })
})

// ---------------------------------------------------------------------------
// Search + combined filters
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — search and combined filters', () => {
  const rows = () => within(screen.getByRole('list', { name: 'Session history' })).getAllByRole('listitem')

  it('searches across title and metadata', () => {
    renderSessionHistoryPage()
    const search = screen.getByRole('searchbox', { name: 'Search sessions' })

    fireEvent.change(search, { target: { value: 'EDP' } })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('EDP Integration Fix - Mobile')

    // System name is part of the searched metadata.
    fireEvent.change(search, { target: { value: 'BSI Canteen' } })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Draft canteen CMS audit')

    // Component name is part of the searched metadata.
    fireEvent.change(search, { target: { value: 'checkout-api' } })
    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Validate delivery evidence')
  })

  it('filters by mode', () => {
    renderSessionHistoryPage()
    fireEvent.change(screen.getByRole('combobox', { name: 'Mode' }), { target: { value: 'planning' } })

    const items = rows()
    expect(items.length).toBeGreaterThan(0)
    for (const row of items) {
      expect(textOf(row.querySelector('.kx-history__row-meta'))).toContain('Planning')
    }

    const expectedTitles = SESSION_HISTORY.filter((entry) => entry.mode === 'planning')
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .map((entry) => entry.title)
    expect(items.map((row) => textOf(row.querySelector('.kx-history__row-title')))).toEqual(expectedTitles)
  })

  it('filters by system', () => {
    renderSessionHistoryPage()
    fireEvent.change(screen.getByRole('combobox', { name: 'System' }), { target: { value: 'mpm-mytok' } })

    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Prepare sprint proposal')
  })

  it('combines mode and system filters to an intersection', () => {
    renderSessionHistoryPage()
    fireEvent.change(screen.getByRole('combobox', { name: 'Mode' }), { target: { value: 'planning' } })
    fireEvent.change(screen.getByRole('combobox', { name: 'System' }), { target: { value: 'online-store' } })

    expect(rows()).toHaveLength(1)
    expect(rows()[0]).toHaveTextContent('Validate delivery evidence')
  })

  it('shows the designed no-results state and clears filters back to the full list', () => {
    renderSessionHistoryPage()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search sessions' }), {
      target: { value: 'zzzz-no-match' },
    })

    expect(screen.getByTestId('history-no-results')).toBeInTheDocument()
    expect(screen.getByText('No sessions match your filters')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Session history' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.queryByTestId('history-no-results')).not.toBeInTheDocument()
    expect(rows()).toHaveLength(SESSION_HISTORY.length)
  })

  it('exposes a disabled Open session action in no-results while Clear filters stays enabled and restores results', () => {
    renderSessionHistoryPage()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search sessions' }), {
      target: { value: 'zzzz-no-match' },
    })

    const noResults = screen.getByTestId('history-no-results')
    const openAction = within(noResults).getByRole('button', { name: 'Open session' })
    expect(openAction).toBeDisabled()

    const clearFilters = within(noResults).getByRole('button', { name: 'Clear filters' })
    expect(clearFilters).toBeEnabled()

    fireEvent.click(clearFilters)
    expect(screen.queryByTestId('history-no-results')).not.toBeInTheDocument()
    expect(rows()).toHaveLength(SESSION_HISTORY.length)
  })
})

// ---------------------------------------------------------------------------
// Demo loading + empty variants
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — demo variants', () => {
  it('renders the designed demo empty state for ?mock=empty', () => {
    renderSessionHistoryPage('?mock=empty')
    expect(screen.getByTestId('history-empty')).toBeInTheDocument()
    expect(screen.getByText('No sessions yet')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Session history' })).not.toBeInTheDocument()
  })

  it('renders the demo loading skeleton for ?mock=loading', () => {
    const { container } = renderSessionHistoryPage('?mock=loading')
    expect(screen.getByTestId('history-loading')).toBeInTheDocument()
    expect(container.querySelectorAll('.kx-history__skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByRole('list', { name: 'Session history' })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Semantics + no emoji + no fetch
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — semantics and hygiene', () => {
  it('uses semantic controls with accessible names and no emoji anywhere', () => {
    renderSessionHistoryPage()
    const page = screen.getByRole('region', { name: 'Session history' })
    expect(page.textContent).not.toMatch(EMOJI)

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
  })

  it('performs no fetch — every row renders from SESSION_HISTORY data', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderSessionHistoryPage()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// App/AppShell integration
// ---------------------------------------------------------------------------

describe('SessionHistoryPage — AppShell integration', () => {
  it('renders inside main on the session-history route with the same persistent sidebar node (outerHTML survives View all)', () => {
    const { container } = renderAppShell()
    const sidebar = container.querySelector('.kx-sidebar') as HTMLElement
    const sidebarHtml = sidebar.outerHTML
    const main = screen.getByRole('main')

    expect(within(main).queryByRole('region', { name: 'Session history' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(within(main).getByRole('region', { name: 'Session history' })).toBeInTheDocument()
    expect(within(main).getByRole('heading', { name: 'Session history' })).toBeInTheDocument()
    expect(within(main).queryByRole('region', { name: 'New session' })).not.toBeInTheDocument()

    // The persistent sidebar keeps its exact node and outerHTML (AC11).
    expect(container.querySelector('.kx-sidebar')).toBe(sidebar)
    expect(sidebar.outerHTML).toBe(sidebarHtml)
  })

  it('wires the session-history route through the App provider', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /view all/i }))
    expect(screen.getByRole('region', { name: 'Session history' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Session history' })).toBeInTheDocument()
  })
})
