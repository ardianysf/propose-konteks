/*
 * Overview — catalog landing page (T4 real content, spec §6 T4 + AC5/6).
 * Explains the dual-output repo, the classification system, how AI agents
 * consume components.json, and shows the mockup pages as composition
 * consumers of the catalogued components.
 */
import { entriesByDomain, manifestEntries } from '../manifest'
import { getPathnameFor, navigateTo } from '../router'

const CLASSIFICATIONS: Array<{
  id: string
  label: string
  meaning: string
}> = [
  {
    id: 'adoptable',
    label: 'Adoptable',
    meaning:
      'Presentational — copy the source file (plus its CSS) and use it. No MockupContext required, but an entry may still need a lightweight provider contract (e.g. WorkspaceMenu needs OverlayLifecycleProvider) — always check the entry\'s adoptionNotes.',
  },
  {
    id: 'mockup-coupled',
    label: 'Mockup-coupled',
    meaning:
      'State Y — the component reads a MockupContext slice and/or dispatches actions. Preview via the fixture pattern (real mockupReducer + controlled initial state); adopt by copying the reducer contract too.',
  },
  {
    id: 'internal',
    label: 'Internal',
    meaning:
      'Not meaningful outside the mockup app (route/page orchestrator). Catalogued with a reason, without an adoption detail page.',
  },
  {
    id: 'utility',
    label: 'Utility',
    meaning:
      'Pure .ts helper (adapter, formatter, hook). Manifest entry only — no live preview.',
  },
]

const counts = {
  total: manifestEntries.length,
  adoptable: manifestEntries.filter((e) => e.classification === 'adoptable').length,
  coupled: manifestEntries.filter((e) => e.classification === 'mockup-coupled').length,
  internal: manifestEntries.filter((e) => e.classification === 'internal').length,
  utility: manifestEntries.filter((e) => e.classification === 'utility').length,
}

const domainGroups = entriesByDomain()

export function OverviewPage() {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-overview-title">
      <h1 id="kx-cat-overview-title" className="kx-cat-title">
        Konteks Design System
      </h1>
      <p className="kx-cat-lede">
        Referensi hidup untuk design system Konteks: token, komponen, kontrak
        API, dan panduan adopsi — dioptimalkan untuk dikonsumsi AI agent lain
        (source-first, bukan npm package).
      </p>

      <section aria-labelledby="kx-cat-dual-title" className="kx-cat-section">
        <h2 id="kx-cat-dual-title">Dual-output repository</h2>
        <p>
          Satu codebase menghasilkan dua artefak: <strong>mockup clickable</strong>{' '}
          (<code>index.html</code>) dan <strong>katalog referensi ini</strong> (
          <code>catalog.html</code>). Katalog adalah <em>konsumer</em> komponen
          produksi dari <code>src/components/</code> — live preview mengimpor
          implementasi aslinya, tanpa salinan (single source of truth).
        </p>
        <p>
          Cara pakai: navigasi via clean URL router (lihat nav di atas). Deep-link (
          <code>/catalog/components/&lt;slug&gt;</code>), reload, dan back/forward
          browser bekerja alami.
        </p>
      </section>

      <section aria-labelledby="kx-cat-class-title" className="kx-cat-section">
        <h2 id="kx-cat-class-title">Klasifikasi komponen</h2>
        <p>
          {counts.total} entri manifest: {counts.adoptable} adoptable,{' '}
          {counts.coupled} mockup-coupled, {counts.internal} internal,{' '}
          {counts.utility} utility.
        </p>
        <div className="kx-cat-card-grid">
          {CLASSIFICATIONS.map((c) => (
            <article key={c.id} className="kx-cat-card">
              <h3>
                <span className={`kx-cat-badge kx-cat-badge--${c.id}`}>{c.label}</span>
              </h3>
              <p>{c.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="kx-cat-ai-title" className="kx-cat-section">
        <h2 id="kx-cat-ai-title">Cara AI memakai katalog ini</h2>
        <ol className="kx-cat-steps">
          <li>
            Baca <code>src/catalog/components.json</code> — manifest
            machine-readable: id, domain, <code>sourcePath</code>,{' '}
            <code>exportName</code>, klasifikasi, <code>propDocs</code>,{' '}
            <code>contextContract</code> (state yang dibaca + action yang
            dikirim), <code>cssFiles</code>, dan <code>tokenDeps</code>.
          </li>
          <li>
            Salin file sumber komponen beserta <code>cssFiles</code>-nya;
            untuk komponen coupled, salin juga kontrak reducer
            (<code>src/state/mockupReducer.ts</code>) yang dirujuk{' '}
            <code>contextContract</code>.
          </li>
          <li>
            Untuk preview/uji, pakai pola fixture{' '}
            <code>MockupFixtureProvider</code>: reducer asli + initial state
            terkontrol — bukan salinan implementasi.
          </li>
          <li>
            Validasi struktur dengan <code>npm run verify:manifest</code>{' '}
            (path, ekspor, nama prop, manifest↔registry 1:1).
          </li>
        </ol>
      </section>

      <section aria-labelledby="kx-cat-composition-title" className="kx-cat-section">
        <h2 id="kx-cat-composition-title">Contoh komposisi</h2>
        <p>
          Tiga pages mockup (<code>src/pages/</code>: new-session,
          session-history, session-detail) adalah konsumen komponen-komponen
          ini. Ringkasan domain → komponen dari manifest:
        </p>
        <table className="kx-cat-table">
          <thead>
            <tr>
              <th scope="col">Domain</th>
              <th scope="col">Components</th>
            </tr>
          </thead>
          <tbody>
            {domainGroups.map((group) => (
              <tr key={group.domain}>
                <th scope="row">
                  <code>{group.domain}</code>
                </th>
                <td>
                  {group.entries.map((entry) => (
                    <span key={entry.id} className="kx-cat-chip">
                      {entry.name}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Lihat{' '}
          <a
            href={getPathnameFor({ name: 'tokens' })}
            onClick={(e) => {
              e.preventDefault()
              navigateTo({ name: 'tokens' })
            }}
          >
            token live
          </a>{' '}
          dan{' '}
          <a
            href={getPathnameFor({ name: 'components' })}
            onClick={(e) => {
              e.preventDefault()
              navigateTo({ name: 'components' })
            }}
          >
            indeks komponen
          </a>{' '}
          untuk detailnya.
        </p>
      </section>
    </section>
  )
}
