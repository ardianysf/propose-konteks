/*
 * SessionHeader — compact sticky header for the Session Detail timeline.
 * Shows the session title, status, share affordance, and the session context
 * metadata (mode · system · component) stored on `sessionDetail` itself.
 * Supporting metadata (repo/branch/issue/agent) belongs to the session
 * metadata section below the timeline.
 */
import { useMockup } from '../../state/MockupContext'
import type { SessionDetailStatus, SessionMode } from '../../data/mockData'

function getStatusLabel(status: SessionDetailStatus): string {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress'
    case 'WAITING_APPROVAL':
      return 'Waiting Approval'
    case 'APPROVED':
      return 'Approved'
    case 'DELIVERING':
      return 'Delivering'
    case 'PARTIALLY_COMPLETED':
      return 'Partially Completed'
    case 'COMPLETED':
      return 'Completed'
    case 'BLOCKED':
      return 'Blocked'
    case 'CANCELLED':
      return 'Cancelled'
  }
}

function StatusIcon({ status }: { status: SessionDetailStatus }) {
  if (status === 'COMPLETED' || status === 'APPROVED') {
    return (
      <svg data-icon="check-circle" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5 8l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (status === 'BLOCKED') {
    return (
      <svg data-icon="warning" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <path d="M8 1v6M8 11v2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    )
  }

  return (
    <svg data-icon="circle" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
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

export default function SessionHeader() {
  const { state } = useMockup()
  const { sessionDetail } = state

  return (
    <header className="kx-session-detail__head" data-testid="session-detail-header">
      {/* Header stack order: title row (title + share) → context line
          (mode · system · component) → status badge at the bottom. */}
      <div className="kx-session-detail__head-main">
        <h1 className="kx-session-detail__title">{sessionDetail.title}</h1>
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
      </div>
      {/* Session context metadata — stored on sessionDetail (option B):
          mode · system · component, read-only for now. */}
      <p className="kx-session-detail__context" data-testid="session-context">
        <span>{getModeLabel(sessionDetail.mode)}</span>
        <span aria-hidden="true">·</span>
        <span>{sessionDetail.systemName}</span>
        <span aria-hidden="true">·</span>
        <span>{sessionDetail.componentName}</span>
      </p>
      {/* Status badge sits at the bottom of the header stack — no longer
          inline with the title row. */}
      <span
        className={`kx-badge kx-badge--${sessionDetail.status.toLowerCase()}`}
        data-testid="session-status"
      >
        <StatusIcon status={sessionDetail.status} />
        <span>{getStatusLabel(sessionDetail.status)}</span>
      </span>
    </header>
  )
}
