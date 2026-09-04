/*
 * SessionDetailPage — the classic session conversation, now rendered
 * through the CATALOGUED stream components (review migration): the
 * fixture timeline maps onto the chat-style stream — user runs merge
 * into request bubbles (attachments ride outside), assistant/system
 * prose flows as flat AnswerBlock turns, errors quote the ErrorBlock
 * disclosure, QUOTE events render the Estimate card, approvals settle
 * the gate, and the delivery lists its artifacts as EntityTokens.
 *
 * The group-final agent turn carries the hover footer with execution
 * stats (duration · tokens in · out) derived from the item's meta —
 * superseding the retired ResponseFooter. SessionHeader (left/right
 * split) and the sticky composer area (tracker + composer) are kept.
 */
import { useMockup } from '../state/MockupContext'
import type { DetailTimelineItem, SessionDetailData, SessionQuote } from '../data/mockData'
import SessionHeader from '../components/session/SessionHeader'
import SessionTracker from '../components/session/SessionTracker'
import SessionDetailComposer from '../components/session/SessionDetailComposer'
import EntityToken from '../components/technical/EntityToken'
import AnswerBlock from '../components/session/stream/blocks/AnswerBlock'
import UserRequestBlock from '../components/session/stream/blocks/UserRequestBlock'
import ErrorBlock from '../components/session/stream/blocks/ErrorBlock'
import ApprovalGateBlock from '../components/session/stream/blocks/ApprovalGateBlock'
import EstimateBlock from '../components/session/stream/blocks/EstimateBlock'
import { isLastAgentTurnOfResponse } from '../components/session/stream/responseGroup'
import type { GateDecision, StreamStoryEntry } from '../components/session/stream/sessionStreamTypes'
import './SessionDetailPage.css'

/** HH:MM from an ISO timestamp (fixture times render locally). */
function clockOf(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Execution stats from a timeline item's meta (durationMs/tokens). */
function statsOf(meta?: { durationMs?: number; tokensIn?: number; tokensOut?: number }) {
  if (meta === undefined || meta.durationMs === undefined) return undefined
  return {
    duration: `${(meta.durationMs / 1000).toFixed(1)}s`,
    tokensIn: `${Math.round((meta.tokensIn ?? 0) / 1000)}k`,
    tokensOut: `${(((meta.tokensOut ?? 0) / 1000)).toFixed(1)}k`,
  }
}

type StreamTurnStats = NonNullable<ReturnType<typeof statsOf>>

export interface SessionDetailStreamEntry {
  entry: StreamStoryEntry
  time: string
  stats?: StreamTurnStats
  decision?: GateDecision
  showDeliveryArtifacts?: boolean
}

function approvalDecisionOf(item: DetailTimelineItem, quote?: SessionQuote): GateDecision {
  if (quote?.status === 'REJECTED') return 'deny'
  if (quote?.status === 'APPROVED') return 'allow-once'

  const text = item.content.toLowerCase()
  if (text.includes('reject') || text.includes('deny')) return 'deny'
  return 'allow-once'
}

function approvalDataOf(item: DetailTimelineItem, quote: SessionQuote | undefined, decision: GateDecision) {
  const rows = [{ label: 'Decision', value: decision === 'deny' ? 'Denied' : 'Approved' }]
  const consequence =
    decision === 'deny'
      ? 'Execution remains blocked until a revised quote is requested.'
      : 'Execution proceeds under the approved quote.'

  if (decision === 'deny' && quote?.rejectionReason !== undefined) {
    rows.push({ label: 'Reason', value: quote.rejectionReason })
  }

  return {
    action: item.content,
    rows,
    consequence,
  }
}

export function buildSessionDetailStreamEntries(sessionDetail: SessionDetailData): SessionDetailStreamEntry[] {
  const entries: SessionDetailStreamEntry[] = []

  // Consecutive USER items merge (message + artifact attachments); each
  // other event maps to its stream component kind. The mapped wrapper
  // carries the source time so merged/omitted timeline items do not skew
  // later blocks.
  sessionDetail.timeline.forEach((item) => {
    const time = clockOf(item.createdAt)
    switch (item.type) {
      case 'USER_MESSAGE': {
        entries.push({
          time,
          entry: {
            kind: 'request',
            data: { intent: item.content, message: item.content, chips: [] },
          },
        })
        break
      }
      case 'ARTIFACT': {
        const previous = entries[entries.length - 1]
        if (item.actorType === 'USER' && previous?.entry.kind === 'request') {
          previous.entry.data.attachments = [
            ...(previous.entry.data.attachments ?? []),
            { name: item.artifact?.label ?? item.content, meta: 'attachment' },
          ]
        }
        break
      }
      case 'ASSISTANT_MESSAGE':
      case 'SYSTEM_EVENT': {
        entries.push({
          time,
          stats: statsOf(item.meta),
          entry: { kind: 'answer', data: { paragraphs: [item.content] } },
        })
        break
      }
      case 'ERROR': {
        entries.push({
          time,
          entry: {
            kind: 'error',
            data: { title: item.content, impact: 'Automatically retried by the runner.' },
          },
        })
        break
      }
      case 'QUOTE': {
        const quote = sessionDetail.quotes.find((candidate) => candidate.id === item.quoteId)
        entries.push({
          time,
          entry: {
            kind: 'estimate',
            data: {
              label: 'QUOTE',
              heading:
                quote !== undefined
                  ? `Quote ${quote.id} · v${quote.version}`
                  : 'Quote',
              rows: [
                {
                  label: 'Story points',
                  value:
                    quote !== undefined
                      ? `${quote.estimatedStoryPoints} (max ${quote.maxStoryPoints})`
                      : '—',
                },
                {
                  label: 'Status',
                  value:
                    quote?.status === 'APPROVED'
                      ? 'Approved'
                      : quote?.status === 'PENDING_APPROVAL'
                        ? 'Waiting approval'
                        : '—',
                },
              ],
              validUntil:
                quote?.expiresAt !== undefined
                  ? `Valid until ${clockOf(quote.expiresAt)}`
                  : quote?.approvedAt !== undefined
                    ? `Approved ${clockOf(quote.approvedAt)}`
                    : '',
              note: item.content,
            },
          },
        })
        break
      }
      case 'APPROVAL': {
        const quote = sessionDetail.quotes.find((candidate) => candidate.id === item.quoteId)
        const decision = approvalDecisionOf(item, quote)
        entries.push({
          time,
          decision,
          entry: {
            kind: 'approval-gate',
            data: approvalDataOf(item, quote, decision),
          },
        })
        break
      }
      case 'DELIVERY': {
        entries.push({
          time,
          showDeliveryArtifacts: true,
          entry: { kind: 'answer', data: { paragraphs: [item.content] } },
        })
        break
      }
      default:
        break
    }
  })

  return entries
}

export default function SessionDetailPage() {
  const { state } = useMockup()
  const { sessionDetail } = state
  const entries = buildSessionDetailStreamEntries(sessionDetail)
  const kinds = entries.map(({ entry }) => entry.kind)
  const isGroupFinal = (index: number) => isLastAgentTurnOfResponse(kinds, index)

  const renderEntry = ({ entry, time, stats, decision }: SessionDetailStreamEntry, index: number) => {
    const final = isGroupFinal(index)
    const footerStats = final ? stats : undefined
    const turnTime = time || '—'

    switch (entry.kind) {
      case 'request':
        return <UserRequestBlock data={entry.data} time={turnTime} />
      case 'error':
        return <ErrorBlock data={entry.data} time={turnTime} showFooter={final} stats={footerStats} />
      case 'estimate':
        return <EstimateBlock data={entry.data} time={turnTime} showFooter={final} stats={footerStats} />
      case 'approval-gate':
        return (
          <ApprovalGateBlock
            data={entry.data}
            decision={decision}
            onDecision={() => undefined}
            time={turnTime}
            showFooter={final}
            stats={footerStats}
          />
        )
      case 'answer':
        return <AnswerBlock data={entry.data} time={turnTime} showFooter={final} stats={footerStats} />
    }
  }

  return (
    <section className="kx-session-detail" aria-label="Session detail" data-testid="session-detail">
      <SessionHeader />

      <div className="kx-session-detail__content">
        <div className="kx-session-detail__blocks" data-testid="session-detail-blocks">
          <div className="kx-stream" data-testid="session-stream" role="log" aria-label="Session conversation">
            {entries.map((entry, index) => (
              <div
                key={`${entry.entry.kind}-${index}`}
                className="kx-stream-slot"
                data-testid={`session-turn-${index + 1}`}
              >
                {renderEntry(entry, index)}
                {/* The delivery turn lists its artifacts as openable
                    EntityTokens (catalogued technical primitive). */}
                {entry.entry.kind === 'answer' && entry.showDeliveryArtifacts && (
                  <p className="kx-session-detail__delivery-artifacts">
                    {sessionDetail.delivery.artifacts.map((artifact) => (
                      <EntityToken
                        key={artifact.label}
                        kind="artifact"
                        label={artifact.label}
                        mono={artifact.type === 'COMMIT'}
                        title={artifact.url}
                      />
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>

          <footer className="kx-session-detail__meta">
            <span className="kx-chip">
              <span>{sessionDetail.repository}</span>
            </span>
            <span className="kx-chip">{sessionDetail.branch}</span>
            <span className="kx-chip">{sessionDetail.issueRef}</span>
            <span className="kx-chip">{sessionDetail.agent}</span>
          </footer>
        </div>

        <div className="kx-session-detail__composer-area" data-testid="session-composer-area">
          <SessionTracker />
          <SessionDetailComposer />
        </div>
      </div>
    </section>
  )
}
