/*
 * CodeBlock — unit tests.
 *
 * Covers the multiline contract (spec §5): header meta + Copy with
 * "Copied" feedback (shared clipboard helper), <pre><code> body that
 * is keyboard-scrollable, line-number gating (default: >5 lines;
 * prop overrides both ways), the >12-line collapse (10 shown +
 * "Show full code" with aria-expanded, toggling reveals everything),
 * and the optional footer. Horizontal scroll is asserted on the
 * stylesheet source (jsdom does not apply CSS).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CodeBlock from './CodeBlock'

const FOUR_LINE_SQL = [
  'SELECT employee_id, clock_in, clock_out',
  'FROM attendance_records',
  "WHERE work_date = '2026-08-31'",
  '  AND clock_out IS NULL;',
].join('\n')

const SIX_LINE = ['a', 'b', 'c', 'd', 'e', 'f'].join('\n')

const SIXTEEN_LINE = Array.from({ length: 16 }, (_, index) => `line-${index + 1}`).join('\n')

function lines(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('.kx-tech-codeblock__line'))
}

describe('CodeBlock', () => {
  it('renders header meta plus a <pre><code> body', () => {
    const { container } = render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" />)
    expect(container.querySelector('.kx-tech-codeblock__meta')).toHaveTextContent('sql')
    const pre = container.querySelector('pre.kx-tech-codeblock__pre')!
    expect(pre.querySelector('code')).not.toBeNull()
    expect(lines(container)).toHaveLength(4)
    expect(screen.getByText(/AND clock_out IS NULL;/)).toBeInTheDocument()
  })

  it('shows Copy → Copied feedback (shared clipboard helper)', () => {
    render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('is keyboard-scrollable — the pre takes focus', () => {
    const { container } = render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" />)
    expect(container.querySelector('pre.kx-tech-codeblock__pre')).toHaveAttribute(
      'tabindex',
      '0',
    )
  })

  it('gates line numbers: 4 lines render unnumbered, 6 lines numbered', () => {
    const short = render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" />)
    expect(short.container.querySelector('.kx-tech-codeblock__ln')).toBeNull()
    short.unmount()

    const long = render(<CodeBlock code={SIX_LINE} meta="txt" />)
    const numbers = long.container.querySelectorAll('.kx-tech-codeblock__ln')
    expect(numbers).toHaveLength(6)
    expect(Array.from(numbers).map((node) => node.textContent)).toEqual([
      '1', '2', '3', '4', '5', '6',
    ])
    // Line numbers are presentational — screen readers hear the code only.
    expect(numbers[0]).toHaveAttribute('aria-hidden', 'true')
  })

  it('lets the lineNumbers prop override the default both ways', () => {
    const forced = render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" lineNumbers />)
    expect(forced.container.querySelectorAll('.kx-tech-codeblock__ln')).toHaveLength(4)
    forced.unmount()

    const suppressed = render(<CodeBlock code={SIX_LINE} meta="txt" lineNumbers={false} />)
    expect(suppressed.container.querySelector('.kx-tech-codeblock__ln')).toBeNull()
  })

  it('applies the per-line className hook for diff-style tinting', () => {
    const diff = ['kept line', '- removed line', '+ added line'].join('\n')
    const { container } = render(
      <CodeBlock
        code={diff}
        meta="output"
        lineClassName={(line) =>
          line.startsWith('+')
            ? 'diff-add'
            : line.startsWith('-')
              ? 'diff-del'
              : undefined
        }
      />,
    )
    const lines = Array.from(container.querySelectorAll('.kx-tech-codeblock__line'))
    expect(lines).toHaveLength(3)
    expect(lines[0].className).toBe('kx-tech-codeblock__line')
    expect(lines[1].className).toBe('kx-tech-codeblock__line diff-del')
    expect(lines[2].className).toBe('kx-tech-codeblock__line diff-add')
  })

  it('collapses 16 lines to 10 by default with a Show full code toggle', () => {
    const { container } = render(<CodeBlock code={SIXTEEN_LINE} meta="trace.txt" />)
    expect(lines(container)).toHaveLength(10)
    const expand = screen.getByRole('button', { name: 'Show full code' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    // Hidden lines are not rendered at all.
    expect(within(container).queryByText(/line-11/)).toBeNull()
  })

  it('expanding reveals every line and flips aria-expanded', () => {
    const { container } = render(<CodeBlock code={SIXTEEN_LINE} meta="trace.txt" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show full code' }))
    expect(lines(container)).toHaveLength(16)
    expect(screen.getByText(/line-16/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide full code' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )

    // And collapses back to the 10-line preview.
    fireEvent.click(screen.getByRole('button', { name: 'Hide full code' }))
    expect(lines(container)).toHaveLength(10)
  })

  it('offers no expand control at or below 12 lines', () => {
    render(<CodeBlock code={SIX_LINE} meta="txt" />)
    expect(screen.queryByRole('button', { name: /full code/i })).toBeNull()
  })

  it('renders the optional muted footer line', () => {
    render(<CodeBlock code={FOUR_LINE_SQL} meta="sql" footer="Executed 09:41 · 3 rows returned" />)
    expect(screen.getByText('Executed 09:41 · 3 rows returned').closest('.kx-tech-codeblock__footer')).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Horizontal scroll — asserted on the stylesheet (jsdom does not apply
// CSS; same convention as DotMatrixLoader.test.tsx).
// ---------------------------------------------------------------------------

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const technicalCss = readFileSync(
  join(process.cwd(), 'src/components/technical/technical.css'),
  'utf8',
)

describe('CodeBlock.css — horizontal scroll', () => {
  it('scrolls the pre horizontally without shrinking the mono font', () => {
    const start = technicalCss.indexOf('.kx-tech-codeblock__pre')
    const rule = technicalCss.slice(start, technicalCss.indexOf('}', start))
    expect(rule).toContain('overflow-x: auto')
    expect(rule).toContain('font-family: var(--kx-font-mono)')
    // 12px mono at lh 1.55 — the fixed size is what the scroll protects.
    expect(rule).toContain('font-size: var(--kx-text-md)')
    expect(rule).toContain('line-height: 1.55')
  })
})
