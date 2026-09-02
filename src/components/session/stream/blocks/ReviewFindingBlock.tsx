/*
 * ReviewFindingBlock — kind 9 (REVIEW FINDING): flat agent content.
 * Severity chip (High reads strongest — solid attention fill; Medium
 * outlines attention; Low stays ink), title, impact prose, evidence
 * location in mono, and the quoted snippet.
 */
import ResponseBlock, { ReviewIcon } from '../ResponseBlock'
import type { ReviewFindingBlockData } from '../sessionStreamTypes'

interface ReviewFindingBlockProps {
  data: ReviewFindingBlockData
  time?: string
}

export default function ReviewFindingBlock({
  data,
  time = '14:45',
}: ReviewFindingBlockProps) {
  const severity = data.severity.toLowerCase()

  return (
    <ResponseBlock
      kindLabel="REVIEW FINDING"
      tone="attention"
      icon={<ReviewIcon />}
      time={time}
    >
      <article className="kx-stream-review">
        <header className="kx-stream-review__head">
          <span className={`kx-stream-severity kx-stream-severity--${severity}`}>
            {data.severity}
          </span>
          <p className="kx-stream-review__title">{data.title}</p>
        </header>
        <p className="kx-stream-review__impact kx-stream-prose">{data.impact}</p>
        <p className="kx-stream-review__location kx-stream-mono">{data.location}</p>
        <blockquote className="kx-stream-review__quote">
          <p>{data.quote}</p>
        </blockquote>
      </article>
    </ResponseBlock>
  )
}
