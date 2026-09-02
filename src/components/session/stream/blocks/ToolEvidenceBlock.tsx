/*
 * ToolEvidenceBlock — kind 7 (TOOL CALL).
 * Each call is ONE compact ledger row: state mark + verb + InlineCode
 * target + duration + StatusBadge (Draft/Running/Completed) + chevron.
 * Rows with evidence (result / io) are COLLAPSED by default — clicking
 * the row toggles the detail (aria-expanded / aria-controls); the io
 * bodies are CodeBlocks (header meta + Copy, +/- diff tints via the
 * line-class hook). Only state==='running' rows render open,
 * highlighted with the active pulse (dead under
 * prefers-reduced-motion); running rows without evidence are
 * non-interactive status rows.
 */
import { useId, useState } from 'react'
import ResponseBlock, { CheckIcon, ChevronIcon, ToolIcon } from '../ResponseBlock'
import InlineCode from '../../../technical/InlineCode'
import StatusBadge from '../../../technical/StatusBadge'
import type { TechStatus } from '../../../technical/StatusBadge'
import CodeBlock from '../../../technical/CodeBlock'
import type { ToolCall, ToolEvidenceBlockData } from '../sessionStreamTypes'

/** queued/running/done → the canonical StatusBadge vocabulary
 * (technical-text spec §Integration: Draft/Running/Completed). */
const STATE_STATUS: Record<ToolCall['state'], TechStatus> = {
  queued: 'draft',
  running: 'running',
  done: 'completed',
}

function ioLineClass(line: string): string | undefined {
  if (line.startsWith('+')) return 'kx-stream-io__line--add'
  if (line.startsWith('-')) return 'kx-stream-io__line--del'
  return undefined
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
      <InlineCode className="kx-stream-call__target">{call.target}</InlineCode>
      {call.duration && (
        <span className="kx-stream-call__duration kx-stream-tabular">{call.duration}</span>
      )}
      <StatusBadge
        status={STATE_STATUS[call.state]}
        className="kx-stream-call__badge"
        testId="tool-state"
      />
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
              <CodeBlock code={call.io.input} meta="input" testId="tool-io-input" />
              <CodeBlock
                code={call.io.output.join('\n')}
                meta="output"
                lineClassName={ioLineClass}
                testId="tool-io-output"
              />
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
