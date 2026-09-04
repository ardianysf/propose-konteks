import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import ErrorBlock from './ErrorBlock'

const STREAM_CSS = readFileSync(
  join(process.cwd(), 'src/components/session/stream/SessionStream.css'),
  'utf8',
)

describe('ErrorBlock', () => {
  it('stays collapsed by default and keeps each toggle wired to its own hidden detail body', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ErrorBlock data={{ title: 'First failure', impact: 'Retry queued.' }} />
        <ErrorBlock data={{ title: 'Second failure', impact: 'Escalation queued.' }} />
      </>,
    )

    const cards = screen.getAllByTestId('error-card')
    expect(cards).toHaveLength(2)

    const [firstToggle, secondToggle] = cards.map((card) =>
      within(card).getByRole('button', { name: /show detail/i }),
    )
    const [firstDetailId, secondDetailId] = [firstToggle, secondToggle].map((toggle) =>
      toggle.getAttribute('aria-controls'),
    )

    expect(firstDetailId).toBeTruthy()
    expect(secondDetailId).toBeTruthy()
    expect(firstDetailId).not.toBe(secondDetailId)

    const firstDetail = cards[0].querySelector(`#${firstDetailId}`)
    const secondDetail = cards[1].querySelector(`#${secondDetailId}`)
    expect(firstDetail).toHaveAttribute('hidden')
    expect(secondDetail).toHaveAttribute('hidden')
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    expect(secondToggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(firstToggle)
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    expect(firstDetail).not.toHaveAttribute('hidden')
    expect(secondDetail).toHaveAttribute('hidden')

    secondToggle.focus()
    await user.keyboard('{Enter}')
    expect(secondToggle).toHaveAttribute('aria-expanded', 'true')
    expect(secondDetail).not.toHaveAttribute('hidden')

    await user.keyboard(' ')
    expect(secondToggle).toHaveAttribute('aria-expanded', 'false')
    expect(secondDetail).toHaveAttribute('hidden')
  })

  it('uses danger tokens for error separators and markers and keeps attention out of error accent selectors', () => {
    expect(STREAM_CSS).toMatch(/\.kx-stream-error__kind\s*\{[^}]*color: var\(--kx-danger\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-error__chevron\s*\{[^}]*color: var\(--kx-danger\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-error\s*\{[^}]*border-bottom: 1px solid var\(--kx-danger\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-error__summary\s*\{[^}]*border-top: 2px solid var\(--kx-danger\);/s)
    expect(STREAM_CSS).toMatch(/\.kx-stream-error__resolution--attention\s*\{[^}]*color: var\(--kx-danger\);/s)

    for (const selector of [
      '.kx-stream-error',
      '.kx-stream-error__summary',
      '.kx-stream-error__kind',
      '.kx-stream-error__chevron',
      '.kx-stream-error__resolution--attention',
    ]) {
      const escaped = selector.replace(/\./g, '\\.').replace(/-/g, '\\-')
      expect(STREAM_CSS).not.toMatch(new RegExp(`${escaped}\\s*\\{[^}]*var\\(--kx-attention\\)`, 's'))
    }
  })
})
