/*
 * CatalogPreviewContext.test.tsx — tests for catalog preview context
 * and its integration with useFocusContainment.
 *
 * These tests verify that focus containment is properly disabled in catalog
 * previews while remaining active in production, ensuring catalog navigation
 * (breadcrumb/backlink) works correctly.
 */
import { useRef, type ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CatalogPreviewProvider,
  useIsCatalogPreview,
} from './CatalogPreviewContext'
import { useFocusContainment } from '../components/shell/useFocusContainment'

// Test component that uses the preview hook
function TestComponent() {
  const isPreview = useIsCatalogPreview()
  return <div data-testid="preview-status">{isPreview ? 'preview' : 'production'}</div>
}

// Test component with a properly connected modal root and tabbable controls
function ModalWithFocusContainment({ children }: { children?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFocusContainment(rootRef)
  return (
    <div ref={rootRef} tabIndex={-1} role="dialog" aria-modal="true" data-testid="modal-root">
      {children || (
        <>
          <button type="button" data-testid="first-button">First</button>
          <button type="button" data-testid="second-button">Second</button>
          <button type="button" data-testid="third-button">Third</button>
        </>
      )}
    </div>
  )
}

// Helper to render with an outside tabbable element
function renderWithOutside(content: ReactNode) {
  return render(
    <>
      <button type="button" data-testid="outside-button">Outside</button>
      {content}
    </>,
  )
}

describe('CatalogPreviewContext', () => {
  describe('basic context behavior', () => {
    it('returns false when context is not provided (production)', () => {
      render(<TestComponent />)
      expect(screen.getByTestId('preview-status')).toHaveTextContent('production')
    })

    it('returns true when wrapped in CatalogPreviewProvider', () => {
      render(
        <CatalogPreviewProvider>
          <TestComponent />
        </CatalogPreviewProvider>,
      )
      expect(screen.getByTestId('preview-status')).toHaveTextContent('preview')
    })

    it('nested providers preserve preview state', () => {
      render(
        <CatalogPreviewProvider>
          <CatalogPreviewProvider>
            <TestComponent />
          </CatalogPreviewProvider>
        </CatalogPreviewProvider>,
      )
      expect(screen.getByTestId('preview-status')).toHaveTextContent('preview')
    })
  })

  describe('focus containment in catalog preview mode', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('does NOT install document-level keydown listener in preview mode', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')

      render(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      // keydown listener should NOT be added in preview mode
      const keydownAdded = addSpy.mock.calls.some(([type]) => type === 'keydown')
      expect(keydownAdded).toBe(false)

      addSpy.mockRestore()
    })

    it('does NOT install document-level focusin listener in preview mode', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')

      render(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      // focusin listener should NOT be added in preview mode
      const focusinAdded = addSpy.mock.calls.some(([type]) => type === 'focusin')
      expect(focusinAdded).toBe(false)

      addSpy.mockRestore()
    })

    it('does NOT focus the modal root on mount in preview mode', () => {
      render(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      // In preview mode, the modal root should NOT be auto-focused
      expect(screen.getByTestId('modal-root')).not.toHaveFocus()
    })

    it('allows Tab navigation to escape the modal in preview mode', () => {
      renderWithOutside(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      const firstButton = screen.getByTestId('first-button')

      // Focus the first button
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Press Tab - in preview mode, focus should NOT be trapped
      // (jsdom doesn't perform native Tab, but the key shouldn't be prevented)
      let defaultPrevented = false
      const probe = (event: KeyboardEvent) => {
        if (event.key === 'Tab') defaultPrevented = event.defaultPrevented
      }
      document.addEventListener('keydown', probe)
      fireEvent.keyDown(firstButton, { key: 'Tab' })
      document.removeEventListener('keydown', probe)

      // In preview mode, Tab should NOT be prevented
      expect(defaultPrevented).toBe(false)
    })

    it('allows focus to move outside the modal in preview mode', () => {
      renderWithOutside(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      const outsideButton = screen.getByTestId('outside-button')
      const firstButton = screen.getByTestId('first-button')

      // Focus the first button
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Simulate focus moving outside (e.g., user clicks outside or uses browser nav)
      outsideButton.focus()

      // Dispatch focusin event - in preview mode, focus should NOT be pulled back
      outsideButton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      // Focus should stay on outside button (not redirected back to modal)
      expect(outsideButton).toHaveFocus()
    })

    it('cleans up listeners when unmounting from preview mode', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <CatalogPreviewProvider>
          <ModalWithFocusContainment />
        </CatalogPreviewProvider>,
      )

      unmount()

      // No listeners should be removed (none were added)
      const keydownRemoved = removeSpy.mock.calls.some(([type]) => type === 'keydown')
      const focusinRemoved = removeSpy.mock.calls.some(([type]) => type === 'focusin')
      expect(keydownRemoved).toBe(false)
      expect(focusinRemoved).toBe(false)

      removeSpy.mockRestore()
    })
  })

  describe('focus containment in production mode', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('DOES install document-level keydown listener in production mode', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')

      render(<ModalWithFocusContainment />)

      // keydown listener SHOULD be added in production mode
      const keydownAdded = addSpy.mock.calls.some(([type]) => type === 'keydown')
      expect(keydownAdded).toBe(true)

      addSpy.mockRestore()
    })

    it('DOES install document-level focusin listener in production mode', () => {
      const addSpy = vi.spyOn(document, 'addEventListener')

      render(<ModalWithFocusContainment />)

      // focusin listener SHOULD be added in production mode
      const focusinAdded = addSpy.mock.calls.some(([type]) => type === 'focusin')
      expect(focusinAdded).toBe(true)

      addSpy.mockRestore()
    })

    it('focuses the modal root on mount in production mode', () => {
      render(<ModalWithFocusContainment />)

      // In production mode, the modal root should be auto-focused
      expect(screen.getByTestId('modal-root')).toHaveFocus()
    })

    it('traps Tab navigation within the modal in production mode', () => {
      render(<ModalWithFocusContainment />)

      const lastButton = screen.getByTestId('third-button')
      const firstButton = screen.getByTestId('first-button')

      // Focus the last button
      lastButton.focus()
      expect(lastButton).toHaveFocus()

      // Press Tab - in production mode, focus should wrap to first
      fireEvent.keyDown(lastButton, { key: 'Tab' })
      expect(firstButton).toHaveFocus()
    })

    it('traps Shift+Tab navigation within the modal in production mode', () => {
      render(<ModalWithFocusContainment />)

      const firstButton = screen.getByTestId('first-button')
      const lastButton = screen.getByTestId('third-button')

      // Focus the first button
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      // Press Shift+Tab - in production mode, focus should wrap to last
      fireEvent.keyDown(firstButton, { key: 'Tab', shiftKey: true })
      expect(lastButton).toHaveFocus()
    })

    it('pulls focus back when it escapes the modal in production mode', () => {
      renderWithOutside(<ModalWithFocusContainment />)

      const outsideButton = screen.getByTestId('outside-button')
      const firstButton = screen.getByTestId('first-button')

      // When focus moves outside (simulated by directly setting activeElement),
      // and then a focusin event fires, containment should pull it back
      outsideButton.focus()
      // The focusin event triggers the containment mechanism
      outsideButton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      // Focus should be redirected back to the first tabbable
      expect(firstButton).toHaveFocus()
      // Verify it's NOT on the outside button
      expect(outsideButton).not.toHaveFocus()
    })

    it('removes listeners when unmounting from production mode', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(<ModalWithFocusContainment />)

      unmount()

      // Both listeners should be removed
      const keydownRemoved = removeSpy.mock.calls.some(([type]) => type === 'keydown')
      const focusinRemoved = removeSpy.mock.calls.some(([type]) => type === 'focusin')
      expect(keydownRemoved).toBe(true)
      expect(focusinRemoved).toBe(true)

      removeSpy.mockRestore()
    })

    it('redirects outside Tab to first tabbable in production mode', () => {
      renderWithOutside(<ModalWithFocusContainment />)

      const outsideButton = screen.getByTestId('outside-button')
      const firstButton = screen.getByTestId('first-button')

      // Focus outside
      outsideButton.focus()

      // Press Tab - should redirect to first tabbable
      fireEvent.keyDown(outsideButton, { key: 'Tab' })
      expect(firstButton).toHaveFocus()
    })

    it('redirects outside Shift+Tab to last tabbable in production mode', () => {
      renderWithOutside(<ModalWithFocusContainment />)

      const outsideButton = screen.getByTestId('outside-button')
      const lastButton = screen.getByTestId('third-button')

      // Focus outside
      outsideButton.focus()

      // Press Shift+Tab - should redirect to last tabbable
      fireEvent.keyDown(outsideButton, { key: 'Tab', shiftKey: true })
      expect(lastButton).toHaveFocus()
    })
  })

  describe('edge cases', () => {
    it('handles empty modal in preview mode without errors', () => {
      expect(() => {
        render(
          <CatalogPreviewProvider>
            <ModalWithFocusContainment>
              <p>No tabbable elements</p>
            </ModalWithFocusContainment>
          </CatalogPreviewProvider>,
        )
      }).not.toThrow()
    })

    it('handles empty modal in production mode without errors', () => {
      expect(() => {
        render(
          <ModalWithFocusContainment>
            <p>No tabbable elements</p>
          </ModalWithFocusContainment>,
        )
      }).not.toThrow()
    })

    it('keeps focus on empty modal root in production mode', () => {
      renderWithOutside(
        <ModalWithFocusContainment>
          <p>No tabbable elements</p>
        </ModalWithFocusContainment>,
      )

      const modalRoot = screen.getByTestId('modal-root')
      expect(modalRoot).toHaveFocus()

      // Try to move focus outside
      screen.getByTestId('outside-button').focus()
      screen.getByTestId('outside-button').dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

      // Focus should return to the root
      expect(modalRoot).toHaveFocus()
    })
  })
})
