import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import EstimateBlock from './EstimateBlock'

const STREAM_CSS = readFileSync(
  join(process.cwd(), 'src/components/session/stream/SessionStream.css'),
  'utf8',
)

const DATA = {
  label: 'QUOTE',
  heading: 'Quote Q-102 · v2',
  rows: [
    { label: 'Story points', value: '6 (max 9)' },
    { label: 'Status', value: 'Waiting approval' },
  ],
  validUntil: 'Valid until 14:40',
  note: 'Quote Q-102 v2: 6 story points (max 9) for pagination edge case fix.',
}

describe('EstimateBlock', () => {
  it('stays collapsed by default, keeps the summary row visible, and toggles the controlled body by keyboard', async () => {
    const user = userEvent.setup()
    render(<EstimateBlock data={DATA} />)

    const toggle = screen.getByRole('button', { name: /show breakdown/i })
    const card = screen.getByTestId('estimate-card')
    const detailId = toggle.getAttribute('aria-controls')

    expect(detailId).toBeTruthy()
    expect(card).toHaveAttribute('id', detailId)
    expect(card).toHaveAttribute('hidden')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Status')).toBeVisible()
    expect(screen.getByText('Waiting approval')).toBeVisible()
    expect(within(card).getByText('Story points')).not.toBeVisible()

    toggle.focus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(card).not.toHaveAttribute('hidden')
    expect(within(card).getByText('Story points')).toBeVisible()
    expect(within(card).getByText('6 (max 9)')).toBeVisible()
    expect(within(card).getByText('Valid until 14:40')).toBeVisible()
    expect(screen.getByText('Waiting approval')).toBeVisible()

    await user.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(card).toHaveAttribute('hidden')
  })

  it('uses attention separators/toggle accents while keeping card borders and leaders on border tokens', () => {
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate-disclosure\s*\{[^}]*border-top: 2px solid var\(--kx-attention\);[^}]*border-bottom: 1px solid var\(--kx-attention\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate__kind\s*\{[^}]*color: var\(--kx-attention\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate__toggle\s*\{[^}]*color: var\(--kx-attention\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate__toggle:hover,\s*\.kx-stream-estimate__toggle:focus-visible\s*\{[^}]*color: var\(--kx-attention\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate\s*\{[^}]*border: 1px solid var\(--kx-border\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-estimate__leader\s*\{[^}]*border-bottom: 1px dotted var\(--kx-border\);/s)
  })
})
