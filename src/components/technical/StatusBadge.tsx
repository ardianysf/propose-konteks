/*
 * StatusBadge — spec §4: the canonical 10 execution statuses as a pill.
 * Sans (NEVER mono), 11-12px, weight 600, and ALWAYS icon + label +
 * tone together — color never carries the meaning alone. Fase 3a: each
 * tone renders a FILLED treatment — tinted fill + tone border + tone ink
 * via the --kx-tech-status-* tokens (success reads the AA accent ink,
 * warning/danger share the tuned amber family with the firm × telling
 * them apart, neutral reads the AA muted ink).
 * Running pulses a live dot (kx-tech-pulse; killed by the stylesheet
 * under prefers-reduced-motion while staying visible). Non-clickable
 * by default; an `onClick` upgrades the pill to real <button>
 * semantics with a visible focus ring.
 */
import type { ReactNode } from 'react'
import './technical.css'

export const TECH_STATUSES = [
  'draft',
  'running',
  'waiting-input',
  'waiting-approval',
  'needs-review',
  'blocked',
  'completed',
  'partial',
  'failed',
  'cancelled',
] as const

export type TechStatus = (typeof TECH_STATUSES)[number]

/** Canonical UI labels (EN) — one per status key. */
export const TECH_STATUS_LABELS: Record<TechStatus, string> = {
  draft: 'Draft',
  running: 'Running',
  'waiting-input': 'Waiting for input',
  'waiting-approval': 'Waiting approval',
  'needs-review': 'Needs review',
  blocked: 'Blocked',
  completed: 'Completed',
  partial: 'Partial',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

type Tone = 'neutral' | 'success' | 'warning' | 'danger'

/** Tone + glyph vocabulary per status (spec: ● / ! / ✓ / × / ⏸ / ◐ …).
 * `running` is special-cased below — it renders the animated dot. */
const STATUS_CONFIG: Record<TechStatus, { tone: Tone; icon: ReactNode }> = {
  draft: { tone: 'neutral', icon: <Glyph name="draft" /> },
  running: { tone: 'success', icon: null },
  'waiting-input': { tone: 'neutral', icon: <Glyph name="waiting-input" /> },
  'waiting-approval': { tone: 'warning', icon: <Glyph name="waiting-approval" /> },
  'needs-review': { tone: 'warning', icon: <Glyph name="needs-review" /> },
  blocked: { tone: 'danger', icon: <Glyph name="blocked" /> },
  completed: { tone: 'success', icon: <Glyph name="completed" /> },
  partial: { tone: 'warning', icon: <Glyph name="partial" /> },
  failed: { tone: 'danger', icon: <Glyph name="failed" /> },
  cancelled: { tone: 'neutral', icon: <Glyph name="cancelled" /> },
}

/** One drawn stroke family: viewBox 16, currentColor strokes, aria-hidden. */
function Glyph({ name }: { name: string }): ReactNode {
  const shared = {
    'data-icon': `tech-status-${name}`,
    viewBox: '0 0 16 16',
    width: 12,
    height: 12,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  }
  switch (name) {
    case 'draft': // hollow circle — not yet live
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="5" />
        </svg>
      )
    case 'waiting-input': // pause — parked on a person
      return (
        <svg {...shared}>
          <path d="M6 4.5v7" />
          <path d="M10 4.5v7" />
        </svg>
      )
    case 'waiting-approval': // clock — parked on an approver
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5.2V8l2 1.3" />
        </svg>
      )
    case 'needs-review': // exclamation
      return (
        <svg {...shared}>
          <path d="M8 3.6v5.2" />
          <path d="M8 11.6h.01" />
        </svg>
      )
    case 'blocked': // slashed circle — hard stop
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M4.2 11.8 11.8 4.2" />
        </svg>
      )
    case 'completed': // check
      return (
        <svg {...shared}>
          <path d="m3.6 8.4 2.9 2.9 5.9-6.2" />
        </svg>
      )
    case 'partial': // half-filled — some done, some not
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'failed': // firm ×
      return (
        <svg {...shared}>
          <path d="M4.5 4.5l7 7" />
          <path d="M11.5 4.5l-7 7" />
        </svg>
      )
    case 'cancelled': // single strike — called off
      return (
        <svg {...shared}>
          <path d="M3.8 8h8.4" />
        </svg>
      )
    default:
      return null
  }
}

export interface StatusBadgeProps {
  status: TechStatus
  /** Optional click behavior — upgrades the pill to a <button>. */
  onClick?: () => void
  /** Overrides the canonical label with a settled-state reading that
   * keeps the status' tone + glyph (e.g. completed → "Answered" on the
   * stream clarification). The status set itself stays canonical. */
  label?: string
  className?: string
  testId?: string
}

export default function StatusBadge({ status, onClick, label, className, testId }: StatusBadgeProps) {
  const { tone, icon } = STATUS_CONFIG[status]
  const text = label ?? TECH_STATUS_LABELS[status]
  const classes = ['kx-tech-badge', `kx-tech-badge--${tone}`]
  if (onClick !== undefined) classes.push('kx-tech-badge--button')
  if (className !== undefined) classes.push(className)

  const inner = (
    <>
      <span className="kx-tech-badge__icon" aria-hidden="true">
        {status === 'running' ? <span className="kx-tech-badge__dot" /> : icon}
      </span>
      <span className="kx-tech-badge__label">{text}</span>
    </>
  )

  if (onClick !== undefined) {
    return (
      <button type="button" className={classes.join(' ')} onClick={onClick} data-testid={testId}>
        {inner}
      </button>
    )
  }
  return (
    <span className={classes.join(' ')} data-testid={testId}>
      {inner}
    </span>
  )
}
