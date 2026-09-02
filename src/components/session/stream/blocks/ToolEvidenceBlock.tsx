/*
 * ToolEvidenceBlock — kind 7 (TOOL CALL).
 * Each call is ONE compact ledger row: state mark + verb + mono target +
 * duration + state label + chevron. Rows with evidence (result / io)
 * are COLLAPSED by default — clicking the row toggles the detail
 * (aria-expanded / aria-controls). Only state==='running' rows render
 * open, highlighted with the active pulse (dead under
 * prefers-reduced-motion); running rows without evidence are
 * non-interactive status rows.
 */
import { useId, useState } from 'react'
import ResponseBlock, { CheckIcon, ChevronIcon, ToolIcon } from '../ResponseBlock'
import type { ToolCall, ToolEvidenceBlockData } from '../sessionStreamTypes'

const STATE_LABELS: Record<ToolCall['state'], string> = {
  queued: 'queued',
  running: 'running',
  done: 'done',
}

function ioLineClass(line: string): string {
  if (line.startsWith('+')) return 'kx-stream-io__line kx-stream-io__line--add'
  if (line.startsWith('-')) return 'kx-stream-io__line kx-stream-io__line--del'
  return 'kx-stream-io__line'
}

function ToolCallRow({ call }: { call: ToolCall }) {
  const [expanded, setExpanded] = useState(call.state === 'running')
  const detailId = useId()
  const hasDetail = call.result !== undefined || call.io !== undefined
  const open = expanded && hasDetail

  const row = (
    <>
      <span className="kx-stream-call__mark" aria-hidden="true">
        {call.state === 'done' && <CheckIcon />}
        {call.state === 'running' && <span className="kx-stream-call__pulse" />}
        {call.state === 'queued' && <span className="kx-stream-call__dot" />}
      </span>
      <span className="kx-stream-call__verb">{call.verb}</span>
      <span className="kx-stream-call__target kx-stream-mono">{call.target}</span>
      {call.duration && (
        <span className="kx-stream-call__duration kx-stream-tabular">{call.duration}</span>
      )}
      <span className={`kx-stream-call__state kx-stream-call__state--${call.state}`}>
        {STATE_LABELS[call.state]}
      </span>
      <span
        className={`kx-stream-collapse-chevron${open ? ' kx-stream-collapse-chevron--open' : ''}`}
        aria-hidden="true"
      >
        <ChevronIcon />
      </span>
    </>
  )

  return (
    <li className={`kx-stream-call kx-stream-call--${call.state}`}>
      {hasDetail ? (
        <button
          type="button"
          className="kx-stream-call__row"
          data-testid="tool-row"
          aria-expanded={open}
          aria-controls={open ? detailId : undefined}
          onClick={() => setExpanded((value) => !value)}
        >
          {row}
        </button>
      ) : (
        <div className="kx-stream-call__row" data-testid="tool-row" role="status">
          {row}
        </div>
      )}
      {open && (
        <div id={detailId} className="kx-stream-call__detail">
          {call.state === 'done' && call.result && (
            <p className="kx-stream-call__result kx-stream-prose">{call.result}</p>
          )}
          {call.io && (
            <div className="kx-stream-io">
              <p className="kx-stream-io__label">input</p>
              <pre className="kx-stream-io__block kx-stream-mono">
                <code>{call.io.input}</code>
              </pre>
              <p className="kx-stream-io__label">output</p>
              <pre className="kx-stream-io__block kx-stream-mono">
                <code>
                  {call.io.output.map((line, index) => (
                    <span key={index} className={ioLineClass(line)}>
                      {line}
                      {'\n'}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

interface ToolEvidenceBlockProps {
  data: ToolEvidenceBlockData
  time?: string
}

export default function ToolEvidenceBlock({
  data,
  time = '14:20',
}: ToolEvidenceBlockProps) {
  return (
    <ResponseBlock kindLabel="TOOL CALL" tone="neutral" icon={<ToolIcon />} time={time}>
      <ul className="kx-stream-tool__calls">
        {data.calls.map((call) => (
          <ToolCallRow key={call.id} call={call} />
        ))}
      </ul>
    </ResponseBlock>
  )
}
