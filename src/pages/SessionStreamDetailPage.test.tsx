/*
 * SessionStreamDetailPage tests — the CHAT-STYLE stream session detail
 * page contract (spec: .pi/orch/plans/chat-session-stream-spec.md
 * §Acceptance criteria):
 *   - the page renders via the 'session-stream-detail' route with the
 *     attendance-review header title and context line (the fixture
 *     session `recent-attendance` / `hist-attendance`, system bsi-hris);
 *   - chat anatomy: the user request renders as a right-aligned BUBBLE
 *     with attachment CARDS and a hover action bar (time + copy + edit),
 *     while agent turns render FLAT (no bubble) with their hover footer
 *     (copy + share + time) — 12 settled turns total;
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
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useReducer } from 'react'
import SessionStreamDetailPage from './SessionStreamDetailPage'
import SessionDetailPage from './SessionDetailPage'
import V2App from '../v2/V2App'
import { MockupContext } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer, type MockupRoute } from '../state/mockupReducer'

/** Kind labels the AGENT turns carry in their compact headers. The two
 * user turns are bubbles and intentionally carry NO kind label. */
const AGENT_KIND_LABELS = [
  'UNDERSTANDING',
  'CLARIFICATION',
  'PLAN',
  'APPROVAL',
  'PROGRESS',
  'TOOL CALL',
  'ARTIFACT',
  'REVIEW FINDING',
  'ANSWER',
  'HANDOFF',
] as const

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

    // Every agent kind label renders inside the stream…
    for (const label of AGENT_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    // …while the user bubbles carry no REQUEST label at all.
    expect(within(stream).queryByText('REQUEST')).toBeNull()

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

  it('renders every agent turn with its hover footer (copy, share, response time)', () => {
    renderRoute('session-stream-detail')
    const stream = screen.getByTestId('session-stream')

    const footers = stream.querySelectorAll('[data-testid="turn-footer"]')
    expect(footers).toHaveLength(10)

    // The understanding turn — first agent turn — exposes all three.
    const understanding = stream.querySelectorAll('.kx-stream-turn')[0] as HTMLElement
    expect(within(understanding).getByTestId('turn-copy')).toHaveAttribute(
      'aria-label',
      'Copy message',
    )
    expect(within(understanding).getByTestId('turn-share')).toHaveAttribute(
      'aria-label',
      'Share message',
    )
    expect(within(understanding).getByTestId('turn-footer')).toHaveTextContent('14:04')

    // Share copies the session link and flashes feedback.
    fireEvent.click(within(understanding).getByTestId('turn-share'))
    expect(within(understanding).getByText('Link copied')).toBeInTheDocument()
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

  it('renders the artifact as a chip with small hover actions', () => {
    renderRoute('session-stream-detail')

    const chip = screen.getByTestId('artifact-chip')
    expect(chip).toHaveTextContent('REPORT')
    expect(chip).toHaveTextContent('Review report — attendance integration')
    expect(chip).toHaveTextContent('v1')
    // No big-card body while collapsed — the preview only opens on demand.
    expect(screen.queryByText('## Sign-off')).not.toBeInTheDocument()

    const actions = within(screen.getByTestId('artifact-actions')).getAllByRole('button')
    expect(actions.map((action) => action.textContent)).toEqual(['Open', 'Copy', 'Download'])

    // Copy flashes feedback inside the chip.
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    // Open expands the compact mono schema preview; Close collapses it.
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByText('## Sign-off')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('## Sign-off')).not.toBeInTheDocument()
  })

  it('edits a user bubble inline and saves the new text locally', () => {
    renderRoute('session-stream-detail')

    const request = screen.getAllByTestId('user-bubble')[0]
    fireEvent.click(within(request).getByTestId('bubble-edit'))

    const editor = within(request).getByTestId('bubble-editor')
    const input = within(editor).getByTestId('bubble-edit-input')
    expect(input).toHaveDisplayValue(/Review the MyTok ↔ BSI HRIS attendance integration/)

    fireEvent.change(input, { target: { value: 'Review the integration again after the fix.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save' }))

    expect(within(request).getByTestId('bubble-text')).toHaveTextContent(
      'Review the integration again after the fix.',
    )
    expect(within(request).queryByTestId('bubble-editor')).not.toBeInTheDocument()
  })
})
