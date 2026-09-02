/*
 * CodeBlock — spec §5: the multiline counterpart of InlineCode. Header
 * (mono muted language/path + a Copy button with brief "Copied"
 * feedback via the shared stream clipboard helper), a <pre><code> body
 * (mono 12-13px, lh 1.55, horizontal scroll without shrinking the
 * font, focusable so keyboard users can scroll it), optional line
 * numbers (default: on when the code exceeds 5 lines, overridable),
 * and a collapse contract: code longer than 12 lines starts collapsed
 * showing the first 10 with a "Show full code" toggle (aria-expanded).
 * An optional muted footer line carries source/execution context.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { copyToClipboard } from '../session/stream/clipboard'
import './technical.css'

/** Line numbers appear by default past this many lines (spec §5). */
export const CODEBLOCK_LINENUMBER_THRESHOLD = 5
/** Code longer than this many lines starts collapsed… */
export const CODEBLOCK_COLLAPSE_THRESHOLD = 12
/** …showing this many lines while collapsed. */
export const CODEBLOCK_COLLAPSED_LINES = 10

export interface CodeBlockProps {
  code: string
  /** Header meta — a language or a file path, e.g. "sql" or "config/sync.yaml". */
  meta?: string
  /** Overrides the >5-line default: true = always numbered, false = never. */
  lineNumbers?: boolean
  /** Per-line class hook (e.g. diff +/- tinting on tool-evidence output).
   * Returning undefined renders the line untinted. */
  lineClassName?: (line: string) => string | undefined
  /** Muted footer line — source or execution result. */
  footer?: ReactNode
  className?: string
  testId?: string
}

export default function CodeBlock({
  code,
  meta,
  lineNumbers,
  lineClassName,
  footer,
  className,
  testId,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code])
  const numbered = lineNumbers ?? lines.length > CODEBLOCK_LINENUMBER_THRESHOLD
  const collapsible = lines.length > CODEBLOCK_COLLAPSE_THRESHOLD
  const visible = collapsible && !expanded ? lines.slice(0, CODEBLOCK_COLLAPSED_LINES) : lines

  const handleCopy = () => {
    void copyToClipboard(code)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  const classes = ['kx-tech-codeblock']
  if (className !== undefined) classes.push(className)

  return (
    <div className={classes.join(' ')} data-testid={testId}>
      <div className="kx-tech-codeblock__head">
        {meta !== undefined && <span className="kx-tech-codeblock__meta">{meta}</span>}
        <button type="button" className="kx-tech-copy" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="kx-tech-codeblock__pre" tabIndex={0}>
        <code>
          {visible.map((line, index) => (
            <span
              key={index}
              className={['kx-tech-codeblock__line', lineClassName?.(line)]
                .filter(Boolean)
                .join(' ')}
            >
              {numbered && (
                <span className="kx-tech-codeblock__ln" aria-hidden="true">
                  {index + 1}
                </span>
              )}
              {line}
            </span>
          ))}
        </code>
      </pre>
      {collapsible && (
        <div className="kx-tech-codeblock__actions">
          <button
            type="button"
            className="kx-tech-codeblock__expand"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? 'Hide full code' : 'Show full code'}
          </button>
        </div>
      )}
      {footer !== undefined && <div className="kx-tech-codeblock__footer">{footer}</div>}
    </div>
  )
}
