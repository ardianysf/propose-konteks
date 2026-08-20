import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { getAggregatedCss } from '../../test/cssAggregate'
import SystemMapModal from './SystemMapModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import { SYSTEMS } from '../../data/mockData'

// ---------------------------------------------------------------------------
// Harness — the modal behind the real reducer via the mockup context,
// mounted exactly the way AppShell mounts it: the overlay slot renders the
// modal only while overlay.kind === 'system-map'. A state bucket captures
// the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderSystemMapModal(
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
          {state.overlay.kind === 'system-map' && <SystemMapModal />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so frame/canvas rules are verified
// against the shipped CSS directly (tokens.test.ts convention).
const css = getAggregatedCss()

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

const TARGET = SYSTEMS[1]

// ---------------------------------------------------------------------------
// Frame + mount gating
// ---------------------------------------------------------------------------

describe('SystemMapModal — frame', () => {
  it('renders only while the system-map overlay is open — no other overlay kind mounts it', () => {
    const closed = renderSystemMapModal()
    expect(closed.container.querySelector('.kx-system-map')).toBeNull()
    closed.unmount()

    const other = renderSystemMapModal({ kind: 'system-menu' })
    expect(other.container.querySelector('.kx-system-map')).toBeNull()
    other.unmount()

    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    expect(
      screen.getByRole('dialog', { name: `${TARGET.name} — system map` }),
    ).toBeInTheDocument()
  })

  it('is a centered modal dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    const dialog = screen.getByRole('dialog', { name: `${TARGET.name} — system map` })
    expect(dialog).toHaveClass('kx-modal', 'kx-system-map')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = within(dialog).getByRole('heading', { name: `${TARGET.name} — system map` })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the dialog in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, dialog)).toBe(true)

    // Header dismiss control.
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1)

    // Frame + geometry ship in components.css.
    expect(css).toContain('.kx-system-map')
    expect(css).toContain('.kx-modal-backdrop')
  })

  it('moves focus to the dialog on mount', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    expect(screen.getByRole('dialog', { name: `${TARGET.name} — system map` })).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the dialog', () => {
    const { bucket } = renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves a stale systemId safely — falls back instead of crashing', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: 'no-such-system' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByRole('heading')).toHaveTextContent(
      /— system map$/,
    )
  })
})

// ---------------------------------------------------------------------------
// Diagram contract — deterministic inline SVG, theme-token driven
// ---------------------------------------------------------------------------

describe('SystemMapModal — diagram', () => {
  it('renders an accessible inline SVG diagram: role=img, labeled, nodes + edges', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    const dialog = screen.getByRole('dialog', { name: `${TARGET.name} — system map` })
    const diagram = within(dialog).getByRole('img')
    expect(diagram.tagName.toLowerCase()).toBe('svg')
    expect(diagram).toHaveAttribute('viewBox', '0 0 640 360')
    expect(diagram.getAttribute('aria-label')).toMatch(/system map for/i)

    // 6-10 rounded-rect subsystem nodes, each with a text label; the API
    // node derives its name from the system.
    const nodes = diagram.querySelectorAll('.kx-system-map__node')
    expect(nodes.length).toBeGreaterThanOrEqual(6)
    expect(nodes.length).toBeLessThanOrEqual(10)
    for (const node of nodes) {
      expect(node.querySelector('rect')).not.toBeNull()
      expect(node.querySelector('text')?.textContent?.trim().length).toBeGreaterThan(0)
    }
    expect(diagram.textContent).toContain(`${TARGET.name} API`)
    expect(diagram.textContent).toContain('Postgres')

    // Nodes are connected by edges.
    const edges = diagram.querySelectorAll('.kx-system-map__edge')
    expect(edges.length).toBeGreaterThanOrEqual(6)

    // The canvas region carries the geometry class.
    expect(dialog.querySelector('.kx-system-map__canvas')).not.toBeNull()
  })

  it('uses theme tokens for node fill/stroke, edge stroke, and label text (CSS convention)', () => {
    expect(css).toMatch(
      /\.kx-system-map__node rect\s*\{[^}]*fill: var\(--kx-raised\)[^}]*stroke: var\(--kx-accent-strong\)/,
    )
    expect(css).toMatch(/\.kx-system-map__edge\s*\{[^}]*stroke: var\(--kx-border\)/)
    expect(css).toMatch(
      /\.kx-system-map__node text\s*\{[^}]*fill: var\(--kx-secondary\)[^}]*font-size: var\(--kx-text-md\)/,
    )
    expect(css).toMatch(/\.kx-system-map\s*\{[^}]*width: min\(720px, calc\(100vw - 48px\)\)/)
  })

  it('uses no emoji anywhere in the modal', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    expect(screen.getByRole('dialog', { name: `${TARGET.name} — system map` }).textContent).not.toMatch(
      EMOJI,
    )
  })
})
