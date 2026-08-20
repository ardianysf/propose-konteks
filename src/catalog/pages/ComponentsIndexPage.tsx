/**
 * Components index — daftar semua komponen terkatalog.
 * Placeholder shell content (T2); manifest-driven list lands in T3/T6.
 */
export function ComponentsIndexPage() {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-components-title">
      <h1 id="kx-cat-components-title" className="kx-cat-title">
        Components
      </h1>
      <p className="kx-cat-lede">
        Indeks komponen produksi <code>src/components/</code> dengan
        klasifikasi adoptable / mockup-coupled / internal.
      </p>
      <div className="kx-cat-placeholder" role="note">
        Daftar komponen dari manifest (<code>components.json</code>) menyusul
        di task berikut (T3/T6).
      </div>
    </section>
  )
}
