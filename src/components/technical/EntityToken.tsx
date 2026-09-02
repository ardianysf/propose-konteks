/*
 * EntityToken — an OPENABLE system object (spec §2): repository, branch,
 * document, artifact, task, plan, agent, tool, commit, session. Renders
 * as a <button> by default (opens a panel) or an <a> when `href` navigates.
 *
 * Semantics:
 *   - explicit accessible name via openLabel, defaulting to
 *     `Open {kind} {label}` (e.g. "Open repository hris-frontend");
 *   - title tooltip — pass the FULL value whenever the label is truncated
 *     (long paths, SHAs, URLs);
 *   - `mono` (default) for identifiers, `mono={false}` for human-readable
 *     artifact titles;
 *   - kind icon (13px, aria-hidden — the accessible name carries the kind).
 *
 * The click handler is intentionally absent in phase 1: the target panel
 * ships with the session-stream integration phase, so demo clicks are a
 * documented noop — the element keeps full button/link semantics.
 */
import type { ReactNode } from 'react'
import './technical.css'

export const ENTITY_KINDS = [
  'repository',
  'branch',
  'document',
  'artifact',
  'task',
  'plan',
  'agent',
  'tool',
  'commit',
  'session',
] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]

export interface EntityTokenProps {
  kind: EntityKind
  label: string
  /** Identifier label (mono, default) vs human-readable artifact title (sans). */
  mono?: boolean
  /** Explicit accessible name, e.g. "Open repository hris-frontend". */
  openLabel?: string
  /** Tooltip text — required for truncated values (full path / SHA / URL). */
  title?: string
  /** Render as an anchor (navigation) instead of a button (opens a panel). */
  href?: string
  onClick?: () => void
  className?: string
}

/** One drawn stroke family: viewBox 16, currentColor strokes, aria-hidden. */
function KindIcon({ kind }: { kind: EntityKind }): ReactNode {
  const shared = {
    'data-icon': `tech-${kind}`,
    viewBox: '0 0 16 16',
    width: 13,
    height: 13,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  }
  switch (kind) {
    case 'repository':
      return (
        <svg {...shared}>
          <rect x="2" y="2.5" width="12" height="11" rx="2" />
          <path d="M5.2 5.5h5.6" />
          <path d="M5.2 8h5.6" />
          <path d="M5.2 10.5h3.2" />
        </svg>
      )
    case 'branch':
      return (
        <svg {...shared}>
          <circle cx="4.5" cy="4" r="1.8" />
          <circle cx="4.5" cy="12" r="1.8" />
          <circle cx="11.5" cy="4" r="1.8" />
          <path d="M4.5 5.8v4.4" />
          <path d="M11.5 5.8c0 2.7-2 3.9-4.5 4.3" />
        </svg>
      )
    case 'document':
      return (
        <svg {...shared}>
          <path d="M9.5 2H5.2A1.7 1.7 0 0 0 3.5 3.7v8.6A1.7 1.7 0 0 0 5.2 14h5.6a1.7 1.7 0 0 0 1.7-1.7V5L9.5 2z" />
          <path d="M9.5 2v3h3" />
        </svg>
      )
    case 'artifact':
      return (
        <svg {...shared}>
          <path d="M8 2l5.5 2.8v6.4L8 14l-5.5-2.8V4.8L8 2z" />
          <path d="M2.5 4.8 8 7.6l5.5-2.8" />
          <path d="M8 7.6V14" />
        </svg>
      )
    case 'task':
      return (
        <svg {...shared}>
          <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
          <path d="m5.5 8.1 1.8 1.8 3.4-3.7" />
        </svg>
      )
    case 'plan':
      return (
        <svg {...shared}>
          <path d="M5.5 4.5H13" />
          <path d="M5.5 8H13" />
          <path d="M5.5 11.5H13" />
          <path d="M3.2 4.5h.01" />
          <path d="M3.2 8h.01" />
          <path d="M3.2 11.5h.01" />
        </svg>
      )
    case 'agent':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="10" height="7.5" rx="2.2" />
          <path d="M8 5V2.8" />
          <circle cx="6.1" cy="8.7" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="9.9" cy="8.7" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'tool':
      return (
        <svg {...shared}>
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <path d="m4.8 6.4 1.9 1.9-1.9 1.9" />
          <path d="M8.2 10.4h3.2" />
        </svg>
      )
    case 'commit':
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="2.6" />
          <path d="M2 8h3.4" />
          <path d="M10.6 8H14" />
        </svg>
      )
    case 'session':
      return (
        <svg {...shared}>
          <circle cx="8" cy="8" r="5.8" />
          <path d="M8 4.8V8l2.3 1.4" />
        </svg>
      )
  }
}

export default function EntityToken({
  kind,
  label,
  mono = true,
  openLabel,
  title,
  href,
  onClick,
  className,
}: EntityTokenProps) {
  const classes = ['kx-tech-entity']
  if (mono) classes.push('kx-tech-entity--mono')
  if (className !== undefined) classes.push(className)
  const accessibleName = openLabel ?? `Open ${kind} ${label}`
  const tooltip = title ?? label
  const icon = (
    <span className="kx-tech-entity__icon" aria-hidden="true">
      <KindIcon kind={kind} />
    </span>
  )
  if (href !== undefined) {
    return (
      <a className={classes.join(' ')} href={href} aria-label={accessibleName} title={tooltip} onClick={onClick}>
        {icon}
        <span className="kx-tech-entity__label">{label}</span>
      </a>
    )
  }
  return (
    <button type="button" className={classes.join(' ')} aria-label={accessibleName} title={tooltip} onClick={onClick}>
      {icon}
      <span className="kx-tech-entity__label">{label}</span>
    </button>
  )
}
