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
 * LIVE MOCK (spec §Live mock v2/v3 — staged interactive + progressive
 * continuation): sending via the composer appends a user bubble
 * (Sending… → sent "just now"), locks the composer, and plays the
 * selected script on timers. The FIRST send is the staged v2 cycle,
 * untouched: typing indicator → understanding prose → PARK at an
 * OUTSTANDING approval gate (the choices are the only way forward) →
 * decision settles the gate → typing → interactive plan WAITS (Approve
 * plan / Request changes) → approving runs the execution leg (live
 * progress with a ticking elapsed clock → tool call RUNNING → done →
 * settled + artifact chip → final answer → unlock); Deny / Request
 * changes close the turn with short prose and unlock.
 *
 * Continuation sends get PROGRESSIVELY more complex (v3): the second
 * send plays the DEEP script — typing → INTERACTIVE clarification with
 * answer chips (two questions; parked with zero pending timers, same
 * pattern as the gate) → chip answers insert as a user bubble → typing
 * → REVISED plan waits → approval runs the MULTI-TOOL leg (two tool
 * rows: running→done, queued→running→done) → a High REVIEW FINDING → a
 * short fix tool call → the version-bumped artifact → a final answer
 * that references the finding. The third send stays LIGHT — one tool
 * call and a short answer with NO wait points (timers alone) — and
 * further sends alternate deep/light, artifact versions climbing v2,
 * v3, … on each deep run.
 *
 * Editing any user bubble ("Save & resend") updates its text, truncates
 * every turn after it, and replays the SAME turn-number-appropriate
 * script from typing (mockup regeneration; history edits replay the
 * staged cycle). Every timer lives in a page ref and is cleared on
 * unmount and on resend — no setState after unmount; while a gate,
 * plan, or clarification waits there are no pending timers at all (the
 * run resumes from the decision).
 */
import { Fragment, useEffect, useRef, useState } from 'react'
import {
  ATTENDANCE_REVIEW_STORY,
  ATTENDANCE_REVIEW_TITLE,
  LIVE_DEEP_CONTINUATION_SCRIPT,
  LIVE_LIGHT_FOLLOWUP_SCRIPT,
  LIVE_TURN_SCRIPT,
  type LiveClosingScript,
  type LiveDeepContinuationScript,
  type LiveLightFollowUpScript,
  type LiveStagedScript,
} from '../components/session/stream/attendanceReviewStory'
import { isLastAgentTurnOfResponse } from '../components/session/stream/responseGroup'
import BubbleBlock from '../components/session/stream/BubbleBlock'
import type {
  AnswerBlockData,
  ApprovalGateBlockData,
  ArtifactBlockData,
  ClarificationBlockData,
  GateDecision,
  PlanBlockData,
  ProgressBlockData,
  ReviewFindingBlockData,
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
import WarningBlock from '../components/session/stream/blocks/WarningBlock'
import ErrorBlock from '../components/session/stream/blocks/ErrorBlock'
import QuoteBlock from '../components/session/stream/blocks/QuoteBlock'
import EstimateBlock from '../components/session/stream/blocks/EstimateBlock'
import SessionHeader from '../components/session/SessionHeader'
import SessionDetailComposer from '../components/session/SessionDetailComposer'
import DotMatrixLoader from '../components/ui/DotMatrixLoader'
import '../components/session/stream/SessionStream.css'
import './SessionDetailPage.css'

/** Turn timestamps aligned to the story order (14:02 → 15:03, monotonic
 * per the fixture) — the hover footers and bubble action bars show them. */
const TURN_TIMES: string[] = [
  '14:02', // 1  — user request bubble
  '14:04', // 2  — understanding
  '14:05', // 3  — quote (the spec rule behind the clarification)
  '14:06', // 4  — clarification (settled answers recorded)
  '14:09', // 5  — user answer bubble
  '14:10', // 6  — plan (approved 14:12)
  '14:13', // 7  — delivery estimate (reviewed with the plan)
  '14:16', // 8  — approval gate (decided: Allow once)
  '14:18', // 9  — progress
  '14:20', // 10 — tool evidence
  '14:27', // 11 — warning (connection lost mid-scan, resumed)
  '14:31', // 12 — error (verification 503, retried — succeeded)
  '14:45', // 13 — review finding
  '14:46', // 14 — artifact chip
  '14:58', // 15 — final answer
  '15:03', // 16 — completion handoff
]

/** Timestamp shown by live turns (history carries fixture times). */
const LIVE_TIME = 'just now'

/** Execution stats riding the group-final answer footers (mock values —
 * duration · tokens in · tokens out, per review). */
const HISTORY_STATS = { duration: '229.2s', tokensIn: '1242k', tokensOut: '16.5k' }
const LIVE_STATS = { duration: '18.4s', tokensIn: '96k', tokensOut: '2.1k' }

/** The live progress clock ticks once per second. */
const LIVE_CLOCK_MS = 1000

// ── Live-mock state model ─────────────────────────────────────────────────

/** Which scripted turn a send plays (spec §Live mock v3 — progressive
 * continuation): send #1 = the staged v2 cycle (gate → plan → execution,
 * UNCHANGED), send #2 = the deep continuation (interactive clarification
 * chips → revised plan → multi-tool execution → review finding → fix →
 * artifact bump), send #3 = a light follow-up (one tool → short answer,
 * no wait points), alternating deep/light afterwards. */
type LiveRunKind = 'staged' | 'deep' | 'light'

/** The script of the CURRENT live run plus its kind — the decision
 * handlers branch on it (staged keeps today's legs verbatim). */
type LiveRunVariant =
  | { kind: 'staged'; script: LiveStagedScript }
  | { kind: 'deep'; script: LiveDeepContinuationScript }
  | { kind: 'light'; script: LiveLightFollowUpScript }

/** One appended live turn. Entries reveal step by step as the staged
 * run advances; `id` is stable per entry, and keying by mutable fields
 * (tool state, progress live/settled) remounts the shared blocks so
 * their collapsed-by-default expansion resets exactly like history.
 * `gate`, `plan` and `clarification` are the interactive WAIT points:
 * they render outstanding/pending until the user's decision settles
 * them in place. */
type LiveEntry =
  | { id: string; kind: 'user'; text: string; sending: boolean; variant: LiveRunKind }
  | { id: string; kind: 'typing' }
  | { id: string; kind: 'understanding'; data: AnswerBlockData }
  | { id: string; kind: 'clarification'; data: ClarificationBlockData; answers: Record<string, string> }
  | { id: string; kind: 'answer-bubble'; text: string }
  | { id: string; kind: 'gate'; data: ApprovalGateBlockData; decision?: GateDecision }
  | { id: string; kind: 'plan'; data: PlanBlockData; approved: boolean }
  | { id: string; kind: 'tool'; call: ToolCall }
  | { id: string; kind: 'progress'; data: ProgressBlockData; live: boolean; elapsedSec: number }
  | { id: string; kind: 'artifact'; data: ArtifactBlockData }
  | { id: string; kind: 'review'; data: ReviewFindingBlockData }
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
  //   agentBusy    composer lock while a staged run is in flight (it
  //                stays locked across BOTH interactive waits — the
  //                 gate/plan choices are the only way forward)
  //   historyCutoff  how many fixture turns remain visible after an edit
  //   on an old bubble truncated everything below it
  const [liveTurns, setLiveTurns] = useState<LiveEntry[]>([])
  const [agentBusy, setAgentBusy] = useState(false)
  const [historyCutoff, setHistoryCutoff] = useState(ATTENDANCE_REVIEW_STORY.length)

  // Staged wait points (spec §Live mock v2/v3): while the run parks at
  // the gate, the plan, or the live clarification NO timers are pending —
  // these refs name the entry currently holding the run, so its decision
  // handler resumes the flow and stale clicks (an older gate/plan left
  // settled by a resend) are ignored.
  const gateWaitRef = useRef<string | null>(null)
  const planWaitRef = useRef<string | null>(null)
  const clarWaitRef = useRef<string | null>(null)
  // Scratch answers of the CURRENT parked clarification (reset when a
  // clarification lands) — one clarification waits at a time, so a ref
  // keeps the resume logic out of the setState updater.
  const clarAnswersRef = useRef<Record<string, string>>({})
  // The script + kind of the CURRENT run — the decision handlers branch
  // on it (staged keeps the v2 legs; deep adds its own continuation).
  const runVariantRef = useRef<LiveRunVariant>({ kind: 'staged', script: LIVE_TURN_SCRIPT })
  // The artifact version of the CURRENT run (staged: v1.1, v1.2, … —
  // deep: v2, v3, …) — the execution legs read it at approval time,
  // long after the opening that bumped it.
  const versionRef = useRef('v1.1')

  // Timer plumbing: every timeout/interval of the current run registers
  // here; clearing the refs cancels the whole run (unmount, resend).
  const timeoutsRef = useRef<number[]>([])
  const clockRef = useRef<number | null>(null)
  const seqRef = useRef(0)
  const runCountRef = useRef(0) // SENDS only — drives the v3 alternation
  const stagedCountRef = useRef(0) // staged runs started (send or replay)
  const deepCountRef = useRef(0) // deep runs started (send or replay)
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

  /** Which script a SEND plays (spec §Live mock v3 — progressive
   * continuation): the FIRST send is the staged v2 cycle, then odd
   * sends deepen (interactive clarification → revised plan →
   * multi-tool execution) and even sends stay light (one tool, no
   * wait points), alternating. */
  const runKindForSend = (sendIndex: number): LiveRunKind =>
    sendIndex === 0 ? 'staged' : sendIndex % 2 === 1 ? 'deep' : 'light'

  /** Binds a run to its script and bumps the artifact version that its
   * execution leg (if any) will stamp: staged replays rotate v1.x, deep
   * runs climb v2, v3, … (light runs carry no artifact). */
  const beginRun = (kind: LiveRunKind): LiveRunVariant => {
    if (kind === 'deep') {
      versionRef.current = `v${deepCountRef.current + 2}`
      deepCountRef.current += 1
      return { kind: 'deep', script: LIVE_DEEP_CONTINUATION_SCRIPT }
    }
    if (kind === 'light') {
      return { kind: 'light', script: LIVE_LIGHT_FOLLOWUP_SCRIPT }
    }
    versionRef.current = `v1.${stagedCountRef.current + 1}`
    stagedCountRef.current += 1
    return { kind: 'staged', script: LIVE_TURN_SCRIPT }
  }

  /** Plays the OPENING of the selected script after the last visible
   * user bubble and parks at the script's first WAIT point. `userId`
   * flips that bubble Sending… → sent at sentDelayMs; a resend
   * (edit-save) passes none — the bubble is already sent.
   *
   *   staged (send #1) — typing → understanding → the OUTSTANDING
   *     approval gate; the run parks there (WAIT #1) — v2 verbatim.
   *   deep (send #2, #4, …) — typing → the INTERACTIVE clarification
   *     with answer chips; the run parks there with zero pending timers
   *     (the same parking pattern as the gate).
   *   light (send #3, #5, …) — typing → one tool call → short answer →
   *     unlock; no wait points at all, timers carry the whole turn. */
  const runOpening = (variant: LiveRunVariant, userId?: string) => {
    const seq = ++seqRef.current
    const entryId = (step: string) => `live-${seq}-${step}`
    runVariantRef.current = variant
    gateWaitRef.current = null
    planWaitRef.current = null
    clarWaitRef.current = null

    setAgentBusy(true)
    let clock = 0
    if (userId !== undefined) {
      clock += variant.script.sentDelayMs
      const id = userId
      schedule(() => patchEntry(id, (entry) => (entry.kind === 'user' ? { ...entry, sending: false } : entry)), clock)
    }
    clock += variant.script.typingDelayMs
    const typingId = entryId('typing')
    schedule(() => appendEntry({ id: typingId, kind: 'typing' }), clock)

    if (variant.kind === 'staged') {
      const script = variant.script
      clock += script.openDelayMs
      schedule(() => {
        removeEntry(typingId)
        appendEntry({ id: entryId('understanding'), kind: 'understanding', data: script.understanding })
      }, clock)
      clock += script.gateDelayMs
      const gateId = entryId('gate')
      schedule(() => {
        appendEntry({ id: gateId, kind: 'gate', data: script.gate })
        gateWaitRef.current = gateId // WAIT POINT #1 — the run parks here.
      }, clock)
      return
    }

    if (variant.kind === 'deep') {
      const script = variant.script
      clock += script.clarDelayMs
      const clarId = entryId('clarification')
      schedule(() => {
        removeEntry(typingId)
        clarAnswersRef.current = {}
        appendEntry({ id: clarId, kind: 'clarification', data: script.clarification, answers: {} })
        clarWaitRef.current = clarId // WAIT POINT — parked until every question is answered.
      }, clock)
      return
    }

    // Light follow-up — no wait points: typing hands off to the single
    // tool call, which finishes, then the short answer settles + unlocks.
    const script = variant.script
    clock += script.toolRunningDelayMs
    const toolId = entryId('tool')
    schedule(() => {
      removeEntry(typingId)
      appendEntry({ id: toolId, kind: 'tool', call: script.toolRunning })
    }, clock)
    clock += script.toolDoneDelayMs
    schedule(() => patchEntry(toolId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.toolDone } : entry)), clock)
    clock += script.answerDelayMs
    schedule(() => appendEntry({ id: entryId('answer'), kind: 'answer', data: script.answer }), clock)
    clock += script.settleDelayMs
    schedule(() => setAgentBusy(false), clock)
  }

  /** Plays a closing branch (gate denied / plan changes requested):
   * brief typing → short prose → the turn settles and unlocks. */
  const runClosing = (baseId: string, closing: LiveClosingScript) => {
    let clock = closing.typingDelayMs
    const typingId = `${baseId}-typing`
    schedule(() => appendEntry({ id: typingId, kind: 'typing' }), clock)
    clock += closing.answerDelayMs
    schedule(() => {
      removeEntry(typingId)
      appendEntry({ id: `${baseId}-closing`, kind: 'answer', data: closing.answer })
    }, clock)
    clock += closing.settleDelayMs
    schedule(() => setAgentBusy(false), clock)
  }

  /** WAIT POINT #1 resolves: the gate settles visibly (decision recorded
   * in the stream), then the run branches — Allow once / Always this
   * session continues to the interactive plan (WAIT POINT #2), Deny
   * closes the turn with polite prose and unlocks. Only staged runs
   * open a gate, so this handler is the v2 leg verbatim. */
  const handleLiveGateDecision = (entryId: string, decision: GateDecision) => {
    if (gateWaitRef.current !== entryId) return // stale click after a resend
    const variant = runVariantRef.current
    if (variant.kind !== 'staged') return
    gateWaitRef.current = null
    patchEntry(entryId, (entry) => (entry.kind === 'gate' ? { ...entry, decision } : entry))

    if (decision === 'deny') {
      runClosing(entryId, variant.script.deny)
      return
    }
    const script = variant.script
    let clock = script.allowTypingDelayMs
    const typingId = `${entryId}-typing`
    schedule(() => appendEntry({ id: typingId, kind: 'typing' }), clock)
    clock += script.planDelayMs
    const planId = `${entryId}-plan`
    schedule(() => {
      removeEntry(typingId)
      appendEntry({ id: planId, kind: 'plan', data: script.plan, approved: false })
      planWaitRef.current = planId // WAIT POINT #2 — the run parks here.
    }, clock)
  }

  /** The live clarification's WAIT POINT resolves chip by chip: each
   * answer lands on the entry (selected chip + resumed notice once all
   * answered). When the LAST question is answered the run resumes —
   * the chosen options insert as a USER BUBBLE (the page's
   * inserted-answer pattern), brief typing follows, then the REVISED
   * plan appears and parks at its own wait point. Stale chip clicks
   * (a clarification left behind by a resend) are ignored. */
  const handleLiveAnswer = (entryId: string, questionId: string, option: string) => {
    if (clarWaitRef.current !== entryId) return // stale click after a resend
    const variant = runVariantRef.current
    if (variant.kind !== 'deep') return
    const script = variant.script

    clarAnswersRef.current = { ...clarAnswersRef.current, [questionId]: option }
    const answers = clarAnswersRef.current
    patchEntry(entryId, (entry) => (entry.kind === 'clarification' ? { ...entry, answers } : entry))
    const allAnswered = script.clarification.questions.every(
      (question) => answers[question.id] !== undefined,
    )
    if (!allAnswered) return // still parked — at least one answer missing
    clarWaitRef.current = null

    let clock = script.answerDelayMs
    schedule(() => {
      appendEntry({
        id: `${entryId}-answers`,
        kind: 'answer-bubble',
        text: answerMessage(script.clarification.questions, answers),
      })
    }, clock)
    clock += script.briefTypingDelayMs
    const typingId = `${entryId}-typing`
    schedule(() => appendEntry({ id: typingId, kind: 'typing' }), clock)
    clock += script.planDelayMs
    const planId = `${entryId}-plan`
    schedule(() => {
      removeEntry(typingId)
      appendEntry({ id: planId, kind: 'plan', data: script.revisedPlan, approved: false })
      planWaitRef.current = planId // WAIT POINT — the revised plan parks here.
    }, clock)
  }

  /** The deep continuation's execution leg after "Approve plan": live
   * progress with the ticking clock → MULTI-TOOL execution (tool #1
   * running→done, tool #2 queued→running→done) → the REVIEW FINDING →
   * the short fix tool call → settled progress + the version-bumped
   * artifact → the final answer → unlock. */
  const runDeepExecution = (baseId: string, script: LiveDeepContinuationScript['execution']) => {
    const version = versionRef.current
    let clock = script.progressDelayMs
    const progressId = `${baseId}-progress`
    schedule(() => {
      appendEntry({ id: progressId, kind: 'progress', data: script.progress, live: true, elapsedSec: 0 })
      startClock(progressId)
    }, clock)
    clock += script.tool1RunningDelayMs
    const toolAId = `${baseId}-tool-a`
    schedule(() => appendEntry({ id: toolAId, kind: 'tool', call: script.tool1Running }), clock)
    clock += script.tool1DoneDelayMs
    schedule(
      () => patchEntry(toolAId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.tool1Done } : entry)),
      clock,
    )
    clock += script.tool2QueuedDelayMs
    const toolBId = `${baseId}-tool-b`
    schedule(() => appendEntry({ id: toolBId, kind: 'tool', call: script.tool2Queued }), clock)
    clock += script.tool2RunningDelayMs
    schedule(
      () => patchEntry(toolBId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.tool2Running } : entry)),
      clock,
    )
    clock += script.tool2DoneDelayMs
    schedule(
      () => patchEntry(toolBId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.tool2Done } : entry)),
      clock,
    )
    clock += script.reviewDelayMs
    schedule(() => appendEntry({ id: `${baseId}-review`, kind: 'review', data: script.review }), clock)
    clock += script.fixRunningDelayMs
    const toolFixId = `${baseId}-tool-fix`
    schedule(() => appendEntry({ id: toolFixId, kind: 'tool', call: script.fixRunning }), clock)
    clock += script.fixDoneDelayMs
    schedule(
      () => patchEntry(toolFixId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.fixDone } : entry)),
      clock,
    )
    clock += script.artifactDelayMs
    schedule(() => {
      stopClock()
      patchEntry(progressId, (entry) =>
        entry.kind === 'progress' ? { ...entry, data: script.progressSettled, live: false } : entry,
      )
      appendEntry({ id: `${baseId}-artifact`, kind: 'artifact', data: { ...script.artifact, version } })
    }, clock)
    clock += script.answerDelayMs
    schedule(() => {
      appendEntry({
        id: `${baseId}-answer`,
        kind: 'answer',
        data: {
          paragraphs: script.answer.paragraphs.map((paragraph) =>
            paragraph.replaceAll('v2', version),
          ),
        },
      })
    }, clock)
    clock += script.settleDelayMs
    schedule(() => setAgentBusy(false), clock)
  }

  /** WAIT POINT resolves: the plan settles (approved chip / stays
   * pending), then the run branches — Approve plan plays the execution
   * leg (staged: live progress + one tool call; deep: the multi-tool leg
   * above); Request changes closes the turn asking what to change. */
  const handleLivePlanDecision = (entryId: string, approved: boolean) => {
    if (planWaitRef.current !== entryId) return // stale click after a resend
    const variant = runVariantRef.current
    if (variant.kind !== 'staged' && variant.kind !== 'deep') return
    planWaitRef.current = null
    patchEntry(entryId, (entry) => (entry.kind === 'plan' ? { ...entry, approved } : entry))

    if (!approved) {
      runClosing(entryId, variant.script.requestChanges)
      return
    }
    if (variant.kind === 'deep') {
      runDeepExecution(entryId, variant.script.execution)
      return
    }

    const script = variant.script.execution
    const version = versionRef.current
    let clock = script.progressDelayMs
    const progressId = `${entryId}-progress`
    schedule(() => {
      appendEntry({ id: progressId, kind: 'progress', data: script.progress, live: true, elapsedSec: 0 })
      startClock(progressId)
    }, clock)
    clock += script.toolRunningDelayMs
    const toolId = `${entryId}-tool`
    schedule(() => appendEntry({ id: toolId, kind: 'tool', call: script.toolRunning }), clock)
    clock += script.toolDoneDelayMs
    schedule(() => patchEntry(toolId, (entry) => (entry.kind === 'tool' ? { ...entry, call: script.toolDone } : entry)), clock)
    clock += script.artifactDelayMs
    schedule(() => {
      stopClock()
      patchEntry(progressId, (entry) =>
        entry.kind === 'progress' ? { ...entry, data: script.progressSettled, live: false } : entry,
      )
      appendEntry({
        id: `${entryId}-artifact`,
        kind: 'artifact',
        data: { ...script.artifact, version },
      })
    }, clock)
    clock += script.answerDelayMs
    schedule(() => {
      appendEntry({
        id: `${entryId}-answer`,
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
   * the composer, and play the selected script's opening below it — the
   * first send stages (v2), then sends alternate deep/light (v3). */
  const handleSend = (text: string) => {
    clearLiveTimers()
    const kind = runKindForSend(runCountRef.current)
    runCountRef.current += 1
    const entryId = `live-${seqRef.current + 1}-user`
    appendEntry({ id: entryId, kind: 'user', text, sending: true, variant: kind })
    runOpening(beginRun(kind), entryId)
  }

  /** Edit-save on a history bubble: the stream truncates right below the
   * edited bubble (mockup regeneration) and the STAGED opening replays
   * (history edits are turn-1 replays by construction). */
  const handleResendHistory = (position: number) => {
    clearLiveTimers()
    setHistoryCutoff(position)
    setLiveTurns([])
    runOpening(beginRun('staged'))
  }

  /** Edit-save on a live-sent bubble: truncate every turn after it and
   * replay the SAME turn-number-appropriate script from typing (the
   * bubble keeps its updated text — it stays mounted; its recorded
   * variant picks deep/light/staged again). */
  const handleResendLive = (entryId: string) => {
    clearLiveTimers()
    const edited = liveTurns.find((entry) => entry.id === entryId)
    const kind: LiveRunKind = edited !== undefined && edited.kind === 'user' ? edited.variant : 'staged'
    setLiveTurns((previous) => {
      const index = previous.findIndex((entry) => entry.id === entryId)
      return index === -1 ? previous : previous.slice(0, index + 1)
    })
    runOpening(beginRun(kind))
  }

  // Keep the newest turn in view as the run advances. jsdom has no
  // scrollIntoView — the guard keeps tests quiet (the stream itself does
  // not depend on scrolling).
  useEffect(() => {
    const tail = tailRef.current
    if (tail && typeof tail.scrollIntoView === 'function') {
      tail.scrollIntoView({ block: 'nearest' })
    }
  }, [liveTurns])

  // One hover footer per agent RESPONSE GROUP (spec refinements v3
  // #2): a group is a run of agent turns ending right before the next
  // user turn (or the conversation end) — the footer rides the group's
  // LAST turn, whatever kind it is. The rendered kind sequence mirrors
  // visibleHistory (this fixture's clarification is settled, so no
  // inserted answer bubble shifts the positions).
  const historyKinds = ATTENDANCE_REVIEW_STORY.slice(0, historyCutoff).map(
    (entry) => entry.kind,
  )
  const isGroupFinal = (index: number) => isLastAgentTurnOfResponse(historyKinds, index)

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
            showFooter={isGroupFinal(position - 1)}
            stats={isGroupFinal(position - 1) ? HISTORY_STATS : undefined}
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
        // Conversational prose — carries the footer only when it ends
        // its response group (spec refinements v3 #2).
        return (
          <AnswerBlock
            data={entry.data}
            time={time}
            showFooter={isGroupFinal(position - 1)}
            stats={isGroupFinal(position - 1) ? HISTORY_STATS : undefined}
          />
        )
      case 'warning':
        // Fase 4 — mid-group notice row; never a group closer (spec
        // §Penempatan), so no footer.
        return <WarningBlock data={entry.data} time={time} />
      case 'error':
        // Fase 4 — mid-group failure report; never a group closer.
        return <ErrorBlock data={entry.data} time={time} />
      case 'quote':
        // Fase 4 — mid-group quotation; never a group closer.
        return <QuoteBlock data={entry.data} time={time} />
      case 'estimate':
        // Fase 4b — the delivery-estimate card; mid-group, informational.
        return <EstimateBlock data={entry.data} time={time} />
      case 'completion':
        return (
          <CompletionBlock
            data={entry.data}
            time={time}
            showFooter={isGroupFinal(position - 1)}
            stats={isGroupFinal(position - 1) ? HISTORY_STATS : undefined}
          />
        )
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
            {/* The SAME dot-matrix loader the classic session pages use
                (SessionTimeline / pendingPhases) — one loader family app-wide. */}
            <DotMatrixLoader variant="drift" size={16} label="Agent is thinking" />
            <span className="kx-stream-typing__label">Thinking…</span>
          </div>
        )
      case 'understanding':
        return <AnswerBlock data={entry.data} time={LIVE_TIME} />
      case 'clarification':
        // Interactive WAIT point: clickable answer chips per question;
        // the run (and the composer) stays parked until every question
        // is answered — then the answers insert as a user bubble below.
        return (
          <ClarificationBlock
            data={entry.data}
            answered={entry.answers}
            onAnswer={(questionId, option) => handleLiveAnswer(entry.id, questionId, option)}
            time={LIVE_TIME}
          />
        )
      case 'answer-bubble':
        // The clarification answers as a user bubble — the same anatomy
        // as the page's inserted-answer pattern (copy only, no edit).
        return (
          <BubbleBlock id={entry.id} time={LIVE_TIME} testId="user-bubble" copyPayload={entry.text}>
            <p className="kx-stream-bubble__text kx-stream-prose">{entry.text}</p>
          </BubbleBlock>
        )
      case 'gate':
        // Outstanding while the run parks (composer locked) — the gate
        // choices are the only way forward; a decision settles the block
        // visibly and resumes (allow) or closes (deny) the staged run.
        return (
          <ApprovalGateBlock
            data={entry.data}
            decision={entry.decision}
            onDecision={(decision) => handleLiveGateDecision(entry.id, decision)}
            time={LIVE_TIME}
          />
        )
      case 'plan':
        // Interactive while it waits: Approve plan plays the execution
        // leg; Request changes closes the turn asking what to change.
        return (
          <PlanBlock
            data={entry.data}
            approved={entry.approved}
            onApprove={() => handleLivePlanDecision(entry.id, true)}
            onRequestChanges={() => handleLivePlanDecision(entry.id, false)}
            time={LIVE_TIME}
          />
        )
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
      case 'review':
        // The fresh finding the deep continuation surfaces mid-run.
        return <ReviewFindingBlock data={entry.data} time={LIVE_TIME} />
      case 'answer':
        // The live script's final answer lands with the footer — the
        // same single-turn rule as the settled history's final answer.
        return <AnswerBlock data={entry.data} time={LIVE_TIME} showFooter stats={LIVE_STATS} />
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
