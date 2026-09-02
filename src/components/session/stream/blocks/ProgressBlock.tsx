/*
 * ProgressBlock — kind 6 (PROGRESS).
 * In settled history it renders as ONE collapsed summary line:
 * "N phases · elapsed · Completed" (or "X of N done" while unfinished).
 * The line is an expandable toggle (aria-expanded / aria-controls) that
 * reveals the phase list — done phases with tabular durations, an
 * active phase with the stream's one pulse (dead under
 * prefers-reduced-motion), queued phases dim.
 */
import { useId, useState } from 'react'
import ResponseBlock, { CheckIcon, ChevronIcon, ProgressIcon } from '../ResponseBlock'
import type { ProgressBlockData } from '../sessionStreamTypes'

interface ProgressBlockProps {
  data: ProgressBlockData
  time?: string
  defaultExpanded?: boolean
}

export default function ProgressBlock({
  data,
  time = '14:19',
  defaultExpanded = false,
}: ProgressBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const bodyId = useId()
  const doneCount = data.phases.filter((phase) => phase.state === 'done').length
  const status =
    doneCount === data.phases.length ? 'Completed' : `${doneCount} of ${data.phases.length} done`
  const summary = `${data.phases.length} phases · ${data.elapsed} · ${status}`

  return (
    <ResponseBlock kindLabel="PROGRESS" tone="neutral" icon={<ProgressIcon />} time={time}>
      <div className="kx-stream-progress">
        <button
          type="button"
          className="kx-stream-progress__summary"
          data-testid="progress-summary"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((value) => !value)}
        >
          <span
            className={`kx-stream-collapse-chevron${expanded ? ' kx-stream-collapse-chevron--open' : ''}`}
          >
            <ChevronIcon />
          </span>
          <span className="kx-stream-tabular">{summary}</span>
        </button>
        {expanded && (
          <ol id={bodyId} className="kx-stream-progress__phases">
            {data.phases.map((phase) => (
              <li key={phase.id} className={`kx-stream-phase kx-stream-phase--${phase.state}`}>
                <span className="kx-stream-phase__mark" aria-hidden="true">
                  {phase.state === 'done' && <CheckIcon />}
                  {phase.state === 'active' && <span className="kx-stream-phase__pulse" />}
                  {phase.state === 'queued' && <span className="kx-stream-phase__dot" />}
                </span>
                <span className="kx-stream-phase__label">{phase.label}</span>
                {phase.state === 'done' && phase.duration && (
                  <span className="kx-stream-phase__duration kx-stream-tabular">
                    {phase.duration}
                  </span>
                )}
                {phase.state === 'active' && <span className="kx-stream-phase__now">running</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </ResponseBlock>
  )
}
