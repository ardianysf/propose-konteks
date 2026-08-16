/*
 * OverlayLifecycle.test.tsx — the Task 13 overlay lifecycle provider:
 * focus-return origin registration, replacement chains, and the sole
 * document Escape listener with its guards.
 */
import { useEffect, useMemo, useReducer, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { OverlayLifecycleProvider, useOverlayLifecycle } from './OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupAction,
  type MockupState,
} from '../../state/mockupReducer'

interface Controls {
  state: MockupState | null
  dispatchSpy: ReturnType<typeof vi.fn>
}

function LifecycleProbe({ controls }: { controls: Controls }) {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain, dismissOverlay } = useOverlayLifecycle()
  const [showTrigger, setShowTrigger] = useState(true)

  useEffect(() => {
    controls.state = state
  }, [state])

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          data-testid="open-trigger"
          onClick={(event) => {
            beginOverlayChain(event.currentTarget)
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'system-menu' } })
          }}
        >
          open system
        </button>
      )}
      <button
        type="button"
        data-testid="remove-trigger"
        onClick={() => setShowTrigger(false)}
      >
        remove trigger
      </button>
      <button
        type="button"
        data-testid="open-no-origin"
        onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'system-menu' } })}
      >
        open without origin
      </button>
      <button
        type="button"
        data-testid="replace"
        onClick={() => dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'workspace-menu' } })}
      >
        replace
      </button>
      <button type="button" data-testid="dismiss" onClick={() => dismissOverlay()}>
        dismiss
      </button>
      <button
        type="button"
        data-testid="close-direct"
        onClick={() => dispatch({ type: 'CLOSE_OVERLAY' })}
      >
        close direct
      </button>
    </>
  )
}

function renderLifecycle() {
  const controls: Controls = { state: null, dispatchSpy: vi.fn() }
  const dispatchRef: { current: (action: MockupAction) => void } = { current: () => {} }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, initialState())
    dispatchRef.current = dispatch
    const dispatchSpy = useMemo(
      () => vi.fn((action: MockupAction) => dispatchRef.current(action)),
      [],
    )
    controls.dispatchSpy = dispatchSpy

    return (
      <MockupContext.Provider value={{ state, dispatch: dispatchSpy }}>
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatchSpy}>
          <LifecycleProbe controls={controls} />
          {state.overlay.kind === 'system-menu' && (
            <div role="menu" aria-label="Systems">
              system menu
            </div>
          )}
          {state.overlay.kind === 'workspace-menu' && (
            <div role="menu" aria-label="Workspace">
              workspace menu
            </div>
          )}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  render(<Harness />)
  return controls
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('OverlayLifecycle — direct and replacement chains', () => {
  it('restores focus to the direct-open trigger after a lifecycle dismissal', () => {
    renderLifecycle()
    const trigger = screen.getByTestId('open-trigger')
    fireEvent.click(trigger)
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dismiss'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('keeps the original trigger origin across a same-chain replacement overlay', () => {
    renderLifecycle()
    const trigger = screen.getByTestId('open-trigger')
    fireEvent.click(trigger)
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('replace'))
    expect(screen.getByRole('menu', { name: 'Workspace' })).toBeInTheDocument()
    expect(screen.queryByRole('menu', { name: 'Systems' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dismiss'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})

describe('OverlayLifecycle — Escape guards', () => {
  it('dispatches a single CLOSE_OVERLAY for repeated Escape before commit', () => {
    const controls = renderLifecycle()
    fireEvent.click(screen.getByTestId('open-trigger'))
    controls.dispatchSpy.mockClear()

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
    })

    const closeActions = controls.dispatchSpy.mock.calls.filter(
      ([action]) => (action as MockupAction).type === 'CLOSE_OVERLAY',
    )
    expect(closeActions).toHaveLength(1)
    expect(controls.state?.overlay).toEqual({ kind: 'none' })
  })

  it('ignores Escape that was already defaultPrevented', () => {
    renderLifecycle()
    fireEvent.click(screen.getByTestId('open-trigger'))

    const prevent = (event: KeyboardEvent) => event.preventDefault()
    document.addEventListener('keydown', prevent, true)
    try {
      act(() => {
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
        )
      })
    } finally {
      document.removeEventListener('keydown', prevent, true)
    }

    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()
  })

  it('ignores Escape while an input method is composing', () => {
    renderLifecycle()
    fireEvent.click(screen.getByTestId('open-trigger'))

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    Object.defineProperty(event, 'isComposing', { value: true })
    act(() => {
      document.dispatchEvent(event)
    })

    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()
  })
})

describe('OverlayLifecycle — origin edge cases', () => {
  it('skips focus restoration when no origin was registered', () => {
    renderLifecycle()
    const trigger = screen.getByTestId('open-trigger')
    fireEvent.click(screen.getByTestId('open-no-origin'))
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dismiss'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).not.toHaveFocus()
  })

  it('skips focus restoration when the origin is no longer connected', () => {
    renderLifecycle()
    const trigger = screen.getByTestId('open-trigger')
    fireEvent.click(trigger)
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()

    // Unmount the trigger through React rather than removing its DOM node
    // directly, which would make React's own reconciliation throw.
    fireEvent.click(screen.getByTestId('remove-trigger'))
    expect(screen.queryByTestId('open-trigger')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dismiss'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(document.contains(trigger)).toBe(false)
  })
})

describe('OverlayLifecycle — direct reducer CLOSE reset', () => {
  it('does not restore focus on a direct CLOSE_OVERLAY and resets the refs for the next chain', () => {
    renderLifecycle()
    const trigger = screen.getByTestId('open-trigger')
    fireEvent.click(trigger)

    fireEvent.click(screen.getByTestId('close-direct'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).not.toHaveFocus()

    // A fresh chain after the direct close must still restore correctly.
    fireEvent.click(trigger)
    expect(screen.getByRole('menu', { name: 'Systems' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dismiss'))
    expect(trigger).toHaveFocus()
  })
})
