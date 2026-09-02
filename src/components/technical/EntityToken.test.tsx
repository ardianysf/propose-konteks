/*
 * EntityToken — unit tests.
 *
 * Covers the openable-object contract (spec §2): <button> semantics by
 * default with an EXPLICIT accessible name (openLabel / "Open {kind}
 * {label}"), <a> semantics for href navigation, the title tooltip for
 * truncated values, mono-vs-sans labels, one kind icon per kind
 * (aria-hidden — the accessible name carries the kind), and the
 * documented phase-1 noop click path.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EntityToken, { ENTITY_KINDS } from './EntityToken'

describe('EntityToken', () => {
  it('renders a <button> with an explicit aria-label by default', () => {
    render(<EntityToken kind="repository" label="hris-frontend" />)
    const button = screen.getByRole('button', { name: 'Open repository hris-frontend' })
    expect(button).toHaveClass('kx-tech-entity')
  })

  it('honors a custom openLabel as the accessible name', () => {
    render(<EntityToken kind="task" label="Task 7" mono={false} openLabel="Open Task 7" />)
    expect(screen.getByRole('button', { name: 'Open Task 7' })).toBeInTheDocument()
  })

  it('exposes the full value as a title tooltip (truncated paths/SHAs)', () => {
    const { container } = render(
      <EntityToken
        kind="document"
        label="MMKSI-HRD Phase 2.docx"
        mono={false}
        title="/uploads/2026/08/MMKSI-HRD Phase 2.docx"
      />,
    )
    const button = container.querySelector('button')!
    expect(button).toHaveAttribute('title', '/uploads/2026/08/MMKSI-HRD Phase 2.docx')
  })

  it('defaults the tooltip to the label', () => {
    render(<EntityToken kind="session" label="ses_01JABC" />)
    expect(screen.getByRole('button', { name: 'Open session ses_01JABC' })).toHaveAttribute(
      'title',
      'ses_01JABC',
    )
  })

  it.each(ENTITY_KINDS)('renders the %s kind icon aria-hidden', (kind) => {
    const { container } = render(<EntityToken kind={kind} label="x" />)
    const icon = container.querySelector('.kx-tech-entity__icon')!
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.querySelector(`[data-icon="tech-${kind}"]`)).not.toBeNull()
  })

  it('renders identifier labels mono and artifact titles sans', () => {
    const mono = render(<EntityToken kind="branch" label="development" />)
    expect(mono.container.querySelector('.kx-tech-entity')).toHaveClass('kx-tech-entity--mono')
    mono.unmount()

    const sans = render(
      <EntityToken kind="document" label="MMKSI-HRD Phase 2.docx" mono={false} />
    )
    expect(sans.container.querySelector('.kx-tech-entity')).not.toHaveClass(
      'kx-tech-entity--mono',
    )
  })

  it('renders an <a> when href navigates instead of opening a panel', () => {
    render(<EntityToken kind="commit" label="9f3c2a1" href="/commits/9f3c2a1" />)
    const link = screen.getByRole('link', { name: 'Open commit 9f3c2a1' })
    expect(link).toHaveAttribute('href', '/commits/9f3c2a1')
  })

  it('fires onClick (the demo noop documents the phase-1 click path)', () => {
    const onClick = vi.fn()
    render(<EntityToken kind="repository" label="hris-frontend" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open repository hris-frontend' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('defaults to the pill variant and exposes the link variant class (Fase 3e)', () => {
    const { rerender } = render(<EntityToken kind="repository" label="hris-frontend" />)
    const pill = screen.getByRole('button', { name: 'Open repository hris-frontend' })
    expect(pill).not.toHaveClass('kx-tech-entity--link')

    rerender(<EntityToken kind="repository" label="hris-frontend" variant="link" />)
    expect(screen.getByRole('button', { name: 'Open repository hris-frontend' })).toHaveClass(
      'kx-tech-entity--link',
    )
  })
})
