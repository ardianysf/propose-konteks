/*
 * V2App — the /v2 provider boundary. Mirrors src/App.tsx exactly: the
 * single mockup store (useReducer + MockupProvider, ?mock= parsed once
 * by initialState) wrapping the V2 shell. No chrome lives here.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { readV2Location, v2Path } from './product/navigation'
import {
  initialState,
  mockupReducer,
  type MockupAction,
} from '../state/mockupReducer'
import { MockupProvider } from '../state/MockupContext'
import V2Shell from './V2Shell'

export default function V2App() {
  const [state, rawDispatch] = useReducer(mockupReducer, undefined, () => {
    const base = initialState(window.location.search)
    const target = readV2Location(window.location)
    const next = mockupReducer(base, target)
    return target.route === 'task-session-detail' && target.id
      ? { ...next, activeTaskSessionId: target.id }
      : next
  })
  const dispatch = useCallback(
    (action: MockupAction) =>
      rawDispatch(
        action.type === 'NAVIGATE'
          ? { type: 'NAVIGATE_PRODUCT', route: action.route }
          : action.type === 'NAVIGATE_TASK_SESSION'
            ? {
                type: 'NAVIGATE_PRODUCT',
                route: 'task-session-detail',
                id: action.taskSessionId,
              }
            : action,
      ),
    [],
  )
  const lastPath = useRef(v2Path(state, window.location.search))
  useEffect(() => {
    // Canonicalize deep links without creating an initial history entry.
    window.history.replaceState(null, '', lastPath.current)
    const restore = () => {
      const target = readV2Location(window.location)
      lastPath.current = window.location.pathname + window.location.search
      dispatch(target)
      if (target.route === 'task-session-detail' && target.id)
        dispatch({ type: 'NAVIGATE_TASK_SESSION', taskSessionId: target.id })
    }
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  useEffect(() => {
    const path = v2Path(state, window.location.search)
    if (lastPath.current !== path) {
      window.history.pushState(null, '', path)
      lastPath.current = path
    }
  }, [
    state.route,
    state.product.selectedId,
    state.product.returnRoute,
    state.product.customizeSection,
    state.product.settingsSection,
    state.activeTaskSessionId,
  ])

  return (
    <MockupProvider value={{ state, dispatch }}>
      {state.product.signedOut ? (
        <div className="kx-product-signed-out">
          <section className="kx-card kx-stack">
            <h1>Signed out of the prototype</h1>
            <p>Illustrative data · no production account was signed out.</p>
            <button
              className="kx-button kx-button--primary"
              onClick={() =>
                dispatch({
                  type: 'PRODUCT',
                  action: { kind: 'session', signedOut: false },
                })
              }
            >
              Sign in to prototype
            </button>
          </section>
        </div>
      ) : (
        <V2Shell />
      )}
    </MockupProvider>
  )
}
