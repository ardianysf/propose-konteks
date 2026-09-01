/*
 * StageChips — the per-task workflow stage row (replaces SessionTracker
 * on the task session page): Ideation/Quote in the attention state, the
 * mid stages as pending dots, and "Konteks learned" with a book glyph.
 * The book icon has no existing glyph in icons.tsx, so it is drawn here
 * in the same stroke family (16×16 viewBox, ~1.4 currentColor strokes).
 */
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import type { TaskSessionDetailData } from '../../data/mockData'
import './StageChips.css'

type Stage = TaskSessionDetailData['stages'][number]

/** Book glyph — matches the shell chrome stroke family. */
function BookIcon() {
  return (
    <svg
      data-icon="book"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 3.5C6.8 2.6 5.2 2.4 2.5 2.6v9.4c2.7-.2 4.3 0 5.5.9 1.2-.9 2.8-1.1 5.5-.9V2.6c-2.7-.2-4.3 0-5.5.9zM8 3.5v9.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StageMarker({ state }: { state: Stage['state'] }) {
  if (state === 'done') {
    return (
      <span className="kx-stage-chip__marker kx-stage-chip__marker--done" aria-hidden="true">
        <BookIcon />
      </span>
    )
  }
  return (
    <span
      className={`kx-stage-chip__marker kx-stage-chip__marker--${state}`}
      aria-hidden="true"
    />
  )
}

export default function StageChips() {
  const { stages } = TASK_SESSION_DETAIL

  return (
    <ul
      className="kx-stage-chips"
      aria-label="Task workflow stages"
      data-testid="task-stage-chips"
    >
      {stages.map((stage) => (
        <li
          key={stage.label}
          className={`kx-stage-chip kx-stage-chip--${stage.state}`}
          data-state={stage.state}
        >
          <StageMarker state={stage.state} />
          <span className="kx-stage-chip__label">{stage.label}</span>
          {stage.detail && <span className="kx-stage-chip__detail">{stage.detail}</span>}
        </li>
      ))}
    </ul>
  )
}
