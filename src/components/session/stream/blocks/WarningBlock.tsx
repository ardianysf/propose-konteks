/*
 * WarningBlock — kind 12 (WARNING): a SHORT notice row for brief
 * events — "session stopped / not connected" (spec §Fase 4). The
 * anatomy is deliberately minimal: attention icon + one line of prose
 * (renderTechnicalText) inside a hairline 1px frame, radius 8 — no
 * card, no heavy border-left — with an optional trailing StatusBadge
 * ('Blocked' / 'Waiting for input'). The turn renders BARE (no kind
 * header): the row IS the notice.
 */
import ResponseBlock, { WarningIcon } from '../ResponseBlock'
import StatusBadge from '../../../technical/StatusBadge'
import type { TechStatus } from '../../../technical/StatusBadge'
import { renderTechnicalText } from '../../../technical/renderTechnicalText'
import type { WarningBlockData } from '../sessionStreamTypes'

/** Badge copy → the canonical StatusBadge vocabulary: 'Blocked' keeps
 * the danger tone + slashed circle, 'Waiting for input' the pause
 * glyph (the canonical labels match the badge strings verbatim). */
const BADGE_STATUS: Record<NonNullable<WarningBlockData['badge']>, TechStatus> = {
  Blocked: 'blocked',
  'Waiting for input': 'waiting-input',
}

interface WarningBlockProps {
  data: WarningBlockData
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
}

export default function WarningBlock({
  data,
  time = '14:43',
  showFooter = false,
}: WarningBlockProps) {
  const classes = ['kx-stream-warn']
  if (data.tone === 'danger') classes.push('kx-stream-warn--danger')

  return (
    <ResponseBlock tone="attention" time={time} showFooter={showFooter}>
      <p className={classes.join(' ')}>
        <span className="kx-stream-warn__icon" aria-hidden="true">
          <WarningIcon />
        </span>
        <span className="kx-stream-warn__text kx-stream-prose">
          {renderTechnicalText(data.text)}
        </span>
        {data.badge !== undefined && (
          <StatusBadge
            status={BADGE_STATUS[data.badge]}
            className="kx-stream-warn__badge"
            testId="warning-badge"
          />
        )}
      </p>
    </ResponseBlock>
  )
}
