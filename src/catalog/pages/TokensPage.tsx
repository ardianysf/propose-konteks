/*
 * Tokens — live design-token reference (T4 real content, spec §2 "Token
 * page" + AC7). Token NAMES come from the typed list in ../tokens.ts (the
 * contract verify:manifest validates); token VALUES are always read live
 * via getComputedStyle(document.documentElement), so the page reflects
 * tokens.css exactly and updates when the theme toggle flips data-theme.
 *
 * Visual world: a specimen sheet. A spec-sheet header (mono doc-meta band
 * over a 2px ink rule), then one ledger per token group —
 * flat spec-table rows with hairline separators, square swatches, live
 * type specimens, and mono value chips.
 *
 * jsdom safety: jsdom does not apply stylesheets, so getComputedStyle
 * returns empty strings there — the page renders the fallback em-dash and
 * never crashes (unit tests mock getComputedStyle instead).
 */
import { useEffect, useState } from 'react'
import { ALL_TOKEN_NAMES, TOKEN_GROUPS, type TokenDef, type TokenGroup } from '../tokens'

type ThemeId = 'light' | 'dark'
type TokenValues = Record<string, string>

const THEME_OPTIONS: Array<{ id: ThemeId; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function initialTheme(): ThemeId {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/** Read every catalogued token's computed value (empty string when the
 *  engine cannot resolve it — e.g. jsdom). Wrapped in try/catch so no
 *  environment can crash the page. */
function readTokenValues(): TokenValues {
  const values: TokenValues = {}
  try {
    const styles = getComputedStyle(document.documentElement)
    for (const name of ALL_TOKEN_NAMES) {
      values[name] = styles.getPropertyValue(name).trim()
    }
  } catch {
    for (const name of ALL_TOKEN_NAMES) values[name] = ''
  }
  return values
}

/** 1 → '01' — stable index formatting shared by all catalog tables. */
function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function ValueChip({ value }: { value: string }) {
  return (
    <span className={`kx-cat-value-chip${value ? '' : ' kx-cat-value-chip--empty'}`}>
      {value || '—'}
    </span>
  )
}

/* -------------------------------------------------------------------------
 * Ledger rows — role="table"/"row"/"cell" spec rows on a hairline ground.
 * ---------------------------------------------------------------------- */

function ColorRow({ token, value }: { token: TokenDef; value: string }) {
  return (
    <div className="kx-cat-ledger-row" role="row">
      <span className="kx-cat-cell-swatch" role="cell">
        <span
          className="kx-cat-swatch"
          style={value ? { background: `var(${token.name})` } : undefined}
          aria-hidden="true"
        />
      </span>
      <span className="kx-cat-cell-name" role="cell">
        <code className="kx-cat-token-name">{token.name}</code>
      </span>
      <span className="kx-cat-cell-note" role="cell">
        {token.note}
      </span>
      <span className="kx-cat-cell-value" role="cell">
        <ValueChip value={value} />
      </span>
    </div>
  )
}

function TextRow({ token, value }: { token: TokenDef; value: string }) {
  const isWeight = token.name.startsWith('--kx-font-') && token.name !== '--kx-font-family'
  return (
    <div className="kx-cat-ledger-row" role="row">
      <span className="kx-cat-cell-name" role="cell">
        <code className="kx-cat-token-name">{token.name}</code>
      </span>
      <span className="kx-cat-cell-note" role="cell">
        {token.note}
      </span>
      {/* Live preview: the sample line itself consumes the token, so the
          rendered size/weight/family follows the current theme. */}
      <span className="kx-cat-cell-sample" role="cell">
        <span
          className="kx-cat-type-sample"
          style={
            token.name === '--kx-font-family'
              ? { fontFamily: `var(${token.name})` }
              : isWeight
                ? { fontWeight: `var(${token.name})` }
                : { fontSize: `var(${token.name})` }
          }
        >
          Konteks session
        </span>
      </span>
      <span className="kx-cat-cell-value" role="cell">
        <ValueChip value={value} />
      </span>
    </div>
  )
}

function ValueRow({ token, value }: { token: TokenDef; value: string }) {
  return (
    <div className="kx-cat-ledger-row" role="row">
      <span className="kx-cat-cell-name" role="cell">
        <code className="kx-cat-token-name">{token.name}</code>
      </span>
      <span className="kx-cat-cell-note" role="cell">
        {token.note}
      </span>
      <span className="kx-cat-cell-value" role="cell">
        <ValueChip value={value} />
      </span>
    </div>
  )
}

function TokenGroupSection({
  group,
  values,
  index,
}: {
  group: TokenGroup
  values: TokenValues
  index: number
}) {
  const headingId = `kx-cat-tokens-${group.id}`
  const columns =
    group.kind === 'color'
      ? ['Swatch', 'Token', 'Note', 'Value']
      : group.kind === 'text'
        ? ['Token', 'Note', 'Specimen', 'Value']
        : ['Token', 'Note', 'Value']
  return (
    <section aria-labelledby={headingId} className="kx-cat-section">
      <div className="kx-cat-grouthead">
        <span className="kx-cat-grouthead-no" aria-hidden="true">
          {pad2(index + 1)}
        </span>
        <h2 id={headingId} className="kx-cat-grouthead-title">
          {group.title}
        </h2>
        <span className="kx-cat-grouthead-count">
          {group.tokens.length} tokens
        </span>
      </div>
      <div
        className={`kx-cat-ledger kx-cat-ledger--${group.kind}`}
        role="table"
        aria-label={`${group.title} tokens`}
      >
        <div className="kx-cat-ledger-head" role="row">
          {columns.map((column) => (
            <span key={column} role="columnheader">
              {column}
            </span>
          ))}
        </div>
        {group.tokens.map((token) => {
          const value = values[token.name] ?? ''
          if (group.kind === 'color') {
            return <ColorRow key={token.name} token={token} value={value} />
          }
          if (group.kind === 'text') {
            return <TextRow key={token.name} token={token} value={value} />
          }
          return <ValueRow key={token.name} token={token} value={value} />
        })}
      </div>
    </section>
  )
}

export function TokensPage() {
  const [theme, setTheme] = useState<ThemeId>(initialTheme)
  const [values, setValues] = useState<TokenValues>(readTokenValues)

  useEffect(() => {
    // Same pattern as initTheme in src/catalog/main.tsx: the theme is
    // stamped on <html data-theme>; tokens.css keys its dark palette off
    // that attribute. Values are re-read after the flip so swatches and
    // chips show the live computed results.
    document.documentElement.dataset.theme = theme
    setValues(readTokenValues())
  }, [theme])

  const tokenCount = TOKEN_GROUPS.reduce((sum, group) => sum + group.tokens.length, 0)

  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-tokens-title">
      <header className="kx-cat-doc-head">
        <div className="kx-cat-doc-band">
          <p className="kx-cat-docmeta">KX-CAT/2026-08 · SEC 02 · TOKENS</p>
        </div>
        <div className="kx-cat-doc-titlerow">
          <h1 id="kx-cat-tokens-title" className="kx-cat-doc-title kx-cat-title">
            Tokens
          </h1>
          <p className="kx-cat-doc-count">
            {tokenCount} tokens · {TOKEN_GROUPS.length} groups
          </p>
        </div>
        <p className="kx-cat-lede">
          Warm Enterprise palette, skala tipografi, dan token surface dari{' '}
          <code>src/styles/tokens.css</code>. Semua nilai dibaca{' '}
          <strong>live</strong> via <code>getComputedStyle</code> — bukan
          hardcode — sehingga selalu sinkron dengan stylesheet.
        </p>
      </header>

      <div
        className="kx-cat-theme-toggle"
        role="group"
        aria-label="Theme pratinjau"
      >
        <span className="kx-cat-theme-toggle-label">Theme</span>
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="kx-cat-theme-toggle-btn"
            aria-pressed={theme === option.id}
            onClick={() => setTheme(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {TOKEN_GROUPS.map((group, index) => (
        <TokenGroupSection
          key={group.id}
          group={group}
          values={values}
          index={index}
        />
      ))}
    </section>
  )
}
