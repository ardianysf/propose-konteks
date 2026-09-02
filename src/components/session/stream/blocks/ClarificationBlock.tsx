/*
 * ClarificationBlock — kind 3 (CLARIFICATION): seamless agent prose.
 * Numbered questions flow inside the agent turn (no separate Q/A card).
 *
 * Settled history: when data.settledAnswers is present the block renders
 * its settled, NON-interactive state — each question shows the recorded
 * answer and the resumed notice; the answers themselves live in the
 * stream as user bubbles (fixture order).
 *
 * Interactive (live): clickable answer-option chips ride each question;
 * clicking one calls the page-level callback (the page inserts the user
 * bubble). While any answer is outstanding the notice reads paused
 * (attention); once every question is answered it flips to resumed.
 *
 * The hover footer (copy / share / time) rides this turn when it is the
 * LAST agent turn of its response group (spec refinements v3 #2) — in
 * the fixtures the clarification ends the first response group right
 * before the user's answer bubble.
 */
import ResponseBlock, { CheckIcon, ClarificationIcon } from '../ResponseBlock'
import StatusBadge from '../../../technical/StatusBadge'
import type { ClarificationBlockData } from '../sessionStreamTypes'

interface ClarificationBlockProps {
  data: ClarificationBlockData
  /** questionId → chosen option label (interactive mode only). */
  answered?: Record<string, string>
  onAnswer?: (questionId: string, option: string) => void
  time?: string
  /** Hover footer — when this turn ends its response group. */
  showFooter?: boolean
}

export default function ClarificationBlock({
  data,
  answered = {},
  onAnswer,
  time = '14:05',
  showFooter = false,
}: ClarificationBlockProps) {
  const settled = data.settledAnswers !== undefined
  const allAnswered =
    settled || data.questions.every((question) => answered[question.id] !== undefined)

  return (
    <ResponseBlock
      kindLabel="CLARIFICATION"
      tone={allAnswered ? 'accent' : 'attention'}
      icon={<ClarificationIcon />}
      time={time}
      showFooter={showFooter}
      stateChip={
        allAnswered ? (
          <StatusBadge status="completed" label="Answered" />
        ) : (
          <StatusBadge status="waiting-input" />
        )
      }
    >
      <div className="kx-stream-clar">
        <ol className="kx-stream-clar__questions">
          {data.questions.map((question, index) => {
            const settledAnswer = settled ? data.settledAnswers![index] : undefined
            return (
              <li key={question.id} className="kx-stream-clar__question">
                <p className="kx-stream-clar__q-text kx-stream-prose">
                  <span className="kx-stream-clar__q-num kx-stream-tabular">{index + 1}</span>
                  {question.question}
                </p>
                {settledAnswer !== undefined ? (
                  <p className="kx-stream-clar__settled" data-testid="clar-settled-answer">
                    <span className="kx-stream-clar__settled-mark" aria-hidden="true">
                      <CheckIcon />
                    </span>
                    {settledAnswer}
                  </p>
                ) : (
                  <div
                    className="kx-stream-clar__options"
                    role="group"
                    aria-label={`Answer options for question ${index + 1}`}
                  >
                    {question.options.map((option) => {
                      const selected = answered[question.id] === option
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`kx-stream-option${selected ? ' kx-stream-option--selected' : ''}`}
                          aria-pressed={selected}
                          onClick={() => onAnswer?.(question.id, option)}
                        >
                          {option}
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <p
          className={`kx-stream-notice${
            allAnswered ? ' kx-stream-notice--accent' : ' kx-stream-notice--attention'
          }`}
          role="status"
        >
          {allAnswered ? data.resumedNotice : data.pausedNotice}
        </p>
      </div>
    </ResponseBlock>
  )
}
