/*
 * AnswerBlock — kind 11 (ANSWER): the agent's conversational reply.
 * Flat prose paragraphs flowing like an assistant message in a chat —
 * no card, no chrome, and NO kind label or mini header (spec
 * refinements v2 #1): pure conversational prose. The live-mock
 * understanding step reuses this anatomy (same AnswerBlockData shape)
 * — the history equivalent renders AcknowledgementBlock, equally bare.
 *
 * The hover footer (copy / share / time) rides this turn when it is the
 * LAST agent turn of its response group (spec refinements v3 #2) — the
 * page threads `showFooter` to exactly the group-final turns.
 */
import ResponseBlock from '../ResponseBlock'
import { renderTechnicalText } from '../../../technical/renderTechnicalText'
import type { AnswerBlockData } from '../sessionStreamTypes'

interface AnswerBlockProps {
  data: AnswerBlockData
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
  /** Execution stats on the footer (duration · tokens in · out). */
  stats?: { duration: string; tokensIn: string; tokensOut: string }
}

export default function AnswerBlock({
  data,
  time = '14:58',
  showFooter = false,
  stats,
}: AnswerBlockProps) {
  return (
    <ResponseBlock tone="neutral" time={time} showFooter={showFooter} stats={stats}>
      <div className="kx-stream-answer-prose">
        {data.paragraphs.map((paragraph, index) => (
          <p key={index} className="kx-stream-prose">
            {renderTechnicalText(paragraph)}
          </p>
        ))}
      </div>
    </ResponseBlock>
  )
}
