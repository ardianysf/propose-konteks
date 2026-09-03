/*
 * ErrorBlock — kind 13 (ERROR): clear failure information for the user
 * (spec §Fase 4, flat disclosure per review). NO card:
 *
 *   [×] ERROR                       ← attention kind row
 *   [Failed] title…  Show detail ▾  ← summary row (always visible)
 *   [detail — code/source, impact, resolution]  ← revealed below
 *   ────────────────────────────── ← hairline at the BOTTOM
 *
 * The summary row (badge + title + toggle) always reads beneath the
 * hairline; tapping the toggle reveals the detail between the kind row
 * and the line (aria-expanded + aria-controls, [hidden]-guarded). No
 * error token exists — the attention tone plus the badge's firm ×
 * carry the failure (repo convention).
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
      <div className="kx-stream-error" data-testid="error-card">
        <p className="kx-stream-error__kind">
          <ErrorIcon />
          {KIND_LABELS.error}
        </p>

        {/* The summary row: badge + title left, toggle right. Always
         * visible; tapping reveals the detail BELOW it. */}
        <div className="kx-stream-error__summary">
          <StatusBadge status="failed" testId="error-badge" />
          <p className="kx-stream-error__title">{data.title}</p>
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
            {open ? 'Hide detail' : 'Show detail'}
          </button>
        </div>

        {/* The detail sits between the summary row and the bottom line. */}
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
      </div>
    </ResponseBlock>
  )
}
