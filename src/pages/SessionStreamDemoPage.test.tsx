/*
 * SessionStreamDemoPage tests — the chat-style response-stream demo
 * contract (spec: .pi/orch/plans/chat-session-stream-spec.md):
 *   - chat anatomy: the user request renders as a right-aligned BUBBLE
 *     with attachment cards, agent turns render FLAT (no bubble) — the
 *     hover footer rides ONLY the final agent answer turn (spec
 *     refinements v2 #4) — and every slot keeps its stream-kind anchor;
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
import { TECH_STATUS_LABELS } from '../components/technical/StatusBadge'

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

/** Kind labels the LABELED agent turn headers carry inside the stream
 * (spec refinements v2 #1/#5): the conversational understanding/answer
 * turns and the artifact row render BARE — no header at all. The
 * request is a bubble and carries no label; the gate's header reads
 * APPROVAL while its pending state chip reads APPROVAL NEEDED. */
const AGENT_KIND_LABELS = [
  'CLARIFICATION',
  'PLAN',
  'APPROVAL',
  'PROGRESS',
  'TOOL CALL',
  'REVIEW FINDING',
  'HANDOFF',
] as const

/** Labels that must NOT render inside the stream — the bare
 * conversational turns and the badge-less artifact row. */
const BARE_KIND_LABELS = ['UNDERSTANDING', 'ANSWER', 'ARTIFACT'] as const

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — structure', () => {
  it('renders the chat anatomy — one user bubble + eleven flat agent turns (12 slots)', () => {
    render(<SessionStreamDemoPage />)
    const stream = screen.getByTestId('session-stream')

    // The story runs 12 blocks (tool evidence appears twice; the final
    // answer turn lands right before the handoff).
    expect(stream.querySelectorAll('.kx-stream-slot')).toHaveLength(12)
    for (let position = 1; position <= 12; position += 1) {
      const slot = document.getElementById(`stream-kind-${position}`)
      expect(slot, `stream-kind-${position}`).not.toBeNull()
      expect(slot?.querySelector('.kx-stream-turn, .kx-stream-bubble-row')).not.toBeNull()
    }

    // The request is a bubble; agent turns render flat without bubbles.
    expect(within(stream).getAllByTestId('user-bubble')).toHaveLength(1)
    const turns = stream.querySelectorAll('.kx-stream-turn')
    expect(turns).toHaveLength(11)
    turns.forEach((turn) => expect(turn.querySelector('.kx-stream-bubble')).toBeNull())

    // Every labeled agent kind renders its header inside the stream…
    for (const label of AGENT_KIND_LABELS) {
      expect(within(stream).getAllByText(label).length).toBeGreaterThanOrEqual(1)
    }
    // …while the conversational turns (understanding, answer) and the
    // artifact row carry NO kind label (the anchor chips outside the
    // stream are the only place those words appear).
    for (const label of BARE_KIND_LABELS) {
      expect(within(stream).queryByText(label)).toBeNull()
    }

    // The bare understanding turn is found by its PROSE, not a label.
    expect(
      within(stream).getByText(/You need the invoice tax rounding corrected/),
    ).toBeInTheDocument()
  })

  it('renders the request bubble with attachment cards and a hover action bar', () => {
    render(<SessionStreamDemoPage />)

    const request = screen.getByTestId('user-bubble')
    expect(request).toHaveClass('kx-stream-bubble-row')

    // Attachment-kind chips promote to cards: name + meta per file.
    const files = screen.getByLabelText('Attachments')
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

  it('renders the hover footer on exactly one turn — the final agent answer (copy, share, time)', () => {
    const { container } = render(<SessionStreamDemoPage />)

    // Unanswered clarification → the whole post-request conversation is
    // ONE response group, so exactly ONE footer rides the group's LAST
    // turn — the completion handoff, slot 12 (spec refinements v3 #2).
    const footers = container.querySelectorAll('[data-testid="turn-footer"]')
    expect(footers).toHaveLength(1)
    const groupFinal = document.getElementById('stream-kind-12')!
    expect(groupFinal.querySelector('[data-testid="turn-footer"]')).not.toBeNull()
    expect(
      within(groupFinal).getByTestId('turn-copy'),
    ).toHaveAttribute('aria-label', 'Copy message')
    expect(
      within(groupFinal).getByTestId('turn-share'),
    ).toHaveAttribute('aria-label', 'Share message')

    // The final ANSWER (slot 11) keeps its prose but carries no footer —
    // the handoff after it ends the group.
    const finalAnswer = document.getElementById('stream-kind-11')!
    expect(
      within(finalAnswer).getByText(/Here’s where the rounding fix landed/),
    ).toBeInTheDocument()
    expect(finalAnswer.querySelector('[data-testid="turn-footer"]')).toBeNull()

    // Exactly one .kx-stream-turn carries the footer and it is the
    // group-final handoff.
    const withFooter = Array.from(container.querySelectorAll('.kx-stream-turn')).filter(
      (turn) => turn.querySelector('[data-testid="turn-footer"]'),
    )
    expect(withFooter).toHaveLength(1)
    expect(withFooter[0].closest('.kx-stream-slot')).toBe(groupFinal)
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

    // Paused while unanswered — no answer bubble yet (the chip is the
    // canonical "Waiting for input" StatusBadge; scoped to the stream
    // because the showcase above renders the full canonical row too).
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()
    expect(
      within(screen.getByTestId('session-stream')).getByText('Waiting for input'),
    ).toBeInTheDocument()
    expect(document.getElementById('stream-user-answer')).toBeNull()
    expect(screen.getAllByTestId('user-bubble')).toHaveLength(1)

    // First answer lands: still paused (one question outstanding).
    fireEvent.click(screen.getByRole('button', { name: 'Round half up (SOP default)' }))
    expect(screen.getByText(/Execution is paused/i)).toBeInTheDocument()

    // Second answer completes the set.
    fireEvent.click(screen.getByRole('button', { name: 'Restate August only' }))

    expect(screen.getByText(/execution resumed/i)).toBeInTheDocument()
    expect(screen.getByText('Answered')).toBeInTheDocument()
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

    // Outstanding: the "Waiting approval" StatusBadge + framed pending
    // block with the action, consequence line, and the three explicit
    // decisions.
    expect(within(stream).getAllByText('Waiting approval').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('gate-pending')).toBeInTheDocument()
    expect(
      screen.getByText(/This migration rewrites stored invoice totals in place/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Allow once' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Always this session' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))

    expect(screen.getByText(/Decision recorded:/i).textContent).toContain('Deny')
    expect(screen.queryByTestId('gate-pending')).not.toBeInTheDocument()
    expect(within(stream).queryByText('Waiting approval')).not.toBeInTheDocument()
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
    // State labels read the canonical StatusBadge vocabulary.
    expect(running.textContent).toContain('Running')
    expect(running.querySelector('.kx-stream-call__pulse')).not.toBeNull()
    expect(
      screen.getAllByTestId('tool-row').filter((row) => row.querySelector('.kx-stream-call__pulse')),
    ).toHaveLength(1)
  })

  it('expanding tool evidence reveals CodeBlock input/output with Copy and diff tints', () => {
    render(<SessionStreamDemoPage />)

    const expandable = screen
      .getAllByTestId('tool-row')
      .filter((row) => row.hasAttribute('aria-expanded'))

    fireEvent.click(expandable[0])
    expect(expandable[0]).toHaveAttribute('aria-expanded', 'true')
    // The detail is wired through aria-controls to the revealed block,
    // whose io bodies are now CodeBlocks (header meta + Copy).
    const detail = document.getElementById(expandable[0].getAttribute('aria-controls')!)!
    expect(detail).not.toBeNull()
    expect(screen.getByText('rg -n "round(" src/invoicing --type ts')).toBeInTheDocument()
    expect(within(detail).getAllByTestId('tool-io-input')).toHaveLength(1)
    expect(within(detail).getAllByTestId('tool-io-output')).toHaveLength(1)
    expect(within(detail).getAllByText('input')).toHaveLength(1)
    expect(within(detail).getAllByText('output')).toHaveLength(1)
    expect(screen.getByText(/totals\.ts:112:\s+const tax = round\(base \* rate, 2\)/)).toBeInTheDocument()

    // The second evidence block carries the diff-tinted patch lines via
    // CodeBlock's line-class hook.
    fireEvent.click(expandable[1])
    expect(expandable[1]).toHaveAttribute('aria-expanded', 'true')
    const output = within(expandable[1].parentElement!).getByTestId('tool-io-output')!
    expect(
      output.querySelector('.kx-tech-codeblock__line.kx-stream-io__line--add'),
    ).not.toBeNull()
    expect(
      output.querySelector('.kx-tech-codeblock__line.kx-stream-io__line--del'),
    ).not.toBeNull()

    // Each CodeBlock carries its own Copy action with feedback.
    const inputBlock = within(detail).getByTestId('tool-io-input')!
    fireEvent.click(within(inputBlock).getByRole('button', { name: 'Copy' }))
    expect(within(inputBlock).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
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

    // Scoped to the artifact row: the pending gate's long MetadataPair
    // values and the technical-text showcase above carry their own Copy
    // actions (CodeBlock headers + long metadata values).
    const actions = screen.getByTestId('artifact-actions')
    fireEvent.click(within(actions).getByRole('button', { name: 'Copy' }))
    expect(within(actions).getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Technical text showcase (spec §Showcase) — the five kx-tech-* primitives
// above the stream: InlineCode prose, an EntityToken row, a MetadataPair
// grid with mixed value types, the full canonical StatusBadge row, two
// CodeBlocks (short unnumbered SQL + long collapsed config), and the
// do/don't note. The #technical-text anchor makes it deep-linkable.
// ---------------------------------------------------------------------------

describe('SessionStreamDemoPage — technical text showcase', () => {
  it('renders the section under the header, before the stream, with its anchor', () => {
    render(<SessionStreamDemoPage />)

    const section = document.getElementById('technical-text')
    expect(section).not.toBeNull()
    expect(section).toHaveClass('kx-tech-showcase')
    expect(
      screen.getByRole('heading', { name: 'Technical text', level: 2 }),
    ).toBeInTheDocument()

    // Position: after the page header, before the stream slots.
    const header = document.querySelector('.kx-stream-page__head')!
    const stream = screen.getByTestId('session-stream')
    expect(header.compareDocumentPosition(section!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(section!.compareDocumentPosition(stream)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('embeds InlineCode literals inside the showcase sentence', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const prose = section.querySelector('.kx-tech-showcase__prose')!

    expect(prose.textContent).toContain('is on branch')
    const codes = Array.from(prose.querySelectorAll('code.kx-tech-code'))
    expect(codes.map((code) => code.textContent)).toEqual(['hris-frontend', 'development'])
    // The InlineCode spans are non-interactive inside the prose too.
    codes.forEach((code) => {
      expect(code.querySelector('button, a')).toBeNull()
      expect(code).not.toHaveAttribute('tabindex')
    })
  })

  it('renders the EntityToken row with varied kinds and explicit aria labels', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    // Scoped to the token ROW — the MetadataPair grid below repeats the
    // repository/branch tokens as pair values.
    const row = section.querySelector<HTMLElement>('.kx-tech-showcase__row')!

    expect(within(row).getByRole('button', { name: 'Open repository hris-frontend' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Open branch development' })).toBeInTheDocument()
    expect(
      within(row).getByRole('button', { name: 'Open document MMKSI-HRD Phase 2.docx' }),
    ).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Open Task 7' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Open session ses_01JABC' })).toBeInTheDocument()
  })

  it('renders the MetadataPair grid with mixed value types', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const meta = section.querySelector<HTMLElement>('.kx-tech-showcase__meta')!

    // EntityToken values (Repository, Branch) stay interactive; the long
    // mono Session ID rides InlineCode + the copy action; Provider is a
    // plain string.
    expect(within(meta).getAllByRole('button', { name: /^Open (repository|branch)/ })).toHaveLength(2)
    const sessionPair = meta.querySelectorAll('.kx-tech-meta__pair')[2]
    expect(sessionPair.querySelector('code.kx-tech-code')).not.toBeNull()
    expect(sessionPair.querySelector('.kx-tech-meta__copy')).not.toBeNull()
    expect(within(meta).getByText('Gitea')).toBeInTheDocument()

    // Labels stay plain — never controls.
    meta.querySelectorAll('.kx-tech-meta__label').forEach((label) => {
      expect(label.tagName).toBe('SPAN')
      expect(label.querySelector('button, a')).toBeNull()
    })
  })

  it('renders the full canonical StatusBadge row — icon + label every time', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const badges = section.querySelectorAll<HTMLElement>('.kx-tech-badge')

    expect(badges).toHaveLength(10)
    for (const badge of badges) {
      expect(badge.querySelector('.kx-tech-badge__icon')).not.toBeNull()
      expect(badge.querySelector('.kx-tech-badge__label')).not.toBeNull()
    }
    for (const label of Object.values(TECH_STATUS_LABELS)) {
      expect(within(section).getByText(label)).toBeInTheDocument()
    }
    // Running is the animated-dot variant; the default pills are spans.
    expect(section.querySelector('.kx-tech-badge__dot')).not.toBeNull()
    badges.forEach((badge) => expect(badge.tagName).toBe('SPAN'))
  })

  it('renders both CodeBlocks — short unnumbered SQL and long collapsed config', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const blocks = section.querySelectorAll<HTMLElement>('.kx-tech-codeblock')
    expect(blocks).toHaveLength(2)

    const [sql, config] = Array.from(blocks)
    // Short SQL: 4 lines, no line numbers, with its footer line.
    expect(within(sql).getByText(/AND clock_out IS NULL;/)).toBeInTheDocument()
    expect(sql.querySelectorAll('.kx-tech-codeblock__line')).toHaveLength(4)
    expect(sql.querySelector('.kx-tech-codeblock__ln')).toBeNull()
    expect(within(sql).getByText(/Executed 09:41 · 3 rows returned/)).toBeInTheDocument()

    // Long config: numbered, collapsed to 10 lines + the expand toggle.
    expect(config.querySelectorAll('.kx-tech-codeblock__line')).toHaveLength(10)
    expect(config.querySelectorAll('.kx-tech-codeblock__ln')).toHaveLength(10)
    const expand = within(config).getByRole('button', { name: 'Show full code' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands the long config CodeBlock to all 16 lines', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const config = section.querySelectorAll<HTMLElement>('.kx-tech-codeblock')[1]

    fireEvent.click(within(config).getByRole('button', { name: 'Show full code' }))

    expect(config.querySelectorAll('.kx-tech-codeblock__line')).toHaveLength(16)
    expect(within(config).getByRole('button', { name: 'Hide full code' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('carries the two-line do/don’t note in muted ink', () => {
    render(<SessionStreamDemoPage />)
    const section = document.getElementById('technical-text')!
    const notes = section.querySelectorAll('.kx-tech-note')
    expect(notes).toHaveLength(2)
    expect(notes[0].textContent).toMatch(/^Do —/)
    expect(notes[1].textContent).toMatch(/^Don't —/)
  })
})
