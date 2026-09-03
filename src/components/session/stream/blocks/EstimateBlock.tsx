/*
 * EstimateBlock — kind: 'estimate'. The "Review delivery estimate" CARD
 * of the chat stream (spec §Fase 4b): the task session's
 * DecisionEstimateCard anatomy raised as a bordered card — overline
 * label, heading, dotted-leader estimate rows (label …… value, tabular
 * numerals), validity line, and a muted note.
 *
 * COLLAPSIBLE (review follow-up): the card rests collapsed on the
 * heading + the total row; "Show breakdown" expands the full row list,
 * validity, and note (aria-expanded + aria-controls, the same pattern
 * as the tool-evidence rows and the progress summary).
 */
import { useState } from 'react'
import ResponseBlock, { ChevronIcon, EstimateIcon, KIND_LABELS } from '../ResponseBlock'
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
  const [open, setOpen] = useState(false)
  const total = data.rows[data.rows.length - 1]
  const detailId = 'kx-stream-estimate-detail'

  return (
    <ResponseBlock tone="neutral" time={time} showFooter={showFooter}>
      <div className="kx-stream-estimate-section">
        {/* The disclosure header rides OUTSIDE the card: the estimate
            label + toggle sit between two hairline rules; the card
            below is centered. */}
        <div className="kx-stream-estimate-disclosure">
          <p className="kx-stream-estimate__kind">
            <EstimateIcon />
            {KIND_LABELS.estimate}
          </p>
          <button
            type="button"
            className="kx-stream-estimate__toggle"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((previous) => !previous)}
          >
            <span className={`kx-stream-estimate__chevron${open ? ' kx-stream-estimate__chevron--open' : ''}`}>
              <ChevronIcon />
            </span>
            {open ? 'Hide breakdown' : 'Show breakdown'}
          </button>
        </div>

        <article className="kx-stream-estimate" data-testid="estimate-card" aria-label={data.heading}>
          <h4 className="kx-stream-estimate__heading">{data.heading}</h4>

        {/* Collapsed rest: only the total row reads. */}
        <div id={detailId} className="kx-stream-estimate__detail" hidden={!open}>
          <dl className="kx-stream-estimate__rows">
            {data.rows.slice(0, -1).map((row) => (
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

        {/* The total row always reads — collapsed summary AND the last
            line of the expanded breakdown. */}
        <dl className="kx-stream-estimate__rows">
          <div className="kx-stream-estimate__row kx-stream-estimate__row--total">
            <dt className="kx-stream-estimate__row-label">{total.label}</dt>
            <span className="kx-stream-estimate__leader" aria-hidden="true" />
            <dd className="kx-stream-estimate__row-value kx-stream-tabular">{total.value}</dd>
          </div>
        </dl>
        </article>
      </div>
    </ResponseBlock>
  )
}
