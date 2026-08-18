/*
 * SessionDetailPage — session conversation/workflow detail.
 *
 * The sticky full-width header is intentionally outside the bounded reading
 * column. The content column groups the page into large discrete blocks
 * (quote, timeline, metadata) plus a final sticky region that pins the
 * tracker (current stage · cycle) directly above the continuation composer,
 * so each unit can later become a clickable component without restructuring
 * the page — clickability itself is intentionally not implemented yet.
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
        {/* Large discrete content blocks — kept as flat siblings inside a
            dedicated container so each block can later become a clickable
            component; no click behavior is attached yet. The tracker is no
            longer part of this container: it now sits inside the sticky
            composer region below. */}
        <div className="kx-session-detail__blocks" data-testid="session-detail-blocks">
          <SessionQuoteCard />
          <SessionTimeline />

          <footer className="kx-session-detail__meta">
            <span className="kx-chip">
              <RepoIcon />
              <span>{sessionDetail.repository}</span>
            </span>
            <span className="kx-chip">{sessionDetail.branch}</span>
            <span className="kx-chip">{sessionDetail.issueRef}</span>
            <span className="kx-chip">{sessionDetail.agent}</span>
          </footer>
        </div>

        {/* Final sticky session interaction — tracker (current stage · cycle
            + stage pill) pinned directly above the same inner input as the
            main page, so the stage context stays attached to the composer. */}
        <div className="kx-session-detail__composer-area" data-testid="session-composer-area">
          <SessionTracker />
          <SessionDetailComposer />
        </div>
      </div>
    </section>
  )
}
