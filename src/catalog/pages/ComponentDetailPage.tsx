/*
 * Component detail — satu halaman per entri manifest (T4 real content,
 * spec §2 "Detail page" + AC6/AC11).
 *
 * Generik dan manifest-driven: header (nama, domain, klasifikasi, source),
 * LIVE PREVIEW dari registry (entry.preview ?? render default export di
 * dalam PreviewErrorBoundary — entri coupled tanpa fixture dilempar oleh
 * useMockup dan ditangkap di situ), kontrak API (propDocs table +
 * contextContract chips), contoh pemakaian (usageSnippet), dan meta
 * (cssFiles, tokenDeps, fixtureRef, adoptionNotes). Slug yang tidak ada
 * di manifest menampilkan pesan jelas, bukan crash.
 */
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { getManifestEntry, type ManifestEntry } from '../manifest'
import { registry, usageSnippet } from '../registry'
import { getPathnameFor, navigateTo } from '../router'
import { CatalogPreviewProvider } from '../CatalogPreviewContext'

type LoadedModule = { default?: unknown; [k: string]: unknown }

// ---------------------------------------------------------------------------
// PreviewErrorBoundary — the simple boundary around the raw-default-export
// fallback. Coupled components rendered without their fixture throw via
// useMockup; the boundary reports that as a readable notice instead of
// crashing the catalog page.
// ---------------------------------------------------------------------------

interface PreviewErrorBoundaryProps {
  /** Change to reset the boundary between preview targets. */
  resetKey: string
  children: ReactNode
}

interface PreviewErrorBoundaryState {
  error: Error | null
}

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Non-fatal: the preview is a convenience surface, not the source of
    // truth. Log for debugging without failing the page.
    console.warn('catalog preview failed:', error.message, info.componentStack)
  }

  componentDidUpdate(prev: PreviewErrorBoundaryProps): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="kx-cat-placeholder" role="note">
          Live preview tidak tersedia:{' '}
          <code>{this.state.error.message}</code>
        </div>
      )
    }
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// LivePreview — resolves the registry entry, lazy-loads the source module,
// then renders entry.preview(mod) when present or the raw default export
// inside the boundary.
// ---------------------------------------------------------------------------

function LivePreview({ entry }: { entry: ManifestEntry }) {
  const [mod, setMod] = useState<LoadedModule | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const registryEntry = registry.find((r) => r.id === entry.id)

  useEffect(() => {
    let cancelled = false
    setMod(null)
    setLoadError(null)
    if (!registryEntry) {
      setLoadError('tidak ada entri registry untuk slug ini')
      return
    }
    registryEntry
      .load()
      .then((loaded) => {
        if (!cancelled) setMod(loaded)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [entry.id, registryEntry])

  if (loadError) {
    return (
      <div className="kx-cat-placeholder" role="note">
        Live preview tidak tersedia: <code>{loadError}</code>
      </div>
    )
  }
  if (!mod) {
    return (
      <div className="kx-cat-placeholder" role="status">
        Memuat preview…
      </div>
    )
  }

  if (registryEntry?.preview) {
    return (
      <CatalogPreviewProvider>
        {registryEntry.preview(mod)}
      </CatalogPreviewProvider>
    )
  }

  const ComponentImpl = mod.default as
    | React.ComponentType<Record<string, never>>
    | undefined
  if (!ComponentImpl) {
    return (
      <div className="kx-cat-placeholder" role="note">
        Live preview tidak tersedia: modul tidak punya default export.
      </div>
    )
  }
  return (
    <CatalogPreviewProvider>
      <PreviewErrorBoundary resetKey={entry.id}>
        <ComponentImpl />
      </PreviewErrorBoundary>
    </CatalogPreviewProvider>
  )
}

// ---------------------------------------------------------------------------
// Contract sections
// ---------------------------------------------------------------------------

function PropDocsTable({ propDocs }: { propDocs: Record<string, string> }) {
  return (
    <table className="kx-cat-table kx-cat-props-table">
      <thead>
        <tr>
          <th scope="col">Prop</th>
          <th scope="col">Kontrak</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(propDocs).map(([name, doc]) => (
          <tr key={name}>
            <th scope="row">
              <code>{name}</code>
            </th>
            <td>{doc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ContextContractChips({
  contract,
}: {
  contract: NonNullable<ManifestEntry['contextContract']>
}) {
  return (
    <div className="kx-cat-contract">
      <div className="kx-cat-contract-group">
        <h3 className="kx-cat-contract-title">Reads</h3>
        {contract.reads.length === 0 ? (
          <span className="kx-cat-chip kx-cat-chip--muted">tidak ada</span>
        ) : (
          contract.reads.map((slice) => (
            <span key={slice} className="kx-cat-chip">
              <code>{slice}</code>
            </span>
          ))
        )}
      </div>
      <div className="kx-cat-contract-group">
        <h3 className="kx-cat-contract-title">Dispatches</h3>
        {contract.dispatches.length === 0 ? (
          <span className="kx-cat-chip kx-cat-chip--muted">tidak ada</span>
        ) : (
          contract.dispatches.map((action) => (
            <span key={action} className="kx-cat-chip">
              <code>{action}</code>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

function MetaList({ entry }: { entry: ManifestEntry }) {
  return (
    <dl className="kx-cat-meta">
      <div className="kx-cat-meta-item">
        <dt>cssFiles</dt>
        <dd>
          {entry.cssFiles.length === 0 ? (
            <span className="kx-cat-chip kx-cat-chip--muted">tidak ada</span>
          ) : (
            entry.cssFiles.map((file) => (
              <code key={file} className="kx-cat-chip">
                {file}
              </code>
            ))
          )}
        </dd>
      </div>
      <div className="kx-cat-meta-item">
        <dt>tokenDeps</dt>
        <dd>
          {entry.tokenDeps.length === 0 ? (
            <span className="kx-cat-chip kx-cat-chip--muted">tidak ada</span>
          ) : (
            entry.tokenDeps.map((token) => (
              <code key={token} className="kx-cat-chip">
                {token}
              </code>
            ))
          )}
        </dd>
      </div>
      <div className="kx-cat-meta-item">
        <dt>fixtureRef</dt>
        <dd>
          {entry.fixtureRef ? (
            <code className="kx-cat-chip">{entry.fixtureRef}</code>
          ) : (
            <span className="kx-cat-chip kx-cat-chip--muted">tidak ada</span>
          )}
        </dd>
      </div>
      {entry.variants.length > 0 && (
        <div className="kx-cat-meta-item">
          <dt>variants</dt>
          <dd>
            {entry.variants.map((variant) => (
              <span key={variant} className="kx-cat-chip">
                {variant}
              </span>
            ))}
          </dd>
        </div>
      )}
      <div className="kx-cat-meta-item">
        <dt>adoptionNotes</dt>
        <dd>{entry.adoptionNotes}</dd>
      </div>
    </dl>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface ComponentDetailPageProps {
  /** URI-decoded slug from `#/components/<slug>`. */
  slug: string
}

export function ComponentDetailPage({ slug }: ComponentDetailPageProps) {
  const entry = getManifestEntry(slug)

  if (!entry) {
    return (
      <section className="kx-cat-page" aria-labelledby="kx-cat-component-title">
        <p className="kx-cat-breadcrumb">
          <a
            href={getPathnameFor({ name: 'components' })}
            onClick={(e) => {
              e.preventDefault()
              navigateTo({ name: 'components' })
            }}
          >
            Components
          </a>
          <span aria-hidden="true"> / </span>
          {slug}
        </p>
        <h1 id="kx-cat-component-title" className="kx-cat-title">
          Komponen tidak ditemukan
        </h1>
        <p className="kx-cat-lede">
          Slug <code>{slug}</code> tidak ada di manifest{' '}
          <code>src/catalog/components.json</code>.
        </p>
        <p>
          Kembali ke{' '}
          <a
            href={getPathnameFor({ name: 'components' })}
            onClick={(e) => {
              e.preventDefault()
              navigateTo({ name: 'components' })
            }}
          >
            indeks komponen
          </a>{' '}
          untuk daftar lengkap.
        </p>
      </section>
    )
  }

  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-component-title">
      <p className="kx-cat-breadcrumb">
        <a
          href={getPathnameFor({ name: 'components' })}
          onClick={(e) => {
            e.preventDefault()
            navigateTo({ name: 'components' })
          }}
        >
          Components
        </a>
        <span aria-hidden="true"> / </span>
        {entry.id}
      </p>

      <header className="kx-cat-detail-header">
        <h1 id="kx-cat-component-title" className="kx-cat-title">
          {entry.name}
        </h1>
        <p className="kx-cat-detail-tags">
          <span className="kx-cat-chip">
            domain: <code>{entry.domain}</code>
          </span>
          <span
            className={`kx-cat-badge kx-cat-badge--${entry.classification}`}
          >
            {entry.classification}
          </span>
        </p>
        <p className="kx-cat-lede">{entry.description}</p>
        <p className="kx-cat-detail-source">
          <code>{entry.sourcePath}</code>
          <span aria-hidden="true"> · </span>
          export:{' '}
          <code>
            {Array.isArray(entry.exportName)
              ? entry.exportName.join(', ')
              : entry.exportName}
          </code>
        </p>
      </header>

      <section aria-labelledby="kx-cat-preview-title" className="kx-cat-section">
        <h2 id="kx-cat-preview-title">Live preview</h2>
        <div className="kx-cat-preview-frame">
          <LivePreview entry={entry} />
        </div>
      </section>

      <section aria-labelledby="kx-cat-api-title" className="kx-cat-section">
        <h2 id="kx-cat-api-title">API contract</h2>
        {entry.propDocs && Object.keys(entry.propDocs).length > 0 ? (
          <PropDocsTable propDocs={entry.propDocs} />
        ) : (
          <p className="kx-cat-muted-note">
            Tidak ada props terdokumentasi
            {entry.classification === 'mockup-coupled'
              ? ' — komponen coupled membaca state via context (lihat kontrak di bawah)'
              : ''}
            .
          </p>
        )}
        {entry.contextContract && (
          <ContextContractChips contract={entry.contextContract} />
        )}
      </section>

      <section aria-labelledby="kx-cat-usage-title" className="kx-cat-section">
        <h2 id="kx-cat-usage-title">Contoh pemakaian</h2>
        <pre className="kx-cat-code">
          <code>{usageSnippet(entry)}</code>
        </pre>
      </section>

      <section aria-labelledby="kx-cat-meta-title" className="kx-cat-section">
        <h2 id="kx-cat-meta-title">Meta</h2>
        <MetaList entry={entry} />
      </section>

      <p className="kx-cat-backlink">
        <a
          href={getPathnameFor({ name: 'components' })}
          onClick={(e) => {
            e.preventDefault()
            navigateTo({ name: 'components' })
          }}
        >
          ← Kembali ke indeks komponen
        </a>
      </p>
    </section>
  )
}
