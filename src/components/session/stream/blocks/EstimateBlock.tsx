/*
 * EstimateBlock — kind: 'estimate'. The "Review delivery estimate" card
 * of the chat stream (spec §Fase 4b): the same anatomy as the task
 * session's DecisionEstimateCard — small overline label, heading, then
 * dotted-leader estimate rows (label …… value, tabular numerals), a
 * validity line, and a muted note. Informational; non-interactive.
 */
import ResponseBlock, { EstimateIcon } from '../ResponseBlock'
import type { EstimateBlockData } from '../sessionStreamTypes'

interface EstimateBlockProps {
  data: EstimateBlockData
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
}

export default function EstimateBlock({
  data,
  time = '14:00',
  showFooter = false,
}: EstimateBlockProps) {
  return (
    <ResponseBlock
      kindLabel="ESTIMATE"
      tone="neutral"
      icon={<EstimateIcon />}
      time={time}
      showFooter={showFooter}
    >
      <div className="kx-stream-estimate" data-testid="estimate-card">
        <p className="kx-stream-estimate__label">{data.label}</p>
        <h4 className="kx-stream-estimate__heading">{data.heading}</h4>
        <dl className="kx-stream-estimate__rows">
          {data.rows.map((row) => (
            <div className="kx-stream-estimate__row" key={row.label}>
              <dt className="kx-stream-estimate__row-label">{row.label}</dt>
              <span className="kx-stream-estimate__leader" aria-hidden="true" />
              <dd className="kx-stream-estimate__row-value kx-stream-tabular">{row.value}</dd>
            </div>
          ))}
        </dl>
        <p className="kx-stream-estimate__validity">{data.validUntil}</p>
        <p className="kx-stream-estimate__note">{data.note}</p>
      </div>
    </ResponseBlock>
  )
}
