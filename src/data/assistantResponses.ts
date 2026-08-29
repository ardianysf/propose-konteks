/*
 * assistantResponses — the simulated assistant reply pool + per-reply
 * metadata. RECEIVE picks a random natural response (instead of the old
 * fixed acknowledgment) and attaches response meta (duration/tokens) that
 * the session timeline can surface. Purely illustrative mock data (AC46).
 */

/** Generic, natural assistant responses (English, Konteks engineering
 * tone). The first entry preserves the original fixed acknowledgment. */
export const ASSISTANT_RESPONSES: readonly string[] = [
  'Noted — added to the working context for this cycle.',
  "Got it — I've folded this into the current scope and will factor it into the next proposal.",
  'Understood. Let me trace the affected paths and confirm the impact before proposing a fix.',
  "That's a fair point — I'll weigh the trade-offs and come back with a recommended approach.",
  "Thanks for the detail. I'll cross-check it against the repository state before drafting anything.",
  "On it — I'm reviewing the relevant modules and will report back with findings and options.",
  "Captured. I'll treat this as a constraint for the rest of the cycle and plan around it.",
  'Good catch. Let me verify the edge cases you flagged and adjust the plan if needed.',
  "Makes sense — I'll sequence this after the current fix so the changes stay reviewable.",
  "I've added this to the investigation queue and will surface anything that changes the estimate.",
  'Acknowledged — the working context now reflects this, and follow-up work will account for it.',
  "Understood. I'll keep the change scoped to what you described and flag anything that grows.",
  "Right — I'll validate the assumption against the test suite before committing to an approach.",
]

/** Random member of the response pool. */
export function pickAssistantResponse(): string {
  return ASSISTANT_RESPONSES[Math.floor(Math.random() * ASSISTANT_RESPONSES.length)]
}

/** Simulated usage telemetry attached to every received assistant reply. */
export interface ResponseMeta {
  durationMs: number
  tokensIn: number
  tokensOut: number
}

/** Random response meta: 12–45s duration, 80k–140k input tokens,
 * 300–900 output tokens (inclusive bounds). */
export function generateResponseMeta(): ResponseMeta {
  return {
    durationMs: 12_000 + Math.floor(Math.random() * (45_000 - 12_000 + 1)),
    tokensIn: 80_000 + Math.floor(Math.random() * (140_000 - 80_000 + 1)),
    tokensOut: 300 + Math.floor(Math.random() * (900 - 300 + 1)),
  }
}
