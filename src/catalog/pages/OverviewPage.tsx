/*
 * Overview — the catalog hero spread ("Industrial Parts Catalog", comp A):
 * a 38% identity column (brand, doc meta, 72px title, counter stack, intro,
 * Source-First stamp), a domain index table, and a 26px ruler margin.
 *
 * Every number is computed at runtime: component and domain counts come from
 * the manifest (components.json via manifest.ts), the token count from the
 * typed token structures in tokens.ts, outputs is the dual-output contract.
 */
import { entriesByDomain, manifestEntries } from '../manifest'
import { TOKEN_GROUPS } from '../tokens'
import { getPathnameFor, navigateTo } from '../router'

/** Dual-output repo: the mockup app + this catalog. */
const OUTPUT_COUNT = 2

/** How many sample part names to show before the ellipsis. */
const MAX_SAMPLES = 4

const componentCount = manifestEntries.length
const domainGroups = entriesByDomain()
const domainCount = domainGroups.length
const tokenCount = TOKEN_GROUPS.reduce((sum, group) => sum + group.tokens.length, 0)

const COUNTERS: Array<{ value: number; label: string }> = [
  { value: componentCount, label: 'Components' },
  { value: domainCount, label: 'Domains' },
  { value: tokenCount, label: 'Tokens' },
  { value: OUTPUT_COUNT, label: 'Outputs' },
]

/** Domain index rows in components.json order (first appearance). */
const INDEX_ROWS = domainGroups.map((group, index) => {
  const samples = group.entries.slice(0, MAX_SAMPLES).map((entry) => entry.name)
  if (group.entries.length > MAX_SAMPLES) samples.push('…')
  return {
    no: String(index + 1).padStart(2, '0'),
    domain: group.domain,
    samples: samples.join(' · '),
    count: group.entries.length,
  }
})

function handleRowClick(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  navigateTo({ name: 'components' })
}

export function OverviewPage() {
  return (
    <section
      className="kx-cat-page kx-cat-hero"
      aria-labelledby="kx-cat-overview-title"
    >
      <div className="kx-cat-hero-grid">
        <aside className="kx-cat-hero-left">
          <header>
            <p id="kx-cat-overview-brand" className="kx-cat-brand">
              Konteks{' '}
              <span className="kx-cat-sep" aria-hidden="true" />
              <span className="kx-cat-brand-ds">Design System</span>
            </p>
            <p className="kx-cat-docmeta">KX-CAT/2026-08 · REV A</p>
          </header>
          <h1 id="kx-cat-overview-title" className="kx-cat-hero-title kx-cat-title">
            Component
            <br />
            Catalog
          </h1>
          <div className="kx-cat-counters">
            {COUNTERS.map((counter) => (
              <div key={counter.label} className="kx-cat-counter">
                <div className="kx-cat-counter-big">{counter.value}</div>
                <div className="kx-cat-counter-lbl">{counter.label}</div>
              </div>
            ))}
          </div>
          <p className="kx-cat-hero-intro">
            A living parts book for the Konteks dual-output system. Every entry
            renders the production component — source-first, never a wrapper.
          </p>
          <p className="kx-cat-stamp">Source-First</p>
        </aside>

        <section className="kx-cat-hero-right" aria-label="Domain index">
          <div className="kx-cat-thead" aria-hidden="true">
            <span className="kx-cat-cell-no">No.</span>
            <span className="kx-cat-cell-dom">Domain</span>
            <span className="kx-cat-cell-parts">Sample Parts</span>
            <span className="kx-cat-cell-count">Count</span>
          </div>
          <div className="kx-cat-rows">
            {INDEX_ROWS.map((row) => (
              <a
                key={row.domain}
                className="kx-cat-row"
                href={getPathnameFor({ name: 'components' })}
                onClick={handleRowClick}
              >
                <span className="kx-cat-cell-no">{row.no}</span>
                <span className="kx-cat-cell-dom">{row.domain}</span>
                <span className="kx-cat-cell-parts">{row.samples}</span>
                <span className="kx-cat-cell-count">{row.count}</span>
              </a>
            ))}
          </div>
          <p className="kx-cat-legend">
            <span className="kx-cat-legend-label">Classification</span>
            <span>Adoptable</span>
            <span className="kx-cat-legend-sep" aria-hidden="true">
              ·
            </span>
            <span>Mockup-coupled</span>
            <span className="kx-cat-legend-sep" aria-hidden="true">
              ·
            </span>
            <span>Utility</span>
            <span className="kx-cat-legend-sep" aria-hidden="true">
              ·
            </span>
            <span>Internal</span>
          </p>
        </section>

        <div className="kx-cat-ruler" aria-hidden="true" />
      </div>
    </section>
  )
}
