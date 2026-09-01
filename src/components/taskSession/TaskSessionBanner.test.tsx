/*
 * TaskSessionBanner tests — the "Back to plan" context strip on the task
 * session page (Task Session Page feature).
 *
 * Renders the banner under the real reducer via the mockup context (the
 * Sidebar.test.tsx harness convention) and asserts the origin line quotes
 * the parent plan session, the help copy survives, and Back to plan
 * dispatches NAVIGATE back to the regular session-detail route.
 */
import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import TaskSessionBanner from './TaskSessionBanner'
import { MockupContext, useMockup } from '../../state/MockupContext'
import { initialState, mockupReducer, type MockupState } from '../../state/mockupReducer'

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderBanner(initial?: Partial<MockupState>) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <TaskSessionBanner />
        <main data-testid="route">{state.route}</main>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

describe('TaskSessionBanner', () => {
  it('renders the ticket origin line quoting the parent plan session plus the help copy', () => {
    renderBanner()
    const banner = screen.getByTestId('task-session-banner')
    expect(banner).toHaveTextContent('TKT-3 · from Validate delivery evidence')
    expect(banner).toHaveTextContent(
      'This session delivers ticket TKT-3. Approving its costed proposal here reports the decision back to the plan.',
    )
    // Decorative ticket + arrow glyphs, hidden from assistive tech.
    expect(banner.querySelector('svg[data-icon="ticket"]')).not.toBeNull()
    expect(banner.querySelector('svg[data-icon="ticket"]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('Back to plan navigates to the regular session-detail route', () => {
    const { bucket } = renderBanner({ route: 'task-session-detail' })
    expect(screen.getByTestId('route')).toHaveTextContent('task-session-detail')

    fireEvent.click(screen.getByTestId('task-back-to-plan'))
    expect(bucket.current?.route).toBe('session-detail')
    expect(screen.getByTestId('route')).toHaveTextContent('session-detail')
  })
})
