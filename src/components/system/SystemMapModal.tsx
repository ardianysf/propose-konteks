/*
 * SystemMapModal — the per-system architecture map modal.
 *
 * Eager dialog shell with lazy-loaded React Flow graph visualization.
 * Replaces the static SVG with interactive @xyflow/react graph displaying
 * Repository → Component → System hierarchy (left to right).
 */
import { lazy, Suspense, useRef } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { ReactFlowProvider } from '@xyflow/react'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import GraphSkeleton from './GraphSkeleton'
import SystemMapFallbackView from './SystemMapFallbackView'
import './SystemMapModal.css'

// Lazy inner graph component - must be below ReactFlowProvider
const SystemMapGraph = lazy(() => import('./SystemMapGraph'))

/** Close — the header dismiss control (same glyph as the other modals). */
function CloseIcon() {
  return (
    <svg
      data-icon="close"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SystemMapModal() {
  const { state } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus containment - auto-bypasses catalog preview
  useFocusContainment(dialogRef)

  // Resolve system from overlay state
  const systemId = state.overlay.kind === 'system-map' ? state.overlay.systemId : null
  const system = state.systems.find((s) => s.id === systemId)

  const titleId = `system-map-title-${systemId ?? 'unknown'}`

  return (
    <>
      <div aria-hidden="true" className="kx-modal-backdrop" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="kx-modal kx-system-map"
        // Escape is handled by SystemMapGraph (propagates from content)
        // OverlayLifecycle handles modal closing when no selection
      >
        <header className="kx-system-map__head">
          <h2 id={titleId} className="kx-system-map__title">
            {system?.name || 'System'} — system map
          </h2>
          <button
            type="button"
            className="kx-icon-btn kx-system-map__close"
            aria-label="Close"
            onClick={() => dismissOverlay()}
          >
            <CloseIcon />
          </button>
        </header>

        <ReactFlowProvider>
          <ErrorBoundary FallbackComponent={SystemMapFallbackView as any}>
            <Suspense fallback={<GraphSkeleton />}>
              <SystemMapGraph />
            </Suspense>
          </ErrorBoundary>
        </ReactFlowProvider>
      </div>
    </>
  )
}
