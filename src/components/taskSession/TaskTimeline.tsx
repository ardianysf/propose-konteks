/*
 * TaskTimeline — assistant work narrative for the task session page:
 * condensed narrative paragraphs (ticket codes and repo names render as
 * mono code chips), the "Summary" work report block, retry event pills
 * (the stopped row gets a stronger attention outline + exclamation icon),
 * and the finished-responding line. Content comes entirely from the
 * TASK_SESSION_DETAIL fixture; left-aligned like assistant timeline
 * bubbles, no sender identities/timestamps per SessionTimeline convention.
 */
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import './TaskTimeline.css'

/** Hyphenated lowercase compounds that are English prose, not machine
 * identifiers — excluded from code-chip rendering. */
const PROSE_HYPHEN_WORDS = new Set(['non-executable'])

/** Matches ticket codes (TKT-3) and hyphenated lowercase repo/service
 * identifiers (orders-api) inside narrative text. */
const CODE_CHIP_PATTERN = /\b(?:TKT-\d+|[a-z]+(?:-[a-z]+)+)\b/g

interface NarrativeSegment {
  text: string
  isChip: boolean
}

/** Splits a narrative string into plain-text and code-chip segments so
 * identifiers render in mono chips while the prose stays untouched. */
function segmentNarrative(text: string): NarrativeSegment[] {
  const segments: NarrativeSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(CODE_CHIP_PATTERN)) {
    const token = match[0]
    const index = match.index ?? 0
    if (PROSE_HYPHEN_WORDS.has(token)) continue
    if (index > cursor) segments.push({ text: text.slice(cursor, index), isChip: false })
    segments.push({ text: token, isChip: true })
    cursor = index + token.length
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), isChip: false })
  return segments
}

/** Narrative text with embedded mono code chips (TKT codes, repo names). */
function TextWithChips({ text }: { text: string }) {
  const segments = segmentNarrative(text)
  return (
    <>
      {segments.map((segment, index) =>
        segment.isChip ? (
          <code key={index} className="kx-task-timeline__chip">
            {segment.text}
          </code>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  )
}

/** Exclamation glyph for the stopped-retry pill (attention colored). */
function ExclamationIcon() {
  return (
    <svg
      data-icon="exclamation"
      viewBox="0 0 16 16"
      width="12"
      height="12"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.8v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.4" r="0.9" fill="currentColor" />
    </svg>
  )
}

export default function TaskTimeline() {
  const { assistantNarrative, summaryReport, retryEvents, finishedMeta } = TASK_SESSION_DETAIL

  return (
    <section className="kx-task-timeline" aria-label="Task session work timeline" data-testid="task-timeline">
      {/* Assistant narrative — left-aligned assistant-bubble family. */}
      <div className="kx-task-timeline__narrative" data-testid="task-narrative">
        {assistantNarrative.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="kx-task-timeline__paragraph">
            <TextWithChips text={paragraph} />
          </p>
        ))}
      </div>

      {/* Work report ("laporan pekerjaan") summary block. */}
      <div className="kx-task-timeline__report" data-testid="task-summary-report">
        <h3 className="kx-task-timeline__report-heading">{summaryReport.heading}</h3>
        <ul className="kx-task-timeline__report-list">
          {summaryReport.bullets.map((bullet) => (
            <li key={bullet.slice(0, 40)} className="kx-task-timeline__report-bullet">
              <TextWithChips text={bullet} />
            </li>
          ))}
        </ul>
      </div>

      {/* Retry event pills — muted rounded pills, time right-aligned; the
          stopped row reads stronger (attention outline + exclamation). */}
      <ul className="kx-task-timeline__retries" data-testid="task-retry-events">
        {retryEvents.map((event) => (
          <li
            key={event.text}
            className={`kx-task-timeline__retry${event.stopped ? ' kx-task-timeline__retry--stopped' : ''}`}
            data-testid="task-retry-event"
          >
            {event.stopped && (
              <span className="kx-task-timeline__retry-icon" aria-hidden="true">
                <ExclamationIcon />
              </span>
            )}
            <span className="kx-task-timeline__retry-text">{event.text}</span>
            <span className="kx-task-timeline__retry-time">{event.time}</span>
          </li>
        ))}
      </ul>

      {/* Finished line — dot + label + duration. */}
      <p className="kx-task-timeline__finished" data-testid="task-finished-line">
        <span className="kx-task-timeline__finished-dot" aria-hidden="true" />
        <span className="kx-task-timeline__finished-label">{finishedMeta.label}</span>
        <span className="kx-task-timeline__finished-duration">{finishedMeta.duration}</span>
      </p>
    </section>
  )
}
