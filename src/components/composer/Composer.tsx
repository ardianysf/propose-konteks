/*
 * Composer — the unified session panel (Task 5, composer layout correction).
 *
 * One soft-matcha outer container holds the setup/mode top row and the
 * nested white text-input box. The top row keeps the mode-specific setup
 * pills left and the Session Mode radio group right; the input box keeps
 * the prompt textarea and, hugging its bottom, the input toolbar with the
 * left group (Attach file, Add text document, Execution Profile) and the
 * right group (Voice input, Send/Start planning). The Execution Profile
 * anchored menu still mounts from its control inside the left group.
 * The page-level disclaimer and Reviews-waiting pill live OUTSIDE this
 * component (NewSessionPage's external footer).
 */
import { useState } from 'react'
import { COMPONENTS, EXECUTION_PROFILES } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import ComponentMenu from './ComponentMenu'
import ExecutionProfileMenu from './ExecutionProfileMenu'
import SessionMode from './SessionMode'

const PLANNING_PLACEHOLDER = 'Describe the product outcome you want to plan…'
const ENGINEERING_PLACEHOLDER = 'Describe the engineering task…'
const QA_PLACEHOLDER = 'Describe the QA task…'

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

/** Chevron-right — marks setup pills whose surfaces open to the right. */
function ChevronRight() {
  return (
    <svg
      className="kx-panel__pill-chevron"
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

export default function Composer() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain, dismissOverlay } = useOverlayLifecycle()
  const [value, setValue] = useState('')
  const planning = state.sessionMode === 'planning'
  const qa = state.sessionMode === 'qa'
  const canSubmit = value.trim().length > 0

  const activeProfile =
    EXECUTION_PROFILES.find((profile) => profile.id === state.activeProfileId) ??
    EXECUTION_PROFILES[0]

  // The system pill shows the committed session system when one exists;
  // otherwise it shows the fresh-New-Session placeholder (never the
  // sidebar active-system context).
  const committedSystem = state.sessionContext
    ? state.systems.find((system) => system.id === state.sessionContext!.systemId) ?? null
    : null
  const systemLabel = committedSystem
    ? committedSystem.name
    : planning
      ? 'Choose system'
      : qa
        ? 'Choose system / repositories to test'
        : 'Choose system / repositories'

  const componentCount = state.selectedComponentIds.length
  const componentLabel =
    componentCount === 0
      ? qa
        ? 'Choose component under test'
        : 'Choose component'
      : componentCount === 1
        ? (COMPONENTS.find((component) => component.id === state.selectedComponentIds[0])?.name ??
          state.selectedComponentIds[0])
        : `${componentCount} components`

  return (
    <div className="kx-composer kx-panel" data-testid="composer">
      <div className="kx-panel__top-row">
        {/* Setup cluster — mode-specific setup pills, left-aligned. */}
        <div className="kx-panel__setup-cluster">
          <button
            type="button"
            className="kx-panel__pill"
            aria-haspopup="dialog"
            aria-expanded={state.overlay.kind === 'repository-modal'}
            data-testid="repository-trigger"
            onClick={(event) => {
              beginOverlayChain(event.currentTarget)
              dispatch({ type: 'BEGIN_SESSION_CONTEXT_DRAFT' })
              dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'repository-modal' } })
            }}
          >
            <span className="kx-panel__pill-icon" aria-hidden="true">
              <RepositoryIcon />
            </span>
            <span className="kx-panel__pill-label">{systemLabel}</span>
            <ChevronRight />
          </button>

          {!planning && (
            /* Anchor wrapper around the Component trigger — the menu floats
               from here, above the trigger and flush with its left edge (AC30). */
            <div className="kx-setup-row__component-anchor">
              <button
                type="button"
                className="kx-panel__pill"
                aria-haspopup="menu"
                aria-expanded={state.overlay.kind === 'component-menu'}
                data-testid="component-trigger"
                onClick={(event) => {
                  // Same-trigger toggle: a second click dismisses the menu
                  // (restoring focus here through the lifecycle); any other
                  // state opens or replaces the overlay.
                  if (state.overlay.kind === 'component-menu') {
                    dismissOverlay()
                    return
                  }
                  beginOverlayChain(event.currentTarget)
                  dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'component-menu' } })
                }}
              >
                <span className="kx-panel__pill-icon" aria-hidden="true">
                  <ComponentIcon />
                </span>
                <span className="kx-panel__pill-label">{componentLabel}</span>
                <ChevronRight />
              </button>
              {state.overlay.kind === 'component-menu' && <ComponentMenu />}
            </div>
          )}
        </div>

        {/* Mode cluster — Session Mode radio group, right-aligned. */}
        <div className="kx-panel__mode-cluster">
          <SessionMode />
        </div>
      </div>

      {/* Nested white text-input box — textarea + toolbar all inside. */}
      <div
        className="kx-composer__input-box kx-panel__input-box"
        data-testid="composer-input-box"
      >
        <label htmlFor="kx-composer-input" className="kx-visually-hidden">
          {planning ? 'Planning prompt' : qa ? 'QA prompt' : 'Engineering prompt'}
        </label>
        <textarea
          id="kx-composer-input"
          className="kx-composer__input"
          data-testid="composer-input"
          placeholder={planning ? PLANNING_PLACEHOLDER : qa ? QA_PLACEHOLDER : ENGINEERING_PLACEHOLDER}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <div
          className="kx-composer__toolbar kx-panel__toolbar"
          data-testid="composer-toolbar"
        >
          <div className="kx-panel__toolbar-left" data-testid="toolbar-left">
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

            {/* Execution Profile — inside the input box's left toolbar
                group, after Add text document. The visible content is the
                active profile name + chevron; the caption and gauge icon
                live only in the explicit accessible label. The anchor
                wrapper hosts the anchored menu (Task 6). */}
            <div className="kx-composer__profile-anchor">
              <button
                type="button"
                className="kx-composer__profile"
                aria-label={`Execution Profile · ${activeProfile.name}`}
                aria-haspopup="menu"
                aria-expanded={state.overlay.kind === 'execution-profile-menu'}
                data-testid="execution-profile-trigger"
                onClick={(event) => {
                  // Same-trigger toggle: a second click dismisses the menu
                  // (restoring focus here through the lifecycle); any other
                  // state opens or replaces the overlay.
                  if (state.overlay.kind === 'execution-profile-menu') {
                    dismissOverlay()
                    return
                  }
                  beginOverlayChain(event.currentTarget)
                  dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'execution-profile-menu' } })
                }}
              >
                <span className="kx-composer__profile-name">{activeProfile.name}</span>
                <ChevronDown />
              </button>
              {state.overlay.kind === 'execution-profile-menu' && <ExecutionProfileMenu />}
            </div>
          </div>

          <div className="kx-panel__toolbar-right" data-testid="toolbar-right">
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
        </div>
      </div>
    </div>
  )
}
