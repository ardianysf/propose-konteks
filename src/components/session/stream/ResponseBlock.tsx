/*
 * ResponseBlock — the shared anatomy every response-kind block renders
 * (spec §Bagian B, anatomy contract):
 *
 *   rail (40px: kind icon + continuous hairline timeline)
 *   header (KIND LABEL · actor · time — right: state chip OR duration)
 *   body + footer slots (children)
 *
 * Differentiation between the ten kinds happens through body structure,
 * icon and label — never through a different grid or grammar. Tone maps
 * onto the three existing token families only:
 *   neutral    → ink hierarchy
 *   accent     → success / approved / primary action
 *   attention  → needs input / warning / running
 *
 * The icon family lives here too: one stroke family (viewBox 24,
 * stroke-width 1.75, currentColor, no fill) authored inline — no emoji,
 * no external dependency.
 */
import type { ReactElement, ReactNode } from 'react'
import type { StreamKind, StreamTone } from './sessionStreamTypes'
import './SessionStream.css'

/** Caps kind labels from the spec's ten-type table. */
export const KIND_LABELS: Record<StreamKind, string> = {
  request: 'REQUEST',
  acknowledgement: 'UNDERSTANDING',
  clarification: 'CLARIFICATION',
  plan: 'PLAN',
  'approval-gate': 'APPROVAL NEEDED',
  progress: 'IN PROGRESS',
  tool: 'TOOL CALL',
  artifact: 'ARTIFACT',
  review: 'REVIEW FINDING',
  completion: 'HANDOFF',
}

// ── Icon family ───────────────────────────────────────────────────────────
// One drawn stroke family: viewBox 24, stroke-width 1.75, round caps,
// currentColor, no fill. Sized 16px on the rail; smaller utility marks
// (check, chevron, kebab, alert, minus) stay in the same family.

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

export function KebabIcon() {
  return (
    <Svg width={14} height={14}>
      <path d="M12 5.2h.01" />
      <path d="M12 12h.01" />
      <path d="M12 18.8h.01" />
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

export function MessageIcon() {
  return (
    <Svg width={16} height={16}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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

// ── Shared anatomy ────────────────────────────────────────────────────────

export interface ResponseBlockProps {
  /** Caps kind label, e.g. REQUEST / APPROVAL NEEDED. */
  kindLabel: string
  tone?: StreamTone
  /** 16px stroke icon from the family above. */
  icon: ReactElement
  actor: string
  /** Relative or clock time string. */
  time: string
  /** Right-header state chip. */
  stateChip?: ReactNode
  /** Right-header tabular duration (mutually present-able with chip). */
  duration?: string
  children: ReactNode
  /** Extra modifier class for the block root (e.g. --completion). */
  className?: string
  id?: string
}

export default function ResponseBlock({
  kindLabel,
  tone = 'neutral',
  icon,
  actor,
  time,
  stateChip,
  duration,
  children,
  className,
  id,
}: ResponseBlockProps) {
  const classes = ['kx-stream-block', `kx-stream-block--${tone}`]
  if (className) classes.push(className)
  return (
    <article id={id} className={classes.join(' ')}>
      <div className="kx-stream-block__rail" aria-hidden="true">
        <span className="kx-stream-block__rail-line" />
        <span className="kx-stream-block__rail-icon">{icon}</span>
      </div>
      <div className="kx-stream-block__main">
        <header className="kx-stream-block__header">
          <p className="kx-stream-block__ident">
            <span className="kx-stream-block__kind">{kindLabel}</span>
            <span className="kx-stream-block__sep">·</span>
            <span className="kx-stream-block__actor">{actor}</span>
            <span className="kx-stream-block__sep">·</span>
            <span className="kx-stream-block__time">{time}</span>
          </p>
          {(stateChip !== undefined || duration !== undefined) && (
            <p className="kx-stream-block__meta">
              {stateChip}
              {duration !== undefined && (
                <span className="kx-stream-block__duration kx-stream-tabular">{duration}</span>
              )}
            </p>
          )}
        </header>
        <div className="kx-stream-block__body">{children}</div>
      </div>
    </article>
  )
}
