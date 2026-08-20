/**
 * Tokens — design token reference.
 * Placeholder shell content (T2); live computed values land in T4 (spec §6).
 */
export function TokensPage() {
  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-tokens-title">
      <h1 id="kx-cat-tokens-title" className="kx-cat-title">
        Tokens
      </h1>
      <p className="kx-cat-lede">
        Warm Enterprise palette, skala tipografi, dan token surface dari{' '}
        <code>src/styles/tokens.css</code>.
      </p>
      <div className="kx-cat-placeholder" role="note">
        Tabel token dengan nilai live (via <code>getComputedStyle</code>)
        menyusul di task berikut (T4).
      </div>
    </section>
  )
}
