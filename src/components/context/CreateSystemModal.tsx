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
 *
 * Nested source: when the repository selector's "Add new system"
 * affordance opened this modal, AppShell keeps the selector mounted and
 * suspended behind it. This dialog then renders on dedicated nested
 * stacking classes (backdrop 60 / dialog 61 above the repository's
 * 50/51), Close/Cancel/Escape return directly to the repository modal
 * instead of dismissing the whole chain, Escape is intercepted so the
 * OverlayLifecycle provider never fires its full dismissal, and a
 * successful Create dispatches CREATE_SYSTEM then
 * SET_SESSION_DRAFT_SYSTEM(new id) and reopens the repository modal —
 * the session context is committed only when the user presses Done
 * there. The SystemMenu source keeps the single-modal Create → dismiss
 * behavior and never touches the session draft/context.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import { nextSystemId } from '../../state/mockupReducer'
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
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const nameId = useId()
  const descriptionId = useId()
  const formId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Which affordance opened this modal — global (SystemMenu) or the
  // repository selector's session-context flow.
  const source =
    state.overlay.kind === 'create-system-modal' ? state.overlay.source : 'system-menu'
  const nested = source === 'repository-modal'

  // Form state — name + optional description, all local: Create is the
  // only commit, and it goes through the pure reducer, never the network.
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Shared focus containment owns initial focus, Tab trapping, and the
  // focusin safety net (Task 13); Escape is owned by OverlayLifecycle —
  // except in the nested flow, which intercepts it below.
  useFocusContainment(dialogRef)

  // Nested Escape interception: the bubbling document-level Escape
  // listener in OverlayLifecycle would CLOSE_OVERLAY the entire chain;
  // the nested modal instead returns to the repository modal. The
  // listener sits on the dialog root, so any Escape originating inside
  // this dialog (the realistic path — focus is contained here) is
  // stopped before it can bubble to the provider's document listener.
  const returnToRepository = () => {
    dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'repository-modal' } })
  }

  useLayoutEffect(() => {
    if (!nested) return
    const root = dialogRef.current
    if (!root) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented || event.isComposing) return
      event.preventDefault()
      event.stopPropagation()
      returnToRepository()
    }
    root.addEventListener('keydown', onKeyDown)
    return () => root.removeEventListener('keydown', onKeyDown)
    // dispatch is stable across renders (useReducer); `nested` is the
    // only meaningful dependency.
  }, [nested, dispatch])

  // Cancel/Close: the nested flow returns to the repository modal —
  // never a full-chain dismissal, never a commit. The SystemMenu flow
  // dismisses through the shared lifecycle.
  const close = () => {
    if (nested) returnToRepository()
    else dismissOverlay()
  }

  const trimmedName = name.trim()
  const canCreate = trimmedName !== ''

  // CREATE_SYSTEM appends the system, makes it the active one, and
  // clears the previous repository selection (reducer-proven, AC33).
  // The repository-sourced flow then selects the new system in the
  // session-context draft (empty repositories) and reopens the
  // repository modal — the user commits by pressing Done there, so the
  // session pill changes only after Done. The SystemMenu flow simply
  // dismisses and never touches sessionContext.
  const create = () => {
    if (!canCreate) return
    const newSystemId = nextSystemId(state.systems, trimmedName)
    dispatch({
      type: 'CREATE_SYSTEM',
      name: trimmedName,
      description: description.trim() || undefined,
    })
    if (nested) {
      dispatch({ type: 'SET_SESSION_DRAFT_SYSTEM', systemId: newSystemId })
      dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'repository-modal' } })
    } else {
      dismissOverlay()
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        className={
          nested ? 'kx-modal-backdrop kx-modal-backdrop--nested' : 'kx-modal-backdrop'
        }
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={
          nested
            ? 'kx-modal kx-create-modal kx-create-modal--nested'
            : 'kx-modal kx-create-modal'
        }
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
