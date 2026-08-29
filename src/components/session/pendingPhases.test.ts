import { describe, expect, it } from 'vitest'
import {
  generatePendingPhases,
  PENDING_PHASE_DURATION_MS,
  PENDING_PROCESS_PHASES,
  pendingDelayMs,
} from './pendingPhases'

const CANONICAL_LABELS = PENDING_PROCESS_PHASES.map((phase) => phase.label)

describe('PENDING_PROCESS_PHASES', () => {
  it('defines the 8 canonical phases in order, each with one of the five loader variants', () => {
    expect(CANONICAL_LABELS).toEqual([
      'Retrieving context',
      'Validating',
      'Analyzing',
      'Planning',
      'Drafting',
      'Cross-checking',
      'Reviewing',
      'Synthesizing',
    ])
    for (const phase of PENDING_PROCESS_PHASES) {
      expect(['spiral', 'drift', 'ripple', 'echo', 'glyph']).toContain(phase.variant)
    }
  })

  it('keeps the phase step at 900ms', () => {
    expect(PENDING_PHASE_DURATION_MS).toBe(900)
  })
})

describe('generatePendingPhases', () => {
  it('always returns a contiguous canonical slice of length 3–6 (500 draws)', () => {
    for (let i = 0; i < 500; i += 1) {
      const phases = generatePendingPhases()
      expect(phases.length).toBeGreaterThanOrEqual(3)
      expect(phases.length).toBeLessThanOrEqual(6)
      const labels = phases.map((phase) => phase.label)
      const start = CANONICAL_LABELS.indexOf(labels[0])
      expect(start).toBeGreaterThanOrEqual(0)
      // Contiguous canonical slice, in canonical order, variants intact.
      expect(
        PENDING_PROCESS_PHASES.slice(start, start + labels.length).map((phase) => ({ ...phase })),
      ).toEqual(phases)
    }
  })

  it('draws every slice length 3–6 across many draws (randomness sanity)', () => {
    const lengths = new Set<number>()
    for (let i = 0; i < 500 && lengths.size < 4; i += 1) {
      lengths.add(generatePendingPhases().length)
    }
    expect([...lengths].sort()).toEqual([3, 4, 5, 6])
  })
})

describe('pendingDelayMs', () => {
  it('is one 900ms phase step per label', () => {
    expect(pendingDelayMs([])).toBe(0)
    expect(pendingDelayMs(['a'])).toBe(900)
    expect(pendingDelayMs(['a', 'b', 'c'])).toBe(2_700)
    expect(pendingDelayMs(CANONICAL_LABELS)).toBe(CANONICAL_LABELS.length * PENDING_PHASE_DURATION_MS)
  })

  it('matches the delay of a generated slice', () => {
    const phases = generatePendingPhases()
    expect(pendingDelayMs(phases.map((phase) => phase.label))).toBe(
      phases.length * PENDING_PHASE_DURATION_MS,
    )
  })
})
