import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getAggregatedCss } from '../../test/cssAggregate'
import LearnedDrawer from './LearnedDrawer'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { AUDIT_HISTORY, PENDING_REVIEWS, SYSTEMS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the drawer behind the real reducer via the mockup context,
// mounted exactly the way AppShell mounts it (Task 10): the overlay slot
// renders the drawer only while overlay.kind === 'learned'. A state
// bucket captures the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderLearnedDrawer(
  overlay: MockupOverlay = { kind: 'none' },
  initial?: Partial<MockupState>,
) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial, overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          {state.overlay.kind === 'learned' && <LearnedDrawer />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getDrawer = () => screen.getByRole('dialog', { name: 'Konteks Learned' })
const getTablist = () => screen.getByRole('tablist', { name: /konteks learned tabs/i })
const getTab = (name: string) => within(getTablist()).getByRole('tab', { name })
const getTabPanel = () => screen.getByRole('tabpanel')

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so the fixed 450px right geometry is
// verified against the shipped CSS directly (tokens.test.ts convention).
const css = getAggregatedCss()
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** The shipped .kx-drawer primitive block — geometry assertions stay
 * scoped to it instead of leaking across later rules. */
const drawerBlock = css.match(/\.kx-drawer\s*\{[^}]*\}/)![0]

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const systemNameById = new Map(SYSTEMS.map((system) => [system.id, system.name]))

// ---------------------------------------------------------------------------
// Frame + mount gating (spec §12, §16)
// ---------------------------------------------------------------------------

describe('LearnedDrawer — frame', () => {
  it('renders only while the learned overlay is open — no other overlay kind mounts it', () => {
    const closed = renderLearnedDrawer()
    expect(closed.container.querySelector('.kx-learned')).toBeNull()
    closed.unmount()

    const other = renderLearnedDrawer({ kind: 'customize', destination: { section: 'agents' } })
    expect(other.container.querySelector('.kx-learned')).toBeNull()
    other.unmount()

    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    expect(getDrawer()).toBeInTheDocument()
  })

  it('is a labelled right-drawer dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title, with exactly one close control', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const drawer = getDrawer()
    expect(drawer).toHaveClass('kx-drawer', 'kx-learned')
    expect(drawer).toHaveAttribute('aria-modal', 'true')

    const title = within(drawer).getByRole('heading', { name: 'Konteks Learned' })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the drawer in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, drawer)).toBe(true)

    // Header dismiss control — exactly one.
    expect(within(drawer).getAllByRole('button', { name: 'Close' })).toHaveLength(1)
  })

  it('carries the fixed right geometry in CSS — pinned to the right edge, full height, 450px through the token (AC39)', () => {
    expect(drawerBlock).toMatch(/position:\s*fixed/)
    expect(drawerBlock).toMatch(/top:\s*0/)
    expect(drawerBlock).toMatch(/right:\s*0/)
    expect(drawerBlock).toMatch(/bottom:\s*0/)
    expect(drawerBlock).toMatch(/width:\s*var\(--kx-drawer-w\)/)
    // The token resolves to the spec's exact 450px (AC39).
    expect(tokens).toMatch(/--kx-drawer-w:\s*450px/)
  })

  it('moves focus to the drawer on mount', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    expect(getDrawer()).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the drawer (AC45)', () => {
    const { bucket } = renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderLearnedDrawer({ kind: 'learned', tab: 'audit' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Tab navigation — Pending default/primary + Audit History (§12, AC39)
// ---------------------------------------------------------------------------

describe('LearnedDrawer — tab nav', () => {
  it('renders exactly two tabs in order — Pending first, Audit History second', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const tabs = within(getTablist()).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Pending', 'Audit History'])
    expect(getTablist()).toBeVisible()
  })

  it('selects the tab carried by overlay.tab — Pending by default, Audit History when requested', () => {
    const pending = renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    expect(getTab('Pending')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('Audit History')).toHaveAttribute('aria-selected', 'false')
    pending.unmount()

    renderLearnedDrawer({ kind: 'learned', tab: 'audit' })
    expect(getTab('Audit History')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('Pending')).toHaveAttribute('aria-selected', 'false')
  })

  it('wires tab and panel through aria-controls/aria-labelledby', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    expect(getTab('Pending')).toHaveAttribute('aria-controls', getTabPanel().id)
    expect(getTabPanel()).toHaveAttribute('aria-labelledby', getTab('Pending').id)

    fireEvent.click(getTab('Audit History'))
    expect(getTab('Audit History')).toHaveAttribute('aria-controls', getTabPanel().id)
    expect(getTabPanel()).toHaveAttribute('aria-labelledby', getTab('Audit History').id)
  })

  it('renders exactly one tab panel — only the selected tab mounts its content', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'audit' })
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(getTabPanel()).toHaveTextContent(AUDIT_HISTORY[0].action)
    expect(getTabPanel()).not.toHaveTextContent(PENDING_REVIEWS[0].title)
  })
})

// ---------------------------------------------------------------------------
// In-place switching — OPEN_OVERLAY learned + tab, frame never remounts (AC39)
// ---------------------------------------------------------------------------

describe('LearnedDrawer — in-place tab switching', () => {
  it('tab buttons dispatch OPEN_OVERLAY learned with the selected tab — aria-selected moves and the panel content swaps', () => {
    const { bucket } = renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    fireEvent.click(getTab('Audit History'))
    expect(bucket.current?.overlay).toEqual({ kind: 'learned', tab: 'audit' })
    expect(getTab('Audit History')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('Pending')).toHaveAttribute('aria-selected', 'false')
    expect(getTabPanel()).toHaveTextContent(AUDIT_HISTORY[0].action)

    fireEvent.click(getTab('Pending'))
    expect(bucket.current?.overlay).toEqual({ kind: 'learned', tab: 'pending' })
    expect(getTab('Pending')).toHaveAttribute('aria-selected', 'true')
    expect(getTabPanel()).toHaveTextContent(PENDING_REVIEWS[0].title)
  })

  it('switching tabs never remounts the frame — the same drawer, header, nav, and sole scroll region stay mounted', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const drawer = getDrawer()
    const title = within(drawer).getByRole('heading', { name: 'Konteks Learned' })
    const close = within(drawer).getByRole('button', { name: 'Close' })
    const head = drawer.querySelector('.kx-learned__head')!
    const nav = getTablist()

    fireEvent.click(getTab('Audit History'))
    fireEvent.click(getTab('Pending'))

    // Same DOM nodes still connected — the frame never remounted.
    expect(document.contains(drawer)).toBe(true)
    expect(document.contains(title)).toBe(true)
    expect(document.contains(close)).toBe(true)
    expect(document.contains(head)).toBe(true)
    expect(document.contains(nav)).toBe(true)
    expect(getDrawer()).toBe(drawer)
    expect(getTablist()).toBe(nav)
    // Still exactly one scroll region, carrying the swapped panel.
    const regions = drawer.querySelectorAll('.kx-learned__content')
    expect(regions).toHaveLength(1)
    expect(regions[0].contains(getTabPanel())).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Scroll anatomy — header + nav static, one content scroll region (§12)
// ---------------------------------------------------------------------------

describe('LearnedDrawer — scroll anatomy', () => {
  it('renders exactly one .kx-learned__content scroll region carrying the tab panel', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const drawer = getDrawer()
    const regions = drawer.querySelectorAll('.kx-learned__content')
    expect(regions).toHaveLength(1)
    expect(regions[0].contains(getTabPanel())).toBe(true)
  })

  it('keeps the fixed header and the tab nav outside the scroll region — head, then nav, then content in document order', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const drawer = getDrawer()
    const head = drawer.querySelector('.kx-learned__head')
    const nav = getTablist()
    const content = drawer.querySelector('.kx-learned__content')!

    expect(head).not.toBeNull()
    expect(content.contains(head!)).toBe(false)
    expect(content.contains(nav)).toBe(false)

    expect(follows(head!, nav)).toBe(true)
    expect(follows(nav, content)).toBe(true)
  })

  it('scrolls only the content region in CSS — overflow sits on .kx-learned__content, not the frame', () => {
    expect(css).toMatch(/\.kx-learned__content\s*\{[^}]*overflow-y:\s*auto/)
    expect(css).toMatch(/\.kx-learned\s*\{[^}]*overflow:\s*hidden/)
  })
})

// ---------------------------------------------------------------------------
// Pending tab (AC20/AC39) — actionable waiting-review list from PENDING_REVIEWS
// ---------------------------------------------------------------------------

describe('LearnedDrawer — Pending tab', () => {
  it('lists every waiting review from PENDING_REVIEWS — title, system, summary, and time per row', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })

    const list = screen.getByRole('list', { name: 'Pending reviews' })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(PENDING_REVIEWS.length)

    for (const review of PENDING_REVIEWS) {
      const row = rows.find((row) => row.textContent!.includes(review.title))!
      expect(row.textContent).toContain(review.summary)
      expect(row.textContent).toContain(review.time)
      expect(row.textContent).toContain(systemNameById.get(review.systemId)!)
    }
  })

  it('carries one Approve and one Reject action per review — labelled with the review title', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    for (const review of PENDING_REVIEWS) {
      expect(screen.getByRole('button', { name: `Approve ${review.title}` })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: `Reject ${review.title}` })).toBeInTheDocument()
    }
  })

  it('review decisions are local-only — deciding removes the row, deciding on all shows the designed empty state, and the store never changes', () => {
    const { bucket } = renderLearnedDrawer({ kind: 'learned', tab: 'pending' })

    // Approve the first, reject the rest — rows leave the list one by one.
    fireEvent.click(screen.getByRole('button', { name: `Approve ${PENDING_REVIEWS[0].title}` }))
    expect(
      screen.queryByRole('button', { name: `Approve ${PENDING_REVIEWS[0].title}` }),
    ).not.toBeInTheDocument()
    for (const review of PENDING_REVIEWS.slice(1)) {
      fireEvent.click(screen.getByRole('button', { name: `Reject ${review.title}` }))
    }

    // All decided — the designed empty state appears in place of the list.
    expect(screen.queryByRole('list', { name: 'Pending reviews' })).not.toBeInTheDocument()
    expect(within(getTabPanel()).getByRole('heading', { name: 'No pending reviews' })).toBeInTheDocument()
    expect(getTabPanel().textContent).toContain('Audit History')

    // Nothing reaches the store — decisions are mock-only (AC46 spirit).
    expect(bucket.current).toEqual({
      ...initialState(),
      overlay: { kind: 'learned', tab: 'pending' },
    })
  })
})

// ---------------------------------------------------------------------------
// Audit History tab (AC39) — flat timeline, border-left spine + dots,
// no boxed cards
// ---------------------------------------------------------------------------

describe('LearnedDrawer — Audit History tab', () => {
  it('renders a flat timeline of AUDIT_HISTORY events — one entry per event with actor, action, and time', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'audit' })

    const timeline = screen.getByRole('list', { name: 'Audit history' })
    expect(timeline.tagName).toBe('OL')
    const entries = within(timeline).getAllByRole('listitem')
    expect(entries).toHaveLength(AUDIT_HISTORY.length)

    for (const event of AUDIT_HISTORY) {
      const entry = entries.find((entry) => entry.textContent!.includes(event.action))!
      expect(entry.textContent).toContain(event.actor)
      expect(entry.textContent).toContain(event.time)
    }
  })

  it('keeps the timeline flat — entries carry no boxed-card styling, unlike Pending rows', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'audit' })
    const timeline = screen.getByRole('list', { name: 'Audit history' })
    const entries = within(timeline).getAllByRole('listitem')
    for (const entry of entries) {
      expect(entry).toHaveClass('kx-learned-timeline__item')
      expect(entry).not.toHaveClass('kx-learned-item')
    }
  })

  it('ships the spine and dots in CSS — border-left spine on the list, round dot markers on entries, no card chrome on entries', () => {
    // Spine — the timeline list carries a left border the dots sit on.
    expect(css).toMatch(/\.kx-learned-timeline\s*\{[^}]*border-left:\s*2px solid var\(--kx-border\)/)
    // Dots — round markers positioned on the spine.
    expect(css).toMatch(/\.kx-learned-timeline__item::before\s*\{[^}]*border-radius:\s*50%/)
    expect(css).toMatch(/\.kx-learned-timeline__item::before\s*\{[^}]*position:\s*absolute/)
    // Flat — the entry block itself carries no box chrome.
    const itemBlock = css.match(/\.kx-learned-timeline__item\s*\{[^}]*\}/)![0]
    expect(itemBlock).not.toMatch(/background|border/)
    // Pending rows, by contrast, DO box — the contrast is intentional.
    expect(css).toMatch(/\.kx-learned-item\s*\{[^}]*border:\s*1px solid var\(--kx-border\)/)
  })
})

// ---------------------------------------------------------------------------
// Demo variants (AC43) — loading skeletons and designed empty states
// for both tabs, swapping the content region only
// ---------------------------------------------------------------------------

describe('LearnedDrawer — demo variants (AC43)', () => {
  it('?mock=loading — both tabs show skeleton rows instead of lists, while frame, header, and nav persist', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' }, { demoVariant: 'loading' })

    const drawer = getDrawer()
    const head = drawer.querySelector('.kx-learned__head')!
    const nav = getTablist()

    let status = screen.getByRole('status', { name: 'Loading pending reviews' })
    expect(status.querySelectorAll('.kx-learned__skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    fireEvent.click(getTab('Audit History'))
    status = screen.getByRole('status', { name: 'Loading audit history' })
    expect(status.querySelectorAll('.kx-learned__skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    // The frame never swapped — only the content region.
    expect(getDrawer()).toBe(drawer)
    expect(drawer.querySelector('.kx-learned__head')).toBe(head)
    expect(getTablist()).toBe(nav)

    // Skeletons ship in CSS — pulsing placeholder blocks.
    expect(css).toMatch(/\.kx-learned__skeleton\s*\{[^}]*animation:/)
  })

  it('?mock=empty — both tabs show their designed empty state: heading plus helper hint', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' }, { demoVariant: 'empty' })

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    let empty = within(getTabPanel()).getByRole('heading', { name: 'No pending reviews' })
    expect(empty).toBeInTheDocument()
    expect(getTabPanel().textContent).toContain('Audit History')

    fireEvent.click(getTab('Audit History'))
    empty = within(getTabPanel()).getByRole('heading', { name: 'No audit events yet' })
    expect(empty).toBeInTheDocument()
    expect(getTabPanel().textContent).toContain('appear here')

    // The designed empty states ship in CSS — centered compact blocks.
    expect(css).toMatch(/\.kx-learned__empty\s*\{[^}]*text-align:\s*center/)
  })
})

// ---------------------------------------------------------------------------
// Hygiene — semantic labels, no emoji, no placeholder TODO text (§16)
// ---------------------------------------------------------------------------

describe('LearnedDrawer — hygiene', () => {
  it('labels every control semantically and uses no emoji anywhere in the drawer', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    const drawer = getDrawer()
    expect(drawer.textContent).not.toMatch(EMOJI)

    for (const button of within(drawer).getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    for (const tab of within(getTablist()).getAllByRole('tab')) {
      expect(tab).toHaveAccessibleName()
    }
    expect(drawer).toHaveAccessibleName()
  })

  it('renders no TODO-style placeholder text in either tab — semantic headings only', () => {
    renderLearnedDrawer({ kind: 'learned', tab: 'pending' })
    fireEvent.click(getTab('Audit History'))
    fireEvent.click(getTab('Pending'))
    expect(getDrawer().textContent).not.toMatch(/\b(TODO|TBD|WIP|placeholder)\b/i)
  })
})
