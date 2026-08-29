/*
 * pendingPhases — the assistant "process" phases shown beside the
 * dot-matrix loader while a reply is pending. Each phase pairs a visible
 * label with its own loader variant; the pending bubble advances through
 * the phases every PENDING_PHASE_DURATION_MS, holding the last phase until
 * the reply lands (PENDING_TOTAL_MS after the send).
 */
import type { DotMatrixVariant } from '../ui/DotMatrixLoader'

export interface PendingPhase {
  label: string
  variant: DotMatrixVariant
}

/** Validating → Analyzing → Synthesizing; each phase swaps the loader
 * variant so the indicator visibly changes with the process status. */
export const PENDING_PHASES: readonly PendingPhase[] = [
  { label: 'Validating', variant: 'ripple' },
  { label: 'Analyzing', variant: 'drift' },
  { label: 'Synthesizing', variant: 'glyph' },
]

export const PENDING_PHASE_DURATION_MS = 900

/** Simulated assistant latency: the full phase sequence, send to reply. */
export const PENDING_TOTAL_MS = PENDING_PHASES.length * PENDING_PHASE_DURATION_MS
