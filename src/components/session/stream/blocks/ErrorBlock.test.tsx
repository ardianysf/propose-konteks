import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ErrorBlock from './ErrorBlock'

describe('ErrorBlock', () => {
  it('gives each disclosure its own detail id and matching aria-controls', () => {
    render(
      <>
        <ErrorBlock data={{ title: 'First failure', impact: 'Retry queued.' }} />
        <ErrorBlock data={{ title: 'Second failure', impact: 'Escalation queued.' }} />
      </>,
    )

    const cards = screen.getAllByTestId('error-card')
    expect(cards).toHaveLength(2)

    const detailIds = cards.map((card) => {
      const toggle = within(card).getByRole('button', { name: /show detail/i })
      const detail = card.querySelector('.kx-stream-error__detail') as HTMLDivElement | null
      expect(detail).not.toBeNull()
      expect(detail?.id).toBeTruthy()
      expect(detail?.id).not.toContain(':')
      expect(toggle).toHaveAttribute('aria-controls', detail?.id)
      return detail?.id ?? ''
    })

    expect(new Set(detailIds).size).toBe(2)

    fireEvent.click(within(cards[0]).getByRole('button', { name: /show detail/i }))
    expect(cards[0].querySelector('.kx-stream-error__detail')).not.toHaveAttribute('hidden')
    expect(cards[1].querySelector('.kx-stream-error__detail')).toHaveAttribute('hidden')
  })
})
