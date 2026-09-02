/*
 * StatusBadge — unit tests.
 *
 * Covers the canonical status contract (spec §4): all 10 statuses
 * render icon + label together (color never carries meaning alone),
 * tones map onto the four --kx-tech-status-* aliases, Running carries
 * the animated dot, the default pill is a non-interactive <span>, and
 * an onClick upgrades it to real <button> semantics. The reduced-
 * motion kill is asserted on the stylesheet source (repo pattern: see
 * DotMatrixLoader.test.tsx — jsdom does not apply CSS).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StatusBadge, { TECH_STATUSES, TECH_STATUS_LABELS } from './StatusBadge'

describe('StatusBadge', () => {
  it.each(TECH_STATUSES)('renders the canonical %s label with icon and tone', (status) => {
    const { container } = render(<StatusBadge status={status} />)
    const badge = container.querySelector('.kx-tech-badge')!
    expect(screen.getByText(TECH_STATUS_LABELS[status])).toBeInTheDocument()
    // Always icon + label together — the icon span exists per render.
    expect(badge.querySelector('.kx-tech-badge__icon')).not.toBeNull()
    expect(badge.querySelector('.kx-tech-badge__label')).toHaveTextContent(
      TECH_STATUS_LABELS[status],
    )
  })

  it('exposes exactly the ten canonical statuses with EN labels', () => {
    expect(TECH_STATUSES).toHaveLength(10)
    expect(TECH_STATUSES.map((status) => TECH_STATUS_LABELS[status])).toEqual([
      'Draft',
      'Running',
      'Waiting for input',
      'Waiting approval',
      'Needs review',
      'Blocked',
      'Completed',
      'Partial',
      'Failed',
      'Cancelled',
    ])
  })

  it.each([
    ['draft', 'neutral'],
    ['running', 'success'],
    ['completed', 'success'],
    ['waiting-approval', 'warning'],
    ['needs-review', 'warning'],
    ['partial', 'warning'],
    ['blocked', 'danger'],
    ['failed', 'danger'],
  ] as const)('maps %s onto the %s tone class', (status, tone) => {
    const { container } = render(<StatusBadge status={status} />)
    expect(container.querySelector('.kx-tech-badge')).toHaveClass(`kx-tech-badge--${tone}`)
  })

  it('renders a distinct drawn glyph per status (aria-hidden)', () => {
    const { container } = render(<StatusBadge status="failed" />)
    const glyph = container.querySelector('[data-icon="tech-status-failed"]')!
    expect(glyph).toHaveAttribute('aria-hidden', 'true')
  })

  it('Running renders the animated dot (never a static glyph)', () => {
    const { container } = render(<StatusBadge status="running" />)
    expect(container.querySelector('.kx-tech-badge__dot')).not.toBeNull()
    expect(container.querySelector('[data-icon]')).toBeNull()
  })

  it('is a non-interactive <span> without onClick', () => {
    const { container } = render(<StatusBadge status="completed" />)
    const badge = container.querySelector('.kx-tech-badge')!
    expect(badge.tagName).toBe('SPAN')
    expect(screen.queryByRole('button')).toBeNull()
    expect(badge).not.toHaveAttribute('tabindex')
  })

  it('upgrades to <button> semantics with onClick', () => {
    const onClick = vi.fn()
    render(<StatusBadge status="waiting-approval" onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'Waiting approval' })
    expect(button).toHaveClass('kx-tech-badge--button')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Reduced-motion kill — asserted on the stylesheet (jsdom does not apply
// CSS; same convention as DotMatrixLoader.test.tsx).
// ---------------------------------------------------------------------------

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const technicalCss = readFileSync(
  join(process.cwd(), 'src/components/technical/technical.css'),
  'utf8',
)

/** Brace-matched `@media (prefers-reduced-motion: reduce)` block ('' if absent). */
function reducedMotionBlock(css: string): string {
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)')
  if (start === -1) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(start, i + 1)
    }
  }
  return ''
}

describe('StatusBadge.css — prefers-reduced-motion', () => {
  it('kills the Running dot animation while keeping the dot visible', () => {
    const block = reducedMotionBlock(technicalCss)
    expect(block).not.toBe('')
    // The badge subtree is covered by the animation: none !important rule…
    expect(block).toContain('.kx-tech-badge *')
    expect(block).toContain('animation: none !important')
    // …while the dot's own rule keeps its painted background (visible at rest).
    const dotRule = technicalCss.indexOf('.kx-tech-badge__dot')
    const ruleBody = technicalCss.slice(dotRule, technicalCss.indexOf('}', dotRule))
    expect(ruleBody).toContain('background: currentColor')
  })
})
