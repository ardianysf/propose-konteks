/*
 * ClarificationBlock — kind 3 (CLARIFICATION).
 * Numbered specific questions with clickable answer-option chips. While
 * any answer is outstanding the block reads as paused (attention tone +
 * paused notice); once every question is answered it flips to the accent
 * resumed notice. This is a QUESTION block — deliberately no permission
 * language; the permission-framed interstitial is ApprovalGateBlock.
 */
import ResponseBlock, { ClarificationIcon, StreamChip } from '../ResponseBlock'
import type { ClarificationBlockData } from '../sessionStreamTypes'

interface ClarificationBlockProps {
  data: ClarificationBlockData
  /** questionId → chosen option label. */
  answered: Record<string, string>
  onAnswer: (questionId: string, option: string) => void
  actor?: string
  time?: string
}

export default function ClarificationBlock({
  data,
  answered,
  onAnswer,
  actor = 'Konteks Engineering Agent',
  time = '09:06',
}: ClarificationBlockProps) {
  const allAnswered = data.questions.every((question) => answered[question.id] !== undefined)

  return (
    <ResponseBlock
      kindLabel="CLARIFICATION"
      tone={allAnswered ? 'accent' : 'attention'}
      icon={<ClarificationIcon />}
      actor={actor}
      time={time}
      stateChip={
        allAnswered ? (
          <StreamChip tone="accent">answered</StreamChip>
        ) : (
          <StreamChip tone="attention">awaiting answer</StreamChip>
        )
      }
    >
      <div className="kx-stream-clar">
        <ol className="kx-stream-clar__questions">
          {data.questions.map((question, index) => (
            <li key={question.id} className="kx-stream-clar__question">
              <p className="kx-stream-clar__q-text kx-stream-prose">
                <span className="kx-stream-clar__q-num kx-stream-tabular">{index + 1}</span>
                {question.question}
              </p>
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
                      onClick={() => onAnswer(question.id, option)}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
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
