/*
 * MetadataPair — spec §3: one plain LABEL (11-12px muted medium sans,
 * NEVER interactive — only the value may act) + a VALUE that can be a
 * plain string, an InlineCode (string + `mono`), or any ReactNode
 * (EntityToken, …). String values longer than 24 characters gain a
 * hover/focus-revealed copy action (the same opacity-reveal contract as
 * the stream hover footers — opacity, not visibility, keeps the button
 * keyboard-reachable). The 2-col-desktop → 1-col-mobile grid of pairs
 * lives at the usage site (.kx-tech-showcase__meta in the demo page).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import InlineCode from './InlineCode'
import { copyToClipboard } from '../session/stream/clipboard'
import './technical.css'

/** Strings longer than this gain the copy action (spec §3). */
export const META_COPY_THRESHOLD = 24

export interface MetadataPairProps {
  label: string
  /** Plain string (optionally mono), InlineCode, EntityToken, … */
  value: string | ReactNode
  /** String values render as InlineCode (identifiers) instead of sans. */
  mono?: boolean
  className?: string
  testId?: string
}

export default function MetadataPair({ label, value, mono = false, className, testId }: MetadataPairProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const isString = typeof value === 'string'
  const copyable = isString && value.length > META_COPY_THRESHOLD

  const handleCopy = () => {
    if (!isString) return
    void copyToClipboard(value)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  const pairClasses = ['kx-tech-meta__pair']
  if (className !== undefined) pairClasses.push(className)

  return (
    <div className={pairClasses.join(' ')} data-testid={testId}>
      {/* Plain <span> by contract: the label is never a control —
       * interactivity belongs to the value alone (EntityToken, copy). */}
      <span className="kx-tech-meta__label">{label}</span>
      <span className="kx-tech-meta__value">
        {isString ? mono ? <InlineCode>{value}</InlineCode> : value : value}
        {copyable && (
          <button type="button" className="kx-tech-meta__copy" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </span>
    </div>
  )
}
