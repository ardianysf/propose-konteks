/*
 * TaskSessionBanner — full-width "Back to plan" context banner for the
 * task session page. Left: ticket icon + `TKT-3 · from Validate delivery
 * evidence` (the parent plan session). Right: help text explaining
 * what approving here reports back, plus the Back-to-plan link that
 * dispatches NAVIGATE to the regular 'session-detail' route.
 */
import { useMockup } from '../../state/MockupContext'
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import './TaskSessionBanner.css'

function TicketIcon() {
  return (
    <svg
      data-icon="ticket"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="12" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 4v8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 1.6" strokeLinecap="round" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      data-icon="arrow-left"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 3L5 8l5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TaskSessionBanner() {
  const { dispatch } = useMockup()
  const { code, parentSessionTitle, bannerText } = TASK_SESSION_DETAIL

  return (
    <div className="kx-task-banner" data-testid="task-session-banner">
      <div className="kx-task-banner__origin">
        <TicketIcon />
        <span className="kx-task-banner__context">
          {code} · from {parentSessionTitle}
        </span>
      </div>
      <div className="kx-task-banner__aside">
        <p className="kx-task-banner__help">{bannerText}</p>
        <button
          type="button"
          className="kx-task-banner__back"
          data-testid="task-back-to-plan"
          onClick={() => dispatch({ type: 'NAVIGATE', route: 'session-detail' })}
        >
          <ArrowLeftIcon />
          Back to plan
        </button>
      </div>
    </div>
  )
}
