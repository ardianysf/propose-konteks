/*
 * MockupFixtureProvider (Task T4, spec §2 "Fixture" + AC5) — the catalog
 * fixture pattern for previewing mockup-coupled components.
 *
 * A fixture is NOT a copy of an implementation: it renders the real
 * `mockupReducer` with the real `MockupContext` under a controlled initial
 * state (typed `MockupState`), so a coupled component behaves in the
 * catalog exactly as it does in the mockup — live previews keep importing
 * from src/components/ and src/state/ (single source of truth).
 *
 * Usage:
 *   <MockupFixtureProvider overrides={{ sessionDetail: … }}>
 *     <SessionStatusBadge />
 *   </MockupFixtureProvider>
 *
 * `MockupFixtureProvider` also wires the real `OverlayLifecycleProvider`
 * from the same reducer state, so components like WorkspaceMenu that
 * consume `useOverlayLifecycle` (but not MockupContext) preview correctly
 * too — Escape/CLOSE_OVERLAY behave through the real contracts.
 */
import { useMemo, useReducer, type ReactNode } from 'react'
import { MockupProvider } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type MockupAction,
  type MockupState,
} from '../../state/mockupReducer'
import { OverlayLifecycleProvider } from '../../components/shell/OverlayLifecycle'

export interface MockupFixtureProviderProps {
  /** Shallow overrides merged over `initialState()` (top-level keys only;
   *  nested slices like sessionDetail should be replaced wholesale). */
  overrides?: Partial<MockupState>
  /** Actions replayed onto the initial state via the real reducer —
   *  useful when the interesting state is easier to reach by behavior
   *  than by hand-writing state slices. Applied after `overrides`. */
  actions?: MockupAction[]
  children: ReactNode
}

/**
 * Builds a typed fixture state: the real `initialState()` plus optional
 * shallow overrides, then optional actions replayed through the real
 * reducer. Pure — safe to call outside React (tests, story-style data).
 */
export function makeFixtureState(
  overrides: Partial<MockupState> = {},
  actions: MockupAction[] = [],
): MockupState {
  const base: MockupState = { ...initialState(), ...overrides }
  return actions.reduce(mockupReducer, base)
}

export function MockupFixtureProvider({
  overrides,
  actions,
  children,
}: MockupFixtureProviderProps) {
  // The fixture state is computed once per provider instance; the live
  // reducer keeps interactive previews (dispatch) working afterwards.
  const seed = useMemo(
    () => makeFixtureState(overrides, actions),
    // Overrides/actions are fixture literals created at render time by the
    // registry preview; reseeding on identity change would loop, so the
    // seed is intentionally stable for the provider's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [state, dispatch] = useReducer(mockupReducer, seed)
  const value = useMemo(() => ({ state, dispatch }), [state])

  return (
    <MockupProvider value={value}>
      <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
        {children}
      </OverlayLifecycleProvider>
    </MockupProvider>
  )
}
