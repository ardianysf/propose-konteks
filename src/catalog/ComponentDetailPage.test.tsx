/*
 * Unit tests for the T4 component detail page (AC6/AC11): both sample
 * slugs render preview + API + meta sections, and an unknown slug shows a
 * clear message instead of crashing.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ComponentDetailPage } from './pages/ComponentDetailPage'

describe('ComponentDetailPage', () => {
  it('renders header, live preview, API, usage, and meta for workspace-menu', async () => {
    render(<ComponentDetailPage slug="workspace-menu" />)

    // Header
    expect(
      screen.getByRole('heading', { name: 'WorkspaceMenu' }),
    ).toBeInTheDocument()
    expect(screen.getByText('adoptable')).toBeInTheDocument()
    expect(
      screen.getByText('src/components/shell/WorkspaceMenu.tsx'),
    ).toBeInTheDocument()

    // Live preview (lazy-loaded registry preview: the real WorkspaceMenu
    // behind the fixture, overlay open variant).
    expect(
      screen.getByRole('heading', { name: 'Live preview' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('menu', { name: 'Workspace' })).toBeInTheDocument()

    // API contract — no props; no context contract (adoptable).
    expect(
      screen.getByRole('heading', { name: 'API contract' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Tidak ada props terdokumentasi/)).toBeInTheDocument()

    // Usage snippet
    expect(
      screen.getByRole('heading', { name: 'Contoh pemakaian' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/import WorkspaceMenu from '\.\/components\/shell\/WorkspaceMenu'/),
    ).toBeInTheDocument()

    // Meta: cssFiles, fixtureRef, variants
    expect(screen.getByRole('heading', { name: 'Meta' })).toBeInTheDocument()
    expect(screen.getByText('src/styles/components.css')).toBeInTheDocument()
    expect(
      screen.getByText(/MockupFixtureProvider overlay=workspace-menu/),
    ).toBeInTheDocument()
    expect(screen.getByText('dengan overlay terbuka')).toBeInTheDocument()

    // Back link
    expect(
      screen.getByRole('link', { name: /Kembali ke indeks komponen/ }),
    ).toHaveAttribute('href', '#/components')
  })

  it('renders preview variants and context contract for session-status-badge', async () => {
    render(<ComponentDetailPage slug="session-status-badge" />)

    expect(
      screen.getByRole('heading', { name: 'SessionStatusBadge' }),
    ).toBeInTheDocument()
    expect(screen.getByText('mockup-coupled')).toBeInTheDocument()

    // Live preview: the four curated status variants.
    expect(await screen.findByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Waiting Approval')).toBeInTheDocument()
    expect(screen.getByText('Delivering')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()

    // Context contract chips: reads sessionDetail, no dispatches.
    expect(screen.getByText('Reads')).toBeInTheDocument()
    expect(screen.getByText('sessionDetail')).toBeInTheDocument()
    expect(screen.getByText('Dispatches')).toBeInTheDocument()

    // Meta: fixtureRef + status variants from the manifest.
    expect(
      screen.getByText(/satu provider per status/),
    ).toBeInTheDocument()
    expect(screen.getAllByText('waiting_approval').length).toBeGreaterThan(0)
  })

  it('shows a clear message for an unknown slug instead of crashing', () => {
    render(<ComponentDetailPage slug="no-such-component" />)

    expect(
      screen.getByRole('heading', { name: 'Komponen tidak ditemukan' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        (content, el) => el?.tagName === 'CODE' && content === 'no-such-component',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/tidak ada di manifest/).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByRole('link', { name: 'indeks komponen' }),
    ).toHaveAttribute('href', '#/components')
  })
})
