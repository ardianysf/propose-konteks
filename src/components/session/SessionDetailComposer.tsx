/*
 * SessionDetailComposer — sticky session continuation input.
 *
 * Reuses the exact main-page input-box and toolbar primitives without the
 * main page's outer setup/mode composer panel. Enter sends; Shift+Enter
 * retains a newline. Terminal sessions render a compact locked notice.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { EXECUTION_PROFILES } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import ExecutionProfileMenu from '../composer/ExecutionProfileMenu'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import './SessionDetailComposer.css'

function AttachmentIcon() {
  return (
    <svg data-icon="attachment" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TextDocumentIcon() {
  return (
    <svg data-icon="text-document" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg data-icon="mic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg data-icon="send" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M22 2 11 13 M22 2l-7 20-4-9-9-4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg data-icon="chevron-down" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 6l4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SessionDetailComposer() {
  const { state, dispatch } = useMockup()
  const { beginOverlayChain, dismissOverlay } = useOverlayLifecycle()
  const { sessionDetail } = state
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow: collapse to one line, then expand to fit content (capped by CSS max-height).
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [message])
  const activeProfile = EXECUTION_PROFILES.find((profile) => profile.id === state.activeProfileId) ?? EXECUTION_PROFILES[0]
  const isTerminal = sessionDetail.status === 'CANCELLED' || sessionDetail.status === 'COMPLETED'
  const trimmedMessage = message.trim()

  const send = () => {
    if (!trimmedMessage) return
    dispatch({ type: 'SESSION_SEND_DETAIL_MESSAGE', content: trimmedMessage })
    setMessage('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  if (isTerminal) {
    return (
      <div className="kx-session-composer kx-session-composer--locked" data-testid="session-composer">
        <div className="kx-session-composer__locked-notice">
          This session is completed. Start a follow-up cycle to continue.
        </div>
      </div>
    )
  }

  return (
    <div className="kx-session-composer" data-testid="session-composer">
      <div className="kx-composer__input-box kx-panel__input-box" data-testid="session-composer-input-box">
        <label htmlFor="kx-session-detail-input" className="kx-visually-hidden">Message input</label>
        <textarea
          id="kx-session-detail-input"
          className="kx-composer__input kx-session-composer__input"
          data-testid="session-composer-input"
          rows={1}
          ref={inputRef}
          placeholder="Describe the outcome you need…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message input"
        />
        <div className="kx-composer__toolbar kx-panel__toolbar" data-testid="session-composer-toolbar">
          <div className="kx-panel__toolbar-left" data-testid="toolbar-left">
            <button className="kx-icon-btn kx-composer__tool" type="button" aria-label="Attach file">
              <AttachmentIcon />
            </button>
            <button className="kx-icon-btn kx-composer__tool" type="button" aria-label="Add text document">
              <TextDocumentIcon />
            </button>
            {/* Execution Profile — after Add text document, exactly matching
                the main-page composer toolbar order. */}
            <div className="kx-composer__profile-anchor">
              <button
                type="button"
                className="kx-composer__profile"
                aria-label={`Execution Profile · ${activeProfile.name}`}
                aria-haspopup="menu"
                aria-expanded={state.overlay.kind === 'execution-profile-menu'}
                data-testid="execution-profile-trigger"
                onClick={(event) => {
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
            <button className="kx-icon-btn kx-composer__tool" type="button" aria-label="Voice input">
              <MicIcon />
            </button>
            <button
              className="kx-composer__send"
              type="button"
              onClick={send}
              disabled={!trimmedMessage}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
