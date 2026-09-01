/*
 * V2CreateWorkspaceModal — the /v2 "Add new workspace" form.
 *
 * Opened by the workspace flyout's end-of-list Add row (V2Sidebar owns
 * the open state alongside the workspace list, so creation flows through
 * the same createWorkspace path the old inline draft used). A centered
 * .kx-modal over the shared backdrop primitive with three fields:
 * Workspace ID (mono, required, helper hint), Workspace Display
 * (required), and Description (optional). "Add workspace" stays visibly
 * disabled until ID + Display are non-empty after trim AND the ID does
 * not collide with an existing workspace (inline "This ID is already
 * used" error under the field).
 *
 * Stacking: the context popover's panel sits at z 60/61, above the base
 * .kx-modal layer (50/51), so this dialog carries v2-scoped z overrides
 * (backdrop 70 / dialog 71) — above the popover it suspends, below the
 * ⌘K search palette (80/81).
 *
 * Escape and focus follow the shared modal conventions: document-level
 * Escape closes the modal only (the popover behind stands down while the
 * modal is open), focus containment traps Tab inside the dialog, and the
 * opener (the flyout's Add row) is restored on close when still mounted.
 */
import { useEffect, useId, useRef, useState } from 'react'
import { useFocusContainment } from '../components/shell/useFocusContainment'
import type { V2Workspace } from './v2Workspaces'

export interface V2CreateWorkspaceFormValues {
  id: string
  displayName: string
  description: string
}

interface V2CreateWorkspaceModalProps {
  /** Live workspace list — the ID collision check runs against it. */
  workspaces: readonly V2Workspace[]
  /** Close without changes (Cancel button, Escape). */
  onCancel: () => void
  /** Commit the form values: append + activate + close (guarded). */
  onConfirm: (values: V2CreateWorkspaceFormValues) => void
}

export default function V2CreateWorkspaceModal({
  workspaces,
  onCancel,
  onConfirm,
}: V2CreateWorkspaceModalProps) {
  const titleId = useId()
  const idFieldId = useId()
  const idHintId = useId()
  const idErrorId = useId()
  const displayFieldId = useId()
  const descriptionFieldId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Focus origin captured at mount (before containment moves focus into
  // the dialog) — restored on unmount while still connected, so Cancel
  // lands back on the flyout's Add row.
  const openerRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  // Form state — all local: Add workspace is the only commit.
  const [id, setId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')

  useFocusContainment(dialogRef)

  // Escape cancels — document-level so it works wherever focus sits.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented || event.isComposing) return
      event.preventDefault()
      onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  // Focus return — after unmount, back to the opener if it still exists.
  useEffect(
    () => () => {
      const opener = openerRef.current
      if (opener && opener.isConnected) opener.focus()
    },
    [],
  )

  const trimmedId = id.trim()
  const trimmedDisplay = displayName.trim()
  const idTaken =
    trimmedId !== '' && workspaces.some((workspace) => workspace.id === trimmedId)
  const canConfirm = trimmedId !== '' && trimmedDisplay !== '' && !idTaken

  const confirm = () => {
    if (!canConfirm) return
    onConfirm({
      id: trimmedId,
      displayName: trimmedDisplay,
      description: description.trim(),
    })
  }

  return (
    <>
      <div aria-hidden="true" className="kx-modal-backdrop kx-v2-ws-modal-backdrop" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="kx-modal kx-v2-ws-modal"
        data-testid="v2-create-workspace-modal"
      >
        <header className="kx-v2-ws-modal__head">
          <div className="kx-v2-ws-modal__head-copy">
            <h2 id={titleId} className="kx-v2-ws-modal__title">
              Add new workspace
            </h2>
            <p className="kx-v2-ws-modal__subtitle">
              A fresh workspace starts empty and becomes your active one.
            </p>
          </div>
        </header>

        <form
          className="kx-v2-ws-modal__form"
          onSubmit={(event) => {
            event.preventDefault()
            confirm()
          }}
        >
          <div className="kx-v2-ws-modal__body">
            <div className="kx-v2-ws-modal__field">
              <label className="kx-v2-ws-modal__label" htmlFor={idFieldId}>
                Workspace ID{' '}
                <span className="kx-v2-ws-modal__req" aria-hidden="true">
                  (required)
                </span>
              </label>
              <input
                id={idFieldId}
                type="text"
                className="kx-input kx-v2-ws-modal__id"
                required
                placeholder="e.g. acme-crew"
                aria-describedby={idTaken ? idErrorId : idHintId}
                aria-invalid={idTaken || undefined}
                value={id}
                onChange={(event) => setId(event.target.value)}
              />
              {idTaken ? (
                <p id={idErrorId} className="kx-v2-ws-modal__error" role="alert">
                  This ID is already used
                </p>
              ) : (
                <p id={idHintId} className="kx-v2-ws-modal__hint">
                  Used as the workspace identifier
                </p>
              )}
            </div>

            <div className="kx-v2-ws-modal__field">
              <label className="kx-v2-ws-modal__label" htmlFor={displayFieldId}>
                Workspace Display{' '}
                <span className="kx-v2-ws-modal__req" aria-hidden="true">
                  (required)
                </span>
              </label>
              <input
                id={displayFieldId}
                type="text"
                className="kx-input kx-v2-ws-modal__display"
                required
                placeholder="e.g. Acme Crew"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>

            <div className="kx-v2-ws-modal__field">
              <label className="kx-v2-ws-modal__label" htmlFor={descriptionFieldId}>
                Description{' '}
                <span className="kx-v2-ws-modal__opt" aria-hidden="true">
                  (optional)
                </span>
              </label>
              <textarea
                id={descriptionFieldId}
                className="kx-input kx-v2-ws-modal__description"
                rows={3}
                placeholder="What this workspace is for"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <footer className="kx-v2-ws-modal__footer">
            <div className="kx-v2-ws-modal__actions">
              <button type="button" className="kx-btn kx-btn--ghost" onClick={onCancel}>
                Cancel
              </button>
              <button
                type="submit"
                className="kx-btn kx-btn--primary"
                disabled={!canConfirm}
                data-testid="v2-create-workspace-confirm"
              >
                Add workspace
              </button>
            </div>
          </footer>
        </form>
      </div>
    </>
  )
}
