/*
 * SessionStatusBadge — the session status pill (icon + label).
 *
 * Lives above the composer, right-aligned with the composer box inside the
 * sticky composer area (see SessionTracker), so the status stays visible
 * while the page is scrolled. Rendered by the tracker row; the header is
 * intentionally free of it.
 */
import { useMockup } from '../../state/MockupContext'
import type { SessionDetailStatus } from '../../data/mockData'

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

export default function SessionStatusBadge() {
  const { state } = useMockup()
  const { sessionDetail } = state

  return (
    <span
      className={`kx-badge kx-badge--${sessionDetail.status.toLowerCase()}`}
      data-testid="session-status"
    >
      <StatusIcon status={sessionDetail.status} />
      <span>{getStatusLabel(sessionDetail.status)}</span>
    </span>
  )
}
