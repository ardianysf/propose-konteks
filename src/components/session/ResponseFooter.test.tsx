/*
 * ResponseFooter — unit tests.
 *
 * Covers: action buttons and aria contract, clipboard copy with transient
 * feedback, thumbs reactions with mutual exclusion, the more menu (date +
 * Retry/Fork/Share + outside-click close), stats formatting, and the
 * no-meta case.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { DetailTimelineItem } from '../../data/mockData'
import ResponseFooter from './ResponseFooter'

const baseItem: DetailTimelineItem = {
  id: 'T-1-assistant',
  type: 'ASSISTANT_MESSAGE',
  content: 'Noted — added to the working context for this cycle.',
  actorType: 'ASSISTANT',
  createdAt: '2026-08-16T14:40:00Z',
  meta: { durationMs: 25_700, tokensIn: 105_000, tokensOut: 483 },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ResponseFooter', () => {
  it('renders copy, reactions, and more actions', () => {
    render(<ResponseFooter item={baseItem} />)
    expect(screen.getByTestId('response-copy')).toHaveAccessibleName('Copy response')
    expect(screen.getByTestId('response-thumb-up')).toHaveAccessibleName('Good response')
    expect(screen.getByTestId('response-thumb-down')).toHaveAccessibleName('Bad response')
    expect(screen.getByTestId('response-more')).toHaveAccessibleName('More actions')
    expect(screen.getByTestId('response-more')).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('shows duration and token stats when meta is present', () => {
    render(<ResponseFooter item={baseItem} />)
    expect(screen.getByText('25.7s · 105k tokens in · 483 tokens out')).toBeInTheDocument()
  })

  it('renders no stats when the message has no meta', () => {
    const { meta: _meta, ...withoutMeta } = baseItem
    render(<ResponseFooter item={withoutMeta} />)
    expect(screen.queryByText(/tokens in/)).not.toBeInTheDocument()
  })

  it('copies the response content and shows transient feedback', async () => {
    vi.useFakeTimers()
    try {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      render(<ResponseFooter item={baseItem} />)

      fireEvent.click(screen.getByTestId('response-copy'))
      expect(writeText).toHaveBeenCalledWith(baseItem.content)
      // The clipboard promise resolves in a microtask before "Copied" shows —
      // flush it through act (waitFor would fight the fake timers).
      await act(async () => {
        await Promise.resolve()
      })
      expect(screen.getByTestId('response-copy')).toHaveAccessibleName('Copied')

      act(() => {
        vi.advanceTimersByTime(1600)
      })
      expect(screen.getByTestId('response-copy')).toHaveAccessibleName('Copy response')
    } finally {
      vi.useRealTimers()
    }
  })

  it('copies via the legacy execCommand path when the Clipboard API is unavailable', async () => {
    vi.stubGlobal('navigator', {}) // no clipboard at all
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
    render(<ResponseFooter item={baseItem} />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('response-copy'))
      await Promise.resolve()
    })
    expect(execCommand).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('response-copy')).toHaveAccessibleName('Copied')
  })

  it('shows no feedback when both copy paths fail', async () => {
    vi.stubGlobal('navigator', {})
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    })
    render(<ResponseFooter item={baseItem} />)

    await act(async () => {
      fireEvent.click(screen.getByTestId('response-copy'))
      await Promise.resolve()
    })
    expect(screen.getByTestId('response-copy')).toHaveAccessibleName('Copy response')
  })

  it('supports initial reaction and menu-open states (catalog specimens)', () => {
    render(<ResponseFooter item={baseItem} initialReaction="up" initialMenuOpen />)
    expect(screen.getByTestId('response-thumb-up')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('response-thumb-up').querySelector('svg[data-icon="thumb-up-filled"]')).toBeInTheDocument()
    expect(screen.getByTestId('response-more')).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByTestId('response-menu')).toBeInTheDocument()
    // Initial state does NOT open the dialog — only a user click does.
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument()
  })

  it('thumbs toggle with mutual exclusion; selecting opens the feedback modal, switching swaps its options', () => {
    render(<ResponseFooter item={baseItem} />)
    const up = screen.getByTestId('response-thumb-up')
    const down = screen.getByTestId('response-thumb-down')

    // Selecting up: pressed + filled icon + good feedback options.
    fireEvent.click(up)
    expect(up).toHaveAttribute('aria-pressed', 'true')
    expect(up.querySelector('svg[data-icon="thumb-up-filled"]')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-subtitle')).toHaveTextContent(
      'What made this response helpful?',
    )

    // Switching to down swaps the modal to the bad option set.
    fireEvent.click(down)
    expect(up).toHaveAttribute('aria-pressed', 'false')
    expect(down).toHaveAttribute('aria-pressed', 'true')
    expect(down.querySelector('svg[data-icon="thumb-down-filled"]')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-subtitle')).toHaveTextContent(
      'What went wrong with this response?',
    )

    // Clicking the active reaction again deselects it and closes the modal.
    fireEvent.click(down)
    expect(down).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument()
  })

  it('submitting the feedback dialog closes it while keeping the reaction pressed', () => {
    render(<ResponseFooter item={baseItem} />)
    fireEvent.click(screen.getByTestId('response-thumb-up'))
    fireEvent.click(screen.getAllByTestId('feedback-option')[0])
    fireEvent.click(screen.getByTestId('feedback-submit'))

    expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument()
    expect(screen.getByTestId('response-thumb-up')).toHaveAttribute('aria-pressed', 'true')
    // Focus returns to the reaction button after the dialog closes.
    expect(screen.getByTestId('response-thumb-up')).toHaveFocus()
  })

  it('more menu shows the response date and Retry/Fork/Share; Retry invokes the callback', () => {
    const onRetry = vi.fn()
    render(<ResponseFooter item={baseItem} onRetry={onRetry} />)

    const more = screen.getByTestId('response-more')
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)

    const menu = screen.getByTestId('response-menu')
    expect(more).toHaveAttribute('aria-expanded', 'true')
    // Formatted response date (locale-formatted; assert the stable parts).
    expect(menu.textContent).toMatch(/16 Aug 2026(, \d{2}:\d{2})?/)
    expect(within(menu).getByRole('menuitem', { name: 'Retry' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Fork' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Share' })).toBeInTheDocument()
    // Each menu item carries its icon (aria-hidden, so names stay text-only).
    expect(within(menu).getByRole('menuitem', { name: 'Retry' }).querySelector('svg[data-icon="retry"]')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Fork' }).querySelector('svg[data-icon="fork"]')).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Share' }).querySelector('svg[data-icon="share"]')).toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    // Retry closes the menu.
    expect(screen.queryByTestId('response-menu')).not.toBeInTheDocument()
  })

  it('closes the more menu on outside click', () => {
    render(<ResponseFooter item={baseItem} />)
    fireEvent.click(screen.getByTestId('response-more'))
    expect(screen.getByTestId('response-menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('response-menu')).not.toBeInTheDocument()
  })
})
