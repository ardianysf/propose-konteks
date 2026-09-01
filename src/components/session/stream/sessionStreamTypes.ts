/*
 * sessionStreamTypes — type contract for the session response stream demo
 * (spec: .pi/orch/plans/session-stream-ui-spec.md §Bagian B).
 *
 * One discriminated story array drives the demo page: every entry names its
 * response kind and carries the typed payload its block component renders.
 * The anatomy itself (rail, header grammar, body, footer) is shared and
 * lives in ResponseBlock.tsx — these types only describe per-kind content.
 */

/** The ten response kinds from the spec's type table. */
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

/** Semantic tones mapped onto existing --kx-* token families:
 * neutral = ink, accent = success/approved/primary action,
 * attention = needs input / warning / running. No other colors exist. */
export type StreamTone = 'neutral' | 'accent' | 'attention'

/** Explicit execution states for tool calls — the core distinction of the
 * TOOL CALL kind: "will do" (queued) vs "doing" (running) vs "did" (done). */
export type ToolCallState = 'queued' | 'running' | 'done'

// ── 1. User request ──────────────────────────────────────────────────────

export interface RequestChip {
  label: string
  /** Render the chip label in the mono family (paths, params, files). */
  mono?: boolean
  kind: 'attachment' | 'parameter' | 'context'
}

export interface RequestBlockData {
  intent: string
  chips: RequestChip[]
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

export type ArtifactBadge = 'PRD' | 'DIFF' | 'TEST REPORT' | 'RESEARCH'

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

// ── Story array ──────────────────────────────────────────────────────────

/** One entry per response block, in narrative order. The page renders this
 * array top to bottom; the dynamic clarification-answer block is inserted
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
