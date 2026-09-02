/*
 * AcknowledgementBlock — kind 2 (UNDERSTANDING): flat agent prose.
 * Summary prose, scope in/out as two compact borderless columns,
 * confidence note, and the muted grounding line. No card.
 */
import ResponseBlock, { AckIcon } from '../ResponseBlock'
import type { AcknowledgementBlockData } from '../sessionStreamTypes'

interface AcknowledgementBlockProps {
  data: AcknowledgementBlockData
  time?: string
}

export default function AcknowledgementBlock({
  data,
  time = '14:04',
}: AcknowledgementBlockProps) {
  return (
    <ResponseBlock kindLabel="UNDERSTANDING" tone="neutral" icon={<AckIcon />} time={time}>
      <div className="kx-stream-ack">
        <p className="kx-stream-ack__summary kx-stream-prose">{data.summary}</p>
        <div className="kx-stream-ack__scope">
          <div className="kx-stream-ack__scope-col">
            <p className="kx-stream-ack__scope-title">In scope</p>
            <ul className="kx-stream-ack__scope-list">
              {data.scopeIn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="kx-stream-ack__scope-col">
            <p className="kx-stream-ack__scope-title">Out of scope</p>
            <ul className="kx-stream-ack__scope-list">
              {data.scopeOut.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="kx-stream-ack__confidence kx-stream-prose">
          <strong>{data.confidence} confidence.</strong> {data.confidenceNote}
        </p>
        <p className="kx-stream-ack__grounding">{data.grounding}</p>
      </div>
    </ResponseBlock>
  )
}
