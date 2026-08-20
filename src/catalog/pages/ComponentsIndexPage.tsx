/*
 * Components index — daftar semua entri manifest, dikelompokkan per domain
 * (urut abjad; entri di dalam domain ikut urutan manifest). Entri dengan
 * preview tersedia (sampel T4) menjadi link ke halaman detail; sisanya
 * disabled dengan keterangan "detail page menyusul (T6)" (spec §2 + AC6).
 */
import { manifestEntries, type ManifestEntry } from '../manifest'
import { registry } from '../registry'

/** IDs whose registry entry provides a live preview (and therefore a
 *  working detail page). Derived from the registry, not hardcoded. */
const PREVIEWABLE_IDS = new Set(
  registry.filter((entry) => entry.preview !== undefined).map((entry) => entry.id),
)

/** Detail pages exist for every *component* entry; utility modules have no
 *  visual preview so they are listed manifest-only (manifest entry only). */
function isLinkable(entry: ManifestEntry): boolean {
  return PREVIEWABLE_IDS.has(entry.id)
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

function EntryRow({ entry }: { entry: ManifestEntry }) {
  const linkable = isLinkable(entry)
  return (
    <li className="kx-cat-index-row">
      {linkable ? (
        <a className="kx-cat-index-link" href={`#/components/${entry.id}`}>
          {entry.name}
        </a>
      ) : (
        <span
          className="kx-cat-index-link kx-cat-index-link--disabled"
          aria-disabled="true"
        >
          {entry.name}
        </span>
      )}
      <span className={`kx-cat-badge kx-cat-badge--${entry.classification}`}>
        {entry.classification}
      </span>
      {linkable ? (
        <span className="kx-cat-index-note kx-cat-index-note--preview">
          live preview tersedia
        </span>
      ) : (
        <span className="kx-cat-index-note">detail page menyusul (T6)</span>
      )}
    </li>
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

  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-components-title">
      <h1 id="kx-cat-components-title" className="kx-cat-title">
        Components
      </h1>
      <p className="kx-cat-lede">
        {manifestEntries.length} entri dari manifest{' '}
        <code>src/catalog/components.json</code>, dikelompokkan per domain.
        Dua entri sampel sudah punya live preview &amp; halaman detail;
        sisanya menyusul (T6).
      </p>

      {groupByDomain(componentEntries).map((group) => (
        <section
          key={group.domain}
          aria-labelledby={`kx-cat-domain-${group.domain}`}
          className="kx-cat-section"
        >
          <h2 id={`kx-cat-domain-${group.domain}`}>
            <code>{group.domain}</code>
          </h2>
          <ul className="kx-cat-index-list">
            {group.entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="kx-cat-domain-internal" className="kx-cat-section">
        <h2 id="kx-cat-domain-internal">internal</h2>
        <p className="kx-cat-muted-note">
          Tidak bermakna di luar aplikasi mockup (orkestrator route/page) —
          dikatalogkan dengan alasannya, tanpa halaman detail adopsi.
        </p>
        <ul className="kx-cat-index-list">
          {internalEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="kx-cat-domain-utility" className="kx-cat-section">
        <h2 id="kx-cat-domain-utility">utility</h2>
        <p className="kx-cat-muted-note">
          Helper .ts murni (adapter, formatter, hook) — manifest entry only,
          tanpa live preview visual.
        </p>
        <ul className="kx-cat-index-list">
          {utilityEntries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      </section>
    </section>
  )
}
