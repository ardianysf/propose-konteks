/*
 * FeedbackModal — unit tests.
 *
 * Covers: dialog a11y contract, good vs bad option sets, option autofill,
 * free-form typing, submit (enabled/disabled + callback), and close paths
 * (cancel button, backdrop, Escape, close icon), plus the embedded
 * catalog-specimen mode.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FeedbackModal, { FEEDBACK_OPTIONS } from './FeedbackModal'

afterEach(() => {
  vi.restoreAllMocks()
})

function options() {
  return screen.getAllByTestId('feedback-option')
}

describe('FeedbackModal', () => {
  it('renders as a labelled modal dialog with kind-specific subtitle', () => {
    const { unmount } = render(<FeedbackModal kind="good" onClose={() => undefined} />)
    const dialog = screen.getByRole('dialog', { name: 'Share feedback' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByTestId('feedback-subtitle')).toHaveTextContent(
      'What made this response helpful?',
    )
    unmount()

    render(<FeedbackModal kind="bad" onClose={() => undefined} />)
    expect(screen.getByTestId('feedback-subtitle')).toHaveTextContent(
      'What went wrong with this response?',
    )
  })

  it('offers different preset options for good and bad', () => {
    const { unmount } = render(<FeedbackModal kind="good" onClose={() => undefined} />)
    expect(options().map((o) => o.textContent)).toEqual([...FEEDBACK_OPTIONS.good])
    unmount()

    render(<FeedbackModal kind="bad" onClose={() => undefined} />)
    expect(options().map((o) => o.textContent)).toEqual([...FEEDBACK_OPTIONS.bad])
  })

  it('autofills the textarea when an option is picked', () => {
    render(<FeedbackModal kind="good" onClose={() => undefined} />)
    fireEvent.click(options()[0])
    expect(screen.getByTestId('feedback-input')).toHaveValue(FEEDBACK_OPTIONS.good[0])

    // Picking another option replaces the text.
    fireEvent.click(options()[1])
    expect(screen.getByTestId('feedback-input')).toHaveValue(FEEDBACK_OPTIONS.good[1])
  })

  it('submit is disabled until feedback exists and fires with the trimmed text', () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(<FeedbackModal kind="bad" onSubmit={onSubmit} onClose={onClose} />)

    const submit = screen.getByTestId('feedback-submit')
    expect(submit).toBeDisabled()

    fireEvent.change(screen.getByTestId('feedback-input'), { target: { value: '  Too slow  ' } })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)

    expect(onSubmit).toHaveBeenCalledWith('Too slow')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via cancel button, close icon, backdrop, and Escape', () => {
    const onClose = vi.fn()

    const view = render(<FeedbackModal kind="good" onClose={onClose} />)
    fireEvent.click(within(view.container.ownerDocument.body as HTMLElement).getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
    view.unmount()

    const view2 = render(<FeedbackModal kind="good" onClose={onClose} />)
    fireEvent.click(screen.getByTestId('feedback-close'))
    expect(onClose).toHaveBeenCalledTimes(2)
    view2.unmount()

    const view3 = render(<FeedbackModal kind="good" onClose={onClose} />)
    fireEvent.mouseDown(screen.getByTestId('feedback-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(3)
    view3.unmount()

    render(<FeedbackModal kind="good" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(4)
  })

  it('embedded mode renders the card inline without backdrop or aria-modal', () => {
    render(<FeedbackModal kind="good" embedded onClose={() => undefined} />)
    expect(screen.getByTestId('feedback-modal')).not.toHaveAttribute('aria-modal')
    expect(screen.queryByTestId('feedback-backdrop')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Share feedback' })).toBeInTheDocument()
  })

  it('embedded cards use unique per-instance ids and never steal focus or listen for Escape', () => {
    const onCloseA = vi.fn()
    const onCloseB = vi.fn()
    render(
      <>
        <FeedbackModal kind="good" embedded onClose={onCloseA} />
        <FeedbackModal kind="bad" embedded onClose={onCloseB} />
      </>,
    )

    // Unique title ids; each dialog is labelled by its own title.
    const dialogs = screen.getAllByRole('dialog', { name: 'Share feedback' })
    expect(dialogs).toHaveLength(2)
    const titleIds = dialogs.map((d) => d.getAttribute('aria-labelledby'))
    expect(new Set(titleIds).size).toBe(2)
    for (const dialog of dialogs) {
      const title = document.getElementById(dialog.getAttribute('aria-labelledby') || '')
      expect(title).not.toBeNull()
      expect(title).toHaveTextContent('Share feedback')
    }

    // Inline content: no autofocus, no global Escape handling.
    expect(document.activeElement).toBe(document.body)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCloseA).not.toHaveBeenCalled()
    expect(onCloseB).not.toHaveBeenCalled()
  })

  it('contains focus inside the dialog — Tab wraps at both edges', () => {
    render(<FeedbackModal kind="good" onClose={() => undefined} />)
    const dialog = screen.getByTestId('feedback-modal')
    const tabbables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button, textarea, [href], input, select',
        ),
      ).filter((el) => !el.hasAttribute('disabled'))

    // From the last tabbable, Tab wraps to the first.
    const all = tabbables()
    all[all.length - 1].focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(all[0])

    // From the first tabbable, Shift+Tab wraps to the last.
    all[0].focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(all[all.length - 1])
  })
})
