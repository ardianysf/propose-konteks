/*
 * ApprovalGateBlock — kind 5 (APPROVAL NEEDED).
 * The interstitial: a 2px solid ink frame that must read as a hard stop —
 * action specification rows (what / scope / cost / rollback), a mandatory
 * irreversible-consequence line (attention), and three explicit
 * permission decisions: Allow once (primary), Always this session
 * (secondary), Deny (ghost). Once decided, the whole frame collapses to
 * a quiet resolved summary row. Visually and verbally distinct from
 * ClarificationBlock: strong frame + permission language, never
 * question language.
 */
import ResponseBlock, { AlertIcon, CheckIcon, GateIcon, StreamChip } from '../ResponseBlock'
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
  actor?: string
  time?: string
}

export default function ApprovalGateBlock({
  data,
  decision,
  onDecision,
  actor = 'Konteks Engineering Agent',
  time = '09:14',
}: ApprovalGateBlockProps) {
  const resolved = decision !== undefined
  const allowed = decision === 'allow-once' || decision === 'always'

  return (
    <ResponseBlock
      kindLabel="APPROVAL NEEDED"
      tone={resolved ? (allowed ? 'accent' : 'neutral') : 'attention'}
      icon={<GateIcon />}
      actor={actor}
      time={time}
      stateChip={
        resolved ? (
          <StreamChip tone={allowed ? 'accent' : 'neutral'}>{DECISION_LABELS[decision]}</StreamChip>
        ) : (
          <StreamChip tone="attention">blocking</StreamChip>
        )
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
        <div className="kx-stream-gate">
          <p className="kx-stream-gate__action">{data.action}</p>
          <dl className="kx-stream-gate__rows">
            {data.rows.map((row) => (
              <div className="kx-stream-gate__row" key={row.label}>
                <dt>{row.label}</dt>
                <dd className={row.mono ? 'kx-stream-mono' : undefined}>{row.value}</dd>
              </div>
            ))}
          </dl>
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
