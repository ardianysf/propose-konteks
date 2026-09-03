/*
 * ErrorBlock — kind 13 (ERROR): clear failure information for the user
 * (spec §Fase 4). The Failed badge (danger tone, firm ×) + the error
 * title lead; the code and the source render as mono literals
 * (InlineCode); the impact reads as prose (renderTechnicalText); an
 * optional resolution line closes with accent (resolved) or attention
 * (needs action) ink. No error token exists — the attention tone plus
 * the badge's firm × carry the failure (repo convention).
 */
import ResponseBlock, { ErrorIcon } from '../ResponseBlock'
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
  return (
    <ResponseBlock
      kindLabel="ERROR"
      tone="attention"
      icon={<ErrorIcon />}
      stateChip={<StatusBadge status="failed" testId="error-badge" />}
      time={time}
      showFooter={showFooter}
    >
      <article className="kx-stream-error">
        <p className="kx-stream-error__title">{data.title}</p>
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
      </article>
    </ResponseBlock>
  )
}
