/*
 * SessionStreamDemoPage tests — the chat-style response-stream demo
 * contract (spec: .pi/orch/plans/chat-session-stream-spec.md):
 *   - chat anatomy: the user request renders as a right-aligned BUBBLE
 *     with attachment cards, agent turns render FLAT (no bubble) with
 *     their hover footer, and every slot keeps its stream-kind anchor;
 *   - the anchor chip row links to real block ids (labels follow the
 *     chat kind labels — PROGRESS, APPROVAL NEEDED chip for the gate);
 *   - the history page's "Response flow demo" button navigates to the
 *     demo route (same reducer-driven harness pattern as
 *     SessionDetailPage.test.tsx);
 *   - local interactions: clarification answer chips (resumed state +
 *     the inserted user-answer bubble), plan approval chip flip, the
 *     OUTSTANDING approval gate settling on Deny, collapsed-by-default
 *     tool rows expanding to i/o (running row stays open + animated),
 *     progress summary expand/collapse, and artifact chip copy feedback.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useReducer } from 'react'
import SessionStreamDemoPage from './SessionStreamDemoPage'
import SessionHistoryPage from './SessionHistoryPage'
import { MockupContext } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer } from '../state/mockupReducer'

/** The anchor nav labels (KIND_ORDER through KIND_LABELS) — note the
 * gate reads APPROVAL NEEDED and progress reads PROGRESS in the chat
 * label grammar. */
const ANCHOR_LABELS = [
  'REQUEST',
  'UNDERSTANDING',
  'CLARIFICATION',
  'PLAN',
  'APPROVAL NEEDED',
  'PROGRESS',
  'TOOL CALL',
  'ARTIFACT',
  'REVIEW FINDING',
  'HANDOFF',
] as const

/** Kind labels the AGENT turn headers carry inside the stream (the
 * request is a bubble and carries no label; the gate's header reads
 * APPROVAL while its pending state chip reads APPROVAL NEEDED). */
const AGENT_KIND_LABELS = [
  'UNDERSTANDING',
  'CLARIFICATION',
  'PLAN',
  'APPROVAL',
  'PROGRESS',
  'TOOL CALL',
  'ARTIFACT',
  'REVIEW FINDING',
  'HANDOFF',
] as const

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — structure', () => {
  it('renders the chat anatomy — one user bubble + ten flat agent turns (11 slots)', () => {
    render(<SessionStreamDemoPage />)
    const stream = screen.getByTestId('session-stream')

    // The story runs 11 blocks (tool evidence appears twice).
    expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(11)
    for (let position = 1; position <= 11; position += 1) {
      const slot = document.getElementById(`stream-kind-${position}`)
      expect(slot, `stream-kind-${position}`).not.toBeNull()
      expect(slot?.querySelector('.kx-stream-turn, .kx-stream-bubble-row')).not.toBeNull()
    }

    // The request is a bubble; agent turns render flat without bubbles.
    expect(within(stream).getAllByTestId('user-bubble')).toHaveLength(1)
    const turns = stream.querySelectorAll('.kx-stream-turn')
    expect(turns).toHaveLength(10)
    turns.forEach((turn) => expect(turn.querySelector('.kx-stream-bubble')).toBeNull())

    for (const label of AGENT_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('renders the request bubble with attachment cards and a hover action bar', () => {
    render(<SessionStreamDemoPage />)

    const request = screen.getByTestId('user-bubble')
    expect(request).toHaveClass('kx-stream-bubble-row')

    // Attachment-kind chips promote to cards: name + meta per file.
    const files = within(request).getByLabelText('Attachments')
    expect(within(files).getAllByRole('listitem')).toHaveLength(2)
    expect(within(files).getByText('invoices-aug-sample.csv')).toBeInTheDocument()
    expect(within(files).getByText('SOP-FIN-012 (rev 3)')).toBeInTheDocument()

    // Non-attachment chips ride inline under the prose.
    expect(within(request).getByText('environment: production')).toBeInTheDocument()

    // The hover action bar carries time + copy + edit.
    const bar = within(request).getByTestId('bubble-actions')
    expect(within(bar).getByTestId('bubble-copy')).toHaveAttribute('aria-label', 'Copy message')
    expect(within(bar).getByTestId('bubble-edit')).toHaveAttribute('aria-label', 'Edit message')
  })

  it('renders every agent turn with its hover footer (copy, share, time)', () => {
    const { container } = render(<SessionStreamDemoPage />)

    const footers = container.querySelectorAll('[data-testid="turn-footer"]')
    expect(footers).toHaveLength(10)
    const understanding = container.querySelectorAll('.kx-stream-turn')[0] as HTMLElement
    expect(within(understanding).getByTestId('turn-copy')).toHaveAttribute(
      'aria-label',
      'Copy message',
    )
    expect(within(understanding).getByTestId('turn-share')).toHaveAttribute(
      'aria-label',
      'Share message',
    )
  })

  it('renders an anchor chip per kind, each targeting an existing block id', () => {
    render(<SessionStreamDemoPage />)
    const nav = screen.getByRole('navigation', { name: 'Response kinds' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(10)
    expect(links.map((link) => link.textContent)).toEqual([...ANCHOR_LABELS])
    for (const link of links) {
      const id = link.getAttribute('href')?.slice(1)
      expect(id).toMatch(/^stream-kind-\d+$/)
      expect(document.getElementById(id!)).not.toBeNull()
    }
  })
})

// ---------------------------------------------------------------------------
// Navigation from the history page
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — navigation', () => {
  it('reaches the demo from the Session History header button', () => {
    function Harness() {
      const [state, dispatch] = useReducer(mockupReducer, initialState())
      useEffect(() => {
        dispatch({ type: 'NAVIGATE', route: 'session-history' })
      }, [dispatch])
      return (
        <MockupContext.Provider value={{ state, dispatch }}>
          <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
            {state.route === 'session-history' && <SessionHistoryPage />}
            {state.route === 'session-demo' && <SessionStreamDemoPage />}
          </OverlayLifecycleProvider>
        </MockupContext.Provider>
      )
    }

    render(<Harness />)

    // Starts on the history page with the discrete demo entry point.
    expect(screen.getByRole('heading', { name: 'Session history', level: 1 })).toBeInTheDocument()
    const demoButton = screen.getByRole('button', { name: 'Response flow demo' })

    fireEvent.click(demoButton)

    // The reducer route flipped and the demo page renders inside the shell
    // switch (mirrored here exactly as V2Shell mounts the route).
    expect(
      screen.getByRole('heading', { name: 'Session response stream', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Session history', level: 1 })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Local interactions
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — interactions', () => {
  it('answering all clarification questions flips to the resumed state and inserts the user-answer bubble', () => {
    render(<SessionStreamDemoPage />)

    // Paused while unanswered — no answer bubble yet.
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()
    expect(screen.getByText('awaiting answer')).toBeInTheDocument()
    expect(document.getElementById('stream-user-answer')).toBeNull()
    expect(screen.getAllByTestId('user-bubble')).toHaveLength(1)

    // First answer lands: still paused (one question outstanding).
    fireEvent.click(screen.getByRole('button', { name: 'Round half up (SOP default)' }))
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()

    // Second answer completes the set.
    fireEvent.click(screen.getByRole('button', { name: 'Restate August only' }))

    expect(screen.getByText(/execution resumed/i)).toBeInTheDocument()
    expect(screen.getByText('answered')).toBeInTheDocument()
    expect(screen.queryByText(/Execution is paused/i)).not.toBeInTheDocument()

    // The answers enter the stream as a NEW user bubble right after the
    // clarification block, with both chosen answers.
    const answerBlock = document.getElementById('stream-user-answer')
    expect(answerBlock).not.toBeNull()
    expect(answerBlock?.textContent).toContain('Round half up (SOP default)')
    expect(answerBlock?.textContent).toContain('Restate August only')
    expect(screen.getAllByTestId('user-bubble')).toHaveLength(2)
    const clarificationSlot = document.getElementById('stream-kind-3')
    expect(clarificationSlot?.nextElementSibling?.contains(answerBlock!)).toBe(true)
  })

  it('approving the plan flips the status chip and retires the actions', () => {
    render(<SessionStreamDemoPage />)

    expect(screen.getByText('pending approval')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve plan' }))

    expect(screen.getByText('approved')).toBeInTheDocument()
    expect(screen.queryByText('pending approval')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve plan' })).not.toBeInTheDocument()
    expect(screen.getByText(/Approved — execution proceeded/i)).toBeInTheDocument()
  })

  it('shows the outstanding approval gate prominently, then settles quiet on Deny', () => {
    render(<SessionStreamDemoPage />)
    const stream = screen.getByTestId('session-stream')

    // Outstanding: the APPROVAL NEEDED chip + framed pending block with
    // the action, consequence line, and the three explicit decisions.
    expect(within(stream).getAllByText('APPROVAL NEEDED').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('gate-pending')).toBeInTheDocument()
    expect(
      screen.getByText(/This migration rewrites stored invoice totals in place/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Always this session' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))

    expect(screen.getByText(/Decision recorded:/i).textContent).toContain('Deny')
    expect(screen.queryByTestId('gate-pending')).not.toBeInTheDocument()
    expect(within(stream).queryByText('APPROVAL NEEDED')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Always this session' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
  })

  it('renders tool rows collapsed by default; the running row stays open and animated', () => {
    render(<SessionStreamDemoPage />)

    const rows = screen.getAllByTestId('tool-row')
    expect(rows).toHaveLength(6)

    // Four done-with-evidence rows are expandable buttons, all collapsed.
    const expandable = rows.filter((row) => row.hasAttribute('aria-expanded'))
    expect(expandable).toHaveLength(4)
    expandable.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'false'))

    // The running scan row is a non-interactive status row, open with the
    // live pulse indicator — the only one on the page. The state class
    // rides the parent ledger <li>.
    const running = rows.find((row) =>
      row.closest('li')?.className.includes('kx-stream-call--running'),
    )!
    expect(running).toBeTruthy()
    expect(running).toHaveAttribute('role', 'status')
    expect(running.textContent).toContain('running')
    expect(running.querySelector('.kx-stream-call__pulse')).not.toBeNull()
    expect(
      screen.getAllByTestId('tool-row').filter((row) => row.querySelector('.kx-stream-call__pulse')),
    ).toHaveLength(1)
  })

  it('expanding tool evidence reveals the mono input/output block', () => {
    render(<SessionStreamDemoPage />)

    const expandable = screen
      .getAllByTestId('tool-row')
      .filter((row) => row.hasAttribute('aria-expanded'))

    fireEvent.click(expandable[0])
    expect(expandable[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('rg -n "round(" src/invoicing --type ts')).toBeInTheDocument()
    expect(screen.getByText(/totals\.ts:112:\s+const tax = round\(base \* rate, 2\)/)).toBeInTheDocument()

    // The second evidence block carries the diff-tinted patch lines.
    fireEvent.click(expandable[1])
    expect(expandable[1]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/const rounded = roundHalfUp\(scaled, 2\)/)).toBeInTheDocument()
  })

  it('collapses progress to the one-line summary; expanding reveals the phase list', () => {
    render(<SessionStreamDemoPage />)

    const summary = screen.getByTestId('progress-summary')
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(summary).toHaveTextContent('5 phases · 31m 12s · 2 of 5 done')
    expect(screen.queryByText('Run migration 20260901_tax_rounding_mode.sql')).not.toBeInTheDocument()

    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Run migration 20260901_tax_rounding_mode.sql')).toBeInTheDocument()
    expect(screen.getByText('Verify against August sample (41 invoices)')).toBeInTheDocument()

    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Run migration 20260901_tax_rounding_mode.sql')).not.toBeInTheDocument()
  })

  it('copying the artifact shows feedback', () => {
    render(<SessionStreamDemoPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})
