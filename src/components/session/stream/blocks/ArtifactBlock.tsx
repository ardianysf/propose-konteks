/*
 * ArtifactBlock — kind 8 (ARTIFACT).
 * Document card: type badge (PRD / DIFF / TEST REPORT / RESEARCH), title,
 * excerpt, a mono schema/diff preview (additions accent, deletions
 * attention), version/time meta, and Open / Copy / Download actions.
 * Copy reports through the page-provided onCopy (clipboard with
 * fallback); Open expands the full payload preview; Download emits the
 * payload as a file when the environment allows it.
 */
import { useState } from 'react'
import ResponseBlock, { ArtifactIcon } from '../ResponseBlock'
import type { ArtifactBlockData } from '../sessionStreamTypes'

function previewLineClass(line: string): string {
  if (line.startsWith('+')) return 'kx-stream-io__line kx-stream-io__line--add'
  if (line.startsWith('-')) return 'kx-stream-io__line kx-stream-io__line--del'
  return 'kx-stream-io__line'
}

interface ArtifactBlockProps {
  data: ArtifactBlockData
  onCopy: (payload: string) => void
  actor?: string
  time?: string
}

export default function ArtifactBlock({
  data,
  onCopy,
  actor = 'Konteks Engineering Agent',
  time = '09:33',
}: ArtifactBlockProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const handleCopy = () => {
    onCopy(data.copyPayload)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const handleDownload = () => {
    // Best-effort demo download — silently skipped where the environment
    // (e.g. jsdom) lacks object URLs.
    try {
      const blob = new Blob([data.copyPayload], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch {
      /* download unavailable in this environment */
    }
  }

  return (
    <ResponseBlock kindLabel="ARTIFACT" tone="neutral" icon={<ArtifactIcon />} actor={actor} time={time}>
      <article className="kx-stream-artifact">
        <header className="kx-stream-artifact__head">
          <span className="kx-stream-artifact__badge">{data.badge}</span>
          <p className="kx-stream-artifact__title">{data.title}</p>
          <p className="kx-stream-artifact__meta">
            {data.version} · {data.time}
          </p>
        </header>
        <p className="kx-stream-artifact__excerpt kx-stream-prose">{data.excerpt}</p>
        <pre className="kx-stream-artifact__preview kx-stream-mono">
          <code>
            {data.schema.map((line, index) => (
              <span key={index} className={previewLineClass(line)}>
                {line}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
        {open && (
          <pre className="kx-stream-artifact__preview kx-stream-artifact__preview--full kx-stream-mono">
            <code>{data.copyPayload}</code>
          </pre>
        )}
        <footer className="kx-stream-artifact__actions">
          <button
            type="button"
            className="kx-stream-btn kx-stream-btn--link"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close preview' : 'Open'}
          </button>
          <button type="button" className="kx-stream-btn kx-stream-btn--secondary" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="kx-stream-btn kx-stream-btn--ghost" onClick={handleDownload}>
            Download
          </button>
        </footer>
      </article>
    </ResponseBlock>
  )
}
