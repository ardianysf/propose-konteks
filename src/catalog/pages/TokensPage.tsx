/*
 * Tokens — live design-token reference (T4 real content, spec §2 "Token
 * page" + AC7). Token NAMES come from the typed list in ../tokens.ts (the
 * contract verify:manifest validates); token VALUES are always read live
 * via getComputedStyle(document.documentElement), so the page reflects
 * tokens.css exactly and updates when the theme toggle flips data-theme.
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

function ValueChip({ value }: { value: string }) {
  return (
    <span className={`kx-cat-value-chip${value ? '' : ' kx-cat-value-chip--empty'}`}>
      {value || '—'}
    </span>
  )
}

function ColorRow({ token, value }: { token: TokenDef; value: string }) {
  return (
    <li className="kx-cat-token-row">
      <span
        className="kx-cat-swatch"
        style={value ? { background: `var(${token.name})` } : undefined}
        aria-hidden="true"
      />
      <div className="kx-cat-token-meta">
        <code className="kx-cat-token-name">{token.name}</code>
        <span className="kx-cat-token-note">{token.note}</span>
      </div>
      <ValueChip value={value} />
    </li>
  )
}

function TextRow({ token, value }: { token: TokenDef; value: string }) {
  const isWeight = token.name.startsWith('--kx-font-') && token.name !== '--kx-font-family'
  return (
    <li className="kx-cat-token-row">
      <div className="kx-cat-token-meta">
        <code className="kx-cat-token-name">{token.name}</code>
        <span className="kx-cat-token-note">{token.note}</span>
      </div>
      {/* Live preview: the sample line itself consumes the token, so the
          rendered size/weight/family follows the current theme. */}
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
      <ValueChip value={value} />
    </li>
  )
}

function ValueRow({ token, value }: { token: TokenDef; value: string }) {
  return (
    <li className="kx-cat-token-row">
      <div className="kx-cat-token-meta">
        <code className="kx-cat-token-name">{token.name}</code>
        <span className="kx-cat-token-note">{token.note}</span>
      </div>
      <ValueChip value={value} />
    </li>
  )
}

function TokenGroupSection({
  group,
  values,
}: {
  group: TokenGroup
  values: TokenValues
}) {
  const headingId = `kx-cat-tokens-${group.id}`
  return (
    <section aria-labelledby={headingId} className="kx-cat-section">
      <h2 id={headingId}>{group.title}</h2>
      <ul className={`kx-cat-token-list kx-cat-token-list--${group.kind}`}>
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
      </ul>
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

  return (
    <section className="kx-cat-page" aria-labelledby="kx-cat-tokens-title">
      <h1 id="kx-cat-tokens-title" className="kx-cat-title">
        Tokens
      </h1>
      <p className="kx-cat-lede">
        Warm Enterprise palette, skala tipografi, dan token surface dari{' '}
        <code>src/styles/tokens.css</code>. Semua nilai dibaca{' '}
        <strong>live</strong> via <code>getComputedStyle</code> — bukan
        hardcode — sehingga selalu sinkron dengan stylesheet.
      </p>

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

      {TOKEN_GROUPS.map((group) => (
        <TokenGroupSection key={group.id} group={group} values={values} />
      ))}
    </section>
  )
}
