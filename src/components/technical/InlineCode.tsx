/*
 * InlineCode — the non-interactive <code> for short literal system values
 * inside prose (spec §1): identifiers like `hris-frontend`, `development`,
 * `ses_01JABC`. Mono 0.95em, pale wash, no hover/pointer/chevron — it is
 * a VALUE, not a control (openable objects are EntityToken's job).
 */
import type { ReactNode } from 'react'
import './technical.css'

export interface InlineCodeProps {
  children: ReactNode
  className?: string
}

export default function InlineCode({ children, className }: InlineCodeProps) {
  const classes = className === undefined ? 'kx-tech-code' : `kx-tech-code ${className}`
  return <code className={classes}>{children}</code>
}
