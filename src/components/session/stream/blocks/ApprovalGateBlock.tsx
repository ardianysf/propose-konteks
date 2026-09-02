/*
 * ApprovalGateBlock — kind 5 (APPROVAL GATE).
 * While pending this is the most prominent block on the page: a 2px
 * solid ink frame carrying the `APPROVAL NEEDED` status chip INSIDE
 * the box at its top (spec refinements v3 #3), the action
 * specification rows, the MANDATORY irreversible-consequence line, and
 * three explicit decisions — Allow once (primary), Always this session
 * (secondary), Deny (ghost). Once decided it settles quiet: a single
 * resolved line with the recorded decision (and the quiet header chip
 * echoing it — settled state unaffected).
 */
import ResponseBlock, { AlertIcon, CheckIcon, GateIcon, StreamChip } from '../ResponseBlock'
import MetadataPair from '../../../technical/MetadataPair'
import StatusBadge from '../../../technical/StatusBadge'
import type { ApprovalGateBlockData, GateDecision } from '../sessionStreamTypes'

const DECISION_LABELS: Record<GateDecision, string> = {
  'allow-once': 'Allow once',
  always: 'Always this session',
  deny: 'Deny',
}

interface ApprovalGateBlockProps {
  data: ApprovalGateBlockData
  decision?: GateDecision
  onDecision: (decision: GateDecision) => void
  time?: string
}

export default function ApprovalGateBlock({
  data,
  decision,
  onDecision,
  time = '14:16',
}: ApprovalGateBlockProps) {
  const resolved = decision !== undefined
  const allowed = decision === 'allow-once' || decision === 'always'

  return (
    <ResponseBlock
      kindLabel="APPROVAL"
      tone={resolved ? (allowed ? 'accent' : 'neutral') : 'attention'}
      icon={<GateIcon />}
      time={time}
      stateChip={
        resolved ? (
          <StreamChip tone={allowed ? 'accent' : 'neutral'}>{DECISION_LABELS[decision]}</StreamChip>
        ) : undefined
      }
    >
      {resolved ? (
        <div className="kx-stream-gate kx-stream-gate--resolved">
          <p className="kx-stream-gate__resolved-line">
            <span className="kx-stream-gate__resolved-mark">
              <CheckIcon />
            </span>
            Decision recorded: <strong>{DECISION_LABELS[decision]}</strong> · {data.action}
          </p>
        </div>
      ) : (
        <div className="kx-stream-gate" data-testid="gate-pending">
          {/* The status chip rides INSIDE the frame, top area (spec
              refinements v3 #3) — not outside/above the strong box.
              Technical-text integration: the outstanding chip is the
              canonical "Waiting approval" StatusBadge. */}
          <p className="kx-stream-gate__status">
            <StatusBadge status="waiting-approval" testId="gate-waiting-badge" />
          </p>
          <p className="kx-stream-gate__action">{data.action}</p>
          <div className="kx-stream-gate__rows">
            {data.rows.map((row) => (
              <MetadataPair
                key={row.label}
                label={row.label}
                value={row.value}
                mono={row.mono}
                className="kx-stream-gate__row"
              />
            ))}
          </div>
          <p className="kx-stream-gate__consequence">
            <AlertIcon />
            <span>{data.consequence}</span>
          </p>
          <div className="kx-stream-gate__decisions" role="group" aria-label="Gate decision">
            <button
              type="button"
              className="kx-stream-btn kx-stream-btn--primary"
              onClick={() => onDecision('allow-once')}
            >
              Allow once
            </button>
            <button
              type="button"
              className="kx-stream-btn kx-stream-btn--secondary"
              onClick={() => onDecision('always')}
            >
              Always this session
            </button>
            <button
              type="button"
              className="kx-stream-btn kx-stream-btn--ghost"
              onClick={() => onDecision('deny')}
            >
              Deny
            </button>
          </div>
        </div>
      )}
    </ResponseBlock>
  )
}
