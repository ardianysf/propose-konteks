/*
 * ProgressBlock — kind 6 (IN PROGRESS).
 * Collapsible phase group. Done phases collapse toward a count summary
 * with their tabular durations; the active phase carries the one "alive"
 * moment of the stream (a subtle pulse, disabled under
 * prefers-reduced-motion); queued phases sit dim. Elapsed time rides the
 * shared header's tabular duration slot. "Stop" is a ghost action that
 * acknowledges the request in demo scope.
 */
import { useState } from 'react'
import ResponseBlock, { CheckIcon, ChevronIcon, ProgressIcon } from '../ResponseBlock'
import type { ProgressBlockData } from '../sessionStreamTypes'

interface ProgressBlockProps {
  data: ProgressBlockData
  actor?: string
  time?: string
  defaultExpanded?: boolean
}

export default function ProgressBlock({
  data,
  actor = 'Konteks Engineering Agent',
  time = '09:16',
  defaultExpanded = true,
}: ProgressBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [stopRequested, setStopRequested] = useState(false)
  const doneCount = data.phases.filter((phase) => phase.state === 'done').length
  const summaryLabel = `${data.phases.length} phases · ${doneCount} done`
  const bodyId = `kx-stream-progress-${data.phases.length}-${doneCount}`

  return (
    <ResponseBlock
      kindLabel="IN PROGRESS"
      tone="attention"
      icon={<ProgressIcon />}
      actor={actor}
      time={time}
      duration={data.elapsed}
    >
      <div className="kx-stream-progress">
        <button
          type="button"
          className="kx-stream-collapse-toggle"
          aria-expanded={expanded}
          aria-controls={expanded ? bodyId : undefined}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className={`kx-stream-collapse-chevron${expanded ? ' kx-stream-collapse-chevron--open' : ''}`}>
            <ChevronIcon />
          </span>
          {expanded ? 'Hide phases' : summaryLabel}
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
        <div className="kx-stream-progress__foot">
          <button
            type="button"
            className="kx-stream-btn kx-stream-btn--ghost"
            disabled={stopRequested}
            onClick={() => setStopRequested(true)}
          >
            {stopRequested ? 'Stop requested' : 'Stop'}
          </button>
        </div>
      </div>
    </ResponseBlock>
  )
}
