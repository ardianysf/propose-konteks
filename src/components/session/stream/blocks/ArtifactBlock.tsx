/*
 * ArtifactBlock — kind 8 (ARTIFACT): FULL-WIDTH ROW, no badge/label
 * (spec refinements v2 #5). No type badge and no ARTIFACT kind header —
 * the artifact renders as one full-width row of the response column:
 * title + version, with the small Open / Copy / Download actions
 * revealed on hover / :focus-within. Copy writes data.copyPayload
 * through the shared clipboard helper (clipboard.ts) with brief
 * feedback, Open expands the compact mono schema preview, Download
 * emits the payload as a file when the environment allows it.
 */
import { useEffect, useRef, useState } from 'react'
import ResponseBlock from '../ResponseBlock'
import { copyToClipboard } from '../clipboard'
import type { ArtifactBlockData } from '../sessionStreamTypes'

function previewLineClass(line: string): string {
  if (line.startsWith('+')) return 'kx-stream-io__line kx-stream-io__line--add'
  if (line.startsWith('-')) return 'kx-stream-io__line kx-stream-io__line--del'
  return 'kx-stream-io__line'
}

interface ArtifactBlockProps {
  data: ArtifactBlockData
  time?: string
}

export default function ArtifactBlock({ data, time = '14:46' }: ArtifactBlockProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = () => {
    void copyToClipboard(data.copyPayload)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    setCopied(true)
    timerRef.current = window.setTimeout(() => setCopied(false), 1600)
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
    <ResponseBlock tone="neutral" time={time}>
      <div className="kx-stream-artifact">
        <div
          className="kx-stream-artifact-row kx-stream-artifact-row--full"
          data-testid="artifact-row"
        >
          <span className="kx-stream-artifact-row__title">{data.title}</span>
          <span className="kx-stream-artifact-row__version kx-stream-tabular">
            {data.version} · {data.time}
          </span>
          <span className="kx-stream-artifact-row__actions" data-testid="artifact-actions">
            <button
              type="button"
              className="kx-stream-chip-action"
              aria-expanded={open}
              aria-controls={open ? 'kx-stream-artifact-preview' : undefined}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Close' : 'Open'}
            </button>
            <button type="button" className="kx-stream-chip-action" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="kx-stream-chip-action" onClick={handleDownload}>
              Download
            </button>
          </span>
        </div>
        {open && (
          <pre
            id="kx-stream-artifact-preview"
            className="kx-stream-artifact__preview kx-stream-mono"
          >
            <code>
              {data.schema.map((line, index) => (
                <span key={index} className={previewLineClass(line)}>
                  {line}
                  {'\n'}
                </span>
              ))}
            </code>
          </pre>
        )}
      </div>
    </ResponseBlock>
  )
}
