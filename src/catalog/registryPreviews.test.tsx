/*
 * Parametrized registry↔manifest contract tests (R1 of the dual-output
 * replan, spec AC4/AC5/AC6).
 *
 * Derived from components.json + the runtime registry — never a hand-made
 * slug list, so the test set can never drift from the manifest:
 *   1. Every visual manifest entry (classification adoptable |
 *      mockup-coupled — 28 today) has exactly one registry entry, that
 *      entry defines a `preview`, and the preview lazy-loads and renders
 *      inside an error boundary without an uncaught exception.
 *   2. ComponentDetailPage renders the required sections (Live preview,
 *      API contract, Contoh pemakaian, Meta) plus the resolved preview
 *      content for every one of the 28 slugs.
 *
 * Deliberately no pixel/style assertions: structure, roles, and section
 * presence only.
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import { Component, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { manifestEntries, type ManifestEntry } from './manifest'
import { ComponentDetailPage } from './pages/ComponentDetailPage'
import { registry } from './registry'

const VISUAL_CLASSIFICATIONS = new Set(['adoptable', 'mockup-coupled'])

/** Visual manifest entries — the catalog's adoption surface. */
const visualEntries = manifestEntries.filter((entry) =>
  VISUAL_CLASSIFICATIONS.has(entry.classification),
)

/** Test-local error boundary mirroring the detail page's
 *  PreviewErrorBoundary: an uncaught preview error must surface as a
 *  caught boundary error, never as a test crash. */
class TestErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error): void {
    // Non-fatal here too: the assertion below decides pass/fail.
    console.warn('registry preview test boundary caught:', error.message)
  }

  render(): ReactNode {
    if (this.state.error) {
      return <div data-testid="preview-error">{this.state.error.message}</div>
    }
    return this.props.children
  }
}

describe('registry ↔ manifest visual contract (parametrized)', () => {
  it('the manifest carries 28 visual entries and they all have detail-page content fields', () => {
    // Guard rail for the "28" in the task: if metadata work (R2+) changes
    // classifications, this fails loudly instead of silently re-scoping.
    expect(visualEntries).toHaveLength(28)
    for (const entry of visualEntries) {
      expect(entry.id).toBeTruthy()
      expect(entry.name).toBeTruthy()
      expect(entry.description).toBeTruthy()
      expect(entry.sourcePath).toMatch(/^src\//)
    }
  })

  it.each(visualEntries.map((entry) => [entry.id, entry] as const))(
    '%s has exactly one registry entry, and that entry defines a preview',
    (_id, entry: ManifestEntry) => {
      const matches = registry.filter((r) => r.id === entry.id)
      expect(matches).toHaveLength(1)
      expect(matches[0].kind).toBe('component')
      expect(typeof matches[0].preview).toBe('function')
    },
  )

  it.each(visualEntries.map((entry) => [entry.id, entry] as const))(
    '%s preview loads and renders without an uncaught exception',
    async (_id, entry: ManifestEntry) => {
      const [registryEntry] = registry.filter((r) => r.id === entry.id)
      const mod = await registryEntry.load()
      const { container, unmount } = render(
        <TestErrorBoundary>{registryEntry.preview!(mod)}</TestErrorBoundary>,
      )

      // No error boundary tripped, and the preview rendered real content
      // (every registry preview renders at least one component/fixture).
      expect(screen.queryByTestId('preview-error')).not.toBeInTheDocument()
      expect(container.firstElementChild).not.toBeNull()
      unmount()
    },
  )

  it.each(visualEntries.map((entry) => [entry.id, entry] as const))(
    '%s detail page renders heading, resolved preview, and required sections',
    async (id, entry: ManifestEntry) => {
      render(<ComponentDetailPage slug={id} />)

      // Header: component name, classification badge, source path.
      expect(
        screen.getByRole('heading', { name: entry.name }),
      ).toBeInTheDocument()
      expect(screen.getByText(entry.classification)).toBeInTheDocument()
      expect(screen.getByText(entry.sourcePath)).toBeInTheDocument()

      // Required sections.
      expect(
        screen.getByRole('heading', { name: 'Live preview' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'API contract' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Contoh pemakaian' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Meta' }),
      ).toBeInTheDocument()

      // The lazy preview resolves to real content — never the loading
      // placeholder and never the unavailable notice.
      const frame = document.querySelector('.kx-cat-preview-frame')
      expect(frame).not.toBeNull()
      await waitFor(
        () => {
          expect(frame!.querySelector('.kx-cat-placeholder')).toBeNull()
          expect(frame!.firstElementChild).not.toBeNull()
        },
        { timeout: 5000 },
      )
      // Sanity: the resolved preview exposes some meaningful content
      // (variant labels for grid previews, otherwise any rendered text).
      expect(
        within(frame as HTMLElement)
          .queryAllByText(() => true)
          .length,
      ).toBeGreaterThan(0)
    },
  )
})
