/*
 * AnswerBlock — kind 11 (ANSWER): the agent's conversational reply.
 * Flat prose paragraphs flowing like an assistant message in a chat —
 * no card, no chrome beyond the compact ANSWER header and the shared
 * hover footer (copy / share / time).
 */
import ResponseBlock, { MessageIcon } from '../ResponseBlock'
import type { AnswerBlockData } from '../sessionStreamTypes'

interface AnswerBlockProps {
  data: AnswerBlockData
  time?: string
}

export default function AnswerBlock({ data, time = '14:58' }: AnswerBlockProps) {
  return (
    <ResponseBlock kindLabel="ANSWER" tone="neutral" icon={<MessageIcon />} time={time}>
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
