import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { getAggregatedCss } from '../../test/cssAggregate'
import SystemMenu from './SystemMenu'
import { OverlayLifecycleProvider } from './OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { SYSTEMS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — SystemMenu behind the real reducer, mounted exactly the way
// AppShell mounts it: the overlay slot renders the menu only while
// overlay.kind === 'system-menu'. A state bucket captures the committed
// store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderSystemMenu(overlay: MockupOverlay = { kind: 'none' }) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          {state.overlay.kind === 'system-menu' && <SystemMenu />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getMenu = () => screen.getByRole('menu', { name: 'Systems' })

// jsdom does not load stylesheets, so anchoring/scroll/sticky rules are
// verified against the shipped CSS directly (tokens.test.ts convention).
const css = getAggregatedCss()

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// SystemMenu contract (Task 4 Part B — spec §6.2, AC7/8/13/14)
// ---------------------------------------------------------------------------

describe('SystemMenu', () => {
  it('renders only while the system-menu overlay is open — no other overlay kind mounts it', () => {
    const closed = renderSystemMenu()
    expect(closed.container.querySelector('.kx-system-menu')).toBeNull()
    closed.unmount()

    const other = renderSystemMenu({ kind: 'create-system-modal', source: 'system-menu' })
    expect(other.container.querySelector('.kx-system-menu')).toBeNull()
    other.unmount()

    renderSystemMenu({ kind: 'system-menu' })
    expect(getMenu()).toBeInTheDocument()
  })

  it('is a floating .kx-menu anchored right of the sidebar — no modal backdrop, no heading/header (§6.2)', () => {
    renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    expect(menu).toHaveClass('kx-menu', 'kx-system-menu')
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(within(menu).queryByRole('heading')).not.toBeInTheDocument()
    expect(menu.querySelectorAll('h1,h2,h3,h4,h5,h6,header')).toHaveLength(0)
    // Anchoring ships in components.css, token-aware for both sidebar widths.
    expect(css).toContain('calc(var(--kx-sidebar-w) +')
    expect(css).toContain('calc(var(--kx-sidebar-rail) +')
  })

  it('pins the All systems row above the list in every state — search region, pinned row, scrolling list, sticky footer (§6.2)', () => {
    renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    const regions = Array.from(menu.children)
    expect(regions).toHaveLength(4)
    expect(regions[0]).toHaveClass('kx-system-menu__search')
    expect(regions[1]).toHaveClass('kx-system-menu__all')
    expect(regions[2]).toHaveClass('kx-system-menu__list')
    expect(regions[3]).toHaveClass('kx-system-menu__footer')
    expect(within(menu).getByText('All systems').closest('.kx-system-menu__all')).toBe(regions[1])

    // The pinned row survives a search that empties the list.
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search systems' }), {
      target: { value: 'zzz-no-match' },
    })
    expect(within(menu).getByText('All systems')).toBeInTheDocument()
  })

  it('labels its search field and filters systems through the store search slot', () => {
    const { bucket } = renderSystemMenu({ kind: 'system-menu' })
    const search = screen.getByRole('searchbox', { name: 'Search systems' })
    fireEvent.change(search, { target: { value: 'canteen' } })
    expect(bucket.current?.search.systems).toBe('canteen')
    const menu = getMenu()
    expect(within(menu).getAllByRole('menuitem', { name: /canteen/i })).toHaveLength(1)
    expect(within(menu).queryByRole('menuitem', { name: /hris/i })).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: 'zzz-no-match' } })
    expect(within(menu).queryByRole('menuitem', { name: /bsi/i })).not.toBeInTheDocument()
    expect(within(menu).getByText(/no systems match your search/i)).toBeInTheDocument()
  })

  it('renders system rows as inline neutral SVG + name + repository count, with no avatar imagery (AC8)', () => {
    renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    const rows = within(menu)
      .getAllByRole('menuitem')
      .filter((row) => !/create new system/i.test(row.textContent ?? ''))
    expect(rows).toHaveLength(SYSTEMS.length)
    for (const system of SYSTEMS) {
      const row = within(menu).getByRole('menuitem', { name: new RegExp(system.name, 'i') })
      const icons = row.querySelectorAll('svg[data-icon="system"]')
      expect(icons).toHaveLength(1)
      expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
      const count = system.repoIds.length
      expect(row).toHaveTextContent(system.name)
      expect(row).toHaveTextContent(`${count} ${count === 1 ? 'repository' : 'repositories'}`)

      // The row sits in a wrap with a sibling map action (plain button,
      // decorative diagram glyph) — never a nested interactive.
      const wrap = row.closest('.kx-system-menu__item-wrap')
      expect(wrap).not.toBeNull()
      const mapBtn = within(wrap as HTMLElement).getByRole('button', {
        name: `System map for ${system.name}`,
      })
      expect(mapBtn).not.toHaveAttribute('role', 'menuitem')
      const mapIcon = mapBtn.querySelector('svg[data-icon="system-map"]')
      expect(mapIcon).not.toBeNull()
      expect(mapIcon).toHaveAttribute('aria-hidden', 'true')
    }
    expect(menu.querySelectorAll('img')).toHaveLength(0)
    expect(within(menu).queryByRole('img')).not.toBeInTheDocument()
  })

  it('opens the system-map modal from the row map action, carrying the system id', () => {
    const { bucket } = renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    for (const system of SYSTEMS) {
      expect(
        within(menu).getByRole('button', { name: `System map for ${system.name}` }),
      ).toBeInTheDocument()
    }
    fireEvent.click(
      within(menu).getByRole('button', { name: `System map for ${SYSTEMS[1].name}` }),
    )
    expect(bucket.current?.overlay).toEqual({ kind: 'system-map', systemId: SYSTEMS[1].id })
    // Opening the map replaces the menu overlay (single-overlay union).
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('marks the active system and switches systems through the store, closing itself', () => {
    const { bucket } = renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    expect(within(menu).getByRole('menuitem', { name: /bsi - hris/i })).toHaveAttribute(
      'aria-current',
      'true',
    )
    fireEvent.click(within(menu).getByRole('menuitem', { name: /kookree/i }))
    expect(bucket.current?.activeSystemId).toBe('kookree')
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('keeps the sticky Create new system footer mounted and dispatches the exact create-system overlay (AC13)', () => {
    const { bucket } = renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    const create = within(menu).getByRole('menuitem', { name: /create new system/i })
    // The footer is a sibling of the scrolling list — it never scrolls away.
    expect(create.closest('.kx-system-menu__list')).toBeNull()
    expect(create.closest('.kx-system-menu__footer')).toBe(menu.lastElementChild)

    // Still mounted while the list is filtered empty.
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search systems' }), {
      target: { value: 'zzz-no-match' },
    })
    expect(within(menu).getByRole('menuitem', { name: /create new system/i })).toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('menuitem', { name: /create new system/i }))
    expect(bucket.current?.overlay).toEqual({ kind: 'create-system-modal', source: 'system-menu' })
    // Scroll + sticky styling ship in components.css — the list is the only
    // region that scrolls; the footer stays pinned below it.
    expect(css).toContain('.kx-system-menu__list')
    expect(css).toContain('.kx-system-menu__footer')
  })

  it('exposes menu semantics — role menu, menuitem controls, labeled search', () => {
    renderSystemMenu({ kind: 'system-menu' })
    const menu = getMenu()
    expect(menu).toHaveAttribute('role', 'menu')
    // every system row + the create action; the pinned scope row stays
    // presentational, not an interactive menuitem
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(SYSTEMS.length + 1)
    expect(screen.getByRole('searchbox', { name: 'Search systems' })).toBeInTheDocument()
  })

  it('uses no emoji anywhere in the menu', () => {
    renderSystemMenu({ kind: 'system-menu' })
    expect(getMenu().textContent).not.toMatch(EMOJI)
  })
})
