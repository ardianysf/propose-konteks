/*
 * SessionStreamDemoPage — the demo route for the session response stream
 * (spec §Bagian B). Renders one realistic session story top to bottom
 * with local interactive state only (no global reducer changes):
 * clarification answers (which insert the dynamic user-answer block),
 * plan approval, gate decision, collapsibles, artifact copy.
 *
 * Each story block sits in a "slot" wrapper carrying the
 * id="stream-kind-<n>" anchor target; the stream's hairline separators
 * apply between slots.
 */
import { Fragment, useState } from 'react'
import { SESSION_STREAM_STORY } from '../components/session/stream/sessionStreamData'
import ResponseBlock, {
  KIND_LABELS,
  MessageIcon,
  StreamChip,
} from '../components/session/stream/ResponseBlock'
import type {
  GateDecision,
  StreamKind,
  StreamStoryEntry,
} from '../components/session/stream/sessionStreamTypes'
import UserRequestBlock from '../components/session/stream/blocks/UserRequestBlock'
import AcknowledgementBlock from '../components/session/stream/blocks/AcknowledgementBlock'
import ClarificationBlock from '../components/session/stream/blocks/ClarificationBlock'
import PlanBlock from '../components/session/stream/blocks/PlanBlock'
import ApprovalGateBlock from '../components/session/stream/blocks/ApprovalGateBlock'
import ProgressBlock from '../components/session/stream/blocks/ProgressBlock'
import ToolEvidenceBlock from '../components/session/stream/blocks/ToolEvidenceBlock'
import ArtifactBlock from '../components/session/stream/blocks/ArtifactBlock'
import ReviewFindingBlock from '../components/session/stream/blocks/ReviewFindingBlock'
import CompletionBlock from '../components/session/stream/blocks/CompletionBlock'
import { ILLUSTRATIVE_DATA_NOTE } from '../data/mockData'
import '../components/session/stream/SessionStream.css'

/** The demo's own copy handler: async clipboard with a textarea +
 * execCommand fallback for environments without the async clipboard. */
async function copyToClipboard(payload: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(payload)
    return
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = payload
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch {
    /* clipboard unavailable in this environment — demo tolerates it */
  }
}

const KIND_ORDER: StreamKind[] = [
  'request',
  'acknowledgement',
  'clarification',
  'plan',
  'approval-gate',
  'progress',
  'tool',
  'artifact',
  'review',
  'completion',
]

export default function SessionStreamDemoPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [planApproved, setPlanApproved] = useState(false)
  const [gateDecision, setGateDecision] = useState<GateDecision | undefined>(undefined)

  const clarification = SESSION_STREAM_STORY.find(
    (entry): entry is Extract<StreamStoryEntry, { kind: 'clarification' }> =>
      entry.kind === 'clarification',
  )
  const allAnswered =
    clarification !== undefined &&
    clarification.data.questions.every((question) => answers[question.id] !== undefined)

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: option }))
  }

  /** First stream position (1-based) of each kind — the anchor targets. */
  const firstIndexOf = (kind: StreamKind): number => {
    const index = SESSION_STREAM_STORY.findIndex((entry) => entry.kind === kind)
    return index === -1 ? 1 : index + 1
  }

  const renderEntry = (entry: StreamStoryEntry, position: number) => {
    switch (entry.kind) {
      case 'request':
        return <UserRequestBlock data={entry.data} />
      case 'acknowledgement':
        return <AcknowledgementBlock data={entry.data} />
      case 'clarification':
        return (
          <ClarificationBlock data={entry.data} answered={answers} onAnswer={handleAnswer} />
        )
      case 'plan':
        return (
          <PlanBlock
            data={entry.data}
            approved={planApproved}
            onApprove={() => setPlanApproved(true)}
            onRequestChanges={() => setPlanApproved(false)}
          />
        )
      case 'approval-gate':
        return (
          <ApprovalGateBlock
            data={entry.data}
            decision={gateDecision}
            onDecision={(decision) => setGateDecision(decision)}
          />
        )
      case 'progress':
        return <ProgressBlock data={entry.data} />
      case 'tool':
        // The second tool batch renders later on the story clock.
        return <ToolEvidenceBlock data={entry.data} time={position > 7 ? '09:41' : undefined} />
      case 'artifact':
        return (
          <ArtifactBlock data={entry.data} onCopy={(payload) => void copyToClipboard(payload)} />
        )
      case 'review':
        return <ReviewFindingBlock data={entry.data} />
      case 'completion':
        return <CompletionBlock data={entry.data} />
    }
  }

  return (
    <section className="kx-stream-page" aria-label="Session response stream demo">
      <header className="kx-stream-page__head">
        <p className="kx-stream-page__kicker">Demo · one session, ten response kinds</p>
        <h1 className="kx-stream-page__title">Session response stream</h1>
        <p className="kx-stream-page__desc">
          The operations-ledger anatomy for every agent response — one rail, one header grammar,
          typed bodies. A full session plays out below; jump to a kind:
        </p>
        <nav className="kx-stream-page__anchors" aria-label="Response kinds">
          {KIND_ORDER.map((kind) => (
            <a
              key={kind}
              className="kx-stream-page__anchor"
              href={`#stream-kind-${firstIndexOf(kind)}`}
            >
              {KIND_LABELS[kind]}
            </a>
          ))}
        </nav>
      </header>

      <div className="kx-stream" data-testid="session-stream">
        {SESSION_STREAM_STORY.map((entry, index) => {
          const position = index + 1
          return (
            <Fragment key={`${entry.kind}-${position}`}>
              <div id={`stream-kind-${position}`} className="kx-stream-slot">
                {renderEntry(entry, position)}
              </div>
              {entry.kind === 'clarification' && allAnswered && clarification && (
                <div className="kx-stream-slot">
                  <ResponseBlock
                    id="stream-user-answer"
                    kindLabel="ANSWER"
                    tone="neutral"
                    icon={<MessageIcon />}
                    actor="Refactory Admin"
                    time="09:08"
                    stateChip={<StreamChip>user</StreamChip>}
                  >
                    <div className="kx-stream-answer">
                      {clarification.data.questions.map((question, questionIndex) => (
                        <p key={question.id} className="kx-stream-answer__line">
                          <span className="kx-stream-answer__num kx-stream-tabular">
                            {questionIndex + 1}
                          </span>
                          {answers[question.id]}
                        </p>
                      ))}
                    </div>
                  </ResponseBlock>
                </div>
              )}
            </Fragment>
          )
        })}
      </div>

      <p className="kx-illustrative-note" data-testid="illustrative-data-note">
        {ILLUSTRATIVE_DATA_NOTE}
      </p>
    </section>
  )
}
