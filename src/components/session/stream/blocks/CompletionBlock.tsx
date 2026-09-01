/*
 * CompletionBlock — kind 10 (HANDOFF).
 * The closing block of the session: a 2px ink rule above, a COMPLETED
 * badge, an honest done list plus an explicit "not done / out of scope"
 * list, artifact links (mono option), numbered next actions, the rollback
 * path statement, and a tabular receipt line.
 */
import ResponseBlock, { CheckIcon, CompletionIcon, MinusIcon, StreamChip } from '../ResponseBlock'
import type { CompletionBlockData } from '../sessionStreamTypes'

interface CompletionBlockProps {
  data: CompletionBlockData
  actor?: string
  time?: string
}

export default function CompletionBlock({
  data,
  actor = 'Konteks Engineering Agent',
  time = '09:52',
}: CompletionBlockProps) {
  return (
    <ResponseBlock
      kindLabel="HANDOFF"
      tone="accent"
      icon={<CompletionIcon />}
      actor={actor}
      time={time}
      className="kx-stream-block--completion"
      stateChip={<StreamChip tone="accent">completed</StreamChip>}
    >
      <div className="kx-stream-completion">
        <section className="kx-stream-completion__section">
          <p className="kx-stream-completion__section-label">Done</p>
          <ul className="kx-stream-completion__list">
            {data.done.map((item) => (
              <li key={item} className="kx-stream-completion__item kx-stream-completion__item--done">
                <span className="kx-stream-completion__mark" aria-hidden="true">
                  <CheckIcon />
                </span>
                <span className="kx-stream-prose">{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="kx-stream-completion__section">
          <p className="kx-stream-completion__section-label">Not done / out of scope</p>
          <ul className="kx-stream-completion__list">
            {data.notDone.map((item) => (
              <li key={item} className="kx-stream-completion__item">
                <span className="kx-stream-completion__mark" aria-hidden="true">
                  <MinusIcon />
                </span>
                <span className="kx-stream-prose">{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="kx-stream-completion__section">
          <p className="kx-stream-completion__section-label">Artifacts</p>
          <ul className="kx-stream-completion__artifacts">
            {data.artifacts.map((artifact) => (
              <li
                key={artifact.label}
                className={`kx-stream-completion__artifact${artifact.mono ? ' kx-stream-completion__artifact--mono' : ''}`}
              >
                {artifact.label}
              </li>
            ))}
          </ul>
        </section>
        <section className="kx-stream-completion__section">
          <p className="kx-stream-completion__section-label">Next actions</p>
          <ol className="kx-stream-completion__next">
            {data.nextActions.map((action, index) => (
              <li key={action} className="kx-stream-completion__next-item">
                <span className="kx-stream-completion__next-num kx-stream-tabular">{index + 1}</span>
                <span className="kx-stream-prose">{action}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="kx-stream-completion__rollback kx-stream-prose">
          <strong>Rollback.</strong> {data.rollback}
        </p>
        <p className="kx-stream-completion__receipt kx-stream-tabular">{data.receipt}</p>
      </div>
    </ResponseBlock>
  )
}
