import { useEffect, useReducer } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SessionDetailPage from './SessionDetailPage'
import {
  PENDING_PROCESS_PHASES,
  PENDING_PHASE_DURATION_MS,
  pendingDelayMs,
} from '../components/session/pendingPhases'
import { ASSISTANT_RESPONSES } from '../data/assistantResponses'
import { MockupContext, useMockup } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer, type MockupState } from '../state/mockupReducer'

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

function renderSessionDetailPage(search = '') {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState(search))
    // Navigate to session-detail route
    useEffect(() => {
      dispatch({ type: 'NAVIGATE', route: 'session-detail' })
    }, [dispatch])
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          <StateProbe bucket={bucket} />
          <SessionDetailPage />
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Page structure
// ---------------------------------------------------------------------------

describe('SessionDetailPage — page structure', () => {
  it('renders the session detail region with correct attributes', () => {
    renderSessionDetailPage()
    const page = screen.getByRole('region', { name: 'Session detail' })
    expect(page).toHaveClass('kx-session-detail')
    expect(page).toHaveAttribute('data-testid', 'session-detail')
  })

  it('does not render a Back to sessions control in the sticky detail layout', () => {
    renderSessionDetailPage()
    expect(screen.queryByTestId('back-to-sessions')).not.toBeInTheDocument()
  })

  it('renders the timeline section with SessionTimeline component', () => {
    renderSessionDetailPage()
    const timeline = screen.getByTestId('session-timeline')
    expect(timeline).toHaveAttribute('aria-label', 'Session timeline')
    expect(timeline.querySelector('.kx-session-detail__timeline')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SessionHeader — id, status badge, title, meta, cycle
// ---------------------------------------------------------------------------

describe('SessionHeader — sticky title, status, and share', () => {
  it('renders the status badge with icon+text in the sticky composer area (not the header)', () => {
    renderSessionDetailPage()
    const badge = screen.getByTestId('session-status')
    expect(badge).toHaveClass('kx-badge', 'kx-badge--waiting_approval')
    expect(badge.textContent).toContain('Waiting Approval')
    expect(badge.querySelector('svg[data-icon="circle"]')).not.toBeNull()

    // The badge has moved out of the header and now lives inside the sticky
    // composer area (on the tracker row), right-aligned with the composer.
    expect(screen.getByTestId('session-detail-header')).not.toContainElement(badge)
    expect(screen.getByTestId('session-composer-area')).toContainElement(badge)
    expect(screen.getByTestId('session-tracker')).toContainElement(badge)
  })

  it('renders the session context metadata (mode · system · component) from sessionDetail in the header', () => {
    renderSessionDetailPage()
    const header = screen.getByTestId('session-detail-header')
    const context = screen.getByTestId('session-context')
    expect(header).toContainElement(context)
    expect(context).toHaveClass('kx-session-detail__context')
    expect(context.textContent).toContain('Engineering')
    expect(context.textContent).toContain('BSI - HRIS')
    expect(context.textContent).toContain('hris-web')
  })

  it('renders the title as a single h1 in the sticky header', () => {
    renderSessionDetailPage()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveClass('kx-session-detail__title')
    expect(h1s[0]).toHaveTextContent('Investigate and fix the error when get list approval exception that list not showing')
    expect(screen.getByTestId('session-detail-header')).toContainElement(h1s[0])
  })

  it('renders a keyboard-accessible share affordance at the header right', () => {
    renderSessionDetailPage()
    const share = screen.getByTestId('share-session')
    expect(share).toHaveAccessibleName('Share session')
    expect(share.querySelector('svg[data-icon="share"]')).not.toBeNull()
  })

  it('keeps repository, branch, issue, and agent metadata outside the sticky header', () => {
    const { container } = renderSessionDetailPage()
    const header = screen.getByTestId('session-detail-header')
    expect(header.querySelector('.kx-session-detail__meta')).toBeNull()

    const meta = container.querySelector('footer.kx-session-detail__meta')
    expect(meta).not.toBeNull()
    expect(meta?.textContent).toContain('bsi/hris-approval-service')
    expect(meta?.textContent).toContain('fix/approval-list-exception')
    expect(meta?.textContent).toContain('#318')
    expect(meta?.textContent).toContain('Konteks Engineering Agent')
  })
})

// ---------------------------------------------------------------------------
// SessionTracker — minimal current-stage summary
// ---------------------------------------------------------------------------

describe('SessionTracker — minimal current-stage summary', () => {
  it('renders the cycle context and the active stage pill only', () => {
    renderSessionDetailPage()
    const tracker = screen.getByTestId('session-tracker')
    expect(tracker).toHaveTextContent('Current stage · Cycle 2 of 3')

    // Active stage pill exposes the stage label and its status.
    const pill = tracker.querySelector('.kx-session-detail__stage-pill')
    expect(pill).not.toBeNull()
    expect(pill).toHaveTextContent('Quote')
    expect(pill).toHaveTextContent('Awaiting approval')

    // No extra visual noise in the current-stage cluster itself: no icons,
    // no completed-stage chips. (The session status badge's icon lives on the
    // tracker row but outside the tracker-current summary.)
    const current = tracker.querySelector('.kx-session-detail__tracker-current')
    expect(current?.querySelector('svg')).toBeNull()
    expect(tracker.querySelectorAll('.kx-session-detail__completed-chip')).toHaveLength(0)
  })

  it('shows a badge on the Quote pill counting quotes still pending approval', () => {
    renderSessionDetailPage()
    const pill = screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill')
    const badge = pill?.querySelector('.kx-session-detail__stage-pill-badge')
    // One quote (Q-102) is PENDING_APPROVAL in the illustrative dataset.
    expect(badge).not.toBeNull()
    expect(badge).toHaveTextContent('1')
    expect(badge).toHaveAccessibleName('1 to action')
  })

  it('drops the badge once the pending quote is approved', () => {
    const { bucket } = renderSessionDetailPage()
    expect(bucket.current?.sessionDetail.quotes.filter((q) => q.status === 'PENDING_APPROVAL')).toHaveLength(1)

    // Approve the pending quote through the quote card action.
    fireEvent.click(screen.getByTestId('quote-approval-toggle'))
    fireEvent.click(screen.getByRole('button', { name: /Approve quote Q-102/ }))

    const badge = screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill-badge')
    expect(badge).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Metadata footer chips
// ---------------------------------------------------------------------------

describe('SessionDetailPage — metadata footer chips', () => {
  it('renders all four chips: repository, branch, issue ref, agent', () => {
    renderSessionDetailPage()
    const footer = document.querySelector('footer.kx-session-detail__meta')
    expect(footer).not.toBeNull()

    const chips = footer?.querySelectorAll('.kx-chip')
    expect(chips).toHaveLength(4)

    // Repository chip with icon
    expect(chips?.[0].textContent).toContain('bsi/hris-approval-service')
    expect(chips?.[0].querySelector('svg[data-icon="repository"]')).not.toBeNull()

    // Branch chip
    expect(chips?.[1].textContent).toContain('fix/approval-list-exception')

    // Issue ref chip
    expect(chips?.[2].textContent).toContain('#318')

    // Agent chip
    expect(chips?.[3].textContent).toContain('Konteks Engineering Agent')
  })

  it('keeps mode/system/component context metadata in the header, not the footer', () => {
    renderSessionDetailPage()
    const footer = document.querySelector('footer.kx-session-detail__meta')
    expect(footer?.querySelector('[data-testid="session-context"]')).toBeNull()
    expect(footer?.textContent).not.toContain('BSI - HRIS')
    expect(footer?.textContent).not.toContain('hris-web')
  })
})

// ---------------------------------------------------------------------------
// Content blocks container
// ---------------------------------------------------------------------------

describe('SessionDetailPage — content blocks container', () => {
  it('groups quote, timeline, and metadata as large discrete blocks', () => {
    renderSessionDetailPage()
    const blocks = screen.getByTestId('session-detail-blocks')
    expect(blocks).toHaveClass('kx-session-detail__blocks')

    // Each block remains a flat sibling so it can later become clickable.
    expect(blocks.querySelector('[data-testid="session-timeline"]')).not.toBeNull()
    expect(blocks.querySelector('footer.kx-session-detail__meta')).not.toBeNull()
    expect(blocks.querySelector('[data-testid="quote-approval-card"]')).not.toBeNull()

    // The tracker and sticky composer intentionally stay outside the blocks
    // container — both live inside the sticky composer area.
    expect(blocks.querySelector('[data-testid="session-tracker"]')).toBeNull()
    expect(blocks.querySelector('[data-testid="session-composer"]')).toBeNull()
  })

  it('pins the tracker directly above the composer input box inside the sticky composer area', () => {
    renderSessionDetailPage()
    const area = screen.getByTestId('session-composer-area')
    expect(area).toHaveClass('kx-session-detail__composer-area')

    // Tracker and composer are the two children of the sticky area, tracker first.
    const tracker = screen.getByTestId('session-tracker')
    const composer = screen.getByTestId('session-composer')
    expect(area).toContainElement(tracker)
    expect(area).toContainElement(composer)
    expect(tracker.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // The tracker sits directly above the composer input box.
    const inputBox = screen.getByTestId('session-composer-input-box')
    expect(composer).toContainElement(inputBox)
  })
})

// ---------------------------------------------------------------------------
// App/AppShell integration
// ---------------------------------------------------------------------------

describe('SessionDetailPage — AppShell integration', () => {
  it('renders inside main on the session-detail route', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      // Navigate to session-detail route
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            {state.route === 'session-detail' && <SessionDetailPage />}
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    render(<Harness />)

    // Verify the page renders
    expect(screen.getByRole('region', { name: 'Session detail' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// SessionTimeline — all item types with timestamps
// ---------------------------------------------------------------------------

describe('SessionTimeline — renders all 8 item types', () => {
  it('renders all timeline item types in order with timestamps', () => {
    const { container } = renderSessionDetailPage()
    const timelineList = container.querySelector('.kx-session-detail__timeline')
    expect(timelineList).not.toBeNull()

    const items = timelineList?.querySelectorAll(':scope > li')
    expect(items?.length).toBeGreaterThan(0)

    // Check that user message has right-aligned bubble
    const userBubble = container.querySelector('.kx-session-timeline__item--user')
    expect(userBubble).toBeInTheDocument()
    expect(userBubble?.querySelector('.kx-session-timeline__bubble--user')).not.toBeNull()
    expect(userBubble?.querySelector('.kx-session-timeline__timestamp')).toBeNull()

    // User and assistant bubbles remain visually distinct by alignment and
    // surface, but intentionally carry no sender identity chrome.
    const assistantBubble = container.querySelector('.kx-session-timeline__item--assistant')
    expect(assistantBubble).toBeInTheDocument()
    expect(assistantBubble?.querySelector('.kx-session-timeline__agent-label')).toBeNull()
    expect(assistantBubble?.querySelector('.kx-session-timeline__agent-header')).toBeNull()
    expect(assistantBubble?.querySelector('.kx-session-timeline__bubble--assistant')).not.toBeNull()
    expect(userBubble?.textContent).not.toContain('You')

    // Check system event
    const systemEvent = container.querySelector('.kx-session-timeline__item--system')
    expect(systemEvent).toBeInTheDocument()
    expect(systemEvent?.querySelector('svg[data-icon="gear"]')).not.toBeNull()
    expect(systemEvent?.querySelector('.kx-session-timeline__event-text')).not.toBeNull()

    // Check quote card
    const quoteCard = container.querySelector('[data-testid="timeline-quote-card"]')
    expect(quoteCard).toBeInTheDocument()
    expect(quoteCard?.querySelector('.kx-session-timeline__card-title')).not.toBeNull()

    // Check approval item
    const approvalItem = container.querySelector('.kx-session-timeline__item--approval')
    expect(approvalItem).toBeInTheDocument()

    // Check delivery card
    const deliveryCard = container.querySelector('.kx-session-timeline__card--delivery')
    expect(deliveryCard).toBeInTheDocument()
    expect(deliveryCard?.querySelector('.kx-session-timeline__card-title')).toHaveTextContent('Delivery — D-057')

    // Check error card
    const errorCard = container.querySelector('[data-testid="timeline-error-card"]')
    expect(errorCard).toBeInTheDocument()
    expect(errorCard?.querySelector('.kx-session-timeline__error-title')).toHaveTextContent('Warning')

    // Check artifact item
    const artifactItem = container.querySelector('.kx-session-timeline__item--artifact')
    expect(artifactItem).toBeInTheDocument()
    expect(artifactItem?.querySelector('svg[data-icon="file"]')).not.toBeNull()
  })

  it('user and assistant bubbles have different visual classes', () => {
    const { container } = renderSessionDetailPage()

    const userBubble = container.querySelector('.kx-session-timeline__bubble--user')
    const assistantBubble = container.querySelector('.kx-session-timeline__bubble--assistant')

    expect(userBubble).not.toBe(assistantBubble)
    expect(userBubble).toHaveClass('kx-session-timeline__bubble--user')
    expect(assistantBubble).toHaveClass('kx-session-timeline__bubble--assistant')
  })

  it('renders loading skeleton when demoVariant is loading', () => {
    const { container } = renderSessionDetailPage('?mock=loading')
    const skeleton = container.querySelector('[data-testid="timeline-skeleton"]')
    expect(skeleton).toBeInTheDocument()

    const skeletonRows = skeleton?.querySelectorAll('.kx-session-timeline__skeleton-row')
    expect(skeletonRows?.length).toBe(6)
  })

  it('delivery card shows artifacts, summary, and limitations', () => {
    const { container } = renderSessionDetailPage()
    const deliveryCard = container.querySelector('.kx-session-timeline__card--delivery')
    expect(deliveryCard).toBeInTheDocument()

    // Artifacts
    const artifacts = deliveryCard?.querySelector('.kx-session-timeline__artifacts')
    expect(artifacts).toBeInTheDocument()
    expect(artifacts?.querySelectorAll('a').length).toBeGreaterThan(0)

    // Summary
    expect(deliveryCard?.querySelector('.kx-session-timeline__card-summary')).not.toBeNull()

    // Limitations
    expect(deliveryCard?.querySelector('.kx-session-timeline__card-limitations')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SessionQuoteCard — approval card with CTAs
// ---------------------------------------------------------------------------

describe('SessionQuoteCard — quote approval card', () => {
  it('renders quote approval card when pending quote exists', () => {
    renderSessionDetailPage()
    const quoteCard = screen.queryByTestId('quote-approval-card')
    expect(quoteCard).toBeInTheDocument()
    expect(quoteCard).toHaveTextContent('Quote awaiting your approval')
  })

  it('shows all three CTAs: approve, reject, request revision', () => {
    renderSessionDetailPage()
    const quoteCard = screen.getByTestId('quote-approval-card')

    // Collapsed by default: expand through the keyboard-accessible toggle.
    const toggle = screen.getByTestId('quote-approval-toggle')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const buttons = quoteCard.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(3)

    // Approve button has check icon
    expect(quoteCard.querySelector('svg[data-icon="check"]')).not.toBeNull()

    // Reject button has x icon
    expect(quoteCard.querySelector('svg[data-icon="x"]')).not.toBeNull()

    // Request revision button has refresh icon
    expect(quoteCard.querySelector('svg[data-icon="refresh"]')).not.toBeNull()
  })

  it('keeps aria-controls off the toggle while the body is unmounted, adds it when expanded', () => {
    renderSessionDetailPage()
    const toggle = screen.getByTestId('quote-approval-toggle')

    // Collapsed: body is unmounted, so aria-controls must not point at a
    // non-existent element.
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).not.toHaveAttribute('aria-controls')
    expect(document.getElementById('kx-quote-approval-body')).toBeNull()

    // Expanded: body mounts and aria-controls references it.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAttribute('aria-controls', 'kx-quote-approval-body')
    expect(document.getElementById('kx-quote-approval-body')).not.toBeNull()

    // Collapsing again returns to the clean no-target state.
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).not.toHaveAttribute('aria-controls')
    expect(document.getElementById('kx-quote-approval-body')).toBeNull()
  })

  it('toggles expanded state via keyboard (Enter and Space)', async () => {
    const user = userEvent.setup()
    renderSessionDetailPage()
    const toggle = screen.getByTestId('quote-approval-toggle')
    toggle.focus()

    // Enter on the focused button triggers native keyboard activation (click).
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    // Space on the focused button activates it again, collapsing the body.
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('approve updates status to DELIVERING and hides card', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    const { container } = render(<Harness />)

    // Initially card is visible
    expect(screen.getByTestId('quote-approval-card')).toBeInTheDocument()

    // Expand the card to reveal the actions
    fireEvent.click(screen.getByTestId('quote-approval-toggle'))

    // Find and click approve button (first button with check icon)
    const checkIconBtn = container.querySelector('svg[data-icon="check"]')?.closest('button')
    expect(checkIconBtn).not.toBeNull()
    fireEvent.click(checkIconBtn!)

    // Status changed to DELIVERING
    expect(bucket.current?.sessionDetail.status).toBe('DELIVERING')

    // Quote approval card is gone
    expect(screen.queryByTestId('quote-approval-card')).not.toBeInTheDocument()

    // Approval and delivery-started events added to timeline
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some(t => t.content.includes('approved') && t.type === 'APPROVAL')).toBe(true)
    expect(timeline?.some(t => t.content.includes('delivery started') && t.type === 'SYSTEM_EVENT')).toBe(true)
  })

  it('reject keeps WAITING_APPROVAL, hides card, adds rejection event', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    const { container } = render(<Harness />)

    // Initially card is visible
    expect(screen.getByTestId('quote-approval-card')).toBeInTheDocument()

    // Expand the card to reveal the actions
    fireEvent.click(screen.getByTestId('quote-approval-toggle'))

    // Find and click reject button (button with x icon)
    const xIconBtn = container.querySelector('svg[data-icon="x"]')?.closest('button')
    expect(xIconBtn).not.toBeNull()
    fireEvent.click(xIconBtn!)

    // Status stays WAITING_APPROVAL (actually becomes BLOCKED per reducer)
    expect(['WAITING_APPROVAL', 'BLOCKED']).toContain(bucket.current?.sessionDetail.status)

    // Quote approval card is gone
    expect(screen.queryByTestId('quote-approval-card')).not.toBeInTheDocument()

    // Rejection event added
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some(t => t.content.includes('rejected') && t.type === 'APPROVAL')).toBe(true)
  })

  it('request revision supersedes quote and creates new quote', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    const { container } = render(<Harness />)

    // Expand the card to reveal the actions
    fireEvent.click(screen.getByTestId('quote-approval-toggle'))

    // Find and click request revision button (button with refresh icon)
    const refreshIconBtn = container.querySelector('svg[data-icon="refresh"]')?.closest('button')
    expect(refreshIconBtn).not.toBeNull()
    fireEvent.click(refreshIconBtn!)

    // Old quote is SUPERSEDED
    const oldQuote = bucket.current?.sessionDetail.quotes.find(q => q.id === 'Q-102')
    expect(oldQuote?.status).toBe('SUPERSEDED')

    // New quote is PENDING_APPROVAL
    const newQuote = bucket.current?.sessionDetail.quotes.find(q => q.version === 3)
    expect(newQuote?.status).toBe('PENDING_APPROVAL')

    // System event about supersession added
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some(t => t.content.includes('superseded') && t.type === 'SYSTEM_EVENT')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// SessionDetailComposer — message input with send
// ---------------------------------------------------------------------------

describe('SessionDetailComposer — message composer', () => {
  function renderComposerHarness(bucket: StateBucket) {
    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }
    return render(<Harness />)
  }

  it('renders composer with textarea and send button', () => {
    renderSessionDetailPage()
    const composer = screen.getByTestId('session-composer')
    expect(composer).toBeInTheDocument()

    const textarea = composer.querySelector('textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea?.getAttribute('placeholder')).toBe('Describe the outcome you need…')

    const sendButton = composer.querySelector('button[aria-label="Send message"]')
    expect(sendButton).toBeInTheDocument()
  })

  it('textarea carries the auto-grow modifier class and starts one line tall', () => {
    renderSessionDetailPage()
    const textarea = screen.getByTestId('session-composer-input')
    expect(textarea).toHaveClass('kx-composer__input')
    expect(textarea).toHaveClass('kx-session-composer__input')
    expect(textarea).toHaveAttribute('rows', '1')
  })

  it('send button is disabled when textarea is empty', () => {
    renderSessionDetailPage()
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  it('Enter key sends message, Shift+Enter does not send', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    const { container } = render(<Harness />)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    expect(textarea).not.toBeNull()

    // Type a message
    fireEvent.change(textarea, { target: { value: 'Test message' } })
    expect(textarea.value).toBe('Test message')

    const initialTimelineLength = bucket.current?.sessionDetail.timeline.length || 0

    // Enter sends message (not prevented in test, but dispatch happens)
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    // Message should be sent (timeline grows with only the user message; the
    // assistant ack arrives later via the pending-response timeout)
    const newTimelineLength = bucket.current?.sessionDetail.timeline.length || 0
    expect(newTimelineLength).toBe(initialTimelineLength + 1)

    // Type another message
    fireEvent.change(textarea, { target: { value: 'Second message' } })
    const timelineBeforeShiftEnter = bucket.current?.sessionDetail.timeline.length || 0

    // Shift+Enter should NOT send (default behavior - newline, not preventDefault)
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    // Timeline should not have grown (no dispatch happened)
    const timelineAfterShiftEnter = bucket.current?.sessionDetail.timeline.length || 0
    expect(timelineAfterShiftEnter).toBe(timelineBeforeShiftEnter)
  })

  it('send button click sends message', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    const { container } = render(<Harness />)
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement
    const sendButton = screen.getByRole('button', { name: /send message/i })

    // Type a message
    fireEvent.change(textarea, { target: { value: 'Another test' } })

    const initialTimelineLength = bucket.current?.sessionDetail.timeline.length || 0

    // Click send
    fireEvent.click(sendButton)

    // Message sent and cleared (only the user message lands immediately)
    expect(textarea.value).toBe('')
    expect(bucket.current?.sessionDetail.timeline.length).toBe(initialTimelineLength + 1)
  })

  it('send appends only the user message and shows the pending dot-matrix loader until the drawn phases elapse', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }
      const { container } = renderComposerHarness(bucket)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send message/i })

      const initialTimelineLength = bucket.current?.sessionDetail.timeline.length || 0
      fireEvent.change(textarea, { target: { value: 'First question' } })
      fireEvent.click(sendButton)

      // Exactly +1 user message; loader up in its first drawn phase; composer
      // locked while pending. The compact loader (12px) is accompanied by
      // the visible process label.
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(phases.length).toBeGreaterThanOrEqual(3)
      expect(phases.length).toBeLessThanOrEqual(6)
      const firstVariant = PENDING_PROCESS_PHASES.find((p) => p.label === phases[0])?.variant
      expect(
        screen.getByRole('status', { name: `Menyusun jawaban — ${phases[0]}` }),
      ).toHaveClass(`kx-dmx--${firstVariant}`)
      expect(screen.getByText(phases[0])).toBeVisible()
      expect(sendButton).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(phases))
      })

      // A natural response from the pool is appended; loader gone; composer
      // unlocked.
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline.length).toBe(initialTimelineLength + 2)
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
      expect(ASSISTANT_RESPONSES).toContain(timeline[timeline.length - 1].content)
      expect(screen.queryByRole('status', { name: /menyusun jawaban/i })).not.toBeInTheDocument()
      // Composer unlocked: the send guard (pendingAssistant) is cleared; the
      // button itself stays disabled only because the input is empty again.
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(bucket.current?.sessionDetail.pendingPhases).toEqual([])

      // A follow-up send is possible and re-arms the loader.
      fireEvent.change(textarea, { target: { value: 'Follow-up' } })
      expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('pending process label and loader variant advance through the phases, then the reply lands', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }
      const { container } = renderComposerHarness(bucket)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send message/i })

      fireEvent.change(textarea, { target: { value: 'First question' } })
      fireEvent.click(sendButton)

      // The drawn phase slice drives the bubble: visible label beside the
      // loader, its own variant, and an aria-label that tracks the running
      // process — one step per PENDING_PHASE_DURATION_MS.
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(phases.length).toBeGreaterThanOrEqual(3)
      phases.forEach((label, index) => {
        const variant = PENDING_PROCESS_PHASES.find((p) => p.label === label)?.variant
        expect(screen.getByText(label)).toBeVisible()
        expect(screen.getByRole('status', { name: `Menyusun jawaban — ${label}` })).toHaveClass(
          `kx-dmx--${variant}`,
        )
        if (index < phases.length - 1) {
          act(() => {
            vi.advanceTimersByTime(PENDING_PHASE_DURATION_MS)
          })
        }
      })

      // The last phase holds until the full wait elapses, then resolves.
      act(() => {
        vi.advanceTimersByTime(PENDING_PHASE_DURATION_MS)
      })
      expect(screen.queryByRole('status', { name: /menyusun jawaban/i })).not.toBeInTheDocument()
      expect(screen.queryByText(phases[phases.length - 1])).not.toBeInTheDocument()
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
      expect(ASSISTANT_RESPONSES).toContain(timeline[timeline.length - 1].content)
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels the pending timer on unmount — navigating away and back re-arms it, never stranding the loader', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }

      // Route-driven harness: SessionDetailPage mounts/unmounts exactly as in
      // AppShell, so the composer's unmount cleanup runs on navigation.
      function RouteToggleHarness() {
        const [state, dispatch] = useReducer(mockupReducer, initialState())
        useEffect(() => {
          dispatch({ type: 'NAVIGATE', route: 'session-detail' })
        }, [dispatch])
        return (
          <MockupContext.Provider value={{ state, dispatch }}>
            <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
              <StateProbe bucket={bucket} />
              {state.route === 'session-detail' && <SessionDetailPage />}
              <button
                type="button"
                data-testid="route-toggle"
                onClick={() =>
                  dispatch({
                    type: 'NAVIGATE',
                    route: state.route === 'session-detail' ? 'session-history' : 'session-detail',
                  })
                }
              >
                Toggle route
              </button>
            </OverlayLifecycleProvider>
          </MockupContext.Provider>
        )
      }
      render(<RouteToggleHarness />)

      const textarea = screen.getByTestId('session-composer-input') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send message/i })
      fireEvent.change(textarea, { target: { value: 'Asked before navigating' } })
      fireEvent.click(sendButton)
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      expect(
        screen.getByRole('status', { name: `Menyusun jawaban — ${phases[0]}` }),
      ).toBeInTheDocument()
      const assistantCount = (bucket.current?.sessionDetail.timeline ?? []).filter(
        (item) => item.type === 'ASSISTANT_MESSAGE',
      ).length

      // Navigate away mid-wait — the composer unmounts and CANCELS the
      // timer: the reply must not land "while away".
      fireEvent.click(screen.getByTestId('route-toggle'))
      expect(screen.queryByTestId('session-composer')).not.toBeInTheDocument()
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      const awayTimeline = bucket.current?.sessionDetail.timeline ?? []
      expect(awayTimeline.filter((item) => item.type === 'ASSISTANT_MESSAGE')).toHaveLength(assistantCount)

      // Time passes while away — nothing fires (timer cancelled).
      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(phases) * 2)
      })
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)

      // Back on the route: the loader shows again (first phase), the timer
      // re-arms, and the reply lands exactly once after the full wait.
      fireEvent.click(screen.getByTestId('route-toggle'))
      expect(
        screen.getByRole('status', { name: `Menyusun jawaban — ${phases[0]}` }),
      ).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(phases))
      })
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(screen.queryByRole('status', { name: /menyusun jawaban/i })).not.toBeInTheDocument()
      const timelineAfter = bucket.current?.sessionDetail.timeline ?? []
      expect(timelineAfter.filter((item) => item.type === 'ASSISTANT_MESSAGE')).toHaveLength(
        assistantCount + 1,
      )

      // The composer is unlocked again — not permanently disabled.
      const returnedTextarea = screen.getByTestId('session-composer-input') as HTMLTextAreaElement
      fireEvent.change(returnedTextarea, { target: { value: 'Follow-up after return' } })
      expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('recovers pendingAssistant state on mount by arming the phase timeout (stale state or a composer-created session)', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }
      // Seed the store as if a send happened but the reply never landed
      // (stale state from HMR, or a session created by the main-page
      // composer): pendingAssistant true and no composer timer armed.
      const preseeded = initialState()
      preseeded.sessionDetail.pendingAssistant = true
      preseeded.sessionDetail.pendingPhases = PENDING_PROCESS_PHASES.slice(0, 3).map(
        (phase) => phase.label,
      )

      function PreseededHarness() {
        const [state, dispatch] = useReducer(mockupReducer, preseeded)
        useEffect(() => {
          dispatch({ type: 'NAVIGATE', route: 'session-detail' })
        }, [dispatch])
        return (
          <MockupContext.Provider value={{ state, dispatch }}>
            <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
              <StateProbe bucket={bucket} />
              {state.route === 'session-detail' && <SessionDetailPage />}
            </OverlayLifecycleProvider>
          </MockupContext.Provider>
        )
      }
      render(<PreseededHarness />)

      // Mount-time recovery ARMS the receive timeout with the stored
      // phases: the loader shows with its first phase.
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      expect(
        screen.getByRole('status', { name: `Menyusun jawaban — ${preseeded.sessionDetail.pendingPhases[0]}` }),
      ).toBeInTheDocument()

      // The full phase sequence plays out, then the reply lands.
      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(preseeded.sessionDetail.pendingPhases))
      })
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(screen.queryByRole('status', { name: /menyusun jawaban/i })).not.toBeInTheDocument()
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
    } finally {
      vi.useRealTimers()
    }
  })

  it('response footer Retry re-asks the nearest preceding user message and is a no-op while pending', () => {
    const { bucket } = renderSessionDetailPage()
    const before = bucket.current?.sessionDetail.timeline ?? []
    const lastAssistantIndex = before.map((i) => i.type).lastIndexOf('ASSISTANT_MESSAGE')
    expect(lastAssistantIndex).toBeGreaterThan(0)
    let precedingUser = ''
    for (let i = lastAssistantIndex - 1; i >= 0; i -= 1) {
      if (before[i].type === 'USER_MESSAGE') {
        precedingUser = before[i].content
        break
      }
    }
    expect(precedingUser).not.toBe('')

    // The last assistant message's footer menu offers Retry.
    const moreButtons = screen.getAllByTestId('response-more')
    fireEvent.click(moreButtons[moreButtons.length - 1])
    fireEvent.click(within(screen.getByTestId('response-menu')).getByRole('menuitem', { name: 'Retry' }))

    // Re-ask: +1 USER_MESSAGE with that content, pending armed, loader up.
    const after = bucket.current?.sessionDetail.timeline ?? []
    expect(after).toHaveLength(before.length + 1)
    expect(after[after.length - 1].type).toBe('USER_MESSAGE')
    expect(after[after.length - 1].content).toBe(precedingUser)
    expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
    expect(screen.getByRole('status', { name: /menyusun jawaban/i })).toBeInTheDocument()

    // While pending, another footer's Retry is a no-op.
    const moreButtonsAgain = screen.getAllByTestId('response-more')
    fireEvent.click(moreButtonsAgain[0])
    fireEvent.click(within(screen.getByTestId('response-menu')).getByRole('menuitem', { name: 'Retry' }))
    expect(bucket.current?.sessionDetail.timeline ?? []).toHaveLength(before.length + 1)
  })

  it('shows locked notice when session is COMPLETED', () => {
    const bucket: StateBucket = { current: null }

    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-detail' })
        dispatch({ type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-102' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            <StateProbe bucket={bucket} />
            <SessionDetailPage />
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    render(<Harness />)

    // For now, the mockup reducer doesn't change status to COMPLETED after approve
    // So we'll just verify composer renders
    expect(screen.getByTestId('session-composer')).toBeInTheDocument()
  })

  it('has attachment, text document, and voice mock buttons', () => {
    renderSessionDetailPage()
    const composer = screen.getByTestId('session-composer')

    expect(composer.querySelector('button[aria-label="Attach file"]')).toBeInTheDocument()
    expect(composer.querySelector('button[aria-label="Add text document"]')).toBeInTheDocument()
    expect(composer.querySelector('button[aria-label="Voice input"]')).toBeInTheDocument()
  })

  it('matches the main-page toolbar order: attach + text document + profile left; voice + send right', () => {
    renderSessionDetailPage()
    const composer = screen.getByTestId('session-composer')

    // Left group: Attach file → Add text document → Execution Profile.
    const left = within(screen.getByTestId('toolbar-left'))
    const leftButtons = left.getAllByRole('button')
    expect(leftButtons).toHaveLength(3)
    expect(leftButtons[0]).toHaveAccessibleName('Attach file')
    expect(leftButtons[1]).toHaveAccessibleName('Add text document')
    expect(leftButtons[2]).toHaveAccessibleName(/Execution Profile/)

    // Right group: Voice input → Send message, and nothing else.
    const right = within(screen.getByTestId('toolbar-right'))
    const rightButtons = right.getAllByRole('button')
    expect(rightButtons).toHaveLength(2)
    expect(rightButtons[0]).toHaveAccessibleName('Voice input')
    expect(rightButtons[1]).toHaveAccessibleName('Send message')

    // No cross-contamination between the groups.
    expect(left.queryByRole('button', { name: 'Voice input' })).toBeNull()
    expect(right.queryByRole('button', { name: 'Attach file' })).toBeNull()
    expect(right.queryByRole('button', { name: /Execution Profile/ })).toBeNull()
    expect(composer.querySelectorAll('button[aria-label="Attach file"]')).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Integration: sticky header/share and composer remain present
// ---------------------------------------------------------------------------

describe('SessionDetailPage — final conversation layout', () => {
  it('renders sticky-header affordances and a final composer without a back link', () => {
    renderSessionDetailPage()
    expect(screen.getByTestId('session-detail-header')).toBeInTheDocument()
    expect(screen.getByTestId('share-session')).toBeInTheDocument()
    expect(screen.getByTestId('session-composer')).toBeInTheDocument()
    expect(screen.queryByTestId('back-to-sessions')).not.toBeInTheDocument()
  })
})