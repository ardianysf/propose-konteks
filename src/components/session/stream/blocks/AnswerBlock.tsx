/*
 * AnswerBlock — kind 11 (ANSWER): the agent's conversational reply.
 * Flat prose paragraphs flowing like an assistant message in a chat —
 * no card, no chrome beyond the compact ANSWER header and the shared
 * hover footer (copy / share / time).
 */
import ResponseBlock, { AckIcon, MessageIcon } from '../ResponseBlock'
import type { AnswerBlockData } from '../sessionStreamTypes'

interface AnswerBlockProps {
  data: AnswerBlockData
  time?: string
  /** Presentation variant: the live-mock understanding step reuses the
   * answer anatomy (same AnswerBlockData shape) with the UNDERSTANDING
   * header — the history equivalent renders AcknowledgementBlock. */
  variant?: 'answer' | 'understanding'
}

export default function AnswerBlock({
  data,
  time = '14:58',
  variant = 'answer',
}: AnswerBlockProps) {
  const understanding = variant === 'understanding'
  return (
    <ResponseBlock
      kindLabel={understanding ? 'UNDERSTANDING' : 'ANSWER'}
      tone="neutral"
      icon={understanding ? <AckIcon /> : <MessageIcon />}
      time={time}
    >
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
