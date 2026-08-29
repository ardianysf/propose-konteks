/*
 * pendingPhases — the assistant "process" phases shown beside the
 * dot-matrix loader while a reply is pending. Each phase pairs a visible
 * label with its own loader variant. Every send (or composer-created
 * session) draws a random contiguous slice of the canonical sequence —
 * 3 to 6 phases — which the reducer stores as `pendingPhases`; the pending
 * bubble advances through those phases every PENDING_PHASE_DURATION_MS,
 * holding the last phase until the reply lands (pendingDelayMs(pendingPhases)
 * after the send).
 */
import type { DotMatrixVariant } from '../ui/DotMatrixLoader'

export interface PendingPhase {
  label: string
  variant: DotMatrixVariant
}

/** The canonical 8-phase process sequence, in order. Variants cycle the
 * five dot-matrix variants so the indicator visibly changes with the
 * process status. */
export const PENDING_PROCESS_PHASES: readonly PendingPhase[] = [
  { label: 'Retrieving context', variant: 'ripple' },
  { label: 'Validating', variant: 'spiral' },
  { label: 'Analyzing', variant: 'drift' },
  { label: 'Planning', variant: 'echo' },
  { label: 'Drafting', variant: 'ripple' },
  { label: 'Cross-checking', variant: 'drift' },
  { label: 'Reviewing', variant: 'spiral' },
  { label: 'Synthesizing', variant: 'glyph' },
]

export const PENDING_PHASE_DURATION_MS = 900

const MIN_PENDING_PHASES = 3
const MAX_PENDING_PHASES = 6

/** A random contiguous slice of the canonical sequence: length 3–6
 * (inclusive) starting at a random valid index, always in canonical
 * order. Returns fresh copies so callers can safely store/mutate labels. */
export function generatePendingPhases(): PendingPhase[] {
  const length =
    MIN_PENDING_PHASES + Math.floor(Math.random() * (MAX_PENDING_PHASES - MIN_PENDING_PHASES + 1))
  const maxStart = PENDING_PROCESS_PHASES.length - length
  const start = Math.floor(Math.random() * (maxStart + 1))
  return PENDING_PROCESS_PHASES.slice(start, start + length).map((phase) => ({ ...phase }))
}

/** Simulated assistant latency for a pending phase list: one phase step
 * per label, send to reply. */
export function pendingDelayMs(labels: readonly string[]): number {
  return labels.length * PENDING_PHASE_DURATION_MS
}
