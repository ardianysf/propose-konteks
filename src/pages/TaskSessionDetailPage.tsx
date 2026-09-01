/*
 * TaskSessionDetailPage — the ticket (TKT-3) session detail page. Mirrors
 * SessionDetailPage's composition (sticky full-width header outside the
 * bounded reading column, discrete content blocks, sticky composer tail)
 * but with the task-session block order from the spec: context banner →
 * ticket request → assistant narrative/summary/retries → quote notice →
 * decision/estimate card → workflow stage chips → continuation composer.
 * The header reuses the SessionHeader band classes with task-specific
 * additions (code · title, system subtitle, In Progress status badge);
 * SessionTracker's regular-stage row is replaced by StageChips.
 */
import { TASK_SESSION_DETAIL } from '../data/mockData'
import TaskSessionBanner from '../components/taskSession/TaskSessionBanner'
import TicketRequestCard from '../components/taskSession/TicketRequestCard'
import TaskTimeline from '../components/taskSession/TaskTimeline'
import TaskQuoteCard from '../components/taskSession/TaskQuoteCard'
import DecisionEstimateCard from '../components/taskSession/DecisionEstimateCard'
import StageChips from '../components/taskSession/StageChips'
import SessionDetailComposer from '../components/session/SessionDetailComposer'
// Shared session-detail layout primitives (reading column, blocks, sticky
// composer area) and the badge primitive for the status pill — same
// explicit-dependency convention as SessionTimeline importing sessionBadges.
import './SessionDetailPage.css'
import '../components/session/sessionBadges.css'
import './TaskSessionDetailPage.css'

/** Same IN_PROGRESS glyph as SessionStatusBadge's default circle. */
function StatusCircleIcon() {
  return (
    <svg data-icon="circle" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function TaskSessionDetailPage() {
  const { code, title, systemName, status } = TASK_SESSION_DETAIL
  const statusLabel = status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'

  return (
    <section className="kx-session-detail" aria-label="Task session detail" data-testid="task-session-detail">
      {/* Sticky, full-width task header — same band chrome as the regular
          session detail, with the ticket code prefix, system subtitle, and
          the task's own status badge (SessionStatusBadge reads the regular
          sessionDetail state, so the pill is rendered with its shared
          kx-badge primitives here instead). */}
      <header className="kx-session-detail__head kx-task-session__head" data-testid="task-session-header">
        <div className="kx-session-detail__head-main">
          <h1 className="kx-session-detail__title kx-task-session__title kx-u-sr-only">
            <span className="kx-task-session__code">{code}</span>
            <span className="kx-task-session__sep" aria-hidden="true">·</span>
            <span className="kx-task-session__heading">{title}</span>
          </h1>
          <span
            className={`kx-badge kx-badge--${status.toLowerCase()} kx-task-session__status kx-u-sr-only`}
            data-testid="task-session-status"
          >
            <StatusCircleIcon />
            <span>{statusLabel}</span>
          </span>
        </div>
        <p
          className="kx-session-detail__context kx-task-session__subtitle kx-u-sr-only"
          data-testid="task-session-subtitle"
        >
          <span className="kx-session-detail__context-items">
            <span>{systemName}</span>
          </span>
        </p>
      </header>

      {/* Full-width "Back to plan" context strip directly under the band. */}
      <TaskSessionBanner />

      <div className="kx-session-detail__content">
        {/* Discrete content blocks in the spec's section order. */}
        <div className="kx-session-detail__blocks" data-testid="task-session-blocks">
          <TicketRequestCard />
          <TaskTimeline />
          <TaskQuoteCard />
          <DecisionEstimateCard />
          <StageChips />
        </div>

        {/* Sticky continuation composer — same pinned tail as the regular
            session page (StageChips above replaces the SessionTracker row,
            staying with the scrolled content per the reference layout). */}
        <div className="kx-session-detail__composer-area" data-testid="task-composer-area">
          <SessionDetailComposer />
        </div>
      </div>
    </section>
  )
}
