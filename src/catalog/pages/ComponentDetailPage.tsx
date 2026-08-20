interface ComponentDetailPageProps {
  /** URI-decoded slug from `#/components/<slug>`. */
  slug: string
}

/**
 * Component detail — live preview + kontrak API satu komponen.
 * Placeholder shell content (T2); detail penuh mulai T4 (spec §6).
 */
export function ComponentDetailPage({ slug }: ComponentDetailPageProps) {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-component-title">
      <p className="kx-cat-breadcrumb">
        <a href="#/components">Components</a>
        <span aria-hidden="true"> / </span>
        {slug}
      </p>
      <h1 id="kx-cat-component-title" className="kx-cat-title">
        <code>{slug}</code>
      </h1>
      <div className="kx-cat-placeholder" role="note">
        Detail komponen <strong>{slug}</strong> — live preview, kontrak API,
        contoh pemakaian, path source, dan dependensi token — menyusul di task
        berikut (T4+).
      </div>
    </section>
  )
}
