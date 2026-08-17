import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import NewSessionPage from '../../pages/NewSessionPage'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import { initialState, mockupReducer, type MockupState } from '../../state/mockupReducer'
import { COMPONENTS, REPOSITORIES } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the menu mounted exactly the way NewSessionPage anchors it:
// the Component trigger's anchor wrapper renders the menu only while
// overlay.kind === 'component-menu' (Task 8), under the real reducer via
// the mockup context. A state bucket captures the committed store for
// dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderPage(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <NewSessionPage />
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getTrigger = () => screen.getByTestId('component-trigger')

const openMenu = () => {
  fireEvent.click(getTrigger())
  return screen.getByTestId('component-menu')
}

const repoNameOf = (componentId: string) =>
  REPOSITORIES.find((repo) => repo.id === COMPONENTS.find((c) => c.id === componentId)!.repoId)!
    .name

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so anchoring styling is verified
// against the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Anchoring (Task 8, spec §7.4 — AC30)
// ---------------------------------------------------------------------------

describe('ComponentMenu — anchoring (AC30)', () => {
  it('renders only while the component-menu overlay is open, from the Component trigger anchor wrapper', () => {
    renderPage()
    expect(screen.queryByTestId('component-menu')).toBeNull()
    const trigger = getTrigger()
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    const menu = screen.getByTestId('component-menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Anchored: the menu lives inside the Component trigger's anchor
    // wrapper — a sibling of the trigger, not a page-level overlay slot.
    const anchor = trigger.closest('.kx-setup-row__component-anchor')
    expect(anchor).not.toBeNull()
    expect(menu.closest('.kx-setup-row__component-anchor')).toBe(anchor)
    expect(menu.parentElement).toBe(anchor)
    expect(menu.contains(trigger)).toBe(false)

    // Exactly one overlay: opening another kind unmounts this menu.
    fireEvent.click(screen.getByRole('button', { name: /execution profile/i }))
    expect(screen.queryByTestId('component-menu')).toBeNull()
    expect(screen.getByTestId('execution-profile-menu')).toBeInTheDocument()
  })

  it('is a floating .kx-menu aligned above/left of the trigger — no modal, no backdrop, no header (AC30)', () => {
    renderPage()
    const menu = openMenu()
    expect(menu).toHaveClass('kx-menu', 'kx-component-menu')
    expect(menu).toHaveAttribute('role', 'menu')
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(menu.querySelectorAll('h1,h2,h3,h4,h5,h6,header')).toHaveLength(0)

    // Above/left anchoring ships in CSS (jsdom convention): the menu
    // drops above the trigger, flush with its left edge.
    expect(css).toContain('.kx-setup-row__component-anchor')
    expect(css).toMatch(/\.kx-component-menu\s*\{[^}]*bottom:\s*calc\(100%\s*\+\s*8px\)/)
    expect(css).toMatch(/\.kx-component-menu\s*\{[^}]*top:\s*auto/)
    expect(css).toMatch(/\.kx-component-menu\s*\{[^}]*left:\s*0/)
  })

  it('toggles closed on a second click of the same Component trigger', async () => {
    const { bucket } = renderPage()
    const trigger = getTrigger()

    fireEvent.click(trigger)
    expect(screen.getByTestId('component-menu')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })

    // The second click dismisses through the lifecycle — focus returns
    // to the trigger — instead of re-opening.
    fireEvent.click(trigger)
    expect(screen.queryByTestId('component-menu')).toBeNull()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('unmounts and reopens cleanly through the trigger — selection survives the cycle', () => {
    const { bucket } = renderPage()
    const menu = openMenu()
    fireEvent.click(
      within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ }),
    )
    expect(bucket.current?.selectedComponentIds).toEqual(['comp-canteen-api'])

    // Close via Escape (the trigger also toggles — see above).
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('component-menu')).toBeNull()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')

    // Reopen: fresh mount, same committed selection.
    const reopened = openMenu()
    expect(
      within(reopened).getByRole('menuitemcheckbox', { name: /canteen-api/, checked: true }),
    ).toBeInTheDocument()
    expect(bucket.current?.selectedComponentIds).toEqual(['comp-canteen-api'])
  })
})

// ---------------------------------------------------------------------------
// Flat component rows (Task 8, spec §7.4 — AC31)
// ---------------------------------------------------------------------------

describe('ComponentMenu — flat rows (AC31)', () => {
  it('lists every component flat — name with its repository underneath on the same row', () => {
    renderPage()
    const menu = openMenu()

    const rows = menu.querySelectorAll('.kx-component-menu__row')
    expect(rows).toHaveLength(COMPONENTS.length)

    COMPONENTS.forEach((component, index) => {
      const row = rows[index] as HTMLElement
      // Same row carries the component name…
      const name = within(row).getByText(component.name, { exact: true })
      // …with the repository underneath it, in document order.
      const repo = within(row).getByText(repoNameOf(component.id), { exact: true })
      expect(name.closest('.kx-component-menu__row')).toBe(row)
      expect(repo.closest('.kx-component-menu__row')).toBe(row)
      expect(follows(name, repo)).toBe(true)
    })
  })

  it('carries no component-type chip/label and no group headers — the list stays flat', () => {
    renderPage()
    const menu = openMenu()

    expect(menu.querySelectorAll('.kx-chip')).toHaveLength(0)
    expect(menu.querySelectorAll('[data-type], .kx-component-menu__type')).toHaveLength(0)
    expect(menu.querySelectorAll('h1,h2,h3,h4,h5,h6,legend')).toHaveLength(0)
    expect(menu.querySelectorAll('[role="group"], section')).toHaveLength(0)

    // Row copy is exactly name + repository — nothing else tags along
    // (JSX collapses inter-span whitespace, hence no separator).
    const first = menu.querySelectorAll('.kx-component-menu__row')[0] as HTMLElement
    const expected = `${COMPONENTS[0].name}${repoNameOf(COMPONENTS[0].id)}`
    expect(first.textContent?.replace(/\s+/g, '')).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// Search across component and repository names (Task 8, spec §7.4 — AC31)
// ---------------------------------------------------------------------------

describe('ComponentMenu — search (AC31)', () => {
  it('offers a labeled search bound to the store’s components slot — typing dispatches SET_SEARCH', () => {
    const { bucket } = renderPage()
    openMenu()

    const search = screen.getByRole('searchbox', { name: 'Search components or repositories' })
    expect(search).toHaveValue('')

    fireEvent.change(search, { target: { value: 'canteen' } })
    expect(search).toHaveValue('canteen')
    expect(bucket.current?.search.components).toBe('canteen')
    expect(bucket.current?.search.repositories).toBe('')
  })

  it('filters by component name', () => {
    renderPage()
    openMenu()
    fireEvent.change(screen.getByRole('searchbox', { name: /search components/i }), {
      target: { value: 'canteen' },
    })

    const menu = screen.getByTestId('component-menu')
    const rows = menu.querySelectorAll('.kx-component-menu__row')
    expect(rows).toHaveLength(2)
    expect(within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitemcheckbox', { name: /canteen-cms/ })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemcheckbox', { name: /hris-web/ })).not.toBeInTheDocument()
  })

  it('filters by repository name even when the component name does not match', () => {
    renderPage()
    openMenu()
    fireEvent.change(screen.getByRole('searchbox', { name: /search components/i }), {
      target: { value: 'fe-richapp' },
    })

    const menu = screen.getByTestId('component-menu')
    const rows = menu.querySelectorAll('.kx-component-menu__row')
    expect(rows).toHaveLength(1)
    expect(within(menu).getByRole('menuitemcheckbox', { name: /richapp-fe/ })).toBeInTheDocument()
    expect(within(rows[0] as HTMLElement).getByText('richapp/fe-richapp')).toBeInTheDocument()
  })

  it('shows a designed no-matches state when nothing matches either name (AC43)', () => {
    renderPage()
    openMenu()
    fireEvent.change(screen.getByRole('searchbox', { name: /search components/i }), {
      target: { value: 'zzzz-nothing' },
    })

    const menu = screen.getByTestId('component-menu')
    expect(within(menu).getByText('No matches')).toBeInTheDocument()
    expect(
      within(menu).getByText(/no components or repositories match your search/i),
    ).toBeInTheDocument()
    expect(menu.querySelectorAll('.kx-component-menu__row')).toHaveLength(0)
    expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument()

    // Designed, not blank — and clearing restores the full flat list.
    fireEvent.change(screen.getByRole('searchbox', { name: /search components/i }), {
      target: { value: '' },
    })
    expect(menu.querySelectorAll('.kx-component-menu__row')).toHaveLength(COMPONENTS.length)
  })
})

// ---------------------------------------------------------------------------
// Multi-select + footer (Task 8, spec §7.4 — AC32)
// ---------------------------------------------------------------------------

describe('ComponentMenu — multi-select + footer (AC32)', () => {
  it('checkboxes toggle TOGGLE_COMPONENT and reflect the store selection via aria-checked', () => {
    const { bucket } = renderPage()
    const menu = openMenu()

    const canteenApi = within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ })
    expect(canteenApi).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(canteenApi)
    expect(bucket.current?.selectedComponentIds).toEqual(['comp-canteen-api'])
    expect(canteenApi).toHaveAttribute('aria-checked', 'true')

    // A second, independent selection — true multi-select.
    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /mytok-mobile/ }))
    expect(bucket.current?.selectedComponentIds).toEqual([
      'comp-canteen-api',
      'comp-mytok-mobile',
    ])

    // Toggling again removes only that component.
    fireEvent.click(canteenApi)
    expect(bucket.current?.selectedComponentIds).toEqual(['comp-mytok-mobile'])
  })

  it('footer shows the selection count and the trigger value follows it', () => {
    renderPage()
    const menu = openMenu()
    const trigger = getTrigger()

    expect(within(menu).getByText('0 selected')).toBeInTheDocument()
    expect(trigger).toHaveTextContent('Choose component')

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ }))
    expect(within(menu).getByText('1 selected')).toBeInTheDocument()
    expect(trigger).toHaveTextContent('canteen-api')

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-cms/ }))
    expect(within(menu).getByText('2 selected')).toBeInTheDocument()
    expect(trigger).toHaveTextContent('2 components')
  })

  it('Clear dispatches CLEAR_COMPONENTS, empties every checkbox, and disables while nothing is selected (AC43 disabled)', () => {
    const { bucket } = renderPage()
    const menu = openMenu()

    const clear = within(menu).getByRole('menuitem', { name: 'Clear' })
    expect(clear).toBeDisabled()

    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ }))
    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /canteen-cms/ }))
    expect(clear).toBeEnabled()

    fireEvent.click(clear)
    expect(bucket.current?.selectedComponentIds).toEqual([])
    expect(within(menu).getByText('0 selected')).toBeInTheDocument()
    expect(
      within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/, checked: false }),
    ).toBeInTheDocument()
    expect(getTrigger()).toHaveTextContent('Choose component')
    expect(clear).toBeDisabled()
  })
})

// ---------------------------------------------------------------------------
// Demo variants — loading + empty (Task 8, spec §7.4 — AC43)
// ---------------------------------------------------------------------------

describe('ComponentMenu — demo variants (AC43)', () => {
  it('?mock=loading renders designed skeleton rows instead of the list', () => {
    renderPage({ demoVariant: 'loading' })
    const menu = openMenu()

    const loading = within(menu).getByRole('status', { name: 'Loading components' })
    const skeletons = loading.querySelectorAll('.kx-component-menu__skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    skeletons.forEach((skeleton) => expect(skeleton).toHaveAttribute('aria-hidden', 'true'))

    // No interactive rows while loading — and the frame persists.
    expect(menu.querySelectorAll('.kx-component-menu__row')).toHaveLength(0)
    expect(screen.getByRole('searchbox', { name: /search components/i })).toBeInTheDocument()
    expect(within(menu).getByText('0 selected')).toBeInTheDocument()
    expect(css).toMatch(/\.kx-component-menu__skeleton\s*\{[^}]*animation/)
  })

  it('?mock=empty renders a designed empty state, not a blank area', () => {
    renderPage({ demoVariant: 'empty' })
    const menu = openMenu()

    expect(within(menu).getByText('No components yet')).toBeInTheDocument()
    expect(
      within(menu).getByText(/components appear once repositories are connected/i),
    ).toBeInTheDocument()
    expect(menu.querySelectorAll('.kx-component-menu__row')).toHaveLength(0)
    expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument()
    expect(css).toContain('.kx-component-menu__empty')
  })
})

// ---------------------------------------------------------------------------
// Keyboard dismissal + semantics + hygiene (AC45 support)
// ---------------------------------------------------------------------------

describe('ComponentMenu — Escape + semantics + hygiene', () => {
  it('Escape dispatches CLOSE_OVERLAY through the shared OverlayLifecycle listener', () => {
    const { bucket } = renderPage()
    openMenu()
    expect(bucket.current?.overlay).toEqual({ kind: 'component-menu' })

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByTestId('component-menu')).toBeNull()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('exposes careful menu semantics — labeled menu, menuitemcheckbox rows, presentational footer', () => {
    renderPage()
    const menu = openMenu()

    expect(menu).toHaveAttribute('aria-label', 'Components')
    expect(within(menu).getAllByRole('menuitemcheckbox')).toHaveLength(COMPONENTS.length)

    // Every checkable row names itself with component + repository.
    const row = within(menu).getByRole('menuitemcheckbox', { name: /canteen-api/ })
    expect(row).toHaveAccessibleName(/canteen-api/)
    expect(row).toHaveAccessibleName(/bsi\/canteen-backend/)

    // The search stays a searchbox — never a menu item; Clear is the one
    // plain action exposed as a menu item.
    expect(within(menu).getAllByRole('searchbox')).toHaveLength(1)
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(1)
  })

  it('uses no emoji, no imagery, and no network affordances anywhere in the menu', () => {
    renderPage()
    openMenu()
    const menu = screen.getByTestId('component-menu')
    expect(menu.textContent).not.toMatch(EMOJI)
    expect(menu.querySelectorAll('img')).toHaveLength(0)
    expect(menu.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0)
    expect(menu.querySelectorAll('a[href]')).toHaveLength(0)
  })
})
