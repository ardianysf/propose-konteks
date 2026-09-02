/*
 * SessionStreamDetailPage tests — the CHAT-STYLE stream session detail
 * page contract (spec: .pi/orch/plans/chat-session-stream-spec.md
 * §Acceptance criteria):
 *   - the page renders via the 'session-stream-detail' route with the
 *     attendance-review header title and context line (the fixture
 *     session `recent-attendance` / `hist-attendance`, system bsi-hris);
 *   - chat anatomy: the user request renders as a right-aligned BUBBLE
 *     with attachment CARDS and a hover action bar (time + copy + edit),
 *     while agent turns render FLAT (no bubble) — the hover footer
 *     (copy + share + time) rides ONLY the final agent answer turn
 *     (spec refinements v2 #4) — 12 settled turns total; the
 *     understanding/answer turns render as pure prose with NO kind
 *     label (v2 #1) and the artifact as a full-width row with no
 *     badge (v2 #5);
 *   - the fixture is settled history: the clarification shows its
 *     recorded answers (no live chips), the plan boots approved, the
 *     gate boots decided ("Allow once"), progress collapses to one
 *     summary line, and tool rows render collapsed by default;
 *   - local interactions: tool-row expand/collapse (aria), progress
 *     summary expand/collapse, artifact chip actions (copy feedback +
 *     preview), bubble copy/edit, and the agent footer share feedback;
 *   - navigation wiring: the `recent-attendance` sidebar title and the
 *     "Review attendance integration" history row open THIS page, while
 *     every other session still opens the classic SessionDetailPage
 *     (regression).
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import { useEffect, useReducer } from 'react'
import SessionStreamDetailPage from './SessionStreamDetailPage'
import SessionDetailPage from './SessionDetailPage'
import V2App from '../v2/V2App'
import { LIVE_TURN_SCRIPT } from '../components/session/stream/attendanceReviewStory'
import { MockupContext } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer, type MockupRoute } from '../state/mockupReducer'

/** Kind labels the LABELED agent turns carry in their compact headers
 * (spec refinements v2 #1/#5): the conversational understanding/answer
 * turns and the artifact row render BARE — no header at all. The two
 * user turns are bubbles and intentionally carry NO kind label either. */
const AGENT_KIND_LABELS = [
  'CLARIFICATION',
  'PLAN',
  'APPROVAL',
  'PROGRESS',
  'TOOL CALL',
  'REVIEW FINDING',
  'HANDOFF',
] as const

/** Labels that must NOT render anywhere in the stream — the bare
 * conversational turns and the badge-less artifact row. */
const BARE_KIND_LABELS = ['UNDERSTANDING', 'ANSWER', 'ARTIFACT'] as const

// ---------------------------------------------------------------------------
// Harness — the page under the real reducer via the mockup context, with
// the route switch mirrored exactly as V2Shell mounts it.
// ---------------------------------------------------------------------------

function renderRoute(route: MockupRoute) {
  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
    useEffect(() => {
      dispatch({ type: 'NAVIGATE', route })
    }, [dispatch, route])
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          {state.route === 'session-stream-detail' ? (
            <SessionStreamDetailPage />
          ) : (
            <SessionDetailPage />
          )}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }
  return render(<Harness />)
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('SessionStreamDetailPage — structure', () => {
  it('renders via the new route with the attendance-review header title and context line', () => {
    renderRoute('session-stream-detail')

    const page = screen.getByTestId('session-stream-detail')
    expect(page).toHaveAttribute('aria-label', 'Session detail stream')
    expect(page).toHaveClass('kx-session-detail')

    // The shared SessionHeader chrome carries THIS session's title and
    // context (mode · system · component), not the fixture default.
    expect(
      screen.getByRole('heading', { name: 'Review attendance integration' }),
    ).toBeInTheDocument()
    const context = screen.getByTestId('session-context')
    expect(context).toHaveTextContent('Engineering')
    expect(context).toHaveTextContent('BSI - HRIS')
    expect(context).toHaveTextContent('attendance integration')
    expect(context).not.toHaveTextContent('Investigate and fix')

    // The sticky composer area keeps the shared detail composer mounted.
    expect(screen.getByTestId('session-composer-area')).toBeInTheDocument()
    expect(screen.getByTestId('session-composer')).toBeInTheDocument()
  })

  it('renders the chat anatomy — two user bubbles + ten flat agent turns (12 slots)', () => {
    renderRoute('session-stream-detail')
    const stream = screen.getByTestId('session-stream')

    // The settled story runs 12 turns, each in its own slot.
    expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(12)
    for (let position = 1; position <= 12; position += 1) {
      const slot = document.getElementById(`stream-kind-${position}`)
      expect(slot, `stream-kind-${position}`).not.toBeNull()
      // Every slot carries the shared anatomy: a flat agent turn OR a
      // right-aligned user bubble row.
      expect(slot?.querySelector('.kx-stream-turn, .kx-stream-bubble-row')).not.toBeNull()
    }

    // The two user turns (request + clarification answer) are bubbles.
    const bubbles = within(stream).getAllByTestId('user-bubble')
    expect(bubbles).toHaveLength(2)
    bubbles.forEach((bubble) => expect(bubble).toHaveClass('kx-stream-bubble-row'))

    // The ten agent turns render FLAT — a bubble inside an agent turn
    // would break the chat anatomy.
    const turns = stream.querySelectorAll('.kx-stream-turn')
    expect(turns).toHaveLength(10)
    turns.forEach((turn) => {
      expect(turn.querySelector('.kx-stream-bubble')).toBeNull()
      expect(turn.querySelector('.kx-stream-bubble-row')).toBeNull()
    })

    // Every labeled agent kind renders inside the stream…
    for (const label of AGENT_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    // …while the bare turns (understanding, answer) and the artifact
    // row carry NO kind label, and the user bubbles no REQUEST label.
    for (const label of [...BARE_KIND_LABELS, 'REQUEST'] as const) {
      expect(within(stream).queryByText(label)).toBeNull()
    }

    // The bare understanding turn is found by its PROSE, not a label.
    expect(
      within(stream).getByText(/Got it — you need the attendance integration reviewed end to end/),
    ).toBeInTheDocument()

    // The attendance story's own copy leads the stream.
    expect(
      within(stream).getByText(/Review the MyTok ↔ BSI HRIS attendance integration/),
    ).toBeInTheDocument()
  })

  it('renders the user request as a bubble with attachment cards and a hover action bar', () => {
    renderRoute('session-stream-detail')

    const request = screen.getAllByTestId('user-bubble')[0]
    expect(request).toHaveClass('kx-stream-bubble-row')
    expect(request.querySelector('.kx-stream-bubble')).not.toBeNull()

    // The message prose leads the bubble.
    expect(within(request).getByTestId('bubble-text').textContent).toContain(
      'Review the MyTok ↔ BSI HRIS attendance integration before Friday’s release',
    )

    // Attachments render as CARDS inside the bubble: file name + meta.
    const files = within(request).getByLabelText('Attachments')
    expect(within(files).getAllByRole('listitem')).toHaveLength(2)
    expect(within(files).getByText('attendance-sync-spec.md')).toBeInTheDocument()
    expect(within(files).getByText('Markdown · rev 4 · 18 KB')).toBeInTheDocument()
    expect(within(files).getByText('mytok-sync-logs-aug.csv')).toBeInTheDocument()
    expect(within(files).getByText('CSV · 1,284 rows · 38 KB')).toBeInTheDocument()

    // Non-attachment chips ride inline under the prose.
    expect(within(request).getByText('environment: staging')).toBeInTheDocument()

    // The hover action bar carries the timestamp + copy + edit affordances.
    const bar = within(request).getByTestId('bubble-actions')
    expect(bar).toHaveTextContent('14:02')
    expect(within(bar).getByTestId('bubble-copy')).toHaveAttribute('aria-label', 'Copy message')
    expect(within(bar).getByTestId('bubble-edit')).toHaveAttribute('aria-label', 'Edit message')
  })

  it('renders one hover footer per agent response group (copy, share, time)', () => {
    renderRoute('session-stream-detail')
    const stream = screen.getByTestId('session-stream')

    // TWO response groups in the settled history (spec refinements v3
    // #2): group 1 = understanding + clarification (ends right before
    // the user's answer bubble, slot 4); group 2 = plan … completion.
    // Each group's LAST turn carries the footer — slots 3 and 12.
    const footers = stream.querySelectorAll('[data-testid="turn-footer"]')
    expect(footers).toHaveLength(2)
    const groupOneFinal = document.getElementById('stream-kind-3')!
    const groupTwoFinal = document.getElementById('stream-kind-12')!
    expect(groupOneFinal.querySelector('[data-testid="turn-footer"]')).not.toBeNull()
    expect(groupTwoFinal.querySelector('[data-testid="turn-footer"]')).not.toBeNull()
    expect(within(groupTwoFinal).getByTestId('turn-copy')).toHaveAttribute(
      'aria-label',
      'Copy message',
    )
    expect(within(groupTwoFinal).getByTestId('turn-share')).toHaveAttribute(
      'aria-label',
      'Share message',
    )

    // The final ANSWER (slot 11) renders prose but no footer — the
    // handoff after it ends the group.
    const finalAnswer = document.getElementById('stream-kind-11')!
    expect(finalAnswer.querySelector('[data-testid="turn-footer"]')).toBeNull()

    // Exactly two turns carry a footer and they are the group finals.
    const withFooter = Array.from(stream.querySelectorAll('.kx-stream-turn')).filter((turn) =>
      turn.querySelector('[data-testid="turn-footer"]'),
    )
    expect(withFooter).toHaveLength(2)
    expect(withFooter[0].closest('.kx-stream-slot')).toBe(groupOneFinal)
    expect(withFooter[1].closest('.kx-stream-slot')).toBe(groupTwoFinal)
    expect(
      within(document.getElementById('stream-kind-2')!).queryByTestId('turn-footer'),
    ).toBeNull()

    // Share copies the session link and flashes feedback (group-2
    // footer).
    fireEvent.click(within(groupTwoFinal).getByTestId('turn-share'))
    expect(within(groupTwoFinal).getByText('Link copied')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Navigation wiring — the real V2App (sidebar + shell route switch)
// ---------------------------------------------------------------------------

describe('SessionStreamDetailPage — navigation wiring', () => {
  it('clicking the recent-attendance title in the sidebar opens the stream detail page', () => {
    render(<V2App />)

    const title = screen.getByRole('button', { name: 'Review attendance integration' })
    expect(title).toHaveClass('kx-v2-recent__title')

    fireEvent.click(title)
    expect(screen.getByTestId('session-stream-detail')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Review attendance integration' }),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('session-detail')).not.toBeInTheDocument()
  })

  it('clicking another session’s title still opens the classic session detail page (regression)', () => {
    render(<V2App />)

    fireEvent.click(screen.getByRole('button', { name: 'EDP Integration Fix - Mobile' }))
    expect(screen.getByTestId('session-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('session-stream-detail')).not.toBeInTheDocument()
    // The classic page keeps its fixture header — untouched behavior.
    expect(
      screen.getByRole('heading', {
        name: 'Investigate and fix the error when get list approval exception that list not showing',
      }),
    ).toBeInTheDocument()
  })

  it('clicking the "Review attendance integration" history row opens the stream detail page', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-sessions-trigger'))
    expect(
      screen.getByRole('heading', { name: 'Session history', level: 1 }),
    ).toBeInTheDocument()

    const rows = screen.getAllByTestId('history-row')
    const attendance = rows.find((row) =>
      row.textContent?.includes('Review attendance integration'),
    )!
    expect(attendance).toBeInTheDocument()

    fireEvent.click(attendance)
    expect(screen.getByTestId('session-stream-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('session-detail')).not.toBeInTheDocument()
  })

  it('clicking another history row still opens the classic session detail page (regression)', () => {
    render(<V2App />)
    fireEvent.click(screen.getByTestId('v2-sessions-trigger'))

    const rows = screen.getAllByTestId('history-row')
    const edp = rows.find((row) => row.textContent?.includes('EDP Integration Fix - Mobile'))!
    fireEvent.click(edp)
    expect(screen.getByTestId('session-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('session-stream-detail')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Settled history + local interactions
// ---------------------------------------------------------------------------

describe('SessionStreamDetailPage — settled history', () => {
  it('renders the clarification settled: recorded answers, resumed notice, no live chips', () => {
    renderRoute('session-stream-detail')

    // Settled state: answered chip + resumed notice.
    expect(screen.getByText('answered')).toBeInTheDocument()
    expect(screen.getByText(/execution resumed/i)).toBeInTheDocument()
    expect(screen.queryByText(/Execution is paused/i)).not.toBeInTheDocument()

    // Each question shows its recorded answer inside the turn…
    const settled = screen.getAllByTestId('clar-settled-answer')
    expect(settled).toHaveLength(2)
    expect(settled[0].textContent).toContain('HRIS server time (Asia/Jakarta)')
    expect(settled[1].textContent).toContain('August sample only (1,284)')

    // …and no interactive answer chips remain — the answers already live
    // in the stream as the user bubble right after the questions.
    expect(screen.queryByRole('button', { name: 'HRIS server time (Asia/Jakarta)' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'August sample only (1,284)' })).not.toBeInTheDocument()
    expect(document.getElementById('stream-user-answer')).toBeNull()

    const answerBubble = screen.getAllByTestId('user-bubble')[1]
    expect(within(answerBubble).getByTestId('bubble-text').textContent).toContain(
      '1. HRIS server time (Asia/Jakarta)',
    )
  })

  it('boots the plan approved — chip, settled note, retired actions', () => {
    renderRoute('session-stream-detail')

    expect(screen.getByText('approved')).toBeInTheDocument()
    expect(screen.queryByText('pending approval')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request changes' })).not.toBeInTheDocument()
    expect(screen.getByText(/Approved — execution proceeded/i)).toBeInTheDocument()
  })

  it('boots the approval gate settled quiet on "Allow once"', () => {
    renderRoute('session-stream-detail')

    // Settled history: the resolved line records the decision…
    const resolved = screen.getByText(/Decision recorded:/i)
    expect(resolved.textContent).toContain('Allow once')
    // …the outstanding frame and every decision button are gone…
    expect(screen.queryByTestId('gate-pending')).not.toBeInTheDocument()
    expect(screen.queryByText('APPROVAL NEEDED')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Always this session' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
    // …and the header chip echoes the decision.
    expect(screen.getAllByText('Allow once').length).toBeGreaterThanOrEqual(2)
  })

  it('collapses progress to the one-line summary; expanding reveals the phases', () => {
    renderRoute('session-stream-detail')

    const summary = screen.getByTestId('progress-summary')
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(summary).toHaveTextContent('5 phases · 34m 41s · Completed')
    expect(screen.queryByText('Map the MyTok → HRIS sync path')).not.toBeInTheDocument()

    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Map the MyTok → HRIS sync path')).toBeInTheDocument()
    expect(screen.getByText('Replay sandbox batch att-2026-0814')).toBeInTheDocument()
    expect(screen.getByText('6m 12s')).toBeInTheDocument()

    fireEvent.click(summary)
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Map the MyTok → HRIS sync path')).not.toBeInTheDocument()
  })
})

describe('SessionStreamDetailPage — interactions', () => {
  it('renders tool rows collapsed by default; expanding reveals the mono i/o block', () => {
    renderRoute('session-stream-detail')

    const rows = screen.getAllByTestId('tool-row')
    expect(rows).toHaveLength(4)

    // Settled history: every done row with evidence renders collapsed.
    rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'false'))
    expect(screen.queryByText('rg -n "mytok" services/attendance-sync --type ts')).not.toBeInTheDocument()

    fireEvent.click(rows[0])
    expect(rows[0]).toHaveAttribute('aria-expanded', 'true')
    // The detail is wired through aria-controls to the revealed block.
    const detailId = rows[0].getAttribute('aria-controls')!
    expect(detailId).toBeTruthy()
    expect(document.getElementById(detailId)).not.toBeNull()
    expect(screen.getByText('rg -n "mytok" services/attendance-sync --type ts')).toBeInTheDocument()
    expect(
      screen.getByText('services/attendance-sync/shiftBoundary.ts:47: const day = utcDateOf(event.checkinAt)'),
    ).toBeInTheDocument()

    fireEvent.click(rows[0])
    expect(rows[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders the artifact as a full-width row with hover actions and no badge', () => {
    renderRoute('session-stream-detail')

    // The artifact is a FULL-WIDTH row (spec refinements v2 #5) — title +
    // version + hover/focus actions, not a small chip.
    const row = screen.getByTestId('artifact-row')
    expect(row).toHaveClass('kx-stream-artifact-row--full')
    expect(row).toHaveTextContent('Review report — attendance integration')
    expect(row).toHaveTextContent('v1 · 14:46')
    // No type badge rides the row, and the turn carries no ARTIFACT kind
    // header at all — the row is bare.
    expect(within(row).queryByText('REPORT')).toBeNull()
    const artifactTurn = row.closest('.kx-stream-turn') as HTMLElement
    expect(artifactTurn.querySelector('.kx-stream-turn__head')).toBeNull()
    // No big-card body while collapsed — the preview only opens on demand.
    expect(screen.queryByText('## Sign-off')).not.toBeInTheDocument()

    const actions = within(screen.getByTestId('artifact-actions')).getAllByRole('button')
    expect(actions.map((action) => action.textContent)).toEqual(['Open', 'Copy', 'Download'])

    // Copy flashes feedback inside the row.
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    // Open expands the compact mono schema preview; Close collapses it.
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByText('## Sign-off')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('## Sign-off')).not.toBeInTheDocument()
  })

  it('edits a user bubble — Save & resend keeps the new text, truncates the turns after it, and replays the live script', () => {
    vi.useFakeTimers()
    try {
      renderRoute('session-stream-detail')

      const request = screen.getAllByTestId('user-bubble')[0]
      fireEvent.click(within(request).getByTestId('bubble-edit'))

      const editor = within(request).getByTestId('bubble-editor')
      const input = within(editor).getByTestId('bubble-edit-input')
      expect(input).toHaveDisplayValue(/Review the MyTok ↔ BSI HRIS attendance integration/)

      fireEvent.change(input, { target: { value: 'Review the integration again after the fix.' } })
      // Phase 2: the primary action is save-and-RESEND, not local-only save.
      fireEvent.click(within(editor).getByRole('button', { name: 'Save & resend' }))

      // The edited bubble keeps its new text and closes the editor…
      expect(within(request).getByTestId('bubble-text')).toHaveTextContent(
        'Review the integration again after the fix.',
      )
      expect(within(request).queryByTestId('bubble-editor')).not.toBeInTheDocument()

      // …every turn after it is truncated (mockup regeneration): only the
      // edited bubble slot survives; the settled agent history is gone.
      const stream = screen.getByTestId('session-stream')
      expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(1)
      expect(screen.queryByTestId('stream-turn-2')).not.toBeInTheDocument()
      expect(screen.queryByText('UNDERSTANDING')).not.toBeInTheDocument()

      // …the composer locks while the replay runs…
      expect(screen.getByTestId('session-composer-input')).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()

      // …and the live script restarts: the typing indicator reappears,
      // then hands off to the scripted understanding turn below the edit.
      act(() => {
        vi.advanceTimersByTime(LIVE_TURN_SCRIPT.typingDelayMs)
      })
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(LIVE_TURN_SCRIPT.openDelayMs)
      })
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      const understanding = screen.getByTestId('stream-live-understanding')
      expect(
        within(understanding).getByText(/re-verify the overnight-shift boundary fix from PR #1301/),
      ).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

// ---------------------------------------------------------------------------
// Live mock composer flow (spec §Live mock v2 — staged interactive):
// send → locked composer + staged run that PARKS at the approval gate,
// resumes on the decision, parks again at the plan, and only executes
// after "Approve plan" (deny / request changes close the turn).
// ---------------------------------------------------------------------------

describe('SessionStreamDetailPage — live mock composer flow', () => {
  /** Advances the fake clock one script gap inside act(). */
  const step = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms)
    })

  it('sending appends a user bubble (Sending… → sent), locks the composer, and shows the typing indicator', () => {
    vi.useFakeTimers()
    try {
      renderRoute('session-stream-detail')

      const input = screen.getByTestId('session-composer-input')
      const send = screen.getByRole('button', { name: 'Send message' })

      fireEvent.change(input, {
        target: { value: 'Please re-verify the overnight-shift fix from PR #1301.' },
      })
      fireEvent.click(send)

      // The typed text lands immediately as a NEW user bubble below the
      // settled history — initially marked "Sending…".
      const bubble = within(screen.getByTestId('stream-live-user')).getByTestId('user-bubble')
      expect(within(bubble).getByTestId('bubble-text')).toHaveTextContent(
        'Please re-verify the overnight-shift fix from PR #1301.',
      )
      expect(within(bubble).getByTestId('bubble-actions')).toHaveTextContent('Sending…')

      // After the sent delay the bubble flips to sent "just now".
      step(LIVE_TURN_SCRIPT.sentDelayMs)
      expect(within(bubble).getByTestId('bubble-actions')).toHaveTextContent('just now')

      // The composer cleared the input and locked it while the scripted
      // agent turn runs (input disabled + send disabled + aria-busy).
      expect(input).toHaveValue('')
      expect(input).toBeDisabled()
      expect(send).toBeDisabled()
      expect(send).toHaveAttribute('aria-busy', 'true')

      // The typing indicator appears as a polite live region.
      step(LIVE_TURN_SCRIPT.typingDelayMs)
      const typing = screen.getByTestId('typing-indicator')
      expect(typing).toHaveAttribute('aria-live', 'polite')
      expect(typing).toHaveTextContent('Thinking…')
    } finally {
      vi.useRealTimers()
    }
  })

  it('runs the staged turn — gate WAITS for a decision, plan WAITS for approval, then progress/tool/artifact/answer — then unlocks the composer', () => {
    vi.useFakeTimers()
    try {
      renderRoute('session-stream-detail')

      fireEvent.change(screen.getByTestId('session-composer-input'), {
        target: { value: 'Re-verify the overnight-shift fix from PR #1301.' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

      // Typing indicator appears, then hands off to the scripted
      // understanding turn.
      step(LIVE_TURN_SCRIPT.sentDelayMs + LIVE_TURN_SCRIPT.typingDelayMs)
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
      step(LIVE_TURN_SCRIPT.openDelayMs)
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      const understandingSlot = screen.getByTestId('stream-live-understanding')
      expect(
        within(understandingSlot).getByText(
          /re-verify the overnight-shift boundary fix from PR #1301/,
        ),
      ).toBeInTheDocument()
      // Bare conversational prose — no UNDERSTANDING label, no footer.
      expect(within(understandingSlot).queryByText('UNDERSTANDING')).toBeNull()
      expect(within(understandingSlot).queryByTestId('turn-footer')).toBeNull()

      // The run PARKS at an outstanding approval gate — WAIT point #1.
      step(LIVE_TURN_SCRIPT.gateDelayMs)
      const gateSlot = screen.getByTestId('stream-live-gate')
      expect(within(gateSlot).getByTestId('gate-pending')).toBeInTheDocument()
      expect(within(gateSlot).getByText('APPROVAL NEEDED')).toBeInTheDocument()
      expect(within(gateSlot).getByRole('button', { name: 'Allow once' })).toBeInTheDocument()
      expect(within(gateSlot).getByRole('button', { name: 'Always this session' })).toBeInTheDocument()
      expect(within(gateSlot).getByRole('button', { name: 'Deny' })).toBeInTheDocument()

      // While the gate waits NOTHING beyond it appears — advance timers
      // generously: no plan, progress, tool, artifact, or answer. The
      // composer stays locked; the gate choices are the only way forward.
      step(60_000)
      expect(screen.queryByTestId('stream-live-plan')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-progress')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-tool')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-artifact')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-answer')).not.toBeInTheDocument()
      expect(screen.getByTestId('session-composer-input')).toBeDisabled()

      // Decision: Allow once → the gate settles visibly with the
      // recorded decision…
      fireEvent.click(within(gateSlot).getByRole('button', { name: 'Allow once' }))
      expect(within(gateSlot).queryByTestId('gate-pending')).not.toBeInTheDocument()
      expect(within(gateSlot).getByText(/Decision recorded:/)).toBeInTheDocument()
      expect(gateSlot).toHaveTextContent('Allow once')

      // …brief typing, then the interactive plan — WAIT point #2.
      step(LIVE_TURN_SCRIPT.allowTypingDelayMs)
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
      step(LIVE_TURN_SCRIPT.planDelayMs)
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      const planSlot = screen.getByTestId('stream-live-plan')
      expect(within(planSlot).getByRole('button', { name: 'Approve plan' })).toBeInTheDocument()
      expect(within(planSlot).getByRole('button', { name: 'Request changes' })).toBeInTheDocument()
      expect(within(planSlot).getByText('pending approval')).toBeInTheDocument()
      expect(
        within(planSlot).getByText('sandbox batch att-2026-0815 (overnight subset)'),
      ).toBeInTheDocument()

      // The plan waits too — nothing beyond it appears while locked.
      step(60_000)
      expect(screen.queryByTestId('stream-live-progress')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-tool')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-artifact')).not.toBeInTheDocument()
      expect(screen.getByTestId('session-composer-input')).toBeDisabled()

      // Approve plan → the plan settles (chip flips, actions retire)…
      fireEvent.click(within(planSlot).getByRole('button', { name: 'Approve plan' }))
      expect(within(planSlot).queryByRole('button', { name: 'Approve plan' })).not.toBeInTheDocument()
      expect(within(planSlot).getByText('approved')).toBeInTheDocument()

      // …then live progress boots EXPANDED with the active replay phase
      // and a REAL ticking elapsed clock (mm:ss advances with the fake
      // clock, tabular on the summary line).
      step(LIVE_TURN_SCRIPT.execution.progressDelayMs)
      const progressSlot = screen.getByTestId('stream-live-progress')
      expect(within(progressSlot).getByTestId('progress-summary')).toHaveAttribute(
        'aria-expanded',
        'true',
      )
      expect(within(progressSlot).getByTestId('progress-summary')).toHaveTextContent('00:00')
      expect(within(progressSlot).getByText('Replay overnight subset (37 records)')).toBeInTheDocument()
      expect(within(progressSlot).getByText('running')).toBeInTheDocument()
      step(1000)
      expect(within(progressSlot).getByTestId('progress-summary')).toHaveTextContent('00:01')

      // …the scripted tool call appears RUNNING (open status row)…
      step(LIVE_TURN_SCRIPT.execution.toolRunningDelayMs - 1000)
      const toolSlot = screen.getByTestId('stream-live-tool')
      const running = within(toolSlot).getByTestId('tool-row')
      expect(running).toHaveTextContent('running')
      expect(running).toHaveTextContent('sandbox batch att-2026-0815 (overnight subset · 37 records)')

      // …then flips to DONE and collapses: duration + state visible, the
      // evidence detail hidden behind aria-expanded=false.
      step(LIVE_TURN_SCRIPT.execution.toolDoneDelayMs)
      const done = within(toolSlot).getByTestId('tool-row')
      expect(done).toHaveAttribute('aria-expanded', 'false')
      expect(done).toHaveTextContent('done')
      expect(done).toHaveTextContent('1m 12s')
      expect(within(toolSlot).queryByText(/37\/37 overnight records/)).not.toBeInTheDocument()

      // Progress settles collapsed to the one-line summary, and the
      // refreshed artifact row lands with its v1.1 version.
      step(LIVE_TURN_SCRIPT.execution.artifactDelayMs)
      const settled = within(progressSlot).getByTestId('progress-summary')
      expect(settled).toHaveAttribute('aria-expanded', 'false')
      expect(settled).toHaveTextContent('2 phases · 2m 05s · Completed')
      const artifactSlot = screen.getByTestId('stream-live-artifact')
      const row = within(artifactSlot).getByTestId('artifact-row')
      expect(row).toHaveTextContent('Review report — attendance integration')
      expect(row).toHaveTextContent('v1.1 · 15:12')

      // The scripted final answer arrives with the conversation's ONE
      // hover footer (footer-on-final-answer rule; composer still locked
      // until the settle delay elapses)…
      step(LIVE_TURN_SCRIPT.execution.answerDelayMs)
      const answerSlot = screen.getByTestId('stream-live-answer')
      expect(
        within(answerSlot).getByText(/Verified — the boundary fix holds\./),
      ).toBeInTheDocument()
      expect(within(answerSlot).getByTestId('turn-footer')).toHaveTextContent('just now')
      expect(within(answerSlot).getByTestId('turn-share')).toHaveAttribute(
        'aria-label',
        'Share message',
      )
      expect(screen.getByTestId('session-composer-input')).toBeDisabled()

      // …then the composer unlocks: input enabled and a fresh message can
      // be typed and sent again.
      step(LIVE_TURN_SCRIPT.execution.settleDelayMs)
      const input = screen.getByTestId('session-composer-input')
      expect(input).toBeEnabled()
      const send = screen.getByRole('button', { name: 'Send message' })
      expect(send).toHaveAttribute('aria-busy', 'false')
      fireEvent.change(input, { target: { value: 'Thanks — ready for Friday.' } })
      expect(send).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('gate Deny closes the turn politely — no plan, progress, tool, or artifact ever appears — and unlocks the composer', () => {
    vi.useFakeTimers()
    try {
      renderRoute('session-stream-detail')

      fireEvent.change(screen.getByTestId('session-composer-input'), {
        target: { value: 'Re-verify the overnight-shift fix from PR #1301.' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

      // Straight to the outstanding gate (typing + understanding pass by).
      step(
        LIVE_TURN_SCRIPT.sentDelayMs +
          LIVE_TURN_SCRIPT.typingDelayMs +
          LIVE_TURN_SCRIPT.openDelayMs +
          LIVE_TURN_SCRIPT.gateDelayMs,
      )
      const gateSlot = screen.getByTestId('stream-live-gate')
      expect(within(gateSlot).getByTestId('gate-pending')).toBeInTheDocument()

      // Deny → the gate settles with the recorded decision…
      fireEvent.click(within(gateSlot).getByRole('button', { name: 'Deny' }))
      expect(within(gateSlot).queryByTestId('gate-pending')).not.toBeInTheDocument()
      expect(within(gateSlot).getByText(/Decision recorded:/)).toBeInTheDocument()
      expect(gateSlot).toHaveTextContent('Deny')

      // …brief typing, then short polite closing prose — NO execution:
      // no plan, progress, tool, or artifact ever appears.
      step(LIVE_TURN_SCRIPT.deny.typingDelayMs)
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
      step(LIVE_TURN_SCRIPT.deny.answerDelayMs)
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
      const closing = screen.getByTestId('stream-live-answer')
      expect(within(closing).getByText(/Nothing was executed and nothing was written/)).toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-plan')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-progress')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-tool')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-artifact')).not.toBeInTheDocument()

      // The turn ends and the composer unlocks for the next message.
      step(LIVE_TURN_SCRIPT.deny.settleDelayMs)
      expect(screen.getByTestId('session-composer-input')).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Send message' })).toHaveAttribute(
        'aria-busy',
        'false',
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('plan Request changes closes the turn asking what to change — no execution — and unlocks the composer', () => {
    vi.useFakeTimers()
    try {
      renderRoute('session-stream-detail')

      fireEvent.change(screen.getByTestId('session-composer-input'), {
        target: { value: 'Re-verify the overnight-shift fix from PR #1301.' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

      // Reach the plan: gate → Allow once → typing → plan.
      step(
        LIVE_TURN_SCRIPT.sentDelayMs +
          LIVE_TURN_SCRIPT.typingDelayMs +
          LIVE_TURN_SCRIPT.openDelayMs +
          LIVE_TURN_SCRIPT.gateDelayMs,
      )
      fireEvent.click(
        within(screen.getByTestId('stream-live-gate')).getByRole('button', { name: 'Allow once' }),
      )
      step(LIVE_TURN_SCRIPT.allowTypingDelayMs + LIVE_TURN_SCRIPT.planDelayMs)
      const planSlot = screen.getByTestId('stream-live-plan')

      // Request changes → the plan stays pending…
      fireEvent.click(within(planSlot).getByRole('button', { name: 'Request changes' }))
      expect(within(planSlot).getByText('pending approval')).toBeInTheDocument()

      // …brief typing, then short prose asking what to change; no
      // execution ever starts.
      step(LIVE_TURN_SCRIPT.requestChanges.typingDelayMs)
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
      step(LIVE_TURN_SCRIPT.requestChanges.answerDelayMs)
      const closing = screen.getByTestId('stream-live-answer')
      expect(within(closing).getByText(/tell me what to change in the plan/)).toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-progress')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-tool')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stream-live-artifact')).not.toBeInTheDocument()

      // The turn ends and the composer unlocks — the user can send the
      // requested changes as a new message.
      step(LIVE_TURN_SCRIPT.requestChanges.settleDelayMs)
      expect(screen.getByTestId('session-composer-input')).toBeEnabled()
    } finally {
      vi.useRealTimers()
    }
  })
})
