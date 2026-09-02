/*
 * MetadataPair — unit tests.
 *
 * Covers the label/value contract (spec §3): the label is PLAIN and
 * never interactive (only the value may act), string values can render
 * as InlineCode via `mono`, ReactNode values (EntityToken…) render
 * as-is, and string values longer than 24 characters gain the
 * hover/focus-revealed copy action with "Copied" feedback — short
 * strings get nothing.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MetadataPair, { META_COPY_THRESHOLD } from './MetadataPair'
import EntityToken from './EntityToken'

const LONG_ID = 'ses_01JG8Z4X7QK2M5RT9W3BV6DHC0LP'

describe('MetadataPair', () => {
  it('renders a plain label above a plain string value', () => {
    const { container } = render(<MetadataPair label="Provider" value="Gitea" />)
    const label = container.querySelector('.kx-tech-meta__label')!
    expect(label).toHaveTextContent('Provider')
    // The label is never a control: plain <span>, no role, no tabindex.
    expect(label.tagName).toBe('SPAN')
    expect(label).not.toHaveAttribute('role')
    expect(label).not.toHaveAttribute('tabindex')
    expect(screen.getByText('Gitea')).toBeInTheDocument()
  })

  it('renders string values with mono as InlineCode', () => {
    const { container } = render(<MetadataPair label="Session ID" value="ses_01JABC" mono />)
    const value = container.querySelector('.kx-tech-meta__value')!
    expect(value.querySelector('code.kx-tech-code')).not.toBeNull()
    expect(value).toHaveTextContent('ses_01JABC')
  })

  it('renders ReactNode values as-is (EntityToken stays interactive)', () => {
    render(
      <MetadataPair
        label="Repository"
        value={<EntityToken kind="repository" label="hris-frontend" />}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Open repository hris-frontend' }),
    ).toBeInTheDocument()
  })

  it('never wires the label itself to anything clickable', () => {
    const { container } = render(<MetadataPair label="Branch" value={<EntityToken kind="branch" label="development" />} />)
    // The ONLY interactive element inside the pair is the value's own
    // EntityToken — the label introduces none.
    const label = container.querySelector('.kx-tech-meta__label')!
    expect(label.querySelector('button, a')).toBeNull()
    expect(container.querySelectorAll('button')).toHaveLength(1)
  })

  it('adds the copy action only for string values longer than 24 characters', () => {
    expect(LONG_ID.length).toBeGreaterThan(META_COPY_THRESHOLD)

    const plain = render(<MetadataPair label="Session ID" value="ses_01JABC" />)
    expect(plain.container.querySelector('.kx-tech-meta__copy')).toBeNull()
    plain.unmount()

    const long = render(<MetadataPair label="Session ID" value={LONG_ID} />)
    expect(long.container.querySelector('.kx-tech-meta__copy')).not.toBeNull()
  })

  it('shows Copied feedback after copying a long value', () => {
    render(<MetadataPair label="Session ID" value={LONG_ID} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('keeps the copy action a real (focusable) button — hover reveal is opacity, not visibility', () => {
    const { container } = render(<MetadataPair label="Session ID" value={LONG_ID} />)
    const copy = container.querySelector<HTMLButtonElement>('.kx-tech-meta__copy')!
    expect(copy.tagName).toBe('BUTTON')
    expect(copy.focus()).toBeUndefined() // focusable — the CSS reveals it on :focus-within
    expect(document.activeElement).toBe(copy)
  })
})
