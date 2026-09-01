/*
 * SessionStreamDetailPage — the ALTERNATIVE session detail page
 * (spec: .pi/orch/plans/session-stream-detail-spec.md).
 *
 * Same layout anatomy as SessionDetailPage (sticky full-width header →
 * bounded content column → sticky composer area at the bottom), but the
 * content column renders the session's response-stream story with the
 * shared stream components (ResponseBlock + the ten typed blocks) instead
 * of QuoteCard/Timeline/Tracker. The chrome is reused as-is: SessionHeader
 * (with optional title/context overrides) and SessionDetailComposer.
 *
 * Interaction model is copied from SessionStreamDemoPage: local state
 * only (no reducer changes) — clarification answers insert the dynamic
 * user-answer block, plan approval flips the chip, the gate records a
 * decision, evidence/progress collapse, and the artifact copies through
 * the clipboard helper. The classic SessionDetailPage is untouched and
 * every other session keeps routing to it.
 */
import { Fragment, useState } from 'react'
import { ATTENDANCE_REVIEW_STORY, ATTENDANCE_REVIEW_TITLE } from '../components/session/stream/attendanceReviewStory'
import ResponseBlock, { MessageIcon, StreamChip } from '../components/session/stream/ResponseBlock'
import type {
  GateDecision,
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
import SessionHeader from '../components/session/SessionHeader'
import SessionDetailComposer from '../components/session/SessionDetailComposer'
import { ILLUSTRATIVE_DATA_NOTE } from '../data/mockData'
import '../components/session/stream/SessionStream.css'
import './SessionDetailPage.css'

/** Same clipboard contract as the demo page: async clipboard with a
 * textarea + execCommand fallback for environments without it. */
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
    /* clipboard unavailable in this environment — mockup tolerates it */
  }
}

export default function SessionStreamDetailPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [planApproved, setPlanApproved] = useState(false)
  const [gateDecision, setGateDecision] = useState<GateDecision | undefined>(undefined)

  const clarification = ATTENDANCE_REVIEW_STORY.find(
    (entry): entry is Extract<StreamStoryEntry, { kind: 'clarification' }> =>
      entry.kind === 'clarification',
  )
  const allAnswered =
    clarification !== undefined &&
    clarification.data.questions.every((question) => answers[question.id] !== undefined)

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: option }))
  }

  const renderEntry = (entry: StreamStoryEntry, position: number) => {
    switch (entry.kind) {
      case 'request':
        return <UserRequestBlock data={entry.data} time="14:02" />
      case 'acknowledgement':
        return <AcknowledgementBlock data={entry.data} time="14:04" />
      case 'clarification':
        return (
          <ClarificationBlock
            data={entry.data}
            answered={answers}
            onAnswer={handleAnswer}
            time="14:05"
          />
        )
      case 'plan':
        return (
          <PlanBlock
            data={entry.data}
            approved={planApproved}
            onApprove={() => setPlanApproved(true)}
            onRequestChanges={() => setPlanApproved(false)}
            time="14:12"
          />
        )
      case 'approval-gate':
        return (
          <ApprovalGateBlock
            data={entry.data}
            decision={gateDecision}
            onDecision={(decision) => setGateDecision(decision)}
            time="14:16"
          />
        )
      case 'progress':
        return <ProgressBlock data={entry.data} time="14:18" />
      case 'tool':
        // The second tool batch renders later on the story clock.
        return <ToolEvidenceBlock data={entry.data} time={position > 7 ? '14:52' : '14:19'} />
      case 'artifact':
        return (
          <ArtifactBlock
            data={entry.data}
            onCopy={(payload) => void copyToClipboard(payload)}
            time="14:41"
          />
        )
      case 'review':
        return <ReviewFindingBlock data={entry.data} time="14:47" />
      case 'completion':
        return <CompletionBlock data={entry.data} time="15:03" />
    }
  }

  return (
    <section
      className="kx-session-detail"
      aria-label="Session detail stream"
      data-testid="session-stream-detail"
    >
      {/* Sticky, full-width session name/status/share header — the shared
          chrome component, carrying this session's title and context line
          through the optional props (fixture fallback untouched). */}
      <SessionHeader
        title={ATTENDANCE_REVIEW_TITLE}
        mode="engineering"
        systemName="BSI - HRIS"
        componentName="attendance integration"
      />

      <div className="kx-session-detail__content">
        {/* The stream story replaces the quote/timeline blocks: same
            bounded blocks container (680px reading column), one slot per
            story entry with the sequential stream-kind anchor ids. */}
        <div className="kx-session-detail__blocks" data-testid="session-stream-blocks">
          <div className="kx-stream" data-testid="session-stream">
            {ATTENDANCE_REVIEW_STORY.map((entry, index) => {
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
                        time="14:08"
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
        </div>

        {/* Final sticky session interaction — the same composer the
            classic page pins above the viewport bottom. The tracker is
            deliberately absent: the stream's progress and handoff blocks
            carry the live state instead. */}
        <div className="kx-session-detail__composer-area" data-testid="session-composer-area">
          <SessionDetailComposer />
        </div>
      </div>
    </section>
  )
}
