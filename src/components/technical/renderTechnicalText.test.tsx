/*
 * renderTechnicalText — unit tests (spec §Fase 3b).
 *
 * Covers the backtick-splitting contract: literal spans render as
 * InlineCode (`code.kx-tech-code`), the backticks never leak into the
 * DOM text or an accessible name, plain prose passes through unchanged,
 * multiple literals split correctly, and a stray unpaired backtick
 * stays plain text (never swallows the rest of the string).
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderTechnicalText } from './renderTechnicalText'

describe('renderTechnicalText', () => {
  it('renders a backticked literal as a non-interactive InlineCode', () => {
    const { container } = render(
      <p>Revert {renderTechnicalText('the fix from `pr-1302` first')} now.</p>,
    )
    const code = container.querySelector('code.kx-tech-code')!
    expect(code).not.toBeNull()
    expect(code).toHaveTextContent('pr-1302')
    // InlineCode stays a value, not a control.
    expect(code.querySelector('button, a')).toBeNull()
  })

  it('never leaks backticks into the DOM text or accessible names', () => {
    const { container } = render(
      <button type="button">Open {renderTechnicalText('branch `development`')}</button>,
    )
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Open branch development')
    expect(button.textContent).not.toContain('`')
    expect(container.textContent).not.toContain('`')
  })

  it('keeps plain prose without backticks as a single text segment', () => {
    const nodes = renderTechnicalText('No literals here at all.')
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toBe('No literals here at all.')
  })

  it('splits several literals across one string', () => {
    const { container } = render(
      <p>{renderTechnicalText('Trace `syncClient.ts`, replay `att-2026-0815`, then merge `development`.')}</p>,
    )
    const codes = Array.from(container.querySelectorAll('code.kx-tech-code'))
    expect(codes.map((code) => code.textContent)).toEqual([
      'syncClient.ts',
      'att-2026-0815',
      'development',
    ])
    expect(container.querySelector('p')!.textContent).toBe(
      'Trace syncClient.ts, replay att-2026-0815, then merge development.',
    )
  })

  it('keeps a stray unpaired backtick as plain text', () => {
    const nodes = renderTechnicalText('Stray ` backtick stays literal')
    expect(nodes).toHaveLength(1)
    expect(nodes[0]).toBe('Stray ` backtick stays literal')
    const { container } = render(<p>{renderTechnicalText('Stray ` backtick stays literal')}</p>)
    expect(container.querySelector('code')).toBeNull()
  })

  it('returns an empty node list for the empty string', () => {
    expect(renderTechnicalText('')).toEqual([])
  })
})
