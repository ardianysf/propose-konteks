/*
 * QuoteBlock — kind 14 (QUOTE): a session-ticket style quotation (spec
 * §Fase 4, anatomy follows TaskQuoteCard): a small muted overline
 * label, the quoted prose as the emphasized content, and a muted
 * attribution line (source · revision). Structural differentiation
 * instead of italics: a 2px ink rule on the left of the quote body +
 * indent (the spec-sanctioned thick rule, mirroring the completion
 * rule). Non-interactive — no actions, no hover affordances — and the
 * turn renders BARE (no kind header): the quotation is the content.
 */
import ResponseBlock from '../ResponseBlock'
import type { QuoteBlockData } from '../sessionStreamTypes'

interface QuoteBlockProps {
  data: QuoteBlockData
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
}

export default function QuoteBlock({
  data,
  time = '14:05',
  showFooter = false,
}: QuoteBlockProps) {
  return (
    <ResponseBlock time={time} showFooter={showFooter}>
      <figure className="kx-stream-quote">
        <p className="kx-stream-quote__label">{data.label}</p>
        <blockquote className="kx-stream-quote__body">
          <p className="kx-stream-quote__text kx-stream-prose">{data.text}</p>
        </blockquote>
        {data.attribution !== undefined && (
          <p className="kx-stream-quote__attribution">{data.attribution}</p>
        )}
      </figure>
    </ResponseBlock>
  )
}
