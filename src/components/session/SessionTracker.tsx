/*
 * SessionTracker — compact workflow summary.
 *
 * Shows the current stage prominently. Completed stages are retained as
 * compact chips below it; future/locked stages stay out of the reading flow
 * until they become relevant.
 */
import { useMockup } from '../../state/MockupContext'
import type { StageStatus } from '../../data/mockData'

function getStageStatusLabel(
  stageStatus: StageStatus,
  sessionStatus: string,
): string {
  if (stageStatus === 'COMPLETED') return 'Completed'
  if (stageStatus === 'IN_PROGRESS') {
    return sessionStatus === 'WAITING_APPROVAL' ? 'Awaiting approval' : 'In Progress'
  }
  if (stageStatus === 'BLOCKED') return 'Blocked'
  if (stageStatus === 'FAILED') return 'Failed'
  if (stageStatus === 'SKIPPED') return 'Skipped'
  return 'Not started'
}

function CheckIcon() {
  return (
    <svg data-icon="check-circle-filled" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M5 8l2 2 4-4" fill="none" stroke="var(--kx-raised)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InProgressIcon() {
  return (
    <svg data-icon="spinner" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.3" />
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="14" />
      <circle cx="8" cy="3" r="1.5" fill="currentColor">
        <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg data-icon="warning-circle" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 5v3M8 9.5v1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === 'COMPLETED') return <CheckIcon />
  if (status === 'BLOCKED' || status === 'FAILED') return <WarningIcon />
  return <InProgressIcon />
}

export default function SessionTracker() {
  const { state } = useMockup()
  const { stages, status: sessionStatus, currentCycle, totalCycles } = state.sessionDetail
  const active = stages.find((stage) => stage.status === 'IN_PROGRESS') ?? stages.find((stage) => stage.status !== 'COMPLETED') ?? stages.at(-1)!
  const completed = stages.filter((stage) => stage.status === 'COMPLETED')
  const activeLabel = getStageStatusLabel(active.status, sessionStatus)

  return (
    <nav aria-label="Session progress" className="kx-session-detail__tracker" data-testid="session-tracker">
      <div className="kx-session-detail__tracker-current" aria-label={`Current stage: ${active.label} — ${activeLabel}`}>
        <span className="kx-session-detail__stage-icon kx-session-detail__stage-icon--active">
          <StageIcon status={active.status} />
        </span>
        <div>
          <span className="kx-session-detail__tracker-kicker">Current stage · Cycle {currentCycle} of {totalCycles}</span>
          <strong className="kx-session-detail__tracker-title">{active.label}</strong>
          <span className="kx-session-detail__stage-status">{activeLabel}</span>
        </div>
      </div>

      {completed.length > 0 && (
        <div className="kx-session-detail__completed" aria-label="Completed stages">
          {completed.map((stage) => (
            <span className="kx-session-detail__completed-chip" key={stage.id}>
              <CheckIcon />
              {stage.label}
            </span>
          ))}
        </div>
      )}
    </nav>
  )
}
