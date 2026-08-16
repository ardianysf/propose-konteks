/*
 * useFocusContainment.test.tsx — the shared modal focus-containment hook:
 * initial focus, Tab wrap, focusin escape recovery, empty-dialog behavior,
 * and listener cleanup.
 */
import { useRef, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFocusContainment } from './useFocusContainment'

function ContainedModal({ children }: { children?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusContainment(rootRef)
  return (
    <div ref={rootRef} tabIndex={-1} role="dialog" aria-modal="true" data-testid="contained">
      {children}
    </div>
  )
}

function renderWithOutside(children: ReactNode) {
  return render(
    <>
      <button type="button" data-testid="outside">
        outside
      </button>
      {children}
    </>,
  )
}

const getDialog = () => screen.getByTestId('contained')
const getOutside = () => screen.getByTestId('outside')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useFocusContainment', () => {
  it('moves focus to the tabIndex=-1 root on mount', () => {
    renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
        <button type="button">last</button>
      </ContainedModal>,
    )
    expect(getDialog()).toHaveFocus()
  })

  it('wraps Tab from the last tabbable to the first, and Shift+Tab from the first to the last', () => {
    renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
        <button type="button">last</button>
      </ContainedModal>,
    )
    const first = screen.getByRole('button', { name: 'first' })
    const last = screen.getByRole('button', { name: 'last' })

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(first).toHaveFocus()

    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('does not prevent the default on interior Tab, leaving native navigation intact', () => {
    renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
        <button type="button">middle</button>
        <button type="button">last</button>
      </ContainedModal>,
    )
    const middle = screen.getByRole('button', { name: 'middle' })
    middle.focus()

    // The hook's own keydown listener is registered on document during
    // mount; this probe listener runs after it, so defaultPrevented
    // reflects the hook's decision.
    let defaultPrevented = false
    const probe = (event: KeyboardEvent) => {
      if (event.key === 'Tab') defaultPrevented = event.defaultPrevented
    }
    document.addEventListener('keydown', probe)
    fireEvent.keyDown(middle, { key: 'Tab' })
    document.removeEventListener('keydown', probe)

    expect(defaultPrevented).toBe(false)
    // jsdom performs no native Tab traversal, so focus stays put.
    expect(middle).toHaveFocus()
  })

  it('redirects an outside active element to the first tabbable on Tab, and the last on Shift+Tab', () => {
    renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
        <button type="button">last</button>
      </ContainedModal>,
    )
    const first = screen.getByRole('button', { name: 'first' })
    const last = screen.getByRole('button', { name: 'last' })
    const outside = getOutside()

    // jsdom focus() does not fire focusin, so the active element stays
    // outside and the keydown intercept is exercised directly.
    outside.focus()
    fireEvent.keyDown(outside, { key: 'Tab' })
    expect(first).toHaveFocus()

    outside.focus()
    fireEvent.keyDown(outside, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('pulls focus back to the first tabbable when focus escapes through a focusin event', () => {
    renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
        <button type="button">last</button>
      </ContainedModal>,
    )
    const first = screen.getByRole('button', { name: 'first' })

    getOutside().focus()
    getOutside().dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(first).toHaveFocus()
  })

  it('keeps focus on the root when the dialog has zero tabbable elements', () => {
    renderWithOutside(
      <ContainedModal>
        <p>no tabbable controls</p>
      </ContainedModal>,
    )
    const dialog = getDialog()
    expect(dialog).toHaveFocus()

    getOutside().focus()
    getOutside().dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(dialog).toHaveFocus()

    getOutside().focus()
    fireEvent.keyDown(getOutside(), { key: 'Tab' })
    expect(dialog).toHaveFocus()
  })

  it('removes both document listeners on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderWithOutside(
      <ContainedModal>
        <button type="button">first</button>
      </ContainedModal>,
    )

    const keydownAdded = addSpy.mock.calls.some(([type]) => type === 'keydown')
    const focusinAdded = addSpy.mock.calls.some(([type]) => type === 'focusin')
    expect(keydownAdded).toBe(true)
    expect(focusinAdded).toBe(true)

    unmount()

    const keydownRemoved = removeSpy.mock.calls.some(([type]) => type === 'keydown')
    const focusinRemoved = removeSpy.mock.calls.some(([type]) => type === 'focusin')
    expect(keydownRemoved).toBe(true)
    expect(focusinRemoved).toBe(true)
  })
})
