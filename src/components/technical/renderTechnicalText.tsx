/*
 * renderTechnicalText — prose → ReactNode[] with `` `literal` `` spans
 * rendered as InlineCode (spec §Fase 3b).
 *
 * Agent response prose may name literal system values (paths, IDs,
 * branches, queries). Fixtures mark them with backticks; this helper
 * splits the string on those spans and returns plain text segments plus
 * InlineCode elements. The backticks themselves never reach the DOM (or
 * any accessible name) — only the literal inside does. An unpaired
 * stray backtick is NOT a span: it stays in the plain text.
 *
 * Applied by the agent-facing blocks (Answer, Acknowledgement,
 * Clarification, Completion, ReviewFinding) — never to user bubbles,
 * titles, or structural labels.
 */
import type { ReactNode } from 'react'
import InlineCode from './InlineCode'

/** One backtick-delimited literal span (non-empty content). */
const LITERAL_SPAN = /`([^`]+)`/g

export function renderTechnicalText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let key = 0
  for (const match of text.matchAll(LITERAL_SPAN)) {
    const index = match.index!
    if (index > cursor) nodes.push(text.slice(cursor, index))
    nodes.push(<InlineCode key={key++}>{match[1]}</InlineCode>)
    cursor = index + match[0].length
  }
  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}
