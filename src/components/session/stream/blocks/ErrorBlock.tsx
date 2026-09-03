/*
 * ErrorBlock — kind 13 (ERROR): clear failure information for the user
 * (spec §Fase 4, disclosure pattern per review). The SAME UI family as
 * the estimate card: the error icon + ERROR label ride a disclosure
 * header between two hairline rules, with the Show-details toggle;
 * below it the failure CARD sits centered. The title + Failed badge
 * always read (the collapsed summary); the detail — code & source as
 * mono literals (InlineCode), impact prose (renderTechnicalText), and
 * the optional resolution line — expands on demand (aria-expanded +
 * aria-controls, [hidden]-guarded). No error token exists — the
 * attention tone plus the badge's firm × carry the failure (repo
 * convention).
 */
import { useState } from 'react'
import ResponseBlock, { ChevronIcon, ErrorIcon, KIND_LABELS } from '../ResponseBlock'
import StatusBadge from '../../../technical/StatusBadge'
import InlineCode from '../../../technical/InlineCode'
import { renderTechnicalText } from '../../../technical/renderTechnicalText'
import type { ErrorBlockData } from '../sessionStreamTypes'

interface ErrorBlockProps {
  data: ErrorBlockData
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
}

export default function ErrorBlock({
  data,
  time = '14:31',
  showFooter = false,
}: ErrorBlockProps) {
  const [open, setOpen] = useState(false)
  const detailId = 'kx-stream-error-detail'

  return (
    <ResponseBlock tone="attention" time={time} showFooter={showFooter}>
      <div className="kx-stream-error-section">
        {/* The disclosure header: error icon + ERROR label between two
         * hairline rules, toggle on the right — the estimate UI family. */}
        <div className="kx-stream-error-disclosure">
          <p className="kx-stream-error__kind">
            <ErrorIcon />
            {KIND_LABELS.error}
          </p>
          <button
            type="button"
            className="kx-stream-error__toggle"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((previous) => !previous)}
          >
            <span className={`kx-stream-error__chevron${open ? ' kx-stream-error__chevron--open' : ''}`}>
              <ChevronIcon />
            </span>
            {open ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <article className="kx-stream-error" data-testid="error-card" aria-label={data.title}>
          <div className="kx-stream-error__summary">
            <StatusBadge status="failed" testId="error-badge" />
            <p className="kx-stream-error__title">{data.title}</p>
          </div>

          <div id={detailId} className="kx-stream-error__detail" hidden={!open}>
            {(data.code !== undefined || data.source !== undefined) && (
              <p className="kx-stream-error__meta">
                {data.code !== undefined && <InlineCode>{data.code}</InlineCode>}
                {data.source !== undefined && <InlineCode>{data.source}</InlineCode>}
              </p>
            )}
            <p className="kx-stream-error__impact kx-stream-prose">{renderTechnicalText(data.impact)}</p>
            {data.resolution !== undefined && (
              <p
                className={`kx-stream-error__resolution kx-stream-error__resolution--${data.resolution.tone}`}
              >
                {data.resolution.text}
              </p>
            )}
          </div>
        </article>
      </div>
    </ResponseBlock>
  )
}
