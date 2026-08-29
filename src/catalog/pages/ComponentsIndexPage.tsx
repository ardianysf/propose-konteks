/*
 * Components index — the master parts index: daftar semua entri manifest,
 * dikelompokkan per domain (urut abjad; entri di dalam domain ikut urutan
 * manifest). Sejak T6, SETIAP entri komponen (adoptable + mockup-coupled)
 * punya halaman detail dan ditautkan; entri internal (AppShell) dan utility
 * (.ts helper) dicantumkan dengan alasannya tanpa link (spec §2/§4 + AC4/AC6).
 *
 * Visual world: a parts-bin index. Spec-sheet header (mono doc-meta band
 * over a 2px ink rule + tabular count summary), then one bin section per
 * domain — a stenciled domain header (blue mono index, caps domain name,
 * hairline rule) over a parts table with stable mono part numbers
 * (`KX-<DOM>-<NN>`, see ../partNumbers), Sarabun 700 part names, ink
 * classification stamps, and a blue chevron on linked rows.
 */
import { manifestEntries, type ManifestEntry } from '../manifest'
import { getPathnameFor, navigateTo } from '../router'
import { partNumber } from '../partNumbers'

function isLinkable(entry: ManifestEntry): boolean {
  return (
    entry.classification === 'adoptable' ||
    entry.classification === 'mockup-coupled'
  )
}

interface DomainGroup {
  domain: string
  entries: ManifestEntry[]
}

function groupByDomain(entries: readonly ManifestEntry[]): DomainGroup[] {
  const groups = new Map<string, ManifestEntry[]>()
  for (const entry of entries) {
    const list = groups.get(entry.domain)
    if (list) list.push(entry)
    else groups.set(entry.domain, [entry])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domain, grouped]) => ({ domain, entries: grouped }))
}

/** Reason a non-linkable entry is catalogued without a detail sheet
 *  (kept verbatim — it carries the "why", not the manifest description). */
function indexNote(entry: ManifestEntry): string {
  return entry.classification === 'internal'
    ? 'internal — orkestrator route/page, tanpa detail adopsi'
    : 'utility — manifest entry only, tanpa preview visual'
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

const PART_COLUMNS = ['Part no.', 'Name', 'Class', 'Description', '']

/** Row indicator: a tiny ink-stroke chevron (no Unicode arrow glyphs). */
function ChevronGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <path d="M4.5 2.5 8 6l-3.5 3.5" />
    </svg>
  )
}

function PartsTable({ entries, domain }: { entries: ManifestEntry[]; domain: string }) {
  return (
    <div className="kx-cat-parts" role="table" aria-label={`${domain} parts`}>
      <div className="kx-cat-parts-head" role="row">
        {PART_COLUMNS.map((column, i) => (
          <span key={`${column}-${i}`} role="columnheader">
            {column}
          </span>
        ))}
      </div>
      {entries.map((entry) => {
        const linkable = isLinkable(entry)
        return (
          <div key={entry.id} className="kx-cat-parts-row" role="row">
            <span className="kx-cat-parts-no" role="cell">
              {partNumber(entry)}
            </span>
            <span className="kx-cat-parts-name" role="cell">
              {linkable ? (
                <a
                  href={getPathnameFor({ name: 'component', slug: entry.id })}
                  onClick={(e) => {
                    e.preventDefault()
                    navigateTo({ name: 'component', slug: entry.id })
                  }}
                >
                  {entry.name}
                </a>
              ) : (
                <span
                  className="kx-cat-parts-name--disabled"
                  aria-disabled="true"
                >
                  {entry.name}
                </span>
              )}
            </span>
            <span className="kx-cat-parts-class" role="cell">
              <span className={`kx-cat-badge kx-cat-badge--${entry.classification}`}>
                {entry.classification}
              </span>
            </span>
            <span className="kx-cat-parts-desc" role="cell">
              {linkable ? entry.description : indexNote(entry)}
            </span>
            <span className="kx-cat-parts-arrow" role="cell" aria-hidden="true">
              {linkable ? <ChevronGlyph /> : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DomainSection({
  domain,
  entries,
  index,
  note,
}: {
  domain: string
  entries: ManifestEntry[]
  index: number
  note?: string
}) {
  const headingId =
    domain === 'internal'
      ? 'kx-cat-domain-internal'
      : domain === 'utility'
        ? 'kx-cat-domain-utility'
        : `kx-cat-domain-${domain}`
  return (
    <section aria-labelledby={headingId} className="kx-cat-section">
      <div className="kx-cat-grouthead kx-cat-grouthead--hair">
        <span className="kx-cat-grouthead-no" aria-hidden="true">
          {pad2(index + 1)}
        </span>
        <h2 id={headingId} className="kx-cat-grouthead-title">
          {domain}
        </h2>
        <span className="kx-cat-grouthead-count">
          {entries.length} parts
        </span>
      </div>
      {note && <p className="kx-cat-muted-note kx-cat-domain-note">{note}</p>}
      <PartsTable entries={entries} domain={domain} />
    </section>
  )
}

export function ComponentsIndexPage() {
  const componentEntries = manifestEntries.filter(
    (entry) => entry.classification !== 'utility' && entry.classification !== 'internal',
  )
  const internalEntries = manifestEntries.filter(
    (entry) => entry.classification === 'internal',
  )
  const utilityEntries = manifestEntries.filter(
    (entry) => entry.classification === 'utility',
  )
  const domainCount = new Set(componentEntries.map((entry) => entry.domain)).size
  const groups = groupByDomain(componentEntries)

  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-components-title">
      <header className="kx-cat-doc-head">
        <div className="kx-cat-doc-band">
          <p className="kx-cat-docmeta">KX-CAT/2026-08 · SEC 03 · COMPONENTS</p>
        </div>
        <div className="kx-cat-doc-titlerow">
          <h1 id="kx-cat-components-title" className="kx-cat-doc-title kx-cat-title">
            Components
          </h1>
          <p className="kx-cat-doc-count">
            {manifestEntries.length} entries · {domainCount} domains ·{' '}
            {componentEntries.length} detail sheets
          </p>
        </div>
        <p className="kx-cat-lede">
          {manifestEntries.length} entri dari manifest{' '}
          <code>src/catalog/components.json</code>, dikelompokkan per domain.
          Semua {componentEntries.length} komponen (adoptable + mockup-coupled)
          punya halaman detail dengan live preview; entri internal dan utility
          dicantumkan dengan alasannya.
        </p>
      </header>

      {groups.map((group, index) => (
        <DomainSection
          key={group.domain}
          domain={group.domain}
          entries={group.entries}
          index={index}
        />
      ))}

      <DomainSection
        domain="internal"
        index={groups.length}
        entries={internalEntries}
        note="Tidak bermakna di luar aplikasi mockup (orkestrator route/page) — dikatalogkan dengan alasannya, tanpa halaman detail adopsi."
      />

      <DomainSection
        domain="utility"
        index={groups.length + 1}
        entries={utilityEntries}
        note="Helper .ts murni (adapter, formatter, hook) — manifest entry only, tanpa live preview visual."
      />
    </section>
  )
}
