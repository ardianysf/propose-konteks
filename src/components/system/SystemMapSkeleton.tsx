/*
 * SystemMapSkeleton — Suspense fallback for the outer lazy-loaded
 * SystemMapModal in AppShell.
 *
 * Displays a placeholder dialog structure matching the modal's frame
 * while the SystemMapModal chunk loads.
 */
function SystemMapSkeleton() {
  return (
    <>
      <div aria-hidden="true" className="kx-modal-backdrop" />
      <div className="kx-modal kx-system-map" aria-busy="true" role="dialog" aria-modal="true">
        <div className="kx-system-map__head">
          <div className="kx-system-map__title kx-skeleton" style={{ width: '200px', height: '20px' }} />
          <div className="kx-icon-btn kx-skeleton" style={{ width: '32px', height: '32px' }} />
        </div>
        <div
          className="kx-system-map__canvas kx-skeleton"
          style={{ height: '480px', minHeight: '480px' }}
        />
      </div>
    </>
  )
}

export default SystemMapSkeleton
