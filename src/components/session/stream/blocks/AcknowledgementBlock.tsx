/*
 * AcknowledgementBlock — kind 2 (UNDERSTANDING).
 * Deliberately quiet: ink-2 prose, no card, scope in/out as two mini
 * columns, a confidence note and the grounding line. The accent lives in
 * one place only — the "understood" chip.
 */
import ResponseBlock, { AckIcon, StreamChip } from '../ResponseBlock'
import type { AcknowledgementBlockData } from '../sessionStreamTypes'

interface AcknowledgementBlockProps {
  data: AcknowledgementBlockData
  actor?: string
  time?: string
}

export default function AcknowledgementBlock({
  data,
  actor = 'Konteks Engineering Agent',
  time = '09:05',
}: AcknowledgementBlockProps) {
  return (
    <ResponseBlock
      kindLabel="UNDERSTANDING"
      tone="neutral"
      icon={<AckIcon />}
      actor={actor}
      time={time}
      stateChip={<StreamChip tone="accent">understood</StreamChip>}
    >
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
