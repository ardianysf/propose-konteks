/*
 * SessionQuoteCard — quote approval decision card (Task 13 Part 2).
 *
 * Renders above timeline when active quote is PENDING_APPROVAL and session
 * status is WAITING_APPROVAL. Shows Approve, Reject, Request revision CTAs.
 */
import { useMockup } from '../../state/MockupContext'
import { formatTime } from './formatTime'

/** Check icon for approve button */
function ApproveIcon() {
  return (
    <svg
      data-icon="check"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 8l3 3 7-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** X icon for reject button */
function RejectIcon() {
  return (
    <svg
      data-icon="x"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Refresh icon for revision button */
function RevisionIcon() {
  return (
    <svg
      data-icon="refresh"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2.5 8a5.5 5.5 0 0110.7-1.5M13.5 8a5.5 5.5 0 01-10.7 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M13.2 6.5V2.5h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SessionQuoteCard() {
  const { state, dispatch } = useMockup()
  const { sessionDetail } = state

  // Find the active pending approval quote
  const activeQuote = sessionDetail.quotes.find(
    (q) => q.status === 'PENDING_APPROVAL'
  )

  // Only show when we have a pending quote AND session is waiting approval
  const shouldShow = activeQuote && sessionDetail.status === 'WAITING_APPROVAL'

  if (!shouldShow) {
    return null
  }

  // Find superseded quotes for revision history
  const supersededQuote = sessionDetail.quotes.find(
    (q) => q.status === 'APPROVED' && q.version < activeQuote.version
  )

  const handleApprove = () => {
    dispatch({ type: 'SESSION_APPROVE_QUOTE', quoteId: activeQuote.id })
  }

  const handleReject = () => {
    dispatch({
      type: 'SESSION_REJECT_QUOTE',
      quoteId: activeQuote.id,
      reason: 'Scope needs rework — rejected from mock UI',
    })
  }

  const handleRequestRevision = () => {
    dispatch({ type: 'SESSION_REQUEST_QUOTE_REVISION', quoteId: activeQuote.id })
  }

  return (
    <div
      className="kx-quote-approval-card"
      data-testid="quote-approval-card"
    >
      <div className="kx-quote-approval-card__head">
        <h2 className="kx-quote-approval-card__title">
          Quote awaiting your approval
        </h2>
      </div>

      <div className="kx-quote-approval-card__body">
        <div className="kx-quote-approval-card__quote-info">
          <div className="kx-quote-approval-card__quote-id">
            {activeQuote.id} · v{activeQuote.version}
          </div>
          <p className="kx-quote-approval-card__scope">
            {sessionDetail.title}
          </p>
        </div>

        <div className="kx-quote-approval-card__estimates">
          <p className="kx-quote-approval-card__points">
            Estimated {activeQuote.estimatedStoryPoints} story points · Max {activeQuote.maxStoryPoints}
          </p>
          <p className="kx-quote-approval-card__expiry">
            Valid until {activeQuote.expiresAt ? formatTime(activeQuote.expiresAt) : 'Not set'}
          </p>
        </div>

        {supersededQuote && (
          <p className="kx-quote-approval-card__history">
            Supersedes {supersededQuote.id} (approved, fulfilled in cycle {supersededQuote.version})
          </p>
        )}

        <div className="kx-quote-approval-card__actions">
          <button
            className="kx-btn kx-btn--primary"
            type="button"
            onClick={handleApprove}
            aria-label={`Approve quote ${activeQuote.id}`}
          >
            <ApproveIcon />
            Approve quote
          </button>

          <button
            className="kx-btn kx-btn--ghost"
            type="button"
            onClick={handleReject}
            aria-label={`Reject quote ${activeQuote.id}`}
          >
            <RejectIcon />
            Reject quote
          </button>

          <button
            className="kx-btn kx-btn--ghost"
            type="button"
            onClick={handleRequestRevision}
            aria-label={`Request revision for quote ${activeQuote.id}`}
          >
            <RevisionIcon />
            Request revision
          </button>
        </div>

        <p className="kx-quote-approval-card__note">
          Delivery starts only after approval.
        </p>
      </div>
    </div>
  )
}