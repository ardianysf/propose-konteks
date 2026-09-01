/*
 * DecisionEstimateCard — the "DECISION NEEDED / Review delivery estimate"
 * card for the task session page: dotted-leader estimate rows (label left,
 * value right, dotted flex leader between), validity + guidance note, and
 * the action row (primary filled / quiet text / attention-colored decline
 * per the --kx-attention token's documented decline affordance). Buttons
 * are mock-only affordances — no side effects.
 */
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import type { TaskSessionDetailData } from '../../data/mockData'
import './DecisionEstimateCard.css'

type DecisionAction = TaskSessionDetailData['decision']['actions'][number]

function actionClassName(kind: DecisionAction['kind']): string {
  if (kind === 'primary') return 'kx-btn kx-btn--primary kx-decision-card__action'
  if (kind === 'danger') return 'kx-decision-card__action kx-decision-card__action--danger'
  return 'kx-decision-card__action kx-decision-card__action--text'
}

export default function DecisionEstimateCard() {
  const { decision } = TASK_SESSION_DETAIL

  return (
    <article
      className="kx-decision-card"
      data-testid="decision-estimate-card"
      aria-label={decision.heading}
    >
      <p className="kx-decision-card__label">{decision.label}</p>
      <h3 className="kx-decision-card__heading">{decision.heading}</h3>

      <dl className="kx-decision-card__rows">
        {decision.rows.map((row) => (
          <div className="kx-decision-card__row" key={row.label}>
            <dt className="kx-decision-card__row-label">{row.label}</dt>
            <span className="kx-decision-card__leader" aria-hidden="true" />
            <dd className="kx-decision-card__row-value">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="kx-decision-card__validity">{decision.validUntil}</p>
      <p className="kx-decision-card__note">{decision.note}</p>

      <div className="kx-decision-card__actions">
        {decision.actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={actionClassName(action.kind)}
            data-kind={action.kind}
            onClick={() => {
              // Mock-only affordance: no approval state change in the mockup.
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  )
}
