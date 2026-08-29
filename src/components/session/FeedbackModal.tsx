/*
 * FeedbackModal — the "Share feedback" dialog opened when a response gets
 * a thumbs reaction. Good and bad reactions offer different preset options
 * that autofill the feedback textarea (single click replaces the text);
 * free-form typing stays available. Callback-driven and standalone: no
 * context reads, so it works in the catalog and in any host. The shared
 * modal shell (.kx-modal-backdrop + .kx-modal) and buttons (.kx-btn) come
 * from the global stylesheet; `embedded` renders the dialog card inline
 * (no backdrop, static position) for catalog specimens.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useFocusContainment } from '../shell/useFocusContainment'
import './FeedbackModal.css'

export type FeedbackKind = 'good' | 'bad'

/** Preset feedback options per reaction kind — good and bad differ. */
export const FEEDBACK_OPTIONS: Record<FeedbackKind, readonly string[]> = {
  good: [
    'Accurate and well-structured',
    'Saved me time',
    'Clear, easy-to-follow explanation',
    'Followed my instructions precisely',
    'Good code suggestions',
  ],
  bad: [
    'Missed the point of my request',
    'Inaccurate or outdated information',
    'Too verbose',
    'Suggested risky or unsafe changes',
    'Missed important edge cases',
  ],
}

export interface FeedbackModalProps {
  /** Which reaction opened the dialog — drives the preset options. */
  kind: FeedbackKind
  /** Invoked with the submitted feedback text (trimmed). */
  onSubmit?: (feedback: string) => void
  /** Closes the dialog (cancel, backdrop, Escape, or after submit). */
  onClose: () => void
  /** Render inline without overlay chrome (catalog specimens). */
  embedded?: boolean
  /** Extra content rendered under the textarea (host customisation). */
  children?: ReactNode
}

const SUBTITLES: Record<FeedbackKind, string> = {
  good: 'What made this response helpful?',
  bad: 'What went wrong with this response?',
}

function CloseIcon() {
  return (
    <svg data-icon="close" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function FeedbackModal({ kind, onSubmit, onClose, embedded = false, children }: FeedbackModalProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  // Per-instance ids — embedded catalog specimens render side by side, so
  // hardcoded ids would collide and break label/name resolution.
  const titleId = useId()
  const inputId = useId()
  // Shared modal focus containment: Tab/Shift+Tab stay inside the dialog
  // while it is a real modal (embedded cards and catalog previews never
  // trap focus — the hook itself also stands down in catalog previews).
  useFocusContainment(dialogRef, { active: !embedded })

  // Autofocus the textarea on open; Escape closes from anywhere. Embedded
  // cards are inline content — no focus stealing, no global keys.
  useEffect(() => {
    if (!embedded) textareaRef.current?.focus()
  }, [embedded])
  useEffect(() => {
    if (embedded) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [embedded, onClose])

  const submit = () => {
    const feedback = text.trim()
    if (!feedback) return
    onSubmit?.(feedback)
    onClose()
  }

  const dialog = (
    <div
      ref={dialogRef}
      tabIndex={embedded ? undefined : -1}
      className={`kx-modal kx-feedback-modal${embedded ? ' kx-feedback-modal--embedded' : ''}`}
      role="dialog"
      aria-modal={embedded ? undefined : true}
      aria-labelledby={titleId}
      data-testid="feedback-modal"
    >
      <button
        type="button"
        className="kx-feedback-modal__close"
        aria-label="Close feedback dialog"
        data-testid="feedback-close"
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      <h2 id={titleId} className="kx-feedback-modal__title">
        Share feedback
      </h2>
      <p className="kx-feedback-modal__subtitle" data-testid="feedback-subtitle">
        {SUBTITLES[kind]}
      </p>

      <div className="kx-feedback-modal__options" role="group" aria-label="Quick feedback options">
        {FEEDBACK_OPTIONS[kind].map((option) => (
          <button
            key={option}
            type="button"
            className="kx-feedback-modal__option"
            data-testid="feedback-option"
            onClick={() => setText(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <label htmlFor={inputId} className="kx-feedback-modal__label">
        Your feedback
      </label>
      <textarea
        id={inputId}
        ref={textareaRef}
        className="kx-feedback-modal__input"
        data-testid="feedback-input"
        rows={3}
        placeholder="Write your feedback…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {children}
      <div className="kx-feedback-modal__actions">
        <button type="button" className="kx-btn kx-btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="kx-btn kx-btn--primary"
          data-testid="feedback-submit"
          disabled={!text.trim()}
          onClick={submit}
        >
          Submit feedback
        </button>
      </div>
    </div>
  )

  if (embedded) return dialog
  return (
    <div className="kx-modal-backdrop" data-testid="feedback-backdrop" onMouseDown={onClose}>
      {/* Stop backdrop-close from clicks inside the dialog card itself. */}
      <div onMouseDown={(event) => event.stopPropagation()}>{dialog}</div>
    </div>
  )
}
