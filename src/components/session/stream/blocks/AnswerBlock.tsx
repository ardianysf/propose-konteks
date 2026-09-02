/*
 * AnswerBlock — kind 11 (ANSWER): the agent's conversational reply.
 * Flat prose paragraphs flowing like an assistant message in a chat —
 * no card, no chrome, and NO kind label or mini header (spec
 * refinements v2 #1): pure conversational prose. The live-mock
 * understanding step reuses this anatomy (same AnswerBlockData shape)
 * — the history equivalent renders AcknowledgementBlock, equally bare.
 *
 * The hover footer (copy / share / time) exists ONLY on the FINAL agent
 * answer turn of the conversation (spec refinements v2 #4) — the page
 * threads `showFooter` to exactly that turn.
 */
import ResponseBlock from '../ResponseBlock'
import type { AnswerBlockData } from '../sessionStreamTypes'

interface AnswerBlockProps {
  data: AnswerBlockData
  time?: string
  /** Hover footer — the final agent answer turn only. */
  showFooter?: boolean
}

export default function AnswerBlock({
  data,
  time = '14:58',
  showFooter = false,
}: AnswerBlockProps) {
  return (
    <ResponseBlock tone="neutral" time={time} showFooter={showFooter}>
      <div className="kx-stream-answer-prose">
        {data.paragraphs.map((paragraph, index) => (
          <p key={index} className="kx-stream-prose">
            {paragraph}
          </p>
        ))}
      </div>
    </ResponseBlock>
  )
}
