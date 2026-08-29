/*
 * ResponseFooter — per-response action row rendered under every assistant
 * message: copy, reactions (thumbs up/down), and a three-dot more menu
 * (response date + Retry / Fork / Share). Hovering or focusing the row
 * reveals the response stats (duration + tokens in/out) when the message
 * carries meta. Presentational and callback-driven: no context reads.
 */
import { useEffect, useRef, useState } from 'react'
import type { DetailTimelineItem } from '../../data/mockData'
import './ResponseFooter.css'

export interface ResponseFooterProps {
  /** The assistant message this footer belongs to. */
  item: DetailTimelineItem
  /** Retry re-asks the nearest preceding user message (wired by the
   * timeline; optional so the footer works standalone/previews). */
  onRetry?: () => void
  /** Optional initial reaction state (catalog/storybook specimens). */
  initialReaction?: 'up' | 'down' | null
  /** Optionally render with the more menu already open (catalog specimens). */
  initialMenuOpen?: boolean
}

function CopyIcon() {
  return (
    <svg data-icon="copy" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10H4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg data-icon="check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ThumbUpIcon() {
  return (
    <svg data-icon="thumb-up" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M5.5 14V7l3-4.5c.8-.2 1.5.4 1.3 1.2L9.2 6.5h3.1c.9 0 1.5.8 1.3 1.6l-1.1 4.6c-.2.8-.9 1.3-1.7 1.3H5.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M5.5 7H3.2c-.7 0-1.2.5-1.2 1.2v4.6c0 .7.5 1.2 1.2 1.2h2.3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg data-icon="thumb-down" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M10.5 2v7l-3 4.5c-.8.2-1.5-.4-1.3-1.2l.6-2.8H3.7c-.9 0-1.5-.8-1.3-1.6l1.1-4.6C3.7 2.5 4.4 2 5.2 2h5.3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M10.5 9h2.3c.7 0 1.2-.5 1.2-1.2V3.2c0-.7-.5-1.2-1.2-1.2h-2.3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg data-icon="more" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="3" cy="8" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="13" cy="8" r="1.3" fill="currentColor" />
    </svg>
  )
}

function RetryIcon() {
  return (
    <svg data-icon="retry" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.7 1.8v2.9h-2.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ForkIcon() {
  return (
    <svg data-icon="fork" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <circle cx="4" cy="3.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="3.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="12.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4 5.1v1.2c0 1 .8 1.8 1.8 1.8h4.4c1 0 1.8-.8 1.8-1.8V5.1M8 8.1v2.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg data-icon="share" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M8 10.5V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5.2 5.1L8 2.3l2.8 2.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 9v3.6c0 .8.6 1.4 1.4 1.4h7.2c.8 0 1.4-.6 1.4-1.4V9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function formatResponseDate(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${day}, ${time}`
}

function formatStats(meta: NonNullable<DetailTimelineItem['meta']>): string {
  return `${(meta.durationMs / 1000).toFixed(1)}s · ${Math.round(meta.tokensIn / 1000)}k tokens in · ${meta.tokensOut} tokens out`
}

/** Copy with a graceful fallback: the async Clipboard API when available,
 * otherwise a hidden-textarea document.execCommand('copy') pass. Returns
 * whether the copy succeeded (feedback only shows on success). */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied / clipboard unavailable — fall through to legacy.
  }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

export default function ResponseFooter({
  item,
  onRetry,
  initialReaction = null,
  initialMenuOpen = false,
}: ResponseFooterProps) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'up' | 'down' | null>(initialReaction)
  const [menuOpen, setMenuOpen] = useState(initialMenuOpen)
  const copiedTimerRef = useRef<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Clear the transient "Copied" indicator and close the menu on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
    }
  }, [])

  // Close the more menu on any click outside the footer.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onDocumentClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [menuOpen])

  const handleCopy = async () => {
    const copied = await copyText(item.content)
    if (!copied) return
    setCopied(true)
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 1500)
  }

  const toggleReaction = (next: 'up' | 'down') => {
    setReaction((current) => (current === next ? null : next))
  }

  return (
    <div className="kx-response-footer" data-testid="response-footer" ref={rootRef}>
      <button
        type="button"
        className="kx-response-footer__action"
        aria-label={copied ? 'Copied' : 'Copy response'}
        data-testid="response-copy"
        onClick={handleCopy}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
      <button
        type="button"
        className="kx-response-footer__action"
        aria-label="Good response"
        aria-pressed={reaction === 'up'}
        data-testid="response-thumb-up"
        onClick={() => toggleReaction('up')}
      >
        <ThumbUpIcon />
      </button>
      <button
        type="button"
        className="kx-response-footer__action"
        aria-label="Bad response"
        aria-pressed={reaction === 'down'}
        data-testid="response-thumb-down"
        onClick={() => toggleReaction('down')}
      >
        <ThumbDownIcon />
      </button>
      <div className="kx-response-footer__more-anchor">
        <button
          type="button"
          className="kx-response-footer__action"
          aria-label="More actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          data-testid="response-more"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreIcon />
        </button>
        {menuOpen ? (
          <div className="kx-response-footer__menu" role="menu" aria-label="Response actions" data-testid="response-menu">
            <div className="kx-response-footer__menu-date">{formatResponseDate(item.createdAt)}</div>
            <button
              type="button"
              role="menuitem"
              className="kx-response-footer__menu-item"
              onClick={() => {
                setMenuOpen(false)
                onRetry?.()
              }}
            >
              <RetryIcon />
              Retry
            </button>
            <button
              type="button"
              role="menuitem"
              className="kx-response-footer__menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <ForkIcon />
              Fork
            </button>
            <button
              type="button"
              role="menuitem"
              className="kx-response-footer__menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <ShareIcon />
              Share
            </button>
          </div>
        ) : null}
      </div>
      {item.meta ? (
        <span className="kx-response-footer__stats" aria-hidden="true" title={formatStats(item.meta)}>
          {formatStats(item.meta)}
        </span>
      ) : null}
    </div>
  )
}
