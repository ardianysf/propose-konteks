/*
 * SessionStreamDetailPage — the CHAT-STYLE session detail page
 * (spec: .pi/orch/plans/chat-session-stream-spec.md).
 *
 * Layout anatomy: sticky full-width SessionHeader → bounded scrollable
 * dialog column rendering ATTENDANCE_REVIEW_STORY top-to-bottom as chat
 * turns (user requests/answers = right-aligned bubbles via
 * UserRequestBlock/BubbleBlock; every agent kind = flat prose turns via
 * the typed blocks + ResponseBlock) → sticky composer area
 * (SessionDetailComposer, unchanged behavior — the live-mock send flow
 * is a later phase).
 *
 * Interaction model is page-level local state only (no reducer changes):
 * the fixture story is SETTLED history, so the plan boots approved and
 * the gate boots decided ("Allow once") — but the model stays wired for
 * interactive entries exactly like the demo page: answering a
 * clarification (one without recorded settled answers) inserts the user
 * bubble, plan approval flips the chip, the gate records a decision,
 * and tool/progress rows expand and collapse locally.
 */
import { Fragment, useState } from 'react'
import {
  ATTENDANCE_REVIEW_STORY,
  ATTENDANCE_REVIEW_TITLE,
} from '../components/session/stream/attendanceReviewStory'
import BubbleBlock from '../components/session/stream/BubbleBlock'
import type {
  ClarificationBlockData,
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
import AnswerBlock from '../components/session/stream/blocks/AnswerBlock'
import CompletionBlock from '../components/session/stream/blocks/CompletionBlock'
import SessionHeader from '../components/session/SessionHeader'
import SessionDetailComposer from '../components/session/SessionDetailComposer'
import { ILLUSTRATIVE_DATA_NOTE } from '../data/mockData'
import '../components/session/stream/SessionStream.css'
import './SessionDetailPage.css'

/** Turn timestamps aligned to the story order (14:02 → 15:03, monotonic
 * per the fixture) — the hover footers and bubble action bars show them. */
const TURN_TIMES: string[] = [
  '14:02', // 1  — user request bubble
  '14:04', // 2  — understanding
  '14:05', // 3  — clarification (settled answers recorded)
  '14:08', // 4  — user answer bubble
  '14:09', // 5  — plan (approved 14:12)
  '14:16', // 6  — approval gate (decided: Allow once)
  '14:18', // 7  — progress
  '14:20', // 8  — tool evidence
  '14:45', // 9  — review finding
  '14:46', // 10 — artifact chip
  '14:58', // 11 — final answer
  '15:03', // 12 — completion handoff
]

/** Composes the inserted user bubble for an interactive clarification:
 * the chosen options as a numbered message (same shape as the fixture's
 * recorded answer bubble). */
function answerMessage(questions: ClarificationBlockData['questions'], answers: Record<string, string>): string {
  return questions
    .map((question, index) => `${index + 1}. ${answers[question.id] ?? ''}`)
    .join('\n')
}

export default function SessionStreamDetailPage() {
  // History is settled — the fixture's plan was approved and the gate
  // decided "Allow once" mid-session. The state model itself stays
  // interactive: pending entries (an unanswered clarification, an
  // unapproved plan) behave exactly like the demo page.
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [planApproved, setPlanApproved] = useState(true)
  const [gateDecision, setGateDecision] = useState<GateDecision | undefined>('allow-once')

  // Only a clarification WITHOUT recorded answers is interactive — the
  // fixture's own answers already sit in the stream as a user bubble.
  const interactiveClarification = ATTENDANCE_REVIEW_STORY.find(
    (entry): entry is Extract<StreamStoryEntry, { kind: 'clarification' }> =>
      entry.kind === 'clarification' && entry.data.settledAnswers === undefined,
  )
  const allAnswered =
    interactiveClarification !== undefined &&
    interactiveClarification.data.questions.every((question) => answers[question.id] !== undefined)

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: option }))
  }

  const renderEntry = (entry: StreamStoryEntry, position: number) => {
    const time = TURN_TIMES[position - 1] ?? '14:00'
    switch (entry.kind) {
      case 'request':
        return <UserRequestBlock data={entry.data} time={time} />
      case 'acknowledgement':
        return <AcknowledgementBlock data={entry.data} time={time} />
      case 'clarification':
        return (
          <ClarificationBlock
            data={entry.data}
            answered={answers}
            onAnswer={handleAnswer}
            time={time}
          />
        )
      case 'plan':
        return (
          <PlanBlock
            data={entry.data}
            approved={planApproved}
            onApprove={() => setPlanApproved(true)}
            onRequestChanges={() => setPlanApproved(false)}
            time={time}
          />
        )
      case 'approval-gate':
        return (
          <ApprovalGateBlock
            data={entry.data}
            decision={gateDecision}
            onDecision={(decision) => setGateDecision(decision)}
            time={time}
          />
        )
      case 'progress':
        return <ProgressBlock data={entry.data} time={time} />
      case 'tool':
        return <ToolEvidenceBlock data={entry.data} time={time} />
      case 'artifact':
        return <ArtifactBlock data={entry.data} time={time} />
      case 'review':
        return <ReviewFindingBlock data={entry.data} time={time} />
      case 'answer':
        return <AnswerBlock data={entry.data} time={time} />
      case 'completion':
        return <CompletionBlock data={entry.data} time={time} />
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
        {/* The dialog column: the settled story reads top-to-bottom as a
            real conversation — user bubbles right-aligned, agent turns
            flat. Same bounded blocks container (680px reading column). */}
        <div className="kx-session-detail__blocks" data-testid="session-stream-blocks">
          <div
            className="kx-stream"
            data-testid="session-stream"
            role="log"
            aria-label="Session conversation"
          >
            {ATTENDANCE_REVIEW_STORY.map((entry, index) => {
              const position = index + 1
              return (
                <Fragment key={`${entry.kind}-${position}`}>
                  <div
                    id={`stream-kind-${position}`}
                    className="kx-stream-slot"
                    data-testid={`stream-turn-${position}`}
                  >
                    {renderEntry(entry, position)}
                  </div>
                  {/* Interactive clarification answered → the answers
                      enter the stream as a NEW user bubble right after
                      the questions. */}
                  {entry === interactiveClarification && allAnswered && (
                    <div className="kx-stream-slot" data-testid="stream-turn-user-answer">
                      <BubbleBlock
                        id="stream-user-answer"
                        time="14:08"
                        testId="user-bubble"
                        copyPayload={answerMessage(interactiveClarification.data.questions, answers)}
                      >
                        <p className="kx-stream-bubble__text kx-stream-prose">
                          {answerMessage(interactiveClarification.data.questions, answers)}
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
        </div>

        {/* Final sticky session interaction — the same composer the
            classic page pins above the viewport bottom. Sending stays
            inert in this phase; the live-mock send flow arrives later. */}
        <div className="kx-session-detail__composer-area" data-testid="session-composer-area">
          <SessionDetailComposer />
        </div>
      </div>
    </section>
  )
}
