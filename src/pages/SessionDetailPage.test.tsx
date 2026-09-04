import { useEffect, useReducer } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SessionDetailPage, { buildSessionDetailStreamEntries } from './SessionDetailPage'
import { isLastAgentTurnOfResponse } from '../components/session/stream/responseGroup'
import {
  PENDING_PROCESS_PHASES,
  PENDING_PHASE_DURATION_MS,
  pendingDelayMs,
} from '../components/session/pendingPhases'
import { ASSISTANT_RESPONSES } from '../data/assistantResponses'
import { SESSION_DETAIL } from '../data/mockData'
import { MockupContext, useMockup } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer, type MockupAction, type MockupState } from '../state/mockupReducer'

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

/**
 * Renders the detail page with an extra `run-action` control that dispatches
 * a mockup action on click. The retired SessionQuoteCard CTAs were the old
 * UI driver for quote decisions; the reducer path is unchanged, so
 * quote-decision coverage dispatches through this control and asserts the
 * stream/tracker consequences the page renders.
 */
function renderSessionDetailPage(search = '', action?: MockupAction) {
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
          {action !== undefined && (
            <button type="button" data-testid="run-action" onClick={() => dispatch(action)}>
              Run action
            </button>
          )}
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
// Fixture helpers — the page renders from a clone of SESSION_DETAIL, so
// tests reference the fixture directly to stay in sync with copy tweaks.
// ---------------------------------------------------------------------------

/** Fixture timeline, in order (T-001…T-016). */
const FIXTURE_TIMELINE = SESSION_DETAIL.timeline
const NON_ARTIFACT_TIMELINE = FIXTURE_TIMELINE.filter((item) => item.type !== 'ARTIFACT')
const FIXTURE_STREAM_ENTRIES = buildSessionDetailStreamEntries(SESSION_DETAIL)
const FIXTURE_STREAM_KINDS = FIXTURE_STREAM_ENTRIES.map(({ entry }) => entry.kind)
const EXPECTED_SOURCE_IDS = [
  ['T-001', 'T-002'],
  ['T-003'],
  ['T-004'],
  ['T-005'],
  ['T-006'],
  ['T-007'],
  ['T-008'],
  ['T-009'],
  ['T-010'],
  ['T-011'],
  ['T-012'],
  ['T-013'],
  ['T-014'],
  ['T-015'],
  ['T-016'],
]
const EXPECTED_STREAM_KINDS = [
  'request',
  'answer',
  'answer',
  'answer',
  'error',
  'answer',
  'estimate',
  'approval-gate',
  'answer',
  'answer',
  'answer',
  'answer',
  'answer',
  'estimate',
  'answer',
]
const INITIAL_STREAM_FOOTER_SLOT_IDS = FIXTURE_STREAM_KINDS.flatMap((_, index) =>
  isLastAgentTurnOfResponse(FIXTURE_STREAM_KINDS, index) ? [`session-turn-${index + 1}`] : [],
)

/** HH:MM local clock — mirrors the page's timestamp formatting. */
const clockOf = (iso: string) => {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** The rendered stream slot for turn `n` (1-based, session-turn-N). */
const slot = (n: number) => screen.getByTestId(`session-turn-${n}`)

/** All stream slots in conversation order. */
const allSlots = () =>
  screen.getByTestId('session-stream').querySelectorAll('[data-testid^="session-turn-"]')

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

  it('renders the conversation stream container (role log) with ordered turn slots', () => {
    renderSessionDetailPage()
    const stream = screen.getByTestId('session-stream')
    expect(stream).toHaveAttribute('role', 'log')
    expect(stream).toHaveAttribute('aria-label', 'Session conversation')
    expect(stream).toHaveClass('kx-stream')

    // One slot per mapped timeline turn, flat siblings inside the stream.
    const slots = stream.querySelectorAll(':scope > [data-testid^="session-turn-"]')
    expect(slots).toHaveLength(15)
    slots.forEach((turnSlot) => expect(turnSlot).toHaveClass('kx-stream-slot'))

    // The stream replaces the retired SessionTimeline inside the blocks
    // container.
    expect(screen.getByTestId('session-detail-blocks')).toContainElement(stream)
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
    // Approve through the reducer — the retired quote-card CTAs were the
    // previous UI driver; the state the tracker derives from is unchanged.
    const { bucket } = renderSessionDetailPage('', { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-102' })
    expect(bucket.current?.sessionDetail.quotes.filter((q) => q.status === 'PENDING_APPROVAL')).toHaveLength(1)

    fireEvent.click(screen.getByTestId('run-action'))

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

    // The stream migration flattened the footer chips to plain text —
    // repository, branch, issue ref, agent, in that order, icon-free.
    expect(chips?.[0].textContent).toContain('bsi/hris-approval-service')
    expect(chips?.[1].textContent).toContain('fix/approval-list-exception')

    // Issue ref chip
    expect(chips?.[2].textContent).toContain('#318')

    // Agent chip
    expect(chips?.[3].textContent).toContain('Konteks Engineering Agent')
    expect(footer?.querySelectorAll('svg')).toHaveLength(0)
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
  it('groups the conversation stream, quote estimates, and metadata as large discrete blocks', () => {
    renderSessionDetailPage()
    const blocks = screen.getByTestId('session-detail-blocks')
    expect(blocks).toHaveClass('kx-session-detail__blocks')

    // Each block remains a flat sibling so it can later become clickable:
    // the stream container, the metadata footer, and both quote-event
    // estimate disclosures (the cards rest collapsed but mounted).
    expect(blocks.querySelector('[data-testid="session-stream"]')).not.toBeNull()
    expect(blocks.querySelector('footer.kx-session-detail__meta')).not.toBeNull()
    expect(blocks.querySelectorAll('[data-testid="estimate-card"]')).toHaveLength(2)

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
// Session stream — the fixture timeline mapped onto chat-style turns.
// (Replaces the retired SessionTimeline coverage: every timeline item type
// now asserts its stream-component equivalent.)
// ---------------------------------------------------------------------------

describe('Session stream — timeline mapped to chat turns', () => {
  it('keeps every mapped turn timestamp aligned with its non-artifact timeline source event', () => {
    renderSessionDetailPage()

    expect(FIXTURE_STREAM_ENTRIES).toHaveLength(NON_ARTIFACT_TIMELINE.length)

    NON_ARTIFACT_TIMELINE.forEach((item, index) => {
      const expectedTime = clockOf(item.createdAt)
      const renderedKind = FIXTURE_STREAM_ENTRIES[index]?.entry.kind
      const renderedSlot = slot(index + 1)
      const renderedTime =
        renderedKind === 'request'
          ? renderedSlot.querySelector('.kx-stream-bubble__time')?.textContent
          : renderedSlot.querySelector('article.kx-stream-turn')?.getAttribute('data-stream-time')

      expect(FIXTURE_STREAM_ENTRIES[index]?.time, `${item.id} entry time`).toBe(expectedTime)
      expect(renderedTime, `${item.id} (${item.type}) rendered in session-turn-${index + 1}`).toBe(expectedTime)
    })
  })

  it('maps the fixture timeline onto ordered stream turns (user run merged, artifact attached)', () => {
    renderSessionDetailPage()
    const slots = allSlots()

    // One turn per non-artifact timeline item — the USER artifact merges
    // into the preceding request bubble as an attachment card.
    expect(slots).toHaveLength(FIXTURE_TIMELINE.filter((item) => item.type !== 'ARTIFACT').length)
    expect(slots).toHaveLength(15)

    // Turn 1 — the user run: right-aligned request bubble carrying the
    // message prose, the attachment card rendered AFTER the bubble shell
    // inside the row, and the hover action bar (time + copy + edit)
    // beneath it.
    const request = within(slot(1))
    const bubble = request.getByTestId('user-bubble')
    expect(bubble).toHaveClass('kx-stream-bubble-row')
    expect(bubble.querySelector('.kx-stream-bubble')).not.toBeNull()
    expect(request.getByTestId('bubble-text')).toHaveTextContent(FIXTURE_TIMELINE[0].content)
    const attachments = slot(1).querySelector('ul[aria-label="Attachments"]')
    expect(attachments).not.toBeNull()
    expect(attachments?.querySelectorAll('.kx-stream-attachment')).toHaveLength(1)
    expect(attachments?.querySelector('.kx-stream-attachment__name')?.textContent).toBe(
      'logs-approval-exception.txt',
    )
    expect(bubble.querySelector('.kx-stream-bubble')?.contains(attachments as Node)).toBe(false)
    expect(bubble.contains(attachments as Node)).toBe(true)
    expect(slot(1).querySelector('[data-testid="bubble-actions"]')).not.toBeNull()
    expect(slot(1).querySelector('.kx-stream-bubble__time')?.textContent).toBe(
      clockOf(FIXTURE_TIMELINE[0].createdAt),
    )
    // The short fixture message never shows the Read-more clamp control.
    expect(slot(1).querySelector('.kx-stream-bubble__read-toggle')).toBeNull()

    // Turns 2–4 — acknowledgement answer, system event, analysis answer:
    // all flat prose turns in fixture order.
    expect(slot(2)).toHaveTextContent('Acknowledged.')
    expect(slot(2)).toHaveTextContent(
      'Investigating the approval list exception in bsi/hris-approval-service repository.',
    )
    expect(slot(3).textContent).toContain(FIXTURE_TIMELINE[3].content)
    expect(slot(4)).toHaveTextContent(
      'Investigation findings: ApprovalListQuery throws NPE when paginating past an empty result set.',
    )
    expect(slot(4)).toHaveTextContent(
      'Root cause in ApprovalListMapper line 142 where safe navigation operator is missing.',
    )

    // Turn 5 — the runner error: neutral turn shell with the collapsed
    // [× ERROR] summary row and a Show-detail disclosure.
    const errorTurn = slot(5)
    expect(errorTurn.querySelector('article.kx-stream-turn')).toHaveClass('kx-stream-turn--neutral')
    expect(errorTurn.querySelector('[data-testid="error-card"]')).not.toBeNull()
    expect(errorTurn.querySelector('.kx-stream-error__kind')?.textContent).toContain('ERROR')
    expect(errorTurn.querySelector('.kx-stream-error__title')?.textContent).toBe(FIXTURE_TIMELINE[5].content)
    const errorToggle = within(errorTurn).getByRole('button', { name: /show detail/i })
    expect(errorToggle).toHaveAttribute('aria-expanded', 'false')
    expect(errorTurn.querySelector('.kx-stream-error__detail')).toHaveAttribute('hidden')
    fireEvent.click(errorToggle)
    expect(errorToggle).toHaveAttribute('aria-expanded', 'true')
    expect(errorTurn.querySelector('.kx-stream-error__detail')).not.toHaveAttribute('hidden')
    expect(errorTurn.querySelector('.kx-stream-error__impact')?.textContent).toBe(
      'Automatically retried by the runner.',
    )

    // Turn 6 — tests-green answer.
    expect(slot(6)).toHaveTextContent('Test suite passed on retry.')
    expect(slot(6)).toHaveTextContent('All 127 integration tests green.')

    // Turn 7 — the Q-101 quote event: estimate disclosure, collapsed by
    // default, total row reading the approved status.
    const q101Total = slot(7).querySelector('.kx-stream-estimate__row--total')
    expect(q101Total?.textContent).toContain('Status')
    expect(q101Total?.textContent).toContain('Approved')

    // Turn 8 — the Q-101 approval: resolved gate (accent tone, compact
    // APPROVAL header, quiet decision line — no pending gate chrome).
    const gate = slot(8)
    expect(gate.querySelector('article.kx-stream-turn')).toHaveClass('kx-stream-turn--accent')
    expect(gate.querySelector('.kx-stream-turn__kind')?.textContent).toBe('APPROVAL')
    expect(gate.querySelector('.kx-stream-chip')?.textContent).toBe('Allow once')
    expect(gate.textContent).toContain('Decision recorded:')
    expect(gate.textContent).toContain(FIXTURE_TIMELINE[8].content)
    expect(gate.querySelector('[data-testid="gate-pending"]')).toBeNull()

    // Turns 9–10 — delivery-started system event + implementing answer.
    expect(slot(9).textContent).toContain(FIXTURE_TIMELINE[9].content)
    expect(slot(10)).toHaveTextContent(
      'Implementing fix: adding null-safety checks to ApprovalListMapper and updating pagination logic.',
    )

    // Turn 11 — the delivery: answer prose followed by the artifact chip row.
    expect(slot(11)).toHaveTextContent(
      'Cycle 1 completed: PR #142, commit 9f3c2ab, test report passed, receipt R-0057.',
    )
    expect(slot(11)).toHaveTextContent('Delivered 5 of 5 story points.')
    expect(slot(11).querySelector('.kx-session-detail__delivery-artifacts')).not.toBeNull()

    // Turns 12–13 — cycle-completed system event + follow-up recommendation.
    expect(slot(12).textContent).toContain(FIXTURE_TIMELINE[12].content)
    expect(slot(13)).toHaveTextContent('Cycle 1 delivered the core NPE fix.')
    expect(slot(13)).toHaveTextContent(
      'I recommend a follow-up cycle to address the pagination edge case (navigating past empty result sets) which was deferred to keep scope bounded.',
    )
    expect(slot(13)).toHaveTextContent('This would add ~6 story points.')

    // Turn 14 — the Q-102 quote event: estimate collapsed, total reading
    // the pending status.
    const q102Total = slot(14).querySelector('.kx-stream-estimate__row--total')
    expect(q102Total?.textContent).toContain('Waiting approval')

    // Turn 15 — the waiting-approval system event, the group-final agent
    // turn carrying the hover footer.
    expect(slot(15)).toHaveTextContent('Status changed to Waiting Approval — quote Q-102 awaiting your response')

    // The initial classic fixture is one continuous agent response group
    // after the opening user request, so ONLY the final slot carries the
    // modern hover footer.
    expect(INITIAL_STREAM_FOOTER_SLOT_IDS).toEqual(['session-turn-15'])
    const footers = screen.getAllByTestId('turn-footer')
    expect(footers).toHaveLength(INITIAL_STREAM_FOOTER_SLOT_IDS.length)
    slots.forEach((turnSlot, index) => {
      const slotId = `session-turn-${index + 1}`
      if (INITIAL_STREAM_FOOTER_SLOT_IDS.includes(slotId)) {
        expect(turnSlot.querySelector('[data-testid="turn-footer"]')).not.toBeNull()
      } else {
        expect(turnSlot.querySelector('[data-testid="turn-footer"]')).toBeNull()
      }
    })
  })

  it('preserves the 15-slot source-order mapping and renders technical literals through AnswerBlock prose', () => {
    renderSessionDetailPage()

    expect(FIXTURE_STREAM_ENTRIES).toHaveLength(15)
    expect(FIXTURE_STREAM_ENTRIES.map(({ sourceIds }) => sourceIds)).toEqual(EXPECTED_SOURCE_IDS)
    expect(FIXTURE_STREAM_KINDS).toEqual(EXPECTED_STREAM_KINDS)

    expect(within(slot(2)).getByText('bsi/hris-approval-service', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(4)).getByText('ApprovalListQuery', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(4)).getByText('ApprovalListMapper', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(4)).getByText('line 142', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(6)).getByText('127', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(11)).getByText('PR #142', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(11)).getByText('commit 9f3c2ab', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(11)).getByText('R-0057', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(13)).getByText('~6', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
    expect(within(slot(15)).getByText('Q-102', { selector: 'code.kx-tech-code' })).toBeInTheDocument()
  })

  it('renders the user turn as a right-aligned bubble and agent turns as flat prose articles', () => {
    renderSessionDetailPage()
    const stream = screen.getByTestId('session-stream')

    // Exactly one user bubble: the merged user run.
    const userRow = screen.getByTestId('user-bubble')
    expect(userRow).toHaveClass('kx-stream-bubble-row')
    expect(stream.querySelectorAll('.kx-stream-bubble')).toHaveLength(1)

    // Agent turns are flat prose articles — no bubbles and no sender
    // identity chrome anywhere (the old timeline’s You/agent labels are
    // gone with it).
    const turns = stream.querySelectorAll('article.kx-stream-turn')
    expect(turns).toHaveLength(14)
    turns.forEach((turn) => {
      expect(turn.querySelector('.kx-stream-bubble')).toBeNull()
    })

    // Conversational answers render bare (no kind header); the kinded
    // turns label themselves inside their disclosures/headers instead.
    for (const n of [2, 3, 4, 6, 9, 10, 12, 13, 15]) {
      expect(slot(n).querySelector('.kx-stream-turn__head')).toBeNull()
    }
    expect(slot(5).querySelector('.kx-stream-error__kind')?.textContent).toContain('ERROR')
    expect(slot(7).querySelector('.kx-stream-estimate__kind')?.textContent).toContain('ESTIMATE')
    expect(slot(8).querySelector('.kx-stream-turn__head .kx-stream-turn__kind')?.textContent).toBe(
      'APPROVAL',
    )
  })

  it('renders the full stream under the loading demo variant — the retired timeline skeleton is gone', () => {
    renderSessionDetailPage('?mock=loading')
    // The stream migration dropped the demoVariant skeleton branch: the
    // conversation renders identically regardless of the demo variant.
    expect(screen.queryByTestId('timeline-skeleton')).not.toBeInTheDocument()
    expect(allSlots()).toHaveLength(15)
  })

  it('the delivery turn lists its artifacts as openable EntityTokens', () => {
    renderSessionDetailPage()
    const delivery = slot(11)

    // The delivery prose answers first…
    expect(delivery).toHaveTextContent(
      'Cycle 1 completed: PR #142, commit 9f3c2ab, test report passed, receipt R-0057.',
    )
    expect(delivery).toHaveTextContent('Delivered 5 of 5 story points.')

    // …then the artifacts ride as openable EntityToken chips — accessible
    // open-labels carry the kind, tooltips carry the artifact urls, and
    // only the commit identifier renders mono.
    const row = delivery.querySelector('.kx-session-detail__delivery-artifacts')
    expect(row).not.toBeNull()
    const tokens = within(row as HTMLElement).getAllByRole('button')
    expect(tokens).toHaveLength(4)
    expect(tokens.map((token) => token.getAttribute('aria-label'))).toEqual([
      'Open artifact PR #142',
      'Open artifact commit 9f3c2ab',
      'Open artifact Test Report',
      'Open artifact Receipt R-0057',
    ])
    expect(tokens.map((token) => token.getAttribute('title'))).toEqual(
      SESSION_DETAIL.delivery.artifacts.map((artifact) => artifact.url),
    )
    expect(tokens.filter((token) => token.classList.contains('kx-tech-entity--mono'))).toHaveLength(1)
    expect(tokens[1]).toHaveClass('kx-tech-entity--mono')
  })
})

// ---------------------------------------------------------------------------
// Estimate disclosures — the QUOTE timeline events. (Replaces the retired
// SessionQuoteCard coverage: each quote event renders a collapsed Estimate
// disclosure whose card expands in place; quote decisions dispatch through
// the reducer and assert the stream consequences.)
// ---------------------------------------------------------------------------

describe('Estimate disclosures — quote events', () => {
  it('renders a collapsed estimate disclosure for every quote event, keyed by quote status', () => {
    renderSessionDetailPage()

    // Both quote events (Q-101, Q-102) map to estimate turns.
    for (const n of [7, 14]) {
      const estimate = slot(n)
      expect(estimate.querySelector('.kx-stream-estimate-disclosure')).not.toBeNull()
      expect(estimate.querySelector('.kx-stream-estimate__kind')?.textContent).toContain('ESTIMATE')
      expect(estimate.querySelector('svg[data-icon="estimate"]')).not.toBeNull()
      const toggle = within(estimate).getByRole('button', { name: /show breakdown/i })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')

      // Collapsed: the hidden article keeps the detail row mounted, while
      // the always-on total row remains visible outside it.
      const card = within(estimate).getByTestId('estimate-card')
      expect(card).toHaveAttribute('hidden')
      expect(card.querySelectorAll('.kx-stream-estimate__row')).toHaveLength(1)
      expect(estimate.querySelectorAll('.kx-stream-estimate__row--total')).toHaveLength(1)
    }

    // The always-visible total rows key off each quote's status: Q-101 is
    // APPROVED in the fixture, Q-102 PENDING_APPROVAL.
    expect(slot(7).querySelector('.kx-stream-estimate__row--total')?.textContent).toContain('Approved')
    expect(slot(14).querySelector('.kx-stream-estimate__row--total')?.textContent).toContain(
      'Waiting approval',
    )
  })

  it('expands the quote card through the keyboard-accessible toggle (Enter and Space)', async () => {
    const user = userEvent.setup()
    renderSessionDetailPage()
    const q102 = slot(14)
    const toggle = within(q102).getByRole('button', { name: /show breakdown/i })
    toggle.focus()

    // Enter on the focused button expands the card in place.
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveTextContent('Hide breakdown')
    const card = within(q102).getByTestId('estimate-card')
    expect(card).not.toHaveAttribute('hidden')

    // The expanded card carries the quote's exposed detail: heading, story
    // points, validity line (Q-102 expires), and the event note. The
    // waiting-approval summary stays in the always-visible total row.
    expect(within(card).getByText('Quote Q-102 · v2')).toBeInTheDocument()
    expect(within(card).getAllByText('Story points')).toHaveLength(1)
    expect(card.textContent).toContain('6 (max 9)')
    expect(card.textContent).toContain(
      `Valid until ${clockOf(SESSION_DETAIL.quotes[1].expiresAt as string)}`,
    )
    expect(card.textContent).toContain(FIXTURE_TIMELINE[14].content)
    expect(card.textContent).not.toContain('Waiting approval')
    expect(q102.querySelector('.kx-stream-estimate__row--total')?.textContent).toContain('Waiting approval')

    // Space on the focused button collapses it again.
    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(card).toHaveAttribute('hidden')
  })

  it('gives each estimate disclosure its own detail id and keeps each toggle wired to its own body', () => {
    renderSessionDetailPage()
    const q101 = slot(7)
    const q102 = slot(14)
    const q101Toggle = within(q101).getByRole('button', { name: /show breakdown/i })
    const q102Toggle = within(q102).getByRole('button', { name: /show breakdown/i })
    const q101DetailId = q101Toggle.getAttribute('aria-controls')
    const q102DetailId = q102Toggle.getAttribute('aria-controls')

    expect(q101DetailId).toBeTruthy()
    expect(q102DetailId).toBeTruthy()
    expect(q101DetailId).not.toBe(q102DetailId)

    const q101Detail = q101.querySelector(`#${q101DetailId}`)
    const q102Detail = q102.querySelector(`#${q102DetailId}`)
    expect(q101Detail).not.toBeNull()
    expect(q102Detail).not.toBeNull()
    expect(q101.contains(q101Detail as Node)).toBe(true)
    expect(q102.contains(q102Detail as Node)).toBe(true)

    const q101Card = within(q101).getByTestId('estimate-card')
    const q102Card = within(q102).getByTestId('estimate-card')
    expect(q101Card).toHaveAttribute('hidden')
    expect(q102Card).toHaveAttribute('hidden')

    fireEvent.click(q101Toggle)
    expect(q101Card).not.toHaveAttribute('hidden')
    expect(q102Card).toHaveAttribute('hidden')

    fireEvent.click(q102Toggle)
    expect(q102Card).not.toHaveAttribute('hidden')
    expect(q101Toggle).toHaveAttribute('aria-expanded', 'true')
    expect(q102Toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('approving the pending quote settles its estimate to Approved and appends gate + delivery-started turns', () => {
    const { bucket } = renderSessionDetailPage('', { type: 'SESSION_APPROVE_QUOTE', quoteId: 'Q-102' })

    // Before: the pending estimate reads Waiting approval; the tracker
    // badge counts it.
    expect(slot(14).querySelector('.kx-stream-estimate__row--total')?.textContent).toContain(
      'Waiting approval',
    )
    expect(
      screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill-badge'),
    ).not.toBeNull()

    fireEvent.click(screen.getByTestId('run-action'))

    // Status changed to DELIVERING; approval and delivery-started events
    // appended to the timeline (same reducer path the card CTAs drove).
    expect(bucket.current?.sessionDetail.status).toBe('DELIVERING')
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some((t) => t.content.includes('approved') && t.type === 'APPROVAL')).toBe(true)
    expect(timeline?.some((t) => t.content.includes('delivery started') && t.type === 'SYSTEM_EVENT')).toBe(true)

    // The settled estimate now reads Approved — the disclosure stays as a
    // historical record instead of the card hiding.
    expect(slot(14).querySelector('.kx-stream-estimate__row--total')?.textContent).toContain('Approved')
    expect(slot(14).querySelector('.kx-stream-estimate__row--total')?.textContent).not.toContain(
      'Waiting approval',
    )

    // The stream appends the resolved approval gate and the delivery-started
    // answer; the sticky status badge flips to Delivering and the tracker
    // badge drops.
    const gate = slot(16)
    expect(gate.querySelector('.kx-stream-turn__kind')?.textContent).toBe('APPROVAL')
    expect(gate.textContent).toContain('Quote Q-102 approved by Refactory Admin')
    expect(slot(17).textContent).toContain('Quote approved — delivery started')
    expect(screen.getByTestId('session-status')).toHaveTextContent('Delivering')
    expect(
      screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill-badge'),
    ).toBeNull()
  })

  it('rejecting the pending quote blocks the quote stage and renders a denied approval decision', () => {
    const { bucket } = renderSessionDetailPage('', {
      type: 'SESSION_REJECT_QUOTE',
      quoteId: 'Q-102',
      reason: 'Scope mismatch',
    })

    fireEvent.click(screen.getByTestId('run-action'))

    // Status stays WAITING_APPROVAL (the quote stage itself blocks).
    expect(['WAITING_APPROVAL', 'BLOCKED']).toContain(bucket.current?.sessionDetail.status)
    const rejected = bucket.current?.sessionDetail.quotes.find((q) => q.id === 'Q-102')
    expect(rejected?.status).toBe('REJECTED')

    // Rejection event added.
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some((t) => t.content.includes('rejected') && t.type === 'APPROVAL')).toBe(true)

    // The estimate settles to the em-dash (no decision value) and the stream
    // appends the rejection gate + acknowledgement answer.
    expect(slot(14).querySelector('.kx-stream-estimate__row--total')?.textContent).toContain('—')
    const gate = slot(16)
    expect(gate.querySelector('.kx-stream-turn__kind')?.textContent).toBe('APPROVAL')
    expect(gate.querySelector('.kx-stream-chip')?.textContent).toBe('Deny')
    expect(gate.textContent).toContain('Decision recorded:')
    expect(gate.textContent).toContain('Deny')
    expect(gate.textContent).toContain('Quote Q-102 rejected: Scope mismatch')
    expect(slot(17).textContent).toContain(
      'Understood — a revised quote can be requested whenever you are ready.',
    )
    expect(
      screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill-badge'),
    ).toBeNull()
  })

  it('requesting a revision supersedes the quote and appends a fresh pending estimate', () => {
    const { bucket } = renderSessionDetailPage('', {
      type: 'SESSION_REQUEST_QUOTE_REVISION',
      quoteId: 'Q-102',
    })

    fireEvent.click(screen.getByTestId('run-action'))

    // Old quote is SUPERSEDED; the new revision is PENDING_APPROVAL.
    const oldQuote = bucket.current?.sessionDetail.quotes.find((q) => q.id === 'Q-102')
    expect(oldQuote?.status).toBe('SUPERSEDED')
    const newQuote = bucket.current?.sessionDetail.quotes.find((q) => q.version === 3)
    expect(newQuote?.status).toBe('PENDING_APPROVAL')

    // System event about supersession added.
    const timeline = bucket.current?.sessionDetail.timeline
    expect(timeline?.some((t) => t.content.includes('superseded') && t.type === 'SYSTEM_EVENT')).toBe(true)

    // The stream appends the supersession answer and a fresh collapsed
    // estimate for the revision, still waiting approval — and the tracker
    // badge keeps counting one pending quote.
    expect(slot(16).textContent).toContain('Quote Q-102 superseded — revised quote Q-103 prepared')
    const revision = slot(17)
    expect(within(revision).getByRole('button', { name: /show breakdown/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    const revisionCard = within(revision).getByTestId('estimate-card')
    expect(revisionCard).toHaveAttribute('hidden')
    expect(revisionCard).toHaveAttribute('aria-label', 'Quote Q-103 · v3')
    expect(revision.querySelector('.kx-stream-estimate__row--total')?.textContent).toContain(
      'Waiting approval',
    )
    fireEvent.click(within(revision).getByRole('button', { name: /show breakdown/i }))
    expect(revisionCard).not.toHaveAttribute('hidden')
    expect(revisionCard.textContent).toContain('6 (max 9)')
    expect(revisionCard.textContent).toContain(`Valid until ${clockOf(newQuote?.expiresAt as string)}`)
    expect(revisionCard.textContent).toContain('for revised scope.')
    const footers = screen.getAllByTestId('turn-footer')
    expect(footers).toHaveLength(1)
    expect(within(revision).getByTestId('turn-footer')).toBe(footers[0])
    expect(slot(16).querySelector('[data-testid="turn-footer"]')).toBeNull()
    expect(
      screen.getByTestId('session-tracker').querySelector('.kx-session-detail__stage-pill-badge'),
    ).not.toBeNull()
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

  it('send appends only the user message and keeps the stream on that pending turn until the drawn delay elapses', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }
      const { container } = renderComposerHarness(bucket)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send message/i })

      const initialTimelineLength = bucket.current?.sessionDetail.timeline.length || 0
      const initialTurnCount = allSlots().length
      fireEvent.change(textarea, { target: { value: 'First question' } })
      fireEvent.click(sendButton)

      // Exactly +1 user message; the current detail stream shows that new
      // user turn and no assistant reply yet, while the composer stays
      // locked by pendingAssistant.
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(phases.length).toBeGreaterThanOrEqual(3)
      expect(phases.length).toBeLessThanOrEqual(6)
      expect(allSlots()).toHaveLength(initialTurnCount + 1)
      expect(screen.getByTestId(`session-turn-${initialTurnCount + 1}`)).toHaveTextContent('First question')
      expect(screen.queryByTestId(`session-turn-${initialTurnCount + 2}`)).not.toBeInTheDocument()
      expect(sendButton).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(phases))
      })

      // A natural response from the pool is appended; the pending state is
      // cleared and the stream gains the assistant turn.
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline.length).toBe(initialTimelineLength + 2)
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
      expect(ASSISTANT_RESPONSES).toContain(timeline[timeline.length - 1].content)
      expect(allSlots()).toHaveLength(initialTurnCount + 2)
      expect(screen.getByTestId(`session-turn-${initialTurnCount + 2}`)).toHaveTextContent(
        timeline[timeline.length - 1].content,
      )
      // Composer unlocked: the send guard (pendingAssistant) is cleared; the
      // button itself stays disabled only because the input is empty again.
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(bucket.current?.sessionDetail.pendingPhases).toEqual([])

      // A follow-up send is possible and re-arms the pending cycle.
      fireEvent.change(textarea, { target: { value: 'Follow-up' } })
      expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('holds the submitted user turn in place across the drawn pending cadence, then appends the reply', () => {
    vi.useFakeTimers()
    try {
      const bucket: StateBucket = { current: null }
      const { container } = renderComposerHarness(bucket)
      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      const sendButton = screen.getByRole('button', { name: /send message/i })

      const initialTurnCount = allSlots().length
      fireEvent.change(textarea, { target: { value: 'First question' } })
      fireEvent.click(sendButton)

      // The classic detail page no longer renders the retired timeline
      // loader; the observable pending state is the newly appended user turn
      // holding as the last stream item until the full drawn delay elapses.
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(phases.length).toBeGreaterThanOrEqual(3)
      for (let index = 1; index < phases.length; index += 1) {
        act(() => {
          vi.advanceTimersByTime(PENDING_PHASE_DURATION_MS)
        })
        expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
        expect(screen.getByTestId(`session-turn-${initialTurnCount + 1}`)).toHaveTextContent('First question')
        expect(screen.queryByTestId(`session-turn-${initialTurnCount + 2}`)).not.toBeInTheDocument()
      }

      // The final phase duration resolves the pending cycle and appends the
      // assistant reply.
      act(() => {
        vi.advanceTimersByTime(PENDING_PHASE_DURATION_MS)
      })
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(screen.getByTestId(`session-turn-${initialTurnCount + 2}`)).toBeInTheDocument()
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
      const initialTurnCount = allSlots().length
      fireEvent.change(textarea, { target: { value: 'Asked before navigating' } })
      fireEvent.click(sendButton)
      const phases = bucket.current?.sessionDetail.pendingPhases ?? []
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      expect(screen.getByTestId(`session-turn-${initialTurnCount + 1}`)).toHaveTextContent(
        'Asked before navigating',
      )
      expect(screen.queryByTestId(`session-turn-${initialTurnCount + 2}`)).not.toBeInTheDocument()
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

      // Back on the route: the pending user turn is still the stream tail,
      // the timer re-arms, and the reply lands exactly once after the full
      // wait.
      fireEvent.click(screen.getByTestId('route-toggle'))
      expect(screen.getByTestId(`session-turn-${initialTurnCount + 1}`)).toHaveTextContent(
        'Asked before navigating',
      )
      expect(screen.queryByTestId(`session-turn-${initialTurnCount + 2}`)).not.toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(phases))
      })
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
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
      // phases: the current stream stays on the settled history while the
      // pending guard keeps the send action locked.
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
      fireEvent.change(screen.getByTestId('session-composer-input'), {
        target: { value: 'Blocked while recovering' },
      })
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
      expect(allSlots()).toHaveLength(15)
      expect(screen.queryByTestId('session-turn-16')).not.toBeInTheDocument()

      // The full phase sequence plays out, then the reply lands.
      act(() => {
        vi.advanceTimersByTime(pendingDelayMs(preseeded.sessionDetail.pendingPhases))
      })
      expect(bucket.current?.sessionDetail.pendingAssistant).toBe(false)
      expect(allSlots()).toHaveLength(16)
      const timeline = bucket.current?.sessionDetail.timeline ?? []
      expect(timeline[timeline.length - 1].type).toBe('ASSISTANT_MESSAGE')
    } finally {
      vi.useRealTimers()
    }
  })

  it('response-group footers expose the current copy/share actions and stay state-safe while pending', () => {
    const { bucket } = renderSessionDetailPage()
    const footer = screen.getAllByTestId('turn-footer').at(-1)
    expect(footer).toBeDefined()
    expect(within(footer as HTMLElement).getByTestId('turn-copy')).toHaveAttribute(
      'aria-label',
      'Copy message',
    )
    expect(within(footer as HTMLElement).getByTestId('turn-share')).toHaveAttribute(
      'aria-label',
      'Share message',
    )

    // The settled group-final footer flashes link-copy feedback.
    fireEvent.click(within(footer as HTMLElement).getByTestId('turn-share'))
    expect(within(footer as HTMLElement).getByText('Link copied')).toBeInTheDocument()

    // While a fresh reply is pending, footer actions remain local-only: no
    // retry/re-ask behavior, no timeline mutation, pending state unchanged.
    const textarea = screen.getByTestId('session-composer-input') as HTMLTextAreaElement
    const sendButton = screen.getByRole('button', { name: /send message/i })
    fireEvent.change(textarea, { target: { value: 'Footer safety check' } })
    fireEvent.click(sendButton)

    const duringPending = bucket.current?.sessionDetail.timeline ?? []
    expect(duringPending[duringPending.length - 1].type).toBe('USER_MESSAGE')
    expect(duringPending[duringPending.length - 1].content).toBe('Footer safety check')
    expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)

    fireEvent.click(within(footer as HTMLElement).getByTestId('turn-copy'))
    expect(within(footer as HTMLElement).getByText('Copied')).toBeInTheDocument()
    expect(bucket.current?.sessionDetail.timeline ?? []).toHaveLength(duringPending.length)
    expect(bucket.current?.sessionDetail.pendingAssistant).toBe(true)
  })

  it('shows the locked composer notice when session status is COMPLETED', () => {
    const completedState = {
      ...initialState(),
      route: 'session-detail' as const,
      sessionDetail: {
        ...initialState().sessionDetail,
        status: 'COMPLETED' as const,
      },
    }

    render(
      <MockupContext.Provider value={{ state: completedState, dispatch: () => undefined }}>
        <OverlayLifecycleProvider overlay={completedState.overlay} dispatch={() => undefined}>
          <SessionDetailPage />
        </OverlayLifecycleProvider>
      </MockupContext.Provider>,
    )

    const composer = screen.getByTestId('session-composer')
    expect(composer).toHaveClass('kx-session-composer--locked')
    expect(screen.getByText('This session is completed. Start a follow-up cycle to continue.')).toBeInTheDocument()
    expect(screen.queryByTestId('session-composer-input')).not.toBeInTheDocument()
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