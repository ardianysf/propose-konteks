/*
 * UserRequestBlock — kind 1 (REQUEST): the USER turn.
 *
 * Right-aligned bubble (BubbleBlock) carrying the message prose
 * (data.message, falling back to data.intent), attachment CARDS inside
 * the bubble — file-type icon + name + meta under a hairline separator
 * — and the non-attachment chips as subtle inline chips. The hover /
 * focus-within action bar (time + copy + edit) is BubbleBlock's.
 *
 * Edit (phase 1): clicking the edit icon swaps the prose for an inline
 * textarea with Save / Cancel inside the bubble; Save updates the
 * bubble text locally. Phase 2 upgrades this to save-and-resend.
 */
import { useState } from 'react'
import BubbleBlock from '../BubbleBlock'
import { ArchiveIcon, DiffIcon, DocIcon, SheetIcon } from '../ResponseBlock'
import type { RequestAttachment, RequestBlockData } from '../sessionStreamTypes'

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

function AttachmentCard({ name, meta, type }: RequestAttachment) {
  const Glyph = FILE_ICONS[type ?? attachmentIcon(name)]
  return (
    <li className="kx-stream-attachment">
      <span className="kx-stream-attachment__icon" aria-hidden="true">
        <Glyph />
      </span>
      <span className="kx-stream-attachment__main">
        <span className="kx-stream-attachment__name">{name}</span>
        <span className="kx-stream-attachment__meta">{meta}</span>
      </span>
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

  return (
    <BubbleBlock
      time={time}
      copyPayload={text}
      editing={editing}
      onEdit={editing ? undefined : beginEdit}
      testId="user-bubble"
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
          <p className="kx-stream-bubble__text kx-stream-prose" data-testid="bubble-text">
            {text}
          </p>
          {attachments.length > 0 && (
            <ul className="kx-stream-bubble__files" aria-label="Attachments">
              {attachments.map((attachment) => (
                <AttachmentCard key={attachment.name} {...attachment} />
              ))}
            </ul>
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
