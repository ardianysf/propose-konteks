/*
 * PlanBlock — kind 4 (PLAN): numbered compact steps inside the agent
 * turn (verb + mono target + agent · estimate · optional risk), footer
 * totals the estimate. Pending shows the primary "Approve plan" action
 * and a ghost "Request changes"; approved settles quiet — checkmark +
 * "Approved" chip, actions retired.
 */
import ResponseBlock, { CheckIcon, PlanIcon, StreamChip } from '../ResponseBlock'
import type { PlanBlockData } from '../sessionStreamTypes'

interface PlanBlockProps {
  data: PlanBlockData
  approved: boolean
  onApprove: () => void
  onRequestChanges: () => void
  time?: string
}

export default function PlanBlock({
  data,
  approved,
  onApprove,
  onRequestChanges,
  time = '14:09',
}: PlanBlockProps) {
  return (
    <ResponseBlock
      kindLabel="PLAN"
      tone={approved ? 'accent' : 'neutral'}
      icon={<PlanIcon />}
      time={time}
      stateChip={
        approved ? (
          <StreamChip tone="accent">approved</StreamChip>
        ) : (
          <StreamChip tone="attention">pending approval</StreamChip>
        )
      }
    >
      <div className="kx-stream-plan">
        <ol className="kx-stream-plan__steps">
          {data.steps.map((step, index) => (
            <li key={step.id} className="kx-stream-plan__step">
              <span className="kx-stream-plan__num kx-stream-tabular">{index + 1}</span>
              <div className="kx-stream-plan__step-main">
                <p className="kx-stream-plan__line">
                  <span className="kx-stream-plan__verb">{step.verb}</span>{' '}
                  <span className={step.targetMono ? 'kx-stream-mono' : undefined}>
                    {step.target}
                  </span>
                </p>
                <p className="kx-stream-plan__meta">
                  {step.agent} · est. {step.estimate}
                  {step.risk ? (
                    <>
                      {' · '}
                      <span className="kx-stream-plan__risk">risk: {step.risk}</span>
                    </>
                  ) : null}
                </p>
              </div>
              {approved && (
                <span className="kx-stream-plan__step-mark" aria-hidden="true">
                  <CheckIcon />
                </span>
              )}
            </li>
          ))}
        </ol>
        <footer className="kx-stream-plan__footer">
          <p className="kx-stream-plan__total">
            Total estimate <span className="kx-stream-tabular">{data.totalEstimate}</span>
          </p>
          {approved ? (
            <p className="kx-stream-plan__approved-note">Approved — execution proceeded.</p>
          ) : (
            <div className="kx-stream-plan__actions">
              <button
                type="button"
                className="kx-stream-btn kx-stream-btn--primary"
                onClick={onApprove}
              >
                Approve plan
              </button>
              <button
                type="button"
                className="kx-stream-btn kx-stream-btn--ghost"
                onClick={onRequestChanges}
              >
                Request changes
              </button>
            </div>
          )}
        </footer>
      </div>
    </ResponseBlock>
  )
}
