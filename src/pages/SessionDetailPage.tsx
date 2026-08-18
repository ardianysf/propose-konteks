/*
 * SessionDetailPage — session conversation/workflow detail.
 *
 * The sticky full-width header is intentionally outside the bounded reading
 * column. The content column contains the quote, timeline, compact workflow
 * summary, metadata, and the final sticky continuation composer.
 */
import { useMockup } from '../state/MockupContext'
import SessionHeader from '../components/session/SessionHeader'
import SessionQuoteCard from '../components/session/SessionQuoteCard'
import SessionTimeline from '../components/session/SessionTimeline'
import SessionTracker from '../components/session/SessionTracker'
import SessionDetailComposer from '../components/session/SessionDetailComposer'

function RepoIcon() {
  return (
    <svg
      data-icon="repository"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 4h12M2 8h12M2 12h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function SessionDetailPage() {
  const { state } = useMockup()
  const { sessionDetail } = state

  return (
    <section className="kx-session-detail" aria-label="Session detail" data-testid="session-detail">
      {/* Sticky, full-width session name/status/share header. */}
      <SessionHeader />

      <div className="kx-session-detail__content">
        <SessionQuoteCard />
        <SessionTimeline />
        <SessionTracker />

        <footer className="kx-session-detail__meta">
          <span className="kx-chip">
            <RepoIcon />
            <span>{sessionDetail.repository}</span>
          </span>
          <span className="kx-chip">{sessionDetail.branch}</span>
          <span className="kx-chip">{sessionDetail.issueRef}</span>
          <span className="kx-chip">{sessionDetail.agent}</span>
        </footer>

        {/* Final sticky session interaction — same inner input as main page. */}
        <SessionDetailComposer />
      </div>
    </section>
  )
}
