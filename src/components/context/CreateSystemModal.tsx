/*
 * CreateSystemModal — the "Create a new system" form (Task 7 Part C,
 * spec §8.3, AC33).
 *
 * A centered .kx-modal over the shared backdrop primitive, kept
 * deliberately small: Name (required, with the cue visible in the label
 * itself) and Description (labeled optional) are the only fields, over
 * a one-sentence helper explaining that systems group repositories and
 * components. Create stays visibly disabled while the name is blank or
 * whitespace (AC43); when enabled it commits through CREATE_SYSTEM —
 * the reducer appends the system, makes it active, and clears the
 * previous repository selection (AC33, reducer-proven) — then closes.
 * There is nothing to load: no network is involved, so no loading state
 * exists either.
 */
import { useId, useRef, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'

/** Close — the header dismiss control. */
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

export default function CreateSystemModal() {
  const { dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const nameId = useId()
  const descriptionId = useId()
  const formId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Form state — name + optional description, all local: Create is the
  // only commit, and it goes through the pure reducer, never the network.
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Shared focus containment owns initial focus, Tab trapping, and the
  // focusin safety net (Task 13); Escape is owned by OverlayLifecycle.
  useFocusContainment(dialogRef)

  const close = () => dismissOverlay()

  const trimmedName = name.trim()
  const canCreate = trimmedName !== ''

  // CREATE_SYSTEM appends the system, makes it the active one, and
  // clears the previous repository selection (reducer-proven, AC33);
  // the overlay then closes. No network call happens anywhere.
  const create = () => {
    if (!canCreate) return
    dispatch({
      type: 'CREATE_SYSTEM',
      name: trimmedName,
      description: description.trim() || undefined,
    })
    dismissOverlay()
  }

  return (
    <>
      <div className="kx-modal-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="kx-modal kx-create-modal"
      >
        <header className="kx-create-modal__head">
          <div className="kx-create-modal__head-copy">
            <h2 id={titleId} className="kx-create-modal__title">
              Create a new system
            </h2>
            <p className="kx-create-modal__subtitle">
              Name the system now — repositories can join it right after.
            </p>
          </div>
          <button
            type="button"
            className="kx-icon-btn kx-create-modal__close"
            aria-label="Close"
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        <form
          id={formId}
          className="kx-create-modal__form"
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          {/* The only scrolling region — helper + the two labeled fields. */}
          <div className="kx-create-modal__body">
            <p className="kx-create-modal__helper">
              Systems group repositories and components so sessions start with the right scope.
            </p>

            <div className="kx-create-modal__field">
              <label className="kx-create-modal__label" htmlFor={nameId}>
                Name{' '}
                <span className="kx-create-modal__req" aria-hidden="true">
                  (required)
                </span>
              </label>
              <input
                id={nameId}
                type="text"
                className="kx-input kx-create-modal__name"
                required
                placeholder="e.g. QA Platform"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="kx-create-modal__field">
              <label className="kx-create-modal__label" htmlFor={descriptionId}>
                Description{' '}
                <span className="kx-create-modal__opt" aria-hidden="true">
                  (optional)
                </span>
              </label>
              <textarea
                id={descriptionId}
                className="kx-input kx-create-modal__description"
                rows={3}
                placeholder="What this system covers"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          {/* Single-row footer — note left, Cancel/Create right (AC33). */}
          <footer className="kx-create-modal__footer">
            <p className="kx-create-modal__footer-note">
              The new system starts empty and becomes your active system.
            </p>
            <div className="kx-create-modal__actions">
              <button
                type="button"
                className="kx-btn kx-btn--ghost kx-create-modal__cancel"
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="kx-btn kx-btn--primary kx-create-modal__create"
                disabled={!canCreate}
              >
                Create
              </button>
            </div>
          </footer>
        </form>
      </div>
    </>
  )
}
