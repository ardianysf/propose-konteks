/*
 * ReviewFindingBlock — kind 9 (REVIEW FINDING).
 * Finding card: severity chip (High reads strongest — solid attention
 * fill; Medium outlines attention; Low stays ink), title, impact prose,
 * evidence location in mono with a quoted snippet, and the three
 * response options as ghost buttons (demo affordances).
 */
import ResponseBlock, { ReviewIcon } from '../ResponseBlock'
import type { ReviewFindingBlockData } from '../sessionStreamTypes'

interface ReviewFindingBlockProps {
  data: ReviewFindingBlockData
  actor?: string
  time?: string
}

export default function ReviewFindingBlock({
  data,
  actor = 'Konteks Review Agent',
  time = '09:38',
}: ReviewFindingBlockProps) {
  const severity = data.severity.toLowerCase()

  return (
    <ResponseBlock kindLabel="REVIEW FINDING" tone="attention" icon={<ReviewIcon />} actor={actor} time={time}>
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
        <footer className="kx-stream-review__actions">
          <button type="button" className="kx-stream-btn kx-stream-btn--secondary">
            Auto-fix
          </button>
          <button type="button" className="kx-stream-btn kx-stream-btn--ghost">
            Dismiss with reason
          </button>
          <button type="button" className="kx-stream-btn kx-stream-btn--ghost">
            Escalate
          </button>
        </footer>
      </article>
    </ResponseBlock>
  )
}
