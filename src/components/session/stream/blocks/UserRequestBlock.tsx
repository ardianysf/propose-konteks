/*
 * UserRequestBlock — kind 1 (REQUEST): the USER turn.
 *
 * Right-aligned bubble (BubbleBlock) carrying the message prose
 * (data.message, falling back to data.intent) and the non-attachment
 * chips. The hover / focus-within action bar (time + copy + edit) is
 * BubbleBlock's.
 *
 * LONG MESSAGES (review): prose taller than MAX_LINES collapses with a
 * soft shading fade and a quiet Read more button — the fade masks the
 * clamp edge so the bubble still reads well-designed; Read less folds
 * it back. Messages under the limit never show the control.
 *
 * ATTACHMENTS (review): attachment cards live OUTSIDE the bubble — a
 * separate row of file cards (icon + name + meta) directly beneath it.
 *
 * Edit: clicking the edit icon swaps the prose for an inline textarea
 * with Save / Cancel inside the bubble; Save & resend truncates the
 * following turns and re-runs the live sequence (page-provided).
 */
import { useEffect, useRef, useState } from 'react'
import BubbleBlock from '../BubbleBlock'
import { ArchiveIcon, DiffIcon, DocIcon, SheetIcon } from '../ResponseBlock'
import type { RequestAttachment, RequestBlockData } from '../sessionStreamTypes'

/** Collapsed messages show only this many lines; the Read-more
 * control appears when the message exceeds them (review: 5). */
const MAX_LINES = 5

/** File-type glyph for an attachment card (fallback: doc). */
function attachmentIcon(name: string): NonNullable<RequestAttachment['type']> {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || lower.endsWith('.tsv')) return 'sheet'
  if (lower.endsWith('.diff') || lower.endsWith('.patch')) return 'diff'
  if (lower.endsWith('.zip') || lower.endsWith('.tar') || lower.endsWith('.gz')) return 'archive'
  return 'doc'
}

const FILE_ICONS: Record<NonNullable<RequestAttachment['type']>, () => JSX.Element> = {
  doc: DocIcon,
  sheet: SheetIcon,
  diff: DiffIcon,
  archive: ArchiveIcon,
}

function AttachmentCard({ name, type }: RequestAttachment) {
  const Glyph = FILE_ICONS[type ?? attachmentIcon(name)]
  // Review: the card carries ONLY the file-type glyph + title — meta
  // lives in the data, not the UI.
  return (
    <li className="kx-stream-attachment">
      <span className="kx-stream-attachment__icon" aria-hidden="true">
        <Glyph />
      </span>
      <span className="kx-stream-attachment__name">{name}</span>
    </li>
  )
}

interface UserRequestBlockProps {
  data: RequestBlockData
  time?: string
  /** Phase-2 save-and-resend: Save updates the bubble text locally and
   * notifies the caller to truncate the following turns and re-run the
   * live sequence. Without it Save stays local-only (phase 1). */
  onResend?: (nextText: string) => void
}

export default function UserRequestBlock({ data, time = '14:02', onResend }: UserRequestBlockProps) {
  const initialText = data.message ?? data.intent
  const [text, setText] = useState(initialText)
  const [draft, setDraft] = useState(initialText)
  const [editing, setEditing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [clampable, setClampable] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  // Overflow detection (fixed): the clamp class rides from first paint
  // whenever the message is not expanded — line-clamp is a no-op on
  // messages under MAX_LINES, so measuring the CLAMPED box is the only
  // way scrollHeight can exceed clientHeight. Under the limit the
  // Read-more control never renders.
  useEffect(() => {
    const element = textRef.current
    if (element === null || expanded || editing) return
    // Measure the NATURAL height: -webkit-line-clamp collapses
    // scrollHeight to the clamped box in real browsers, so the clamp
    // is lifted for this measurement frame only (same paint — no flash).
    element.style.display = 'block'
    element.style.webkitLineClamp = 'unset'
    const natural = element.scrollHeight
    element.style.display = ''
    // CRITICAL: restore the clamp VALUE explicitly — setting '' removes
    // the inline property and React never rewrites it (same prop value),
    // leaving the box unclamped (only overflow trimmed ~1 line).
    element.style.webkitLineClamp = String(MAX_LINES)
    const computed = window.getComputedStyle(element)
    const lineHeight =
      parseFloat(computed.lineHeight) || parseFloat(computed.fontSize) * 1.55 || 20
    setClampable(natural > lineHeight * MAX_LINES + 1)
  }, [text, expanded, editing])

  // Explicit attachment cards, or attachment-kind chips promoted to cards.
  const attachments: RequestAttachment[] =
    data.attachments ??
    data.chips
      .filter((chip) => chip.kind === 'attachment')
      .map((chip) => ({
        name: chip.label,
        meta: chip.meta ?? 'attachment',
        type: attachmentIcon(chip.label),
      }))
  const inlineChips = data.chips.filter((chip) => chip.kind !== 'attachment')

  const beginEdit = () => {
    setDraft(text)
    setEditing(true)
  }

  const saveEdit = () => {
    const next = draft.trim()
    if (next !== '') {
      setText(next)
      setEditing(false)
      onResend?.(next)
      return
    }
    setEditing(false)
  }

  // The clamp rides whenever the message is collapsed — harmless for
  // short prose (line-clamp caps nothing) and measurable for long one.
  const clamped = !expanded && !editing

  return (
    <BubbleBlock
      time={time}
      copyPayload={text}
      editing={editing}
      onEdit={editing ? undefined : beginEdit}
      testId="user-bubble"
      afterBubble={
        attachments.length > 0 ? (
          <ul className="kx-stream-request__attachments" aria-label="Attachments">
            {attachments.map((attachment) => (
              <AttachmentCard key={attachment.name} {...attachment} />
            ))}
          </ul>
        ) : undefined
      }
    >
        {editing ? (
          <div className="kx-stream-bubble__edit" data-testid="bubble-editor">
            <label className="kx-visually-hidden" htmlFor="kx-stream-bubble-edit-input">
              Edit message
            </label>
            <textarea
              id="kx-stream-bubble-edit-input"
              className="kx-stream-bubble__edit-input"
              data-testid="bubble-edit-input"
              value={draft}
              rows={Math.min(10, Math.max(3, draft.split('\n').length))}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="kx-stream-bubble__edit-actions">
              <button type="button" className="kx-stream-btn kx-stream-btn--primary" onClick={saveEdit}>
                {onResend !== undefined ? 'Save & resend' : 'Save'}
              </button>
              <button
                type="button"
                className="kx-stream-btn kx-stream-btn--ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="kx-stream-bubble__text-wrap">
              <p
                ref={textRef}
                className={`kx-stream-bubble__text kx-stream-prose${clamped ? ' kx-stream-bubble__text--clamped' : ''}`}
                style={clamped ? { WebkitLineClamp: MAX_LINES } : undefined}
                data-testid="bubble-text"
              >
                {text}
              </p>
              {/* The soft shading fade seats the Read-more control —
                  ONLY on genuinely clamped messages, never on short
                  ones (review). */}
              {clampable && !expanded && (
                <span className="kx-stream-bubble__text-fade" aria-hidden="true" />
              )}
            </div>
            {clampable && (
              <button
                type="button"
                className="kx-stream-bubble__read-toggle"
                aria-expanded={expanded}
                onClick={() => setExpanded((previous) => !previous)}
              >
                {expanded ? 'Read less' : 'Read more'}
              </button>
            )}
            {inlineChips.length > 0 && (
              <ul className="kx-stream-bubble__chips" aria-label="Request context">
                {inlineChips.map((chip) => (
                  <li key={chip.label} className="kx-stream-bubble__chip">
                    <span className="kx-stream-bubble__chip-kind">{chip.kind}</span>
                    <span className={chip.mono ? 'kx-stream-mono' : undefined}>{chip.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
    </BubbleBlock>
  )
}
