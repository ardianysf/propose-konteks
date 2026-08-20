import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead.
const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const palette = [
  '#FAF8EF',
  '#FFFFFF',
  '#FFF',
  '#243025',
  '#58735A',
  '#778C78',
  '#E2E9D5',
  '#F4F8EE',
  '#8FBF6A',
  '#5F8D4E',
  '#607260',
  '#4F7044',
  '#95A547',
]

it.each(palette)('tokens.css defines %s', (hex) =>
  expect(css.toUpperCase()).toContain(hex.toUpperCase()),
)

it.each([22, 18, 16, 14, 12, 11, 10, 9])('type scale defines %spx', (px) =>
  expect(css).toContain(`${px}px`),
)

it('defines fixed dimensions (19.5px corners, 240px sidebar, 790x580 customize, 450px drawer)', () => {
  expect(css).toContain('19.5px')
  expect(css).toContain('240px')
  expect(css).toContain('790px')
  expect(css).toContain('580px')
  expect(css).toContain('450px')
})

it('defines the three Task 13 AA contrast semantics (AC9)', () => {
  expect(css).toContain('--kx-muted-text-aa: #607260')
  expect(css).toContain('--kx-accent-text-aa: #4f7044')
  expect(css).toContain('--kx-accent-solid-aa: #4f7044')
})

it('defines the Session Mode active segment fill — dark-text AA (white fails)', () => {
  expect(css).toContain('--kx-accent-segment-aa: #95a547')
})

// ── Dark theme (konteks.io dark palette — ink-900 bg, matcha accents) ────

it('declares color-scheme on both :root (light) and the dark block', () => {
  expect(css).toContain('color-scheme: light')
  expect(css).toContain('color-scheme: dark')
})

it('defines a [data-theme=\'dark\'] block with the konteks.io dark palette', () => {
  expect(css).toContain("[data-theme='dark']")
  const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))
  expect(darkBlock).toContain('--kx-canvas: #0f1510')
  expect(darkBlock).toContain('--kx-raised: #1a231b')
  expect(darkBlock).toContain('--kx-sidebar-bg: #152618')
  expect(darkBlock).toContain('--kx-primary: #e8ede8')
  expect(darkBlock).toContain('--kx-secondary: #c5cfc6')
  expect(darkBlock).toContain('--kx-muted: #9ead9f')
  expect(darkBlock).toContain('--kx-muted-text-aa: #9ead9f')
  expect(darkBlock).toContain('--kx-accent-text-aa: #c5d9a6')
  expect(darkBlock).toContain('--kx-accent-solid-aa: #4f7044')
  expect(darkBlock).toContain('--kx-accent-segment-aa: #a8c883')
  expect(darkBlock).toContain('--kx-border: #35502c')
  expect(darkBlock).toContain('--kx-pale: #152618')
})

it('keeps the shared accents unchanged in the dark block', () => {
  const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))
  // --kx-accent and --kx-accent-strong are NOT overridden in dark mode.
  expect(darkBlock).not.toContain('--kx-accent:')
  expect(darkBlock).not.toContain('--kx-accent-strong:')
})

it('defines --kx-ink-rgb for shadow composition in both themes', () => {
  expect(css).toContain('--kx-ink-rgb: 36 48 37;') // #243025 (light)
  const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))
  expect(darkBlock).toContain('--kx-ink-rgb: 53 80 44;') // #35502C (dark)
})

it('defines theme-aware --kx-scrim-* tokens in both themes', () => {
  // Light: ink-based scrim darkens the light canvas.
  expect(css).toContain('--kx-scrim-base: rgb(36 48 37 / 0.44);')
  expect(css).toContain('--kx-scrim-nested: rgb(36 48 37 / 0.14);')
  // Dark: black-based scrim — an ink-tinted scrim would blend LIGHTER than
  // the near-black canvas (#0F1510) and the backdrop would read as absent.
  const darkBlock = css.slice(css.indexOf("[data-theme='dark']"))
  expect(darkBlock).toContain('--kx-scrim-base: rgb(0 0 0 / 0.55);')
  expect(darkBlock).toContain('--kx-scrim-nested: rgb(0 0 0 / 0.3);')
})

it('stylesheets contain no invalid mixed comma+slash rgb() syntax', () => {
  // CSS Color 4 allows legacy comma-separated rgb() OR the modern
  // space-separated form with slash alpha — but never commas combined with
  // a slash alpha in the same function. Browsers silently drop the whole
  // declaration for the mixed form, which is what made the modal backdrop
  // invisible in both themes. Guard against regression.
  const components = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
  const mixedCommaSlash = /rgb\([^)]*,[^)]*\/\s/
  expect(css).not.toMatch(mixedCommaSlash)
  expect(components).not.toMatch(mixedCommaSlash)
})
