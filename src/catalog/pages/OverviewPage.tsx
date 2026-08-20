/**
 * Overview — catalog landing page.
 * Placeholder shell content (T2); full content lands in T4 (spec §6).
 */
export function OverviewPage() {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-overview-title">
      <h1 id="kx-cat-overview-title" className="kx-cat-title">
        Konteks Design System
      </h1>
      <p className="kx-cat-lede">
        Referensi hidup untuk design system Konteks: token, komponen, kontrak
        API, dan panduan adopsi. Katalog ini mengonsumsi komponen produksi dari{' '}
        <code>src/components/</code> — single source of truth, tanpa salinan.
      </p>
      <div className="kx-cat-placeholder" role="note">
        Konten overview menyusul di task berikut (T4): ringkasan token,
        contoh komposisi halaman mockup, dan tautan adopsi.
      </div>
    </section>
  )
}
