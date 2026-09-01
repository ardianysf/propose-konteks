/*
 * SessionStreamDetailPage tests — the stream-variant session detail page
 * contract (spec: .pi/orch/plans/session-stream-detail-spec.md):
 *   - the page renders via the new 'session-stream-detail' route with the
 *     attendance-review header title and context line (the fixture
 *     session `recent-attendance` / `hist-attendance`, system bsi-hris);
 *   - all ten stream kind labels render inside the stream, in the shared
 *     anatomy (the story runs 11 blocks — tool evidence appears twice);
 *   - navigation wiring: the `recent-attendance` sidebar title and the
 *     "Review attendance integration" history row open THIS page, while
 *     every other session still opens the classic SessionDetailPage
 *     (regression);
 *   - local interactions copied from the demo page's model: clarification
 *     answers (resumed state + the dynamic user-answer block), plan
 *     approval, and the gate decision.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useReducer } from 'react'
import SessionStreamDetailPage from './SessionStreamDetailPage'
import SessionDetailPage from './SessionDetailPage'
import V2App from '../v2/V2App'
import { MockupContext } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer, type MockupRoute } from '../state/mockupReducer'

const ALL_KIND_LABELS = [
  'REQUEST',
  'UNDERSTANDING',
  'CLARIFICATION',
  'PLAN',
  'APPROVAL NEEDED',
  'IN PROGRESS',
  'TOOL CALL',
  'ARTIFACT',
  'REVIEW FINDING',
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

  it('renders all ten kind labels inside the stream (11 slots — tool evidence twice)', () => {
    renderRoute('session-stream-detail')
    const stream = screen.getByTestId('session-stream')
    for (const label of ALL_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(11)
    // The attendance story's own copy leads the stream.
    expect(within(stream).getByText(/Review the MyTok ↔ BSI HRIS attendance integration/)).toBeInTheDocument()
  })

  it('renders every block with its sequential stream-kind anchor id', () => {
    renderRoute('session-stream-detail')
    for (let position = 1; position <= 11; position += 1) {
      const slot = document.getElementById(`stream-kind-${position}`)
      expect(slot).not.toBeNull()
      expect(slot?.querySelector('.kx-stream-block')).not.toBeNull()
    }
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
// Local interactions (same model as the demo page)
// ---------------------------------------------------------------------------

describe('SessionStreamDetailPage — interactions', () => {
  it('answering all clarification questions flips to the resumed state and inserts the user-answer block', () => {
    renderRoute('session-stream-detail')

    // Paused while unanswered — no answer block yet.
    expect(screen.getByText(/Execution is paused until both answers land/i)).toBeInTheDocument()
    expect(screen.getByText('awaiting answer')).toBeInTheDocument()
    expect(document.getElementById('stream-user-answer')).toBeNull()

    // First answer lands: still paused (one question outstanding).
    fireEvent.click(screen.getByRole('button', { name: 'HRIS server time (Asia/Jakarta)' }))
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()

    // Second answer completes the set.
    fireEvent.click(screen.getByRole('button', { name: 'August sample only (1,284)' }))

    expect(screen.getByText(/execution resumed/i)).toBeInTheDocument()
    expect(screen.getByText('answered')).toBeInTheDocument()
    expect(screen.queryByText(/Execution is paused/i)).not.toBeInTheDocument()

    // The dynamic user-answer block renders after the clarification block
    // with both chosen answers.
    const answerBlock = document.getElementById('stream-user-answer')
    expect(answerBlock).not.toBeNull()
    expect(answerBlock?.textContent).toContain('HRIS server time (Asia/Jakarta)')
    expect(answerBlock?.textContent).toContain('August sample only (1,284)')
    const clarificationSlot = document.getElementById('stream-kind-3')
    expect(clarificationSlot?.nextElementSibling?.contains(answerBlock!)).toBe(true)
  })

  it('approving the plan flips the status chip and retires the actions', () => {
    renderRoute('session-stream-detail')

    expect(screen.getByText('pending approval')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Approve plan' }))

    expect(screen.getByText('approved')).toBeInTheDocument()
    expect(screen.queryByText('pending approval')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve plan' })).not.toBeInTheDocument()
    expect(screen.getByText(/Plan approved — execution proceeds/i)).toBeInTheDocument()
  })

  it('the approval gate resolves to a decision summary row', () => {
    renderRoute('session-stream-detail')

    expect(screen.getByText('blocking')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Allow once' }))

    expect(screen.getByText(/Decision recorded:/i).textContent).toContain('Allow once')
    expect(screen.queryByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Always this session' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Deny' })).not.toBeInTheDocument()
    expect(screen.queryByText('blocking')).not.toBeInTheDocument()
  })

  it('expanding tool evidence reveals the mono input/output block', () => {
    renderRoute('session-stream-detail')

    const toggles = screen.getAllByRole('button', { name: 'Evidence' })
    expect(toggles.length).toBe(4)

    fireEvent.click(toggles[0])
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('rg -n "mytok" services/attendance-sync --type ts')).toBeInTheDocument()
    expect(
      screen.getByText('services/attendance-sync/shiftBoundary.ts:47: const day = utcDateOf(event.checkinAt)'),
    ).toBeInTheDocument()
  })

  it('copying the artifact shows feedback', () => {
    renderRoute('session-stream-detail')

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})
