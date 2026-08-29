/*
 * SessionTimeline — chronological session conversation/workflow events.
 *
 * Messages intentionally have no sender identities or timestamps: user
 * content is distinguished by a right-aligned bubble, assistant content by
 * a left-aligned bubble, and workflow events by their own card/row forms.
 */
import { useEffect, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import type { DeliveryInfo, DetailTimelineItem, SessionQuote } from '../../data/mockData'
import DotMatrixLoader from '../ui/DotMatrixLoader'
import ResponseFooter from './ResponseFooter'
import { PENDING_PROCESS_PHASES, PENDING_PHASE_DURATION_MS } from './pendingPhases'
import './SessionTimeline.css'
// Renders quote/delivery status pills with the shared session badge
// primitive (.kx-badge + modifiers) — declared here because the rules live
// in sessionBadges.css, not in SessionTimeline.css.
import './sessionBadges.css'

function GearIcon() {
  return (
    <svg data-icon="gear" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M2.93 2.93l2.12 2.12M10.95 10.95l2.12 2.12M13.07 2.93l-2.12 2.12M5.05 10.95l-2.12 2.12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg data-icon="warning-filled" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M8 1.5l6.5 11h-13z" fill="var(--kx-accent-solid-aa)" />
      <path d="M8 5v4M8 10v1" stroke="var(--kx-raised)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg data-icon="file" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 2h6l4 4v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 2v4h4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg data-icon="check-filled" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="var(--kx-accent)" />
      <path d="M5 8l2 2 4-4" fill="none" stroke="var(--kx-raised)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg data-icon="x-filled" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="7" fill="var(--kx-muted-text-aa)" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" fill="none" stroke="var(--kx-raised)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UserMessage({ item }: { item: DetailTimelineItem }) {
  return (
    <li className="kx-session-timeline__item kx-session-timeline__item--user" data-testid="timeline-user-message">
      <div className="kx-session-timeline__bubble kx-session-timeline__bubble--user">{item.content}</div>
    </li>
  )
}

function AssistantMessage({ item, onRetry }: { item: DetailTimelineItem; onRetry?: () => void }) {
  return (
    <li className="kx-session-timeline__item kx-session-timeline__item--assistant">
      <div className="kx-session-timeline__bubble kx-session-timeline__bubble--assistant">{item.content}</div>
      <ResponseFooter item={item} onRetry={onRetry} />
    </li>
  )
}

function SystemEvent({ item }: { item: DetailTimelineItem }) {
  return (
    <li className="kx-session-timeline__item kx-session-timeline__item--system" data-testid="timeline-system-event">
      <GearIcon />
      <span className="kx-session-timeline__event-text">{item.content}</span>
    </li>
  )
}

function QuoteItem({ quote }: { quote?: SessionQuote }) {
  const statusLabel = quote?.status === 'APPROVED' ? 'Approved' : quote?.status === 'REJECTED' ? 'Rejected' : quote?.status === 'SUPERSEDED' ? 'Superseded' : 'Pending'
  return (
    <li className="kx-session-timeline__item">
      <div className="kx-session-timeline__card kx-session-timeline__card--quote" data-testid="timeline-quote-card">
        <div className="kx-session-timeline__card-head">
          <h3 className="kx-session-timeline__card-title">Quote prepared — {quote?.id || 'Unknown'} · v{quote?.version || 1}</h3>
          <span className={`kx-badge kx-badge--${quote?.status.toLowerCase() || 'pending'}`}>{statusLabel}</span>
        </div>
        <p className="kx-session-timeline__card-body">{quote?.estimatedStoryPoints || 0} story points (max {quote?.maxStoryPoints || 0})</p>
        <p className="kx-session-timeline__card-meta">Quote validity: 24 hours</p>
      </div>
    </li>
  )
}

function ApprovalItem({ item }: { item: DetailTimelineItem }) {
  const isApproved = item.content.toLowerCase().includes('approved')
  return (
    <li className="kx-session-timeline__item kx-session-timeline__item--approval">
      {isApproved ? <CheckIcon /> : <XIcon />}
      <span className="kx-session-timeline__approval-text">{item.content}</span>
    </li>
  )
}

function DeliveryItem({ delivery }: { delivery?: DeliveryInfo }) {
  return (
    <li className="kx-session-timeline__item">
      <div className="kx-session-timeline__card kx-session-timeline__card--delivery">
        <div className="kx-session-timeline__card-head">
          <h3 className="kx-session-timeline__card-title">Delivery — {delivery?.id || 'Unknown'}</h3>
          <span className={`kx-badge kx-badge--${delivery?.status.toLowerCase() || 'not_started'}`}>{delivery?.status?.replace('_', ' ') || 'Unknown'}</span>
        </div>
        <p className="kx-session-timeline__card-body">{delivery?.deliveredStoryPoints || 0} of {delivery?.deliveredStoryPoints || 0} story points delivered</p>
        {delivery?.artifacts?.length ? (
          <div className="kx-session-timeline__artifacts">
            {delivery.artifacts.map((artifact) => (
              <a key={artifact.type} href={artifact.url} className="kx-session-timeline__artifact-link" data-testid={`artifact-${artifact.type.toLowerCase()}`}>{artifact.label}</a>
            ))}
          </div>
        ) : null}
        {delivery?.summary ? <p className="kx-session-timeline__card-summary">{delivery.summary}</p> : null}
        {delivery?.knownLimitations ? <p className="kx-session-timeline__card-limitations"><strong>Known limitations:</strong> {delivery.knownLimitations}</p> : null}
      </div>
    </li>
  )
}

function ErrorItem({ item }: { item: DetailTimelineItem }) {
  return (
    <li className="kx-session-timeline__item">
      <div className="kx-session-timeline__card kx-session-timeline__card--error" data-testid="timeline-error-card">
        <div className="kx-session-timeline__error-header"><WarningIcon /><span className="kx-session-timeline__error-title">Warning</span></div>
        <p className="kx-session-timeline__card-body">{item.content}</p>
      </div>
    </li>
  )
}

function ArtifactItem({ item }: { item: DetailTimelineItem }) {
  return (
    <li className="kx-session-timeline__item kx-session-timeline__item--artifact">
      <FileIcon />
      <span className="kx-session-timeline__artifact-label">{item.content}</span>
      {item.artifact ? <a href={item.artifact.url} className="kx-session-timeline__artifact-link" data-testid={`artifact-${item.artifact.type.toLowerCase()}`}>{item.artifact.label}</a> : null}
    </li>
  )
}

function TimelineSkeleton() {
  return <div className="kx-session-timeline__skeleton" data-testid="timeline-skeleton">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="kx-session-timeline__skeleton-row" />)}</div>
}

/** Pending assistant reply — trailing assistant-aligned bubble with the
 * compact 12px dot-matrix loader and the running process label (with an
 * animated ellipsis) beside it. The phase list comes from the state's
 * pendingPhases slice (falling back to the first three canonical phases); a
 * local index advances through it every PENDING_PHASE_DURATION_MS (holding
 * the last phase until the reply lands). The current phase drives both the
 * visible label and its loader variant. */
function PendingAssistantItem({ phases }: { phases: readonly string[] }) {
  const labels =
    phases.length > 0 ? phases : PENDING_PROCESS_PHASES.slice(0, 3).map((phase) => phase.label)
  const [phaseIndex, setPhaseIndex] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPhaseIndex((index) => Math.min(index + 1, labels.length - 1))
    }, PENDING_PHASE_DURATION_MS)
    return () => window.clearInterval(id)
  }, [labels.length])
  const label = labels[Math.min(phaseIndex, labels.length - 1)]
  const variant =
    PENDING_PROCESS_PHASES.find((phase) => phase.label === label)?.variant ??
    PENDING_PROCESS_PHASES[0].variant
  return (
    <li
      className="kx-session-timeline__item kx-session-timeline__item--assistant"
      data-testid="timeline-pending-assistant"
    >
      <div className="kx-session-timeline__bubble kx-session-timeline__bubble--assistant kx-session-timeline__bubble--pending">
        <DotMatrixLoader
          variant={variant}
          size={12}
          label={`Menyusun jawaban — ${label}`}
        />
        <span className="kx-session-timeline__pending-phase">
          {label}
          <span className="kx-session-timeline__pending-dots" aria-hidden="true">
            <span className="kx-session-timeline__pending-dot" />
            <span className="kx-session-timeline__pending-dot" />
            <span className="kx-session-timeline__pending-dot" />
          </span>
        </span>
      </div>
    </li>
  )
}

export default function SessionTimeline() {
  const { state, dispatch } = useMockup()
  if (state.demoVariant === 'loading') return <TimelineSkeleton />

  const { timeline, quotes, delivery } = state.sessionDetail
  // Retry re-asks the nearest preceding user message: a fresh pending cycle
  // with newly drawn process phases and a new response.
  const retryFrom = (assistantId: string) => {
    if (state.sessionDetail.pendingAssistant) return
    const index = timeline.findIndex((entry) => entry.id === assistantId)
    for (let i = index - 1; i >= 0; i -= 1) {
      if (timeline[i].type === 'USER_MESSAGE') {
        dispatch({ type: 'SESSION_SEND_DETAIL_MESSAGE', content: timeline[i].content })
        return
      }
    }
  }
  return (
    <section aria-label="Session timeline" data-testid="session-timeline">
      <ol className="kx-session-detail__timeline">
        {timeline.map((item) => {
          switch (item.type) {
            case 'USER_MESSAGE': return <UserMessage key={item.id} item={item} />
            case 'ASSISTANT_MESSAGE': return <AssistantMessage key={item.id} item={item} onRetry={() => retryFrom(item.id)} />
            case 'SYSTEM_EVENT': return <SystemEvent key={item.id} item={item} />
            case 'QUOTE': return <QuoteItem key={item.id} quote={quotes.find((quote) => quote.id === item.quoteId)} />
            case 'APPROVAL': return <ApprovalItem key={item.id} item={item} />
            case 'DELIVERY': return <DeliveryItem key={item.id} delivery={delivery} />
            case 'ERROR': return <ErrorItem key={item.id} item={item} />
            case 'ARTIFACT': return <ArtifactItem key={item.id} item={item} />
          }
        })}
        {state.sessionDetail.pendingAssistant ? (
          <PendingAssistantItem phases={state.sessionDetail.pendingPhases} />
        ) : null}
      </ol>
    </section>
  )
}
