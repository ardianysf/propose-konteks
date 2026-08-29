import { getPathnameFor } from '../router'

interface NotFoundPageProps {
  /** Original path that failed to parse, shown verbatim for debugging. */
  path: string
}

/**
 * Not-found — path tak dikenal (kontrak router spec §2: didokumentasikan,
 * bukan redirect diam-diam).
 *
 * Visual world: a mis-filed part slip in the "Industrial Parts Catalog".
 * Mono doc meta (KX-CAT/2026-08 · NOT FOUND) over one large stamp-red index
 * mark (404 — the page's single red moment, reusing the hero counter
 * numeral), then the original heading and lede, and the three available
 * routes boxed in a 1px hair card. No animations.
 */
export function NotFoundPage({ path }: NotFoundPageProps) {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-notfound-title">
      <header>
        <p className="kx-cat-docmeta">KX-CAT/2026-08 · NOT FOUND</p>
        <div
          className="kx-cat-counter-big"
          aria-hidden="true"
          style={{ color: 'var(--kxcat-red)', margin: '12px 0 16px' }}
        >
          404
        </div>
      </header>
      <h1 id="kx-cat-notfound-title" className="kx-cat-title">
        Halaman tidak ditemukan
      </h1>
      <p className="kx-cat-lede">
        Path <code>{path || '(kosong)'}</code> tidak cocok dengan route katalog
        manapun.
      </p>
      <div className="kx-cat-card">
        <p>
          Route yang tersedia:{' '}
          <a href={getPathnameFor({ name: 'overview' })}>Overview</a>,{' '}
          <a href={getPathnameFor({ name: 'tokens' })}>Tokens</a>, dan{' '}
          <a href={getPathnameFor({ name: 'components' })}>Components</a>.
        </p>
      </div>
    </section>
  )
}
