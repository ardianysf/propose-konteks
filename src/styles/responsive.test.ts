import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead
// (same convention as tokens.test.ts). These are source-string assertions:
// jsdom does not load real CSS, so the responsive/focus/glow contracts are
// verified against the committed stylesheets directly.
const components = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
const global = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8')

/** Collapse runs of whitespace so multi-line rules match as single strings. */
const flat = (css: string) => css.replace(/\s+/g, ' ')

/** The responsive media-query block onward (it is the final section). */
function responsiveBlock(): string {
  const start = components.indexOf('@media (max-width: 1280px)')
  expect(start).toBeGreaterThanOrEqual(0)
  return components.slice(start)
}

/** The single .kx-customize rule body (open brace → first closing brace). */
function customizeRule(): string {
  const open = components.indexOf('.kx-customize {')
  expect(open).toBeGreaterThanOrEqual(0)
  const close = components.indexOf('}', open)
  expect(close).toBeGreaterThan(open)
  return components.slice(open, close)
}

describe('responsive rail at max-width 1280px (AC12/AC44)', () => {
  it('declares a max-width 1280px media query', () => {
    expect(components).toContain('@media (max-width: 1280px)')
  })

  it('forces the 64px rail grid track regardless of stored state', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain('.kx-app { grid-template-columns: var(--kx-sidebar-rail) 1fr;')
  })

  it('sizes the sidebar element itself to the rail width', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain(
      '.kx-sidebar { width: var(--kx-sidebar-rail); min-width: var(--kx-sidebar-rail); padding: 14px 8px 10px;',
    )
  })

  it('hides expanded-only labels, captions, recent content, user name, and chevrons', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain(
      '.kx-sidebar__control-copy, .kx-sidebar__chevron, .kx-sidebar__recent, .kx-sidebar__user-name { display: none;',
    )
  })

  it('centers icon/control spacing like the manual rail', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain('.kx-sidebar__control { justify-content: center; gap: 0; padding: 8px 0;')
    expect(block).toContain('.kx-sidebar__top { flex-direction: column; gap: 6px;')
    expect(block).toContain('.kx-sidebar__user { justify-content: center; gap: 10px;')
    expect(block).toContain('.kx-sidebar__logo { width: 100%; justify-content: center;')
    expect(block).toContain('.kx-sidebar__logo-img { height: 32px; width: 32px;')
  })

  it('removes the collapse toggle from interaction via display:none', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain('.kx-sidebar__collapse { display: none;')
  })

  it('anchors sidebar floating menus from the effective rail width', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain(
      '.kx-workspace-menu, .kx-system-menu, .kx-account-menu { left: calc(var(--kx-sidebar-rail) + 12px);',
    )
  })
})

describe('Customize viewport constraints (AC44)', () => {
  it('keeps the preferred 790x580 shell', () => {
    const rule = flat(customizeRule())
    expect(rule).toContain('width: var(--kx-customize-w);')
    expect(rule).toContain('height: var(--kx-customize-h);')
  })

  it('caps width at calc(100vw - 48px)', () => {
    expect(flat(customizeRule())).toContain('max-width: calc(100vw - 48px);')
  })

  it('declares 100vh height fallback before the 100dvh override', () => {
    const rule = customizeRule()
    const vh = rule.indexOf('max-height: calc(100vh - 48px)')
    const dvh = rule.indexOf('max-height: calc(100dvh - 48px)')
    expect(vh).toBeGreaterThanOrEqual(0)
    expect(dvh).toBeGreaterThan(vh)
  })

  it('keeps the content region as the sole vertical scroller', () => {
    expect(flat(components)).toContain('.kx-customize__content { min-height: 0; overflow-y: auto;')
    // Header/close/nav stay outside the scroll region via the grid rows.
    expect(flat(components)).toContain(
      '.kx-customize { display: grid; grid-template-rows: auto auto minmax(0, 1fr);',
    )
  })
})

describe('document + page scroll ownership (AC44)', () => {
  it('locks html/body scrolling so .kx-main owns page-level vertical scroll', () => {
    expect(flat(global)).toContain('html, body { margin: 0; padding: 0; overflow: hidden;')
    const appOpen = components.indexOf('.kx-app {')
    const appClose = components.indexOf('}', appOpen)
    expect(flat(components.slice(appOpen, appClose))).toContain('overflow: hidden;')
    expect(flat(components.slice(appOpen, appClose))).toContain('height: 100vh;')
    expect(flat(components)).toContain('.kx-main { position: relative; min-width: 0; overflow-y: auto;')
  })
})

describe('focus, tooltip, and glow hooks', () => {
  it('keeps the global 2px focus-visible outline', () => {
    expect(flat(global)).toContain(
      ':focus-visible { outline: 2px solid var(--kx-accent-strong); outline-offset: 2px;',
    )
  })

  it('keeps the Customize tooltip visible on hover and keyboard focus', () => {
    expect(flat(components)).toContain(
      '.kx-tooltip-host:hover > .kx-tooltip, .kx-tooltip-host:focus-within > .kx-tooltip { opacity: 1; visibility: visible;',
    )
  })

  it('keeps the glow behind content and non-interactive', () => {
    const glow = flat(components.slice(components.indexOf('.kx-main::before')))
    expect(glow).toContain('z-index: 0;')
    expect(glow).toContain('pointer-events: none;')
    expect(flat(components)).toContain('.kx-main > * { position: relative; z-index: 1;')
  })
})
