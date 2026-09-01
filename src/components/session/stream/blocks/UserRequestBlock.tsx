/*
 * UserRequestBlock — kind 1 (REQUEST).
 * The heaviest block by presence: a raised card (--kx-raised surface +
 * hairline border) carrying the intent prose and the request's
 * attachment / parameter / context chips. Actor is the user.
 */
import ResponseBlock, { RequestIcon, StreamChip } from '../ResponseBlock'
import type { RequestBlockData } from '../sessionStreamTypes'

interface UserRequestBlockProps {
  data: RequestBlockData
  actor?: string
  time?: string
}

export default function UserRequestBlock({
  data,
  actor = 'Refactory Admin',
  time = '09:04',
}: UserRequestBlockProps) {
  return (
    <ResponseBlock
      kindLabel="REQUEST"
      tone="neutral"
      icon={<RequestIcon />}
      actor={actor}
      time={time}
      stateChip={<StreamChip>user</StreamChip>}
    >
      <div className="kx-stream-request">
        <p className="kx-stream-request__intent kx-stream-prose">{data.intent}</p>
        <ul className="kx-stream-request__chips" aria-label="Request context">
          {data.chips.map((chip) => (
            <li key={chip.label} className="kx-stream-request__chip">
              <span className="kx-stream-request__chip-kind">{chip.kind}</span>
              <span className={chip.mono ? 'kx-stream-mono' : undefined}>{chip.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </ResponseBlock>
  )
}
