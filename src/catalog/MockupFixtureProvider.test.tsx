/*
 * Smoke test for the T4 fixture pattern (AC5): a coupled child rendered
 * inside MockupFixtureProvider sees the overridden state through the real
 * MockupContext, and the live reducer keeps dispatch working.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useMockup } from '../state/MockupContext'
import { MockupFixtureProvider, makeFixtureState } from './fixtures/MockupFixtureProvider'
import { initialState } from '../state/mockupReducer'

/** Simple coupled child: reads a state slice + dispatches an action. */
function OverlayProbe() {
  const { state, dispatch } = useMockup()
  return (
    <div>
      <span data-testid="overlay-kind">{state.overlay.kind}</span>
      <button
        type="button"
        onClick={() => dispatch({ type: 'CLOSE_OVERLAY' })}
      >
        close
      </button>
    </div>
  )
}

describe('MockupFixtureProvider', () => {
  it('renders a coupled child with the overridden state visible', () => {
    render(
      <MockupFixtureProvider overrides={{ overlay: { kind: 'workspace-menu' } }}>
        <OverlayProbe />
      </MockupFixtureProvider>,
    )

    expect(screen.getByTestId('overlay-kind')).toHaveTextContent('workspace-menu')
  })

  it('keeps the live reducer working after seeding (dispatch updates state)', () => {
    render(
      <MockupFixtureProvider overrides={{ overlay: { kind: 'workspace-menu' } }}>
        <OverlayProbe />
      </MockupFixtureProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'close' }))
    expect(screen.getByTestId('overlay-kind')).toHaveTextContent('none')
  })

  it('makeFixtureState is pure and replays actions through the real reducer', () => {
    const seeded = makeFixtureState(
      {},
      [{ type: 'OPEN_OVERLAY', overlay: { kind: 'workspace-menu' } }],
    )
    expect(seeded.overlay).toEqual({ kind: 'workspace-menu' })
    // The real initialState() is untouched (pure builder).
    expect(initialState().overlay).toEqual({ kind: 'none' })
  })
})
