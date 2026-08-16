/*
 * Composer — the prompt input region (Task 5, spec §7.2, AC18–AC21).
 *
 * Boundaries: input + toolbar + footer ONLY — the Component anchored
 * menu is a separate component arriving in Task 8; the Execution Profile
 * menu (Task 6) mounts from the profile control's anchor wrapper below.
 * The outer container is the soft
 * matcha wash wrapping the white input (AC18); toolbar icons are unboxed
 * with hover affordances (AC19); the send button is the soft-accent
 * element and stays disabled while the input is empty (AC19/AC43). The
 * footer keeps the disclaimer left and the clickable "Reviews waiting"
 * label with its round count badge right (AC20), opening Konteks Learned
 * on the pending tab. The Execution Profile control sits bottom-left of
 * the toolbar, immediately after the text/document control (AC21).
 */
import { useState } from 'react'
import { EXECUTION_PROFILES, PENDING_REVIEWS } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import ExecutionProfileMenu from './ExecutionProfileMenu'

const PLANNING_PLACEHOLDER = 'Describe the product outcome you want to plan…'
const ENGINEERING_PLACEHOLDER = 'Describe the engineering task…'
const DISCLAIMER =
  'Konteks can make mistakes. Review outputs before adopting them.'

/** Paperclip — the attachment trigger (AC19). */
function AttachmentIcon() {
  return (
    <svg data-icon="attachment" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Document with text lines — the text/document trigger (AC19/AC21). */
function TextDocumentIcon() {
  return (
    <svg data-icon="text-document" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Microphone — the voice-input trigger (AC19). */
function MicIcon() {
  return (
    <svg data-icon="mic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Paper plane — the send affordance (AC19). */
function SendIcon() {
  return (
    <svg data-icon="send" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M22 2 11 13 M22 2l-7 20-4-9-9-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Gauge — the Execution Profile glyph (AC21). */
function GaugeIcon() {
  return (
    <svg data-icon="gauge" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M4 14a8 8 0 1 1 16 0 M12 14l4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="1.6" fill="currentColor" />
    </svg>
  )
}

/** Chevron-down — the profile menu opens anchored below its control. */
function ChevronDown() {
  return (
    <svg
      className="kx-composer__profile-chevron"
      data-icon="chevron-down"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 6 8 10.5 12.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Composer() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain } = useOverlayLifecycle()
  const [value, setValue] = useState('')
  const planning = state.sessionMode === 'planning'
  const canSubmit = value.trim().length > 0
  const pendingCount = PENDING_REVIEWS.length
  const activeProfile =
    EXECUTION_PROFILES.find((profile) => profile.id === state.activeProfileId) ??
    EXECUTION_PROFILES[0]

  return (
    <div className="kx-composer" data-testid="composer">
      <label htmlFor="kx-composer-input" className="kx-visually-hidden">
        {planning ? 'Planning prompt' : 'Engineering prompt'}
      </label>
      <textarea
        id="kx-composer-input"
        className="kx-composer__input"
        data-testid="composer-input"
        placeholder={planning ? PLANNING_PLACEHOLDER : ENGINEERING_PLACEHOLDER}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <div className="kx-composer__toolbar">
        <button
          type="button"
          className="kx-icon-btn kx-composer__tool"
          aria-label="Attach file"
        >
          <AttachmentIcon />
        </button>
        <button
          type="button"
          className="kx-icon-btn kx-composer__tool"
          aria-label="Add text document"
        >
          <TextDocumentIcon />
        </button>

        {/* Execution Profile — bottom-left of the toolbar, immediately
            after the text/document control (AC21). The anchor wrapper
            hosts the anchored menu (Task 6) adjacent to the control. */}
        <div className="kx-composer__profile-anchor">
          <button
            type="button"
            className="kx-composer__profile"
            aria-haspopup="menu"
            aria-expanded={state.overlay.kind === 'execution-profile-menu'}
            data-testid="execution-profile-trigger"
            onClick={(event) => {
              beginOverlayChain(event.currentTarget)
              dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'execution-profile-menu' } })
            }}
          >
            <span className="kx-composer__profile-icon" aria-hidden="true">
              <GaugeIcon />
            </span>
            <span className="kx-composer__profile-copy">
              <span className="kx-composer__profile-caption">Execution Profile</span>
              <span className="kx-composer__profile-name">{activeProfile.name}</span>
            </span>
            <ChevronDown />
          </button>
          {state.overlay.kind === 'execution-profile-menu' && <ExecutionProfileMenu />}
        </div>

        <button
          type="button"
          className="kx-icon-btn kx-composer__tool"
          aria-label="Voice input"
        >
          <MicIcon />
        </button>

        {/* Soft-accent send — disabled while the input is empty (AC43).
            In Planning the same control is the "Start planning" CTA. */}
        <button
          type="button"
          className="kx-composer__send"
          aria-label={planning ? 'Start planning' : 'Send'}
          data-testid="composer-send"
          disabled={!canSubmit}
        >
          <SendIcon />
          {planning && <span>Start planning</span>}
        </button>
      </div>

      <div className="kx-composer__footer">
        <p className="kx-composer__disclaimer">{DISCLAIMER}</p>
        <button
          type="button"
          className="kx-composer__reviews"
          data-testid="reviews-waiting"
          onClick={(event) => {
            beginOverlayChain(event.currentTarget)
            dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'learned', tab: 'pending' } })
          }}
        >
          Reviews waiting
          <span className="kx-composer__badge">{pendingCount}</span>
        </button>
      </div>
    </div>
  )
}
