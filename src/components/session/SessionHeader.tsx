/*
 * SessionHeader — compact sticky header for the Session Detail timeline.
 * Shows the session title, share affordance, and the session context
 * metadata (mode · system · component) stored on `sessionDetail` itself.
 * All display values are overridable through optional props (fallback:
 * the fixture), so the stream-detail page can mount the same chrome for
 * its own session without touching the classic page's behavior.
 * Supporting metadata (repo/branch/issue/agent) belongs to the session
 * metadata section below the timeline. The session status badge no longer
 * lives here — it sits above the composer inside the sticky composer area
 * (see SessionTracker / SessionStatusBadge).
 */
import { useMockup } from '../../state/MockupContext'
import type { SessionMode } from '../../data/mockData'
import './SessionHeader.css'

/** Optional display overrides. Every prop falls back to the fixture
 * value on `state.sessionDetail`, so the classic SessionDetailPage
 * (which passes nothing) renders identically; the stream variant of the
 * page passes its own session's title and context line. */
export interface SessionHeaderProps {
  title?: string
  mode?: SessionMode
  systemName?: string
  componentName?: string
}

function getModeLabel(mode: SessionMode): string {
  switch (mode) {
    case 'engineering':
      return 'Engineering'
    case 'qa':
      return 'QA'
    case 'planning':
      return 'Planning'
  }
}

function ShareIcon() {
  return (
    <svg data-icon="share" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="12.5" cy="3.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="3.5" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="12.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.25 7l5.5-2.6M5.25 9l5.5 2.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export default function SessionHeader({
  title,
  mode,
  systemName,
  componentName,
}: SessionHeaderProps = {}) {
  const { state } = useMockup()
  const { sessionDetail } = state
  const headerTitle = title ?? sessionDetail.title

  return (
    <header className="kx-session-detail__head" data-testid="session-detail-header">
      {/* Left/right split (review): LEFT carries the title
          (head-main) and the sr-only context line; RIGHT carries the
          share icon — vertically centered against the whole left block. */}
      <div className="kx-session-detail__head-left">
        {/* ≤760px the title hides behind the shared sr-only utility
            (global.css scopes it to mobile); the Share button stays
            visible and the desktop header renders unchanged. */}
        <div className="kx-session-detail__head-main">
          <h1 className="kx-session-detail__title kx-u-sr-only">{headerTitle}</h1>
        </div>
      {/* Context row: session context metadata (mode · system · component,
          read-only, stored on sessionDetail — option B). The row wraps
          cleanly on narrow viewports. */}
      <p className="kx-session-detail__context kx-u-sr-only" data-testid="session-context">
        <span className="kx-session-detail__context-items">
          <span>{getModeLabel(mode ?? sessionDetail.mode)}</span>
          <span aria-hidden="true">·</span>
          <span>{systemName ?? sessionDetail.systemName}</span>
          <span aria-hidden="true">·</span>
          <span>{componentName ?? sessionDetail.componentName}</span>
        </span>
      </p>
      </div>

      <button
        type="button"
        className="kx-icon-btn kx-session-detail__share"
        aria-label="Share session"
        data-testid="share-session"
        onClick={() => {
          // Mock-only affordance: no browser/network share side effect.
        }}
      >
        <ShareIcon />
      </button>
    </header>
  )
}
