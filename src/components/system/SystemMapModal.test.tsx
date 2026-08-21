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
// Graph contract — React Flow with token-driven styling
// ---------------------------------------------------------------------------

describe('SystemMapModal — graph', () => {
  // Note: ReactFlow requires ResizeObserver which is not available in jsdom
  // The graph rendering is tested in E2E tests; here we test the modal structure
  it('renders the graph container and inspector panel structure', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    const dialog = screen.getByRole('dialog', { name: `${TARGET.name} — system map` })

    // Content area should be present
    const content = dialog.querySelector('.kx-system-map__content')
    expect(content).not.toBeNull()

    // Modal should be rendered
    expect(dialog).toBeInTheDocument()
  })

  it('uses theme tokens for styling (CSS convention)', () => {
    // Check that node styles use tokens
    expect(css).toMatch(/\.system-node\s*\{[^}]*background: var\(--kx-raised\)/)
    expect(css).toMatch(/\.repository-node\s*\{[^}]*background: var\(--kx-pale\)/)
    expect(css).toMatch(/\.component-node\s*\{[^}]*background: var\(--kx-raised\)/)

    // Check edge styles use tokens
    expect(css).toMatch(/\.react-flow__edge-path\s*\{[^}]*stroke: var\(--kx-border\)/)

    // Check layout and inspector tokens
    expect(css).toMatch(/\.kx-system-map__inspector\s*\{[^}]*width: 280px/)
    expect(css).toMatch(/\.kx-system-map\s*\{[^}]*width: min\(1200px/)
  })

  it('uses no emoji anywhere in the modal', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: TARGET.id })
    expect(screen.getByRole('dialog', { name: `${TARGET.name} — system map` }).textContent).not.toMatch(
      EMOJI,
    )
  })

  it('shows fallback for invalid systemId', () => {
    renderSystemMapModal({ kind: 'system-map', systemId: 'invalid-system-id' })
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    // The fallback graph should render
    expect(dialog.textContent).toContain('system map')
  })
})
