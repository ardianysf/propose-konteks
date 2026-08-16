/*
 * NewSessionPage — the default route's page (Task 5, spec §7).
 *
 * Pure composition: the dominant Engineering/Planning mode control
 * (AC15), the Engineering-only setup row (AC17 — hidden entirely in
 * Planning, AC16), and the Composer (AC18–AC21). Owns no input state;
 * every trigger dispatches an existing overlay kind — the repository
 * modal (Task 7) and, since Task 8, the anchored component menu, which
 * mounts from the Component trigger's anchor wrapper below while
 * overlay.kind === 'component-menu'.
 */
import ComponentMenu from '../components/composer/ComponentMenu'
import Composer from '../components/composer/Composer'
import SessionMode from '../components/composer/SessionMode'
import { useMockup } from '../state/MockupContext'

/** Chevron-right — marks setup triggers whose surfaces open to the right (AC7 language). */
function ChevronRight() {
  return (
    <svg
      className="kx-setup-row__chevron"
      data-icon="chevron-right"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Branch glyph — the system/repository selection trigger. */
function RepositoryIcon() {
  return (
    <svg data-icon="repository" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M6 3v12 M18 9a9 9 0 0 1-9 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="6" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="18" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

/** Box glyph — the component selection trigger. */
function ComponentIcon() {
  return (
    <svg data-icon="component" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function NewSessionPage() {
  const { state, dispatch } = useMockup()
  const engineering = state.sessionMode === 'engineering'
  const activeSystem =
    state.systems.find((system) => system.id === state.activeSystemId) ?? state.systems[0]
  const repoValue =
    state.selectedRepoIds.length === 0
      ? 'Select repositories'
      : `${state.selectedRepoIds.length} of ${activeSystem.repoIds.length} repositories`
  const componentValue =
    state.selectedComponentIds.length === 0
      ? 'All components'
      : `${state.selectedComponentIds.length} components selected`

  return (
    <section className="kx-new-session" aria-label="New session">
      <h1 className="kx-visually-hidden">New session</h1>

      {/* Dominant mode control — above every other region (AC15). */}
      <SessionMode />

      {/* Engineering-only setup row (AC17); Planning hides it entirely
          (AC16). Triggers dispatch existing overlay kinds: the repository
          modal (Task 7), and the anchored component menu, which floats
          from the Component trigger's anchor wrapper (Task 8, AC30). */}
      {engineering && (
        <div className="kx-setup-row">
          <button
            type="button"
            className="kx-setup-row__trigger"
            aria-haspopup="dialog"
            data-testid="repository-trigger"
            onClick={() =>
              dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'repository-modal' } })
            }
          >
            <span className="kx-setup-row__trigger-icon" aria-hidden="true">
              <RepositoryIcon />
            </span>
            <span className="kx-setup-row__trigger-copy">
              <span className="kx-setup-row__trigger-caption">System / repositories</span>
              <span className="kx-setup-row__trigger-value">
                {activeSystem.name} · {repoValue}
              </span>
            </span>
            <ChevronRight />
          </button>
          {/* Anchor wrapper around the Component trigger — the menu
              (Task 8) floats from here, under the trigger's left edge
              (AC30); it renders only while the component-menu overlay
              is the open kind. */}
          <div className="kx-setup-row__component-anchor">
            <button
              type="button"
              className="kx-setup-row__trigger"
              aria-haspopup="menu"
              aria-expanded={state.overlay.kind === 'component-menu'}
              data-testid="component-trigger"
              onClick={() =>
                dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'component-menu' } })
              }
            >
              <span className="kx-setup-row__trigger-icon" aria-hidden="true">
                <ComponentIcon />
              </span>
              <span className="kx-setup-row__trigger-copy">
                <span className="kx-setup-row__trigger-caption">Component</span>
                <span className="kx-setup-row__trigger-value">{componentValue}</span>
              </span>
              <ChevronRight />
            </button>
            {state.overlay.kind === 'component-menu' && <ComponentMenu />}
          </div>
        </div>
      )}

      <Composer />
    </section>
  )
}
