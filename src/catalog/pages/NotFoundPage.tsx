import { getPathnameFor } from '../router'

interface NotFoundPageProps {
  /** Original path that failed to parse, shown verbatim for debugging. */
  path: string
}

/**
 * Not-found — path tak dikenal (kontrak router spec §2: didokumentasikan,
 * bukan redirect diam-diam).
 */
export function NotFoundPage({ path }: NotFoundPageProps) {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-notfound-title">
      <h1 id="kx-cat-notfound-title" className="kx-cat-title">
        Halaman tidak ditemukan
      </h1>
      <p className="kx-cat-lede">
        Path <code>{path || '(kosong)'}</code> tidak cocok dengan route katalog
        manapun.
      </p>
      <p>
        Route yang tersedia:{' '}
        <a href={getPathnameFor({ name: 'overview' })}>Overview</a>,{' '}
        <a href={getPathnameFor({ name: 'tokens' })}>Tokens</a>, dan{' '}
        <a href={getPathnameFor({ name: 'components' })}>Components</a>.
      </p>
    </section>
  )
}
