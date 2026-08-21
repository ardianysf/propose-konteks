/*
 * SystemMapFallbackView — ErrorBoundary fallback for SystemMapGraph.
 *
 * Renders a distinct feature-load-error state when the graph fails to
 * load or throws an exception.
 */
function SystemMapFallbackView({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="kx-system-map__fallback">
      <div className="kx-system-map__fallback-icon">⚠️</div>
      <h3 className="kx-system-map__fallback-title">Unable to load system map</h3>
      <p className="kx-system-map__fallback-message">
        {error.message || 'An unexpected error occurred while loading the graph.'}
      </p>
      <button
        type="button"
        className="kx-btn kx-btn--primary"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  )
}

export default SystemMapFallbackView
