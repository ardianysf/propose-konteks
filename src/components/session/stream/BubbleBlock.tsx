/*
 * BubbleBlock — the shared anatomy for USER turns in the chat-style
 * session stream (spec §Anatomi turn): a right-aligned bubble (max-width
 * ±75% of the column, asymmetric radius — the outer corner sharper), a
 * neutral tint from tokens, and a hover/focus-within action bar under
 * the bubble: the message timestamp + copy icon + edit icon.
 *
 * The bubble content itself is the caller's children (prose, attachment
 * cards, or the inline editor); the edit interaction is owned by the
 * caller — `onEdit` fires when the edit icon is clicked and `editing`
 * hides the affordance while an editor is open (phase 1: local update;
 * phase 2 upgrades to save-and-resend semantics).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { copyToClipboard } from './clipboard'
import { CopyIcon, EditIcon } from './ResponseBlock'
import './SessionStream.css'

export interface BubbleBlockProps {
  /** The message timestamp shown in the action bar. */
  time: string
  /** Payload for the copy action — defaults to the bubble's text. */
  copyPayload?: string
  /** Enters edit mode when the edit icon is clicked. */
  onEdit?: () => void
  /** While true the edit affordance is hidden (an editor is open). */
  editing?: boolean
  id?: string
  testId?: string
  /** Rendered AFTER the bubble but BEFORE the action bar (e.g. the
   * attachment row — review: the bar belongs below the attachments). */
  afterBubble?: ReactNode
  children: ReactNode
}

export default function BubbleBlock({
  time,
  copyPayload,
  onEdit,
  editing = false,
  id,
  testId,
  afterBubble,
  children,
}: BubbleBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    const content = contentRef.current
    void copyToClipboard(copyPayload ?? content?.innerText ?? content?.textContent ?? '')
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div id={id} className="kx-stream-bubble-row" data-testid={testId}>
      <div className="kx-stream-bubble">
        <div className="kx-stream-bubble__content" ref={contentRef}>
          {children}
        </div>
      </div>
      {afterBubble}
      <div className="kx-stream-bubble__bar" data-testid="bubble-actions">
        <span className="kx-stream-bubble__time kx-stream-tabular">{time}</span>
        <button
          type="button"
          className="kx-stream-icon-action"
          aria-label="Copy message"
          data-testid="bubble-copy"
          onClick={handleCopy}
        >
          <CopyIcon />
        </button>
        {onEdit !== undefined && !editing && (
          <button
            type="button"
            className="kx-stream-icon-action"
            aria-label="Edit message"
            data-testid="bubble-edit"
            onClick={onEdit}
          >
            <EditIcon />
          </button>
        )}
        {copied && (
          <span className="kx-stream-bubble__feedback" role="status">
            Copied
          </span>
        )}
      </div>
    </div>
  )
}
