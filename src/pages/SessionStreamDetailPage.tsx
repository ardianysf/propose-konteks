/*
 * SessionStreamDetailPage — the CHAT-STYLE session detail page
 * (spec: .pi/orch/plans/chat-session-stream-spec.md).
 *
 * Layout anatomy: sticky full-width SessionHeader → bounded scrollable
 * dialog column rendering ATTENDANCE_REVIEW_STORY top-to-bottom as chat
 * turns (user requests/answers = right-aligned bubbles via
 * UserRequestBlock/BubbleBlock; every agent kind = flat prose turns via
 * the typed blocks + ResponseBlock) → sticky composer area
 * (SessionDetailComposer with the optional live-mock interceptors:
 * onSend routes sends here instead of the reducer, busy locks the input
 * while a scripted turn runs — classic behavior untouched).
 *
 * Interaction model is page-level local state only (no reducer changes):
 * the fixture story is SETTLED history, so the plan boots approved and
 * the gate boots decided ("Allow once") — answering a clarification
 * without recorded answers inserts the user bubble, plan approval flips
 * the chip, the gate records a decision, and tool/progress rows expand
 * and collapse locally.
 *
 * LIVE MOCK (spec §Live mock, phase 2): sending via the composer appends
 * a user bubble (Sending… → sent "just now"), locks the composer, and
 * plays LIVE_TURN_SCRIPT step by step on timers — typing indicator →
 * understanding prose → tool call RUNNING (open, pulsing) → done
 * (collapses) → live progress with a ticking elapsed clock → settled →
 * artifact chip → final answer → composer unlocks. Editing any user
 * bubble ("Save & resend") updates its text, truncates every turn after
 * it, and replays the script (mockup regeneration). Every timer lives in
 * a page ref and is cleared on unmount — no setState after unmount.
 */
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  ATTENDANCE_REVIEW_STORY,
  ATTENDANCE_REVIEW_TITLE,
  LIVE_TURN_SCRIPT,
} from '../components/session/stream/attendanceReviewStory'
import BubbleBlock from '../components/session/stream/BubbleBlock'
import type {
  AnswerBlockData,
  ArtifactBlockData,
  ClarificationBlockData,
  GateDecision,
  ProgressBlockData,
  StreamStoryEntry,
  ToolCall,
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

/** Timestamp shown by live turns (history carries fixture times). */
const LIVE_TIME = 'just now'

/** The live progress clock ticks once per second. */
const LIVE_CLOCK_MS = 1000

// ── Live-mock state model ─────────────────────────────────────────────────

/** One appended live turn. Entries reveal step by step as the scripted
 * run advances; `id` is stable per entry, and keying by mutable fields
 * (tool state, progress live/settled) remounts the shared blocks so
 * their collapsed-by-default expansion resets exactly like history. */
type LiveEntry =
  | { id: string; kind: 'user'; text: string; sending: boolean }
  | { id: string; kind: 'typing' }
  | { id: string; kind: 'understanding'; data: AnswerBlockData }
  | { id: string; kind: 'tool'; call: ToolCall }
  | { id: string; kind: 'progress'; data: ProgressBlockData; live: boolean; elapsedSec: number }
  | { id: string; kind: 'artifact'; data: ArtifactBlockData }
  | { id: string; kind: 'answer'; data: AnswerBlockData }

/** mm:ss for the live elapsed clock (tabular rendering is CSS-side). */
function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

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

  // Live-mock state (page-local only — the reducer is untouched):
  //   liveTurns    the appended conversation after the settled history
  //   agentBusy    composer lock while a scripted run is in flight
  //   historyCutoff  how many fixture turns remain visible after an edit
  //   on an old bubble truncated everything below it
  const [liveTurns, setLiveTurns] = useState<LiveEntry[]>([])
  const [agentBusy, setAgentBusy] = useState(false)
  const [historyCutoff, setHistoryCutoff] = useState(ATTENDANCE_REVIEW_STORY.length)

  // Timer plumbing: every timeout/interval of the current run registers
  // here; clearing the refs cancels the whole run (unmount, resend).
  const timeoutsRef = useRef<number[]>([])
  const clockRef = useRef<number | null>(null)
  const seqRef = useRef(0)
  const runCountRef = useRef(0)
  const tailRef = useRef<HTMLDivElement>(null)

  const clearLiveTimers = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id))
    timeoutsRef.current = []
    if (clockRef.current !== null) {
      window.clearInterval(clockRef.current)
      clockRef.current = null
    }
  }

  // One unmount cleanup kills every pending timer — nothing can setState
  // after unmount, and navigating away mid-run leaves no strays.
  useEffect(() => () => clearLiveTimers(), [])

  const schedule = (fn: () => void, delay: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, delay))
  }

  const appendEntry = (entry: LiveEntry) => setLiveTurns((previous) => [...previous, entry])
  const removeEntry = (id: string) =>
    setLiveTurns((previous) => previous.filter((entry) => entry.id !== id))
  const patchEntry = (id: string, patch: (entry: LiveEntry) => LiveEntry) =>
    setLiveTurns((previous) => previous.map((entry) => (entry.id === id ? patch(entry) : entry)))

  const startClock = (progressId: string) => {
    if (clockRef.current !== null) window.clearInterval(clockRef.current)
    clockRef.current = window.setInterval(() => {
      patchEntry(progressId, (entry) =>
        entry.kind === 'progress' && entry.live ? { ...entry, elapsedSec: entry.elapsedSec + 1 } : entry,
      )
    }, LIVE_CLOCK_MS)
  }
  const stopClock = () => {
    if (clockRef.current !== null) {
      window.clearInterval(clockRef.current)
      clockRef.current = null
    }
  }

  /** Plays one scripted agent run after the last visible user bubble.
   * `userId` flips that bubble Sending… → sent at sentDelayMs; a resend
   * (edit-save) passes none — the bubble is already sent. Steps appear on
   * the LIVE_TURN_SCRIPT delays, each measured from the previous step:
   *   typing → understanding → tool running → tool done/collapsed →
   *   live progress (elapsed clock ticking) → settled + artifact chip →
   *   final answer → unlock. Repeat runs rotate the artifact version
   * (v1.1, v1.2, …) so a second send reads as a fresh verification. */
  const runLiveScript = (userId?: string) => {
    const script = LIVE_TURN_SCRIPT
    const seq = ++seqRef.current
    const entryId = (step: string) => `live-${seq}-${step}`
    const version = `v1.${runCountRef.current + 1}`
    runCountRef.current += 1

    setAgentBusy(true)
    let clock = 0
    if (userId !== undefined) {
      clock += script.sentDelayMs
      const id = userId
      schedule(() => patchEntry(id, (entry) => (entry.kind === 'user' ? { ...entry, sending: false } : entry)), clock)
    }
    clock += script.typingDelayMs
    const typingId = entryId('typing')
    schedule(() => appendEntry({ id: typingId, kind: 'typing' }), clock)
    clock += script.openDelayMs
    schedule(() => {
      removeEntry(typingId)
      appendEntry({ id: entryId('understanding'), kind: 'understanding', data: script.understanding })
    }, clock)
    clock += script.toolRunningDelayMs
    const toolId = entryId('tool')
    schedule(() => appendEntry({ id: toolId, kind: 'tool', call: script.toolRunning }), clock)
    clock += script.toolDoneDelayMs
    schedule(() => patchEntry(toolId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.toolDone } : entry)), clock)
    clock += script.progressDelayMs
    const progressId = entryId('progress')
    schedule(() => {
      appendEntry({ id: progressId, kind: 'progress', data: script.progress, live: true, elapsedSec: 0 })
      startClock(progressId)
    }, clock)
    clock += script.artifactDelayMs
    schedule(() => {
      stopClock()
      patchEntry(progressId, (entry) =>
        entry.kind === 'progress' ? { ...entry, data: script.progressSettled, live: false } : entry,
      )
      appendEntry({
        id: entryId('artifact'),
        kind: 'artifact',
        data: { ...script.artifact, version },
      })
    }, clock)
    clock += script.answerDelayMs
    schedule(() => {
      appendEntry({
        id: entryId('answer'),
        kind: 'answer',
        data: {
          paragraphs: script.answer.paragraphs.map((paragraph) => paragraph.replaceAll('v1.1', version)),
        },
      })
    }, clock)
    clock += script.settleDelayMs
    schedule(() => setAgentBusy(false), clock)
  }

  /** Composer send: append the user bubble immediately (Sending…), lock
   * the composer, and play the scripted agent turn below it. */
  const handleSend = (text: string) => {
    clearLiveTimers()
    const entryId = `live-${seqRef.current + 1}-user`
    appendEntry({ id: entryId, kind: 'user', text, sending: true })
    runLiveScript(entryId)
  }

  /** Edit-save on a history bubble: the stream truncates right below the
   * edited bubble (mockup regeneration) and the script replays. */
  const handleResendHistory = (position: number) => {
    clearLiveTimers()
    setHistoryCutoff(position)
    setLiveTurns([])
    runLiveScript()
  }

  /** Edit-save on a live-sent bubble: truncate every turn after it and
   * replay (the bubble keeps its updated text — it stays mounted). */
  const handleResendLive = (entryId: string) => {
    clearLiveTimers()
    setLiveTurns((previous) => {
      const index = previous.findIndex((entry) => entry.id === entryId)
      return index === -1 ? previous : previous.slice(0, index + 1)
    })
    runLiveScript()
  }

  // Keep the newest turn in view as the run advances. jsdom has no
  // scrollIntoView — the guard keeps tests quiet (the stream itself does
  // not depend on scrolling).
  useEffect(() => {
    const tail = tailRef.current
    if (tail && typeof tail.scrollIntoView === 'function') {
      tail.scrollIntoView({ block: 'nearest' })
    }
  }, [liveTurns.length])

  // The FINAL agent answer of the settled history is the one turn that
  // carries the hover footer (spec refinements v2 #4) — every other agent
  // turn renders bare. The live script's final answer step reuses the
  // same rule below.
  const finalAnswerPosition = ATTENDANCE_REVIEW_STORY.reduce(
    (last, entry, index) => (entry.kind === 'answer' ? index + 1 : last),
    0,
  )

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
        return (
          <UserRequestBlock
            data={entry.data}
            time={time}
            onResend={() => handleResendHistory(position)}
          />
        )
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
        // The final agent answer — the ONE turn with the hover footer
        // (spec refinements v2 #4).
        return (
          <AnswerBlock data={entry.data} time={time} showFooter={position === finalAnswerPosition} />
        )
      case 'completion':
        return <CompletionBlock data={entry.data} time={time} />
    }
  }

  /** Live-mock turn renderer — the exact blocks history uses. */
  const renderLiveEntry = (entry: LiveEntry) => {
    switch (entry.kind) {
      case 'user':
        return (
          <UserRequestBlock
            data={{ intent: entry.text, chips: [] }}
            time={entry.sending ? 'Sending…' : LIVE_TIME}
            onResend={() => handleResendLive(entry.id)}
          />
        )
      case 'typing':
        return (
          <div className="kx-stream-typing" aria-live="polite" data-testid="typing-indicator">
            <span className="kx-stream-typing__dot" />
            <span className="kx-stream-typing__dot" />
            <span className="kx-stream-typing__dot" />
            <span className="kx-stream-typing__label">Thinking…</span>
          </div>
        )
      case 'understanding':
        return <AnswerBlock data={entry.data} time={LIVE_TIME} />
      case 'tool':
        // Keyed by call state: running → done remounts the row so it
        // collapses exactly like a settled call (expanded initializes
        // from call.state).
        return (
          <ToolEvidenceBlock
            key={`${entry.id}-${entry.call.state}`}
            data={{ calls: [entry.call] }}
            time={LIVE_TIME}
          />
        )
      case 'progress':
        // Live: expanded with the active phase + ticking elapsed clock;
        // settled: remounts collapsed to the one-line summary.
        return (
          <ProgressBlock
            key={`${entry.id}-${entry.live ? 'live' : 'settled'}`}
            data={{
              ...entry.data,
              elapsed: entry.live ? formatElapsed(entry.elapsedSec) : entry.data.elapsed,
            }}
            defaultExpanded={entry.live}
            time={LIVE_TIME}
          />
        )
      case 'artifact':
        return <ArtifactBlock data={entry.data} time={LIVE_TIME} />
      case 'answer':
        // The live script's final answer lands with the footer — the
        // same single-turn rule as the settled history's final answer.
        return <AnswerBlock data={entry.data} time={LIVE_TIME} showFooter />
    }
  }

  const visibleHistory = ATTENDANCE_REVIEW_STORY.slice(0, historyCutoff)

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
            {visibleHistory.map((entry, index) => {
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

            {/* Live-mock turns — appended below the settled history as
                the scripted run advances. */}
            {liveTurns.map((entry) => (
              <div className="kx-stream-slot" key={entry.id} data-testid={`stream-live-${entry.kind}`}>
                {renderLiveEntry(entry)}
              </div>
            ))}
            <div ref={tailRef} aria-hidden="true" />
          </div>

          <p className="kx-illustrative-note" data-testid="illustrative-data-note">
            {ILLUSTRATIVE_DATA_NOTE}
          </p>
        </div>

        {/* Final sticky session interaction — the shared composer with
            the live-mock interceptors: sends land in the page's script
            runner and the input locks while the scripted turn runs. */}
        <div
          className={`kx-session-detail__composer-area${agentBusy ? ' kx-stream-composer-locked' : ''}`}
          data-testid="session-composer-area"
        >
          <SessionDetailComposer onSend={handleSend} busy={agentBusy} />
        </div>
      </div>
    </section>
  )
}
