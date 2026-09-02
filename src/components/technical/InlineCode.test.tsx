/*
 * InlineCode — unit tests.
 *
 * Covers the non-interactive <code> contract (spec §1): mono literal
 * wash inside prose, no control semantics (no role/tabindex/hover —
 * openable objects are EntityToken's job), and className merging.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import InlineCode from './InlineCode'

describe('InlineCode', () => {
  it('renders a <code> with the kx-tech-code class', () => {
    const { container } = render(<InlineCode>ses_01JABC</InlineCode>)
    const code = container.querySelector('code')
    expect(code).not.toBeNull()
    expect(code).toHaveClass('kx-tech-code')
    expect(screen.getByText('ses_01JABC')).toBe(code)
  })

  it('is never interactive — no role, no tabindex, no inner control', () => {
    const { container } = render(<InlineCode>innerHTML</InlineCode>)
    const code = container.querySelector('code')!
    expect(code.tagName).toBe('CODE')
    expect(code).not.toHaveAttribute('role')
    expect(code).not.toHaveAttribute('tabindex')
    expect(container.querySelector('button, a, [role="button"]')).toBeNull()
  })

  it('merges a custom className onto the namespace class', () => {
    const { container } = render(<InlineCode className="where-it-lives">hris-frontend</InlineCode>)
    expect(container.querySelector('code')).toHaveClass('kx-tech-code', 'where-it-lives')
  })
})
