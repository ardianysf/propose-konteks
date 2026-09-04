/*
 * sessionStreamTypes — type contract for the session response stream demo
 * (spec: .pi/orch/plans/session-stream-ui-spec.md §Bagian B).
 *
 * One discriminated story array drives the demo page: every entry names its
 * response kind and carries the typed payload its block component renders.
 * The anatomy itself (rail, header grammar, body, footer) is shared and
 * lives in ResponseBlock.tsx — these types only describe per-kind content.
 */

/** The response kinds from the spec's type table. `answer` is the
 * agent's conversational final reply (chat spec) — rendered as flat
 * prose like every other agent turn. */
export type StreamKind =
  | 'request'
  | 'acknowledgement'
  | 'clarification'
  | 'plan'
  | 'approval-gate'
  | 'progress'
  | 'tool'
  | 'artifact'
  | 'review'
  | 'completion'
  | 'answer'
  | 'warning'
  | 'error'
  | 'quote'
  | 'estimate'

/** Semantic tones mapped onto existing --kx-* token families:
 * neutral = ink, accent = success/approved/primary action,
 * attention = needs input / warning / running. No other colors exist. */
export type StreamTone = 'neutral' | 'accent' | 'attention'

/** Explicit execution states for tool calls — the core distinction of the
 * TOOL CALL kind: "will do" (queued) vs "doing" (running) vs "did" (done). */
export type ToolCallState = 'queued' | 'running' | 'done'

// ── 1. User request (chat bubble) ────────────────────────────────────────

/** A file attachment rendered as a card inside the user bubble. */
export interface RequestAttachment {
  name: string
  /** Meta line under the name — size/type/rows ("CSV · 1,284 rows · 38 KB"). */
  meta: string
  /** File-type glyph from the shared icon family. */
  type?: 'doc' | 'sheet' | 'diff' | 'archive'
}

export interface RequestChip {
  label: string
  /** Render the chip label in the mono family (paths, params, files). */
  mono?: boolean
  kind: 'attachment' | 'parameter' | 'context'
  /** Optional meta line when the chip renders as an attachment card. */
  meta?: string
}

export interface RequestBlockData {
  intent: string
  chips: RequestChip[]
  /** Chat prose for the user bubble (falls back to `intent`). */
  message?: string
  /** Explicit attachment cards; when absent, attachment-kind chips render
   * as cards instead. */
  attachments?: RequestAttachment[]
}

// ── 2. Acknowledgement ───────────────────────────────────────────────────

export interface AcknowledgementBlockData {
  summary: string
  scopeIn: string[]
  scopeOut: string[]
  confidence: string
  confidenceNote: string
  grounding: string
}

// ── 3. Clarification ─────────────────────────────────────────────────────

export interface ClarificationQuestion {
  id: string
  question: string
  options: string[]
}

export interface ClarificationBlockData {
  /** Shown while answers are outstanding (attention). */
  pausedNotice: string
  /** Shown once every question is answered (accent). */
  resumedNotice: string
  questions: ClarificationQuestion[]
  /** Settled history: the recorded answers (aligned to `questions` by
   * index). When present the block renders its settled state — no
   * interactive chips — because the answers already sit in the stream
   * as user bubbles. */
  settledAnswers?: string[]
}

// ── 4. Plan ──────────────────────────────────────────────────────────────

export interface PlanStep {
  id: string
  /** Imperative verb leading the step line ("Trace", "Draft", "Review"). */
  verb: string
  target: string
  /** Render target in the mono family (paths, docs). */
  targetMono?: boolean
  agent: string
  estimate: string
  risk?: string
}

export interface PlanBlockData {
  steps: PlanStep[]
  totalEstimate: string
}

// ── 5. Approval gate ─────────────────────────────────────────────────────

export interface GateRow {
  label: string
  value: string
  mono?: boolean
}

export interface ApprovalGateBlockData {
  action: string
  rows: GateRow[]
  /** MUST row — the irreversible-consequence statement. */
  consequence: string
}

export type GateDecision = 'allow-once' | 'always' | 'deny'

// ── 6. Live progress ─────────────────────────────────────────────────────

export interface ProgressPhase {
  id: string
  label: string
  state: 'done' | 'active' | 'queued'
  /** Tabular duration string ("41s") for completed phases. */
  duration?: string
}

export interface ProgressBlockData {
  elapsed: string
  phases: ProgressPhase[]
}

// ── 7. Tool evidence ─────────────────────────────────────────────────────

export interface ToolIo {
  /** Mono input line (command, query, path). */
  input: string
  /** Mono output lines (may be diff lines prefixed with + / -). */
  output: string[]
}

export interface ToolCall {
  id: string
  verb: string
  /** Path or query — always mono. */
  target: string
  state: ToolCallState
  duration?: string
  /** One-line result summary for done calls. */
  result?: string
  /** Expandable evidence (input/output) for done calls. */
  io?: ToolIo
}

export interface ToolEvidenceBlockData {
  calls: ToolCall[]
}

// ── 8. Artifact ──────────────────────────────────────────────────────────

export type ArtifactBadge = 'PRD' | 'DIFF' | 'TEST REPORT' | 'RESEARCH' | 'REPORT'

export interface ArtifactBlockData {
  badge: ArtifactBadge
  title: string
  excerpt: string
  /** Mono schema/data snippet rendered inside the preview (data, not prose). */
  schema: string[]
  version: string
  time: string
  /** Plain-text payload for the Copy/Download actions. */
  copyPayload: string
}

// ── 9. Review finding ────────────────────────────────────────────────────

export interface ReviewFindingBlockData {
  severity: 'High' | 'Medium' | 'Low'
  title: string
  impact: string
  /** file:line reference — mono. */
  location: string
  quote: string
}

// ── 10. Completion / handoff ─────────────────────────────────────────────

export interface CompletionBlockData {
  done: string[]
  /** Honest "not done / out of scope" section. */
  notDone: string[]
  artifacts: Array<{ label: string; mono?: boolean }>
  nextActions: string[]
  /** Recovery path statement. */
  rollback: string
  receipt: string
}

// ── 12. Delivery estimate (chat spec Fase 4b) ───────────────────────────

/** The "Review delivery estimate" card (mirrors the task session's
 * DecisionEstimateCard): dotted-leader rows, validity, and a note. */
export interface EstimateRow {
  label: string
  value: string
}

export interface EstimateBlockData {
  label: string
  heading: string
  rows: EstimateRow[]
  validUntil: string
  note: string
}

// ── 11. Agent answer (chat spec) ─────────────────────────────────────────

/** The agent's conversational reply — flat prose paragraphs, no card. */
export interface AnswerBlockData {
  paragraphs: string[]
}

// ── 12-14. Warning / Error / Quote (spec §Fase 4) ────────────────────────

/** A SHORT notice row for brief events ("session paused / connection
 * lost"): attention icon + one line of prose in a hairline frame,
 * with an optional trailing StatusBadge. */
export interface WarningBlockData {
  text: string
  /** Narrow semantic override for recovered connection-failure notices:
   * danger adds a restrained red tint while ordinary warnings stay
   * visually unchanged. */
  tone?: 'danger'
  /** Trailing StatusBadge copy — 'Blocked' (danger tone) or
   * 'Waiting for input' (pause glyph). */
  badge?: 'Blocked' | 'Waiting for input'
}

/** Clear failure information: Failed badge + title, the code and the
 * source as mono literals, impact prose, and an optional resolution
 * line. No error token exists — attention + the badge's firm × carry
 * the tone (repo convention). */
export interface ErrorBlockData {
  title: string
  /** Error code / identifier — mono. */
  code?: string
  /** file:line or endpoint the failure came from — mono. */
  source?: string
  impact: string
  resolution?: {
    text: string
    tone: 'accent' | 'attention'
  }
}

/** A session-ticket style quotation: muted overline label, the quoted
 * prose (the emphasized content), and a muted attribution line
 * (source · time). Non-interactive. */
export interface QuoteBlockData {
  label: string
  text: string
  attribution?: string
}

// ── Story array ──────────────────────────────────────────────────────────

/** One entry per response block, in narrative order. The page renders this
 * array top to bottom; the dynamic clarification-answer bubble is inserted
 * by the page between the clarification entry and whatever follows. */
export type StreamStoryEntry =
  | { kind: 'request'; data: RequestBlockData }
  | { kind: 'acknowledgement'; data: AcknowledgementBlockData }
  | { kind: 'clarification'; data: ClarificationBlockData }
  | { kind: 'plan'; data: PlanBlockData }
  | { kind: 'approval-gate'; data: ApprovalGateBlockData }
  | { kind: 'progress'; data: ProgressBlockData }
  | { kind: 'tool'; data: ToolEvidenceBlockData }
  | { kind: 'artifact'; data: ArtifactBlockData }
  | { kind: 'review'; data: ReviewFindingBlockData }
  | { kind: 'completion'; data: CompletionBlockData }
  | { kind: 'answer'; data: AnswerBlockData }
  | { kind: 'warning'; data: WarningBlockData }
  | { kind: 'error'; data: ErrorBlockData }
  | { kind: 'quote'; data: QuoteBlockData }
  | { kind: 'estimate'; data: EstimateBlockData }
