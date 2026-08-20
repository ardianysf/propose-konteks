/*
 * SessionTracker — minimal current-stage summary.
 *
 * Emphasizes only the cycle context line and the active stage pill.
 * Completed/future stages stay out of the reading flow to keep the
 * session detail surface quiet.
 */
import { useMockup } from '../../state/MockupContext'
import type { StageStatus } from '../../data/mockData'
import SessionStatusBadge from './SessionStatusBadge'
import './SessionTracker.css'

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

export default function SessionTracker() {
  const { state } = useMockup()
  const { stages, status: sessionStatus, currentCycle, totalCycles, quotes } = state.sessionDetail
  const active = stages.find((stage) => stage.status === 'IN_PROGRESS') ?? stages.find((stage) => stage.status !== 'COMPLETED') ?? stages.at(-1)!
  const activeLabel = getStageStatusLabel(active.status, sessionStatus)

  // Actionable-item count for the current stage, derived from existing
  // session detail state — no new data source. For the quote stage this is
  // the number of quotes still awaiting a decision (PENDING_APPROVAL).
  const pendingActionCount = active.id === 'quote'
    ? quotes.filter((quote) => quote.status === 'PENDING_APPROVAL').length
    : 0

  return (
    <nav aria-label="Session progress" className="kx-session-detail__tracker" data-testid="session-tracker">
      <div className="kx-session-detail__tracker-current" aria-label={`Current stage: ${active.label} — ${activeLabel}`}>
        <span className="kx-session-detail__tracker-kicker">Current stage · Cycle {currentCycle} of {totalCycles}</span>
        <span className="kx-session-detail__stage-pill" title={activeLabel}>
          {active.label}
          {pendingActionCount > 0 && (
            <span
              className="kx-session-detail__stage-pill-badge"
              aria-label={`${pendingActionCount} to action`}
            >
              {pendingActionCount}
            </span>
          )}
          <span className="kx-visually-hidden"> — {activeLabel}</span>
        </span>
      </div>
      {/* Session status badge — right-aligned with the composer box on the
          same row as the tracker (via margin-left: auto). Stays visible
          while scrolled because the tracker sits inside the sticky composer
          area. */}
      <SessionStatusBadge />
    </nav>
  )
}
