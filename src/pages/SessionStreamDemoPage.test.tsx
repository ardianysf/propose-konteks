/*
 * SessionStreamDemoPage tests — the response-stream demo contract:
 *   - all ten kind labels render inside the stream, in the shared
 *     anatomy (rail + header grammar);
 *   - the anchor chip row links to real block ids;
 *   - the history page's "Response flow demo" button navigates to the
 *     demo route (same reducer-driven harness pattern as
 *     SessionDetailPage.test.tsx);
 *   - local interactions: clarification answers (resumed state + the
 *     dynamic user-answer block), plan approval chip flip, gate Deny
 *     resolution, tool-evidence I/O expansion, progress collapse, and
 *     artifact copy feedback.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useEffect, useReducer } from 'react'
import SessionStreamDemoPage from './SessionStreamDemoPage'
import SessionHistoryPage from './SessionHistoryPage'
import { MockupContext } from '../state/MockupContext'
import { OverlayLifecycleProvider } from '../components/shell/OverlayLifecycle'
import { initialState, mockupReducer } from '../state/mockupReducer'

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
// Structure
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — structure', () => {
  it('renders all ten kind labels inside the stream', () => {
    render(<SessionStreamDemoPage />)
    const stream = screen.getByTestId('session-stream')
    for (const label of ALL_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    // The story runs 11 blocks (tool evidence appears twice).
    expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(11)
  })

  it('renders every block with its sequential stream-kind anchor id', () => {
    const { container } = render(<SessionStreamDemoPage />)
    for (let position = 1; position <= 11; position += 1) {
      const slot = document.getElementById(`stream-kind-${position}`)
      expect(slot).not.toBeNull()
      expect(slot?.querySelector('.kx-stream-block')).not.toBeNull()
    }
    expect(container.querySelectorAll('.kx-stream-block')).toHaveLength(11)
  })

  it('renders an anchor chip per kind, each targeting an existing block id', () => {
    render(<SessionStreamDemoPage />)
    const nav = screen.getByRole('navigation', { name: 'Response kinds' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(10)
    expect(links.map((link) => link.textContent)).toEqual([...ALL_KIND_LABELS])
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
  it('answering all clarification questions flips to the resumed state and inserts the user-answer block', () => {
    render(<SessionStreamDemoPage />)

    // Paused while unanswered — no answer block yet.
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()
    expect(screen.getByText('awaiting answer')).toBeInTheDocument()
    expect(document.getElementById('stream-user-answer')).toBeNull()

    // First answer lands: still paused (one question outstanding).
    fireEvent.click(screen.getByRole('button', { name: 'Round half up (SOP default)' }))
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()

    // Second answer completes the set.
    fireEvent.click(screen.getByRole('button', { name: 'Restate August only' }))

    expect(screen.getByText(/execution resumed/i)).toBeInTheDocument()
    expect(screen.getByText('answered')).toBeInTheDocument()
    expect(screen.queryByText(/Execution is paused/i)).not.toBeInTheDocument()

    // The dynamic user-answer block renders after the clarification block
    // with both chosen answers.
    const answerBlock = document.getElementById('stream-user-answer')
    expect(answerBlock).not.toBeNull()
    expect(answerBlock?.textContent).toContain('Round half up (SOP default)')
    expect(answerBlock?.textContent).toContain('Restate August only')
    // And it sits directly after the clarification slot.
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
    expect(screen.getByText(/Plan approved — execution proceeds/i)).toBeInTheDocument()
  })

  it('denying the approval gate resolves it to a decision summary row', () => {
    render(<SessionStreamDemoPage />)

    expect(screen.getByText('blocking')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))

    expect(screen.getByText(/Decision recorded:/i).textContent).toContain('Deny')
    expect(screen.queryByRole('button', { name: 'Allow once' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Always this session' })).not.toBeInTheDocument()
    expect(screen.queryByText('blocking')).not.toBeInTheDocument()
  })

  it('expanding tool evidence reveals the mono input/output block', () => {
    render(<SessionStreamDemoPage />)

    const toggles = screen.getAllByRole('button', { name: 'Evidence' })
    expect(toggles.length).toBe(4)

    fireEvent.click(toggles[0])
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('rg -n "round(" src/invoicing --type ts')).toBeInTheDocument()
    expect(screen.getByText('src/invoicing/totals.ts:112: const tax = round(base * rate, 2)')).toBeInTheDocument()

    // The second evidence block carries the diff-tinted patch lines.
    fireEvent.click(toggles[1])
    expect(screen.getByText(/const rounded = roundHalfUp\(scaled, 2\)/)).toBeInTheDocument()
  })

  it('collapsing the progress group swaps to the phase-count summary', () => {
    render(<SessionStreamDemoPage />)

    const toggle = screen.getByRole('button', { name: 'Hide phases' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: '5 phases · 2 done' })).toBeInTheDocument()
    expect(screen.queryByText('Verify against August sample (41 invoices)')).not.toBeInTheDocument()
  })

  it('copying the artifact shows feedback', () => {
    render(<SessionStreamDemoPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})
