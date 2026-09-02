/*
 * responseGroup — the "one response = one footer" grouping rule (spec
 * refinements v3 #2, replacing v2 #4).
 *
 * A RESPONSE GROUP is a run of consecutive AGENT turns that ends right
 * before the next USER turn — a fixture request bubble, an inserted
 * clarification-answer bubble, or a live composer bubble — or at the
 * end of the conversation. The hover footer (copy / share / time)
 * rides the LAST agent turn of EACH group (whatever kind that turn
 * is), and no other turn.
 *
 * The grouping is computed from the RENDERED turn-kind sequence, so
 * the caller passes the kinds in conversation order: user kinds are
 * 'request' (fixture bubbles) and 'user' (inserted answers + live
 * sends); everything else — including the transient live typing step —
 * counts as an agent turn.
 */

/** User turn kinds — request bubbles, inserted answers, live sends. */
export function isUserTurnKind(kind: string): boolean {
  return kind === 'request' || kind === 'user'
}

/** True when the turn at `index` is the LAST agent turn of its response
 * group: an agent turn whose next rendered turn is a user turn, or the
 * last turn of the whole conversation. User turns never carry a
 * footer. */
export function isLastAgentTurnOfResponse(kinds: readonly string[], index: number): boolean {
  if (isUserTurnKind(kinds[index] ?? '')) return false
  const next = kinds[index + 1]
  return next === undefined || isUserTurnKind(next)
}
