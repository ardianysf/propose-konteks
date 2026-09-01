/*
 * ToolEvidenceBlock — kind 7 (TOOL CALL).
 * Compact ledger rows: verb + target (mono) + duration + state. The core
 * of this kind is the explicit three-state distinction — queued ("will
 * do", dim), running (animated indicator), done ("did", check + one-line
 * result, expandable into the mono input/output evidence with diff-tinted
 * lines: additions accent, deletions attention).
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
  const [expanded, setExpanded] = useState(false)
  const ioId = useId()
  const expandable = call.state === 'done' && call.io !== undefined

  return (
    <li className={`kx-stream-call kx-stream-call--${call.state}`}>
      <div className="kx-stream-call__row">
        <span className="kx-stream-call__mark" aria-hidden="true">
          {call.state === 'done' && <CheckIcon />}
          {call.state === 'running' && <span className="kx-stream-call__pulse" />}
          {call.state === 'queued' && <span className="kx-stream-call__dot" />}
        </span>
        <span className="kx-stream-call__verb">{call.verb}</span>
        <span className="kx-stream-call__target kx-stream-mono">{call.target}</span>
        <span className={`kx-stream-call__state kx-stream-call__state--${call.state}`}>
          {STATE_LABELS[call.state]}
        </span>
        {call.duration && (
          <span className="kx-stream-call__duration kx-stream-tabular">{call.duration}</span>
        )}
        {expandable && (
          <button
            type="button"
            className="kx-stream-call__io-toggle"
            aria-expanded={expanded}
            aria-controls={expanded ? ioId : undefined}
            onClick={() => setExpanded((value) => !value)}
          >
            <span
              className={`kx-stream-collapse-chevron${expanded ? ' kx-stream-collapse-chevron--open' : ''}`}
            >
              <ChevronIcon />
            </span>
            Evidence
          </button>
        )}
      </div>
      {call.state === 'done' && call.result && (
        <p className="kx-stream-call__result kx-stream-prose">{call.result}</p>
      )}
      {expandable && expanded && (
        <div id={ioId} className="kx-stream-io">
          <p className="kx-stream-io__label">input</p>
          <pre className="kx-stream-io__block kx-stream-mono">
            <code>{call.io!.input}</code>
          </pre>
          <p className="kx-stream-io__label">output</p>
          <pre className="kx-stream-io__block kx-stream-mono">
            <code>
              {call.io!.output.map((line, index) => (
                <span key={index} className={ioLineClass(line)}>
                  {line}
                  {'\n'}
                </span>
              ))}
            </code>
          </pre>
        </div>
      )}
    </li>
  )
}

interface ToolEvidenceBlockProps {
  data: ToolEvidenceBlockData
  actor?: string
  time?: string
}

export default function ToolEvidenceBlock({
  data,
  actor = 'Konteks Engineering Agent',
  time = '09:17',
}: ToolEvidenceBlockProps) {
  return (
    <ResponseBlock kindLabel="TOOL CALL" tone="neutral" icon={<ToolIcon />} actor={actor} time={time}>
      <ul className="kx-stream-tool__calls">
        {data.calls.map((call) => (
          <ToolCallRow key={call.id} call={call} />
        ))}
      </ul>
    </ResponseBlock>
  )
}
