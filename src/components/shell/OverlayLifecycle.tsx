/*
 * OverlayLifecycle (Task 13) — the single owner of overlay focus-return
 * and Escape dismissal.
 *
 * The provider owns the focus origin ref, the synchronous dismissal guard,
 * the previous-overlay-kind ref, the sole bubbling document Escape
 * listener, and the active→none restoration effect. Reducer state stays
 * serializable and unchanged: the provider only reads the current overlay
 * and dispatches CLOSE_OVERLAY.
 */
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { MockupAction, MockupOverlay } from '../../state/mockupReducer'
import { isRestorable } from '../../utils/overlays'

export interface OverlayLifecycleProviderProps {
  overlay: MockupOverlay
  dispatch: Dispatch<MockupAction>
  children: ReactNode
}

export interface OverlayLifecycleContextValue {
  /** Register an outside trigger as the focus-return origin for a new
   * direct-open chain. Replaces any stale origin and clears pending. */
  beginOverlayChain(trigger: HTMLElement): void
  /** Dismiss the active overlay through the lifecycle. Idempotent before
   * React commits via the synchronous pending guard. */
  dismissOverlay(): void
}

const OverlayLifecycleContext = createContext<OverlayLifecycleContextValue | null>(null)
OverlayLifecycleContext.displayName = 'OverlayLifecycle'

export function OverlayLifecycleProvider({
  overlay,
  dispatch,
  children,
}: OverlayLifecycleProviderProps) {
  const originRef = useRef<HTMLElement | null>(null)
  const dismissalPendingRef = useRef(false)
  const previousOverlayKindRef = useRef<MockupOverlay['kind'] | null>(null)

  const beginOverlayChain = (trigger: HTMLElement) => {
    originRef.current = trigger
    dismissalPendingRef.current = false
  }

  const dismissOverlay = () => {
    if (overlay.kind === 'none' || dismissalPendingRef.current) return
    dismissalPendingRef.current = true
    dispatch({ type: 'CLOSE_OVERLAY' })
  }

  // Sole bubbling document Escape listener while an overlay is active.
  useLayoutEffect(() => {
    if (overlay.kind === 'none') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return
      if (event.isComposing) return
      dismissOverlay()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // dismissOverlay reads live refs plus the overlay kind captured for the
    // active overlay's lifetime; re-binding on kind/dispatch changes keeps
    // the listener fresh across replacements.
  }, [overlay.kind, dispatch])

  // active → none restoration, before paint. The overlay children have
  // already been removed by the commit, so only restore when a lifecycle
  // dismissal is pending; always clear origin/pending afterwards.
  useLayoutEffect(() => {
    const previousKind = previousOverlayKindRef.current
    previousOverlayKindRef.current = overlay.kind

    if (overlay.kind === 'none') {
      const wasActive = previousKind !== null && previousKind !== 'none'
      const pending = dismissalPendingRef.current
      const origin = originRef.current

      originRef.current = null
      dismissalPendingRef.current = false

      if (wasActive && pending && origin && isRestorable(origin)) {
        origin.focus()
      }
    }
  }, [overlay.kind])

  return (
    <OverlayLifecycleContext.Provider value={{ beginOverlayChain, dismissOverlay }}>
      {children}
    </OverlayLifecycleContext.Provider>
  )
}

export function useOverlayLifecycle(): OverlayLifecycleContextValue {
  const value = useContext(OverlayLifecycleContext)
  if (!value) {
    throw new Error('useOverlayLifecycle: no OverlayLifecycleProvider above the current component')
  }
  return value
}
