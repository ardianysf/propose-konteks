/*
 * GraphSkeleton — Suspense fallback for the inner lazy-loaded
 * SystemMapGraph component.
 *
 * Displays a placeholder graph canvas while the React Flow graph loads.
 */
function GraphSkeleton() {
  return (
    <div className="kx-system-map__graph kx-skeleton" style={{ height: '480px', minHeight: '480px' }} />
  )
}

export default GraphSkeleton
