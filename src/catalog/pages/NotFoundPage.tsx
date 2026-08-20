interface NotFoundPageProps {
  /** Original hash that failed to parse, shown verbatim for debugging. */
  hash: string
}

/**
 * Not-found — hash tak dikenal (kontrak router spec §2: didokumentasikan,
 * bukan redirect diam-diam).
 */
export function NotFoundPage({ hash }: NotFoundPageProps) {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-notfound-title">
      <h1 id="kx-cat-notfound-title" className="kx-cat-title">
        Halaman tidak ditemukan
      </h1>
      <p className="kx-cat-lede">
        Hash <code>{hash || '(kosong)'}</code> tidak cocok dengan route katalog
        manapun.
      </p>
      <p>
        Route yang tersedia: <a href="#/">Overview</a>,{' '}
        <a href="#/tokens">Tokens</a>, dan <a href="#/components">Components</a>.
      </p>
    </section>
  )
}
