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
import BubbleBlock from '../components/session/stream/BubbleBlock'
import { KIND_LABELS } from '../components/session/stream/ResponseBlock'
import type {
  ClarificationBlockData,
  GateDecision,
  StreamKind,
  StreamStoryEntry,
} from '../components/session/stream/sessionStreamTypes'
import { isLastAgentTurnOfResponse } from '../components/session/stream/responseGroup'
import UserRequestBlock from '../components/session/stream/blocks/UserRequestBlock'
import AcknowledgementBlock from '../components/session/stream/blocks/AcknowledgementBlock'
import ClarificationBlock from '../components/session/stream/blocks/ClarificationBlock'
import PlanBlock from '../components/session/stream/blocks/PlanBlock'
import ApprovalGateBlock from '../components/session/stream/blocks/ApprovalGateBlock'
import ProgressBlock from '../components/session/stream/blocks/ProgressBlock'
import ToolEvidenceBlock from '../components/session/stream/blocks/ToolEvidenceBlock'
import ArtifactBlock from '../components/session/stream/blocks/ArtifactBlock'
import ReviewFindingBlock from '../components/session/stream/blocks/ReviewFindingBlock'
import AnswerBlock from '../components/session/stream/blocks/AnswerBlock'
import CompletionBlock from '../components/session/stream/blocks/CompletionBlock'
import { ILLUSTRATIVE_DATA_NOTE } from '../data/mockData'
import InlineCode from '../components/technical/InlineCode'
import EntityToken from '../components/technical/EntityToken'
import MetadataPair from '../components/technical/MetadataPair'
import StatusBadge, { TECH_STATUSES } from '../components/technical/StatusBadge'
import CodeBlock from '../components/technical/CodeBlock'
import '../components/session/stream/SessionStream.css'

/** Showcase snippet 1 — a short (4-line) attendance query: under the
 * 5-line gate, so it renders WITHOUT line numbers. */
const ATTENDANCE_SQL = `SELECT employee_id, clock_in, clock_out
FROM attendance_records
WHERE work_date = '2026-08-31'
  AND clock_out IS NULL;`

/** Showcase snippet 2 — a 16-line sync config: past the 12-line collapse
 * threshold, so it starts collapsed (10 lines) with numbered rows and a
 * "Show full code" toggle. */
const ATTENDANCE_SYNC_CONFIG = `source:
  provider: gitea
  repository: hris-frontend
  branch: development
sync:
  schedule: "0 7 * * 1-5"
  timezone: Asia/Jakarta
  window:
    opens: "07:30"
    closes: "09:00"
rules:
  late_after: "09:00:59"
  half_day_after: "13:00:00"
  overtime:
    min_minutes: 30
    requires_approval: true`

/** Technical text showcase (spec §Showcase): one section exercising all
 * five primitives with real attendance-domain values — the anchor target
 * for #technical-text. Local presentational composition only. */
function TechnicalTextShowcase() {
  return (
    <section className="kx-tech-showcase" id="technical-text" aria-labelledby="technical-text-title">
      <h2 className="kx-tech-showcase__title" id="technical-text-title">
        Technical text
      </h2>
      <p className="kx-tech-showcase__desc">
        Five primitives for literal system values — identifiers, openable objects, metadata,
        statuses, and code. Every value that represents something the system knows is typed, not
        prose; only values act, labels never do.
      </p>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-showcase__label">Inline code</p>
        <p className="kx-tech-showcase__prose">
          The repository <InlineCode>hris-frontend</InlineCode> is on branch{' '}
          <InlineCode>development</InlineCode>.
        </p>
      </div>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-showcase__label">Entity tokens</p>
        <div className="kx-tech-showcase__row">
          <EntityToken kind="repository" label="hris-frontend" />
          <EntityToken kind="branch" label="development" />
          <EntityToken kind="document" label="MMKSI-HRD Phase 2.docx" mono={false} />
          <EntityToken kind="task" label="Task 7" mono={false} openLabel="Open Task 7" />
          <EntityToken kind="session" label="ses_01JABC" />
        </div>
      </div>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-showcase__label">Metadata pairs</p>
        <div className="kx-tech-showcase__meta">
          <MetadataPair
            label="Repository"
            value={<EntityToken kind="repository" label="hris-frontend" />}
          />
          <MetadataPair label="Branch" value={<EntityToken kind="branch" label="development" />} />
          <MetadataPair label="Session ID" value="ses_01JG8Z4X7QK2M5RT9W3BV6DHC0LP" mono />
          <MetadataPair label="Provider" value="Gitea" />
        </div>
      </div>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-showcase__label">Status badges</p>
        <div className="kx-tech-showcase__row">
          {TECH_STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-showcase__label">Code blocks</p>
        <CodeBlock
          code={ATTENDANCE_SQL}
          meta="sql"
          footer="Executed 09:41 · 3 rows returned"
        />
        <CodeBlock code={ATTENDANCE_SYNC_CONFIG} meta="config/attendance-sync.yaml" />
      </div>

      <div className="kx-tech-showcase__group">
        <p className="kx-tech-note">
          Do — mark literal values with InlineCode and openable objects with EntityToken; in
          metadata, only the value ever acts.
        </p>
        <p className="kx-tech-note">
          Don&apos;t — rely on color alone: every status pairs its icon and label with a tone that
          clears AA contrast in both themes.
        </p>
      </div>
    </section>
  )
}

/** Composes the inserted user bubble for the interactive clarification:
 * the chosen options as a numbered chat message. */
function answerMessage(
  questions: ClarificationBlockData['questions'],
  answers: Record<string, string>,
): string {
  return questions
    .map((question, index) => `${index + 1}. ${answers[question.id] ?? ''}`)
    .join('\n')
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

  /** One hover footer per agent RESPONSE GROUP (spec refinements v3
   * #2): the group's last agent turn — the turn right before the next
   * user turn (request bubble, inserted answer bubble) or the end of
   * the conversation. The rendered kind sequence mirrors the DOM,
   * including the user-answer bubble inserted after the interactive
   * clarification once every question is answered. */
  const effectiveKinds: string[] = SESSION_STREAM_STORY.flatMap((entry) =>
    entry.kind === 'clarification' && allAnswered ? ['clarification', 'user'] : [entry.kind],
  )
  const isGroupFinal = (index: number) => isLastAgentTurnOfResponse(effectiveKinds, index)

  const renderEntry = (entry: StreamStoryEntry, position: number) => {
    switch (entry.kind) {
      case 'request':
        return <UserRequestBlock data={entry.data} />
      case 'acknowledgement':
        return <AcknowledgementBlock data={entry.data} />
      case 'clarification':
        return (
          <ClarificationBlock
            data={entry.data}
            answered={answers}
            onAnswer={handleAnswer}
            showFooter={isGroupFinal(position - 1)}
          />
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
        // Copy/Download ride inside the chip itself (clipboard.ts).
        return <ArtifactBlock data={entry.data} />
      case 'review':
        return <ReviewFindingBlock data={entry.data} />
      case 'answer':
        // Conversational prose — footer only when it ends its response
        // group (spec refinements v3 #2).
        return <AnswerBlock data={entry.data} time="09:44" showFooter={isGroupFinal(position - 1)} />
      case 'completion':
        return <CompletionBlock data={entry.data} showFooter={isGroupFinal(position - 1)} />
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

      <TechnicalTextShowcase />

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
                  <BubbleBlock
                    id="stream-user-answer"
                    time="09:08"
                    testId="user-bubble"
                    copyPayload={answerMessage(clarification.data.questions, answers)}
                  >
                    <p className="kx-stream-bubble__text kx-stream-prose">
                      {answerMessage(clarification.data.questions, answers)}
                    </p>
                  </BubbleBlock>
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
