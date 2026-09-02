/*
 * ResponseBlock — the shared anatomy for AGENT turns in the chat-style
 * session stream (spec: .pi/orch/plans/chat-session-stream-spec.md
 * §Anatomi turn).
 *
 * Agent turns render as FLAT prose — no bubble, no rail, no card:
 *
 *   header  compact: kind icon + muted label (+ optional state chip)
 *   body    children — the kind's typed content
 *   footer  revealed on hover / :focus-within: copy icon (clipboard.ts),
 *           share icon (mockup: copies a link, flashes "Link copied"),
 *           and the turn's timestamp
 *
 * USER turns use BubbleBlock (BubbleBlock.tsx) instead — the
 * right-aligned bubble with its own hover action bar (time + copy +
 * edit). Tone maps onto the three existing token families only:
 *   neutral    → ink hierarchy
 *   accent     → success / approved / settled
 *   attention  → needs input / warning / running
 *
 * The icon family lives here too: one stroke family (viewBox 24,
 * stroke-width 1.75, currentColor, no fill) authored inline — no emoji,
 * no external dependency.
 */
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import type { StreamKind, StreamTone } from './sessionStreamTypes'
import { copyToClipboard } from './clipboard'
import './SessionStream.css'

/** Caps kind labels from the spec's type table (demo-page anchors). */
export const KIND_LABELS: Record<StreamKind, string> = {
  request: 'REQUEST',
  acknowledgement: 'UNDERSTANDING',
  clarification: 'CLARIFICATION',
  plan: 'PLAN',
  'approval-gate': 'APPROVAL NEEDED',
  progress: 'PROGRESS',
  tool: 'TOOL CALL',
  artifact: 'ARTIFACT',
  review: 'REVIEW FINDING',
  completion: 'HANDOFF',
  answer: 'ANSWER',
}

/** Mock share link target — phase 1 copies it to the clipboard. */
const SHARE_LINK = 'https://konteks.app/sessions/SES-2026-0121'

// ── Icon family ───────────────────────────────────────────────────────────
// One drawn stroke family: viewBox 24, stroke-width 1.75, round caps,
// currentColor, no fill. Sized 16px for headers; smaller utility marks
// (check, chevron, alert, copy, share, edit) stay in the same family.

function Svg({ children, ...size }: { children: ReactNode; width: number; height: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size.width}
      height={size.height}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function RequestIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </Svg>
  )
}

export function AckIcon() {
  return (
    <Svg width={16} height={16}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.4 12.2 2.5 2.5 4.7-5.2" />
    </Svg>
  )
}

export function ClarificationIcon() {
  return (
    <Svg width={16} height={16}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8" />
      <path d="M12 16.6h.01" />
    </Svg>
  )
}

export function PlanIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M9.5 6H20" />
      <path d="M9.5 12H20" />
      <path d="M9.5 18H20" />
      <path d="M4.5 6h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 18h.01" />
    </Svg>
  )
}

export function GateIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M12 3.2 19 6v5.2c0 4.4-2.9 7.4-7 8.9-4.1-1.5-7-4.5-7-8.9V6l7-2.8z" />
      <path d="M12 9v3.2" />
      <path d="M12 15.4h.01" />
    </Svg>
  )
}

export function ProgressIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M3 12h3.8l2.4-6.2 4.2 12.4 2.4-6.2H21" />
    </Svg>
  )
}

export function ToolIcon() {
  return (
    <Svg width={16} height={16}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="m7 9.5 3 3-3 3" />
      <path d="M12.8 15.5H17" />
    </Svg>
  )
}

export function ArtifactIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M14 3H7.2A1.7 1.7 0 0 0 5.5 4.7v14.6A1.7 1.7 0 0 0 7.2 21h9.6a1.7 1.7 0 0 0 1.7-1.7V7.5L14 3z" />
      <path d="M14 3v4.5h4.5" />
      <path d="M9 13h6" />
      <path d="M9 16.5h4.5" />
    </Svg>
  )
}

export function ReviewIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M10.3 4.4 2.9 17.2A1.9 1.9 0 0 0 4.6 20h14.8a1.9 1.9 0 0 0 1.7-2.8L13.7 4.4a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4" />
      <path d="M12 16.8h.01" />
    </Svg>
  )
}

export function CompletionIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.6c4.4-2.1 7.9 2 12.3.4v8.2c-4.4 1.6-7.9-2.5-12.3-.4" />
      <path d="m9.2 7.9 1.3 1.3 2.5-2.7" />
    </Svg>
  )
}

export function MessageIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

/** Small utility marks — same stroke family, smaller canvas presence. */

export function CheckIcon({ width = 12 }: { width?: number }) {
  return (
    <Svg width={width} height={width}>
      <path d="m4.5 12.5 5 5L19.5 6.5" />
    </Svg>
  )
}

export function MinusIcon() {
  return (
    <Svg width={12} height={12}>
      <path d="M5 12h14" />
    </Svg>
  )
}

export function ChevronIcon({ width = 12 }: { width?: number }) {
  return (
    <Svg width={width} height={width}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function AlertIcon({ width = 12 }: { width?: number }) {
  return (
    <Svg width={width} height={width}>
      <path d="M10.3 4.4 2.9 17.2A1.9 1.9 0 0 0 4.6 20h14.8a1.9 1.9 0 0 0 1.7-2.8L13.7 4.4a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4" />
      <path d="M12 16.8h.01" />
    </Svg>
  )
}

export function CopyIcon() {
  return (
    <Svg width={14} height={14}>
      <rect x="8.8" y="8.8" width="11.2" height="11.2" rx="2.2" />
      <path d="M15.2 8.8V6.4a2.2 2.2 0 0 0-2.2-2.2H6.4a2.2 2.2 0 0 0-2.2 2.2v6.6a2.2 2.2 0 0 0 2.2 2.2h2.4" />
    </Svg>
  )
}

export function ShareIcon() {
  return (
    <Svg width={14} height={14}>
      <circle cx="17.8" cy="5.6" r="2.4" />
      <circle cx="6.2" cy="12" r="2.4" />
      <circle cx="17.8" cy="18.4" r="2.4" />
      <path d="m8.3 10.9 7.4-4.1" />
      <path d="m8.3 13.1 7.4 4.1" />
    </Svg>
  )
}

export function EditIcon() {
  return (
    <Svg width={14} height={14}>
      <path d="M12.8 5.2l6 6" />
      <path d="M4 20l1-4.2L15.6 5.2a2.1 2.1 0 0 1 3 0l.2.2a2.1 2.1 0 0 1 0 3L8.2 19 4 20z" />
    </Svg>
  )
}

/** File-type glyphs for attachment cards (same stroke family). */

export function DocIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M13.5 3H7a1.7 1.7 0 0 0-1.7 1.7v14.6A1.7 1.7 0 0 0 7 21h10a1.7 1.7 0 0 0 1.7-1.7V8.2L13.5 3z" />
      <path d="M13.5 3v5.2h5.2" />
      <path d="M8.8 12.5h6.4" />
      <path d="M8.8 15.8h4.4" />
    </Svg>
  )
}

export function SheetIcon() {
  return (
    <Svg width={16} height={16}>
      <rect x="4" y="4" width="16" height="16" rx="1.8" />
      <path d="M4 9.3h16" />
      <path d="M4 14.7h16" />
      <path d="M9.3 4v16" />
      <path d="M14.7 4v16" />
    </Svg>
  )
}

export function DiffIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M7 4.5v15" />
      <path d="M17 4.5v15" />
      <path d="M4.8 7h4.4" />
      <path d="M14.8 13.5h4.4" />
      <path d="M17 11.2v4.6" />
    </Svg>
  )
}

export function ArchiveIcon() {
  return (
    <Svg width={16} height={16}>
      <rect x="3.5" y="4.5" width="17" height="4.4" rx="1.2" />
      <path d="M5.2 8.9v9.4a1.7 1.7 0 0 0 1.7 1.7h10.2a1.7 1.7 0 0 0 1.7-1.7V8.9" />
      <path d="M9.8 12.8h4.4" />
    </Svg>
  )
}

// ── State chip ────────────────────────────────────────────────────────────

export function StreamChip({
  tone = 'neutral',
  children,
}: {
  tone?: StreamTone
  children: ReactNode
}) {
  return <span className={`kx-stream-chip kx-stream-chip--${tone}`}>{children}</span>
}

// ── Shared agent-turn anatomy ─────────────────────────────────────────────

export interface ResponseBlockProps {
  /** Caps kind label, e.g. UNDERSTANDING / PLAN / ANSWER. */
  kindLabel: string
  tone?: StreamTone
  /** 16px stroke icon from the family above. */
  icon: ReactElement
  /** The turn's timestamp — shown in the hover footer. */
  time: string
  /** Optional status chip riding the compact header row. */
  stateChip?: ReactNode
  children: ReactNode
  /** Extra modifier class for the turn root (e.g. --completion). */
  className?: string
  id?: string
}

type FooterFeedback = 'idle' | 'copied' | 'linked'

export default function ResponseBlock({
  kindLabel,
  tone = 'neutral',
  icon,
  time,
  stateChip,
  children,
  className,
  id,
}: ResponseBlockProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<FooterFeedback>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const flash = (next: FooterFeedback) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setFeedback(next)
    timerRef.current = window.setTimeout(() => setFeedback('idle'), 1600)
  }

  const handleCopy = () => {
    const body = bodyRef.current
    void copyToClipboard(body?.innerText ?? body?.textContent ?? '')
    flash('copied')
  }

  const handleShare = () => {
    void copyToClipboard(`${SHARE_LINK}${id ? `#${id}` : ''}`)
    flash('linked')
  }

  const classes = ['kx-stream-turn', `kx-stream-turn--${tone}`]
  if (className) classes.push(className)
  return (
    <article id={id} className={classes.join(' ')}>
      <header className="kx-stream-turn__head">
        <p className="kx-stream-turn__ident">
          <span className="kx-stream-turn__icon" aria-hidden="true">
            {icon}
          </span>
          <span className="kx-stream-turn__kind">{kindLabel}</span>
        </p>
        {stateChip !== undefined && stateChip}
      </header>
      <div className="kx-stream-turn__body" ref={bodyRef}>
        {children}
      </div>
      <footer className="kx-stream-turn__footer" data-testid="turn-footer">
        <button
          type="button"
          className="kx-stream-icon-action"
          aria-label="Copy message"
          data-testid="turn-copy"
          onClick={handleCopy}
        >
          <CopyIcon />
        </button>
        <button
          type="button"
          className="kx-stream-icon-action"
          aria-label="Share message"
          data-testid="turn-share"
          onClick={handleShare}
        >
          <ShareIcon />
        </button>
        {feedback !== 'idle' && (
          <span className="kx-stream-turn__feedback" role="status">
            {feedback === 'copied' ? 'Copied' : 'Link copied'}
          </span>
        )}
        <span className="kx-stream-turn__time kx-stream-tabular">{time}</span>
      </footer>
    </article>
  )
}
