import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// jsdom rewrites import.meta.url to an http origin, so resolve from cwd instead
// (same convention as tokens.test.ts). These are source-string assertions:
// jsdom does not load real CSS, so the responsive/focus/glow contracts are
// verified against the committed stylesheets directly.
const components = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
const global = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8')
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** Collapse runs of whitespace so multi-line rules match as single strings. */
const flat = (css: string) => css.replace(/\s+/g, ' ')

/** The responsive media-query block onward (it is the final section). */
function responsiveBlock(): string {
  const start = components.indexOf('@media (max-width: 1280px)')
  expect(start).toBeGreaterThanOrEqual(0)
  return components.slice(start)
}

/** The desktop short-height compaction block (1200×720-class, AC44):
 * inner rules close indented, so the first column-0 brace ends it. */
function compactHeightBlock(): string {
  const start = components.indexOf('@media (max-height: 760px) and (min-width: 761px)')
  expect(start).toBeGreaterThanOrEqual(0)
  const end = components.indexOf('\n}', start)
  expect(end).toBeGreaterThan(start)
  return components.slice(start, end + 2)
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

  it('hides expanded-only labels, captions, recent content, user name, chevrons, and the New session label', () => {
    const block = flat(responsiveBlock())
    expect(block).toContain(
      '.kx-sidebar__control-copy, .kx-sidebar__chevron, .kx-sidebar__recent, .kx-sidebar__user-name, .kx-sidebar__new-session-label { display: none;',
    )
    // The New session control itself stays visible and centered in the
    // forced rail.
    expect(block).toContain('.kx-sidebar__new-session { justify-content: center; gap: 0; padding: 8px 0;')
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

describe('desktop short-height compaction (AC44, 1200×720)', () => {
  it('declares a desktop-only max-height 760px media query guarded off narrow viewports', () => {
    expect(components).toContain('@media (max-height: 760px) and (min-width: 761px)')
  })

  it('tightens the New Session page, intro, and reviews vertical rhythm', () => {
    const block = flat(compactHeightBlock())
    expect(block).toContain('.kx-new-session { gap: 24px; padding: 24px 32px 32px;')
    expect(block).toContain('.kx-new-session__intro { gap: 10px; margin: 0 auto 32px;')
    expect(block).toContain('.kx-new-session__intro-img { max-height: 124px;')
    expect(block).toContain('.kx-new-session__reviews { margin-bottom: 10px;')
  })

  it('compacts the composer panel, textarea, toolbar, and disclaimer spacing', () => {
    const block = flat(compactHeightBlock())
    expect(block).toContain('.kx-panel { gap: 10px;')
    expect(block).toContain('.kx-composer { padding: 10px;')
    expect(block).toContain('.kx-composer__input { min-height: 104px;')
    expect(block).toContain('.kx-panel__toolbar { padding: 6px 10px;')
    expect(block).toContain('.kx-new-session__disclaimer { margin-top: 12px;')
  })

  it('rebalances spacing only — no region is hidden or removed', () => {
    const header = compactHeightBlock()
    expect(header).not.toContain('display: none')
    expect(header).not.toContain('visibility: hidden')
    // Rule bodies only (the @media header itself carries min-width).
    const rules = header.slice(header.indexOf('{') + 1)
    expect(rules).not.toMatch(/\bwidth\b/)
    expect(rules).not.toMatch(/margin-left|margin-right/)
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

describe('New Session semantic layout (composer correction)', () => {
  it('spans the page full width and bounds the content region below the header', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-new-session { display: flex; flex-direction: column; gap: clamp(24px, 4vh, 40px); width: 100%; max-width: none;',
    )
    expect(css).toContain(
      '.kx-new-session__content { display: flex; flex-direction: column; align-items: stretch; width: min(920px, 100%);',
    )
  })

  it('splits the full-width header into copy left and the approval indicator right', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-new-session__header { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; width: min(1200px, 100%);',
    )
    expect(css).toContain('.kx-new-session__title { font-size: var(--kx-text-3xl);')
    expect(css).toContain('.kx-new-session__subtitle { font-size: var(--kx-text-md);')
    expect(css).toContain('.kx-new-session__approval { flex-shrink: 0; margin-left: auto;')
  })

  it('centers the intro with a constrained decorative image and a 2xl heading', () => {
    const css = flat(components)
    expect(css).toContain('.kx-new-session__intro { display: flex; flex-direction: column; align-items: center;')
    expect(css).toContain('margin: 0 auto clamp(40px, 7vh, 72px);')
    expect(css).toContain('.kx-new-session__intro-img { max-height: 140px;')
    expect(css).toContain('.kx-new-session__intro-heading { font-size: var(--kx-text-2xl);')
  })

  it('keeps the setup pills and Session Mode on one wrap-safe top row', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-panel__top-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;',
    )
    expect(css).toContain('.kx-panel__setup-cluster { display: flex; flex-wrap: wrap;')
    expect(css).toContain('.kx-panel__mode-cluster { display: flex; align-items: center;')
  })

  it('stacks the uppercase SESSION MODE label above the right-aligned segmented group', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-session-mode { display: flex; flex-direction: column; align-items: flex-end; gap: 6px;',
    )
    expect(css).toContain(
      '.kx-session-mode__label { font-size: var(--kx-text-2xs); font-weight: var(--kx-font-bold); letter-spacing: 0.12em; text-transform: uppercase;',
    )
  })

  it('renders the active segment as the exact #95A547 fill with white text (user-directed pairing)', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-segmented__btn--active, .kx-segmented__btn--active:hover { background: var(--kx-accent-segment-aa); color: var(--kx-raised); }',
    )
    // White on #95A547 is the user's explicit visual choice for this
    // mockup (2.709:1) — recorded as a directed exception, not an AA claim.
    expect(tokens).toContain('--kx-accent-segment-aa: #95a547')
  })

  it('nests the textarea and input toolbar inside a raised input box', () => {
    const css = flat(components)
    expect(css).toContain('.kx-panel__input-box { display: flex; flex-direction: column;')
    expect(css).toContain('background: var(--kx-raised);')
    expect(css).toContain('border-radius: 14px;')
    expect(css).toContain('.kx-composer__input { display: block; width: 100%;')
  })

  it('separates the toolbar into left and right groups with wrap safety', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-panel__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;',
    )
    expect(css).toContain('.kx-panel__toolbar-left, .kx-panel__toolbar-right { display: flex; flex-wrap: wrap;')
  })

  it('renders the profile trigger as a plain borderless control', () => {
    const open = components.indexOf('.kx-composer__profile {')
    expect(open).toBeGreaterThanOrEqual(0)
    const rule = flat(components.slice(open, components.indexOf('}', open)))
    expect(rule).toContain('background: transparent;')
    expect(rule).toContain('border: 0;')
    expect(rule).toContain('color: var(--kx-secondary);')
  })

  it('places the Reviews pill right-aligned above the composer and centers the disclaimer below it', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-new-session__reviews { display: flex; justify-content: flex-end; margin-bottom: 12px;',
    )
    expect(css).toContain(
      '.kx-new-session__disclaimer { margin-top: 16px; text-align: center;',
    )
    expect(css).toContain('.kx-composer__reviews { display: inline-flex;')
  })

  it('keeps pill labels truncated without horizontal overflow', () => {
    const css = flat(components)
    expect(css).toContain('.kx-panel__pill { display: inline-flex;')
    expect(css).toContain('min-width: 0;')
    expect(css).toContain('.kx-panel__pill-label { min-width: 0;')
    expect(css).toContain('white-space: nowrap; overflow: hidden; text-overflow: ellipsis;')
    expect(css).toContain('.kx-composer { width: 100%; min-width: 0;')
  })

  it('renders the setup pills as compact fully-rounded pills', () => {
    const css = flat(components)
    expect(css).toContain(
      '.kx-panel__pill { display: inline-flex; align-items: center; gap: 10px; min-width: 0; max-width: 100%; min-height: 38px; padding: 7px 12px;',
    )
    expect(css).toContain('border-radius: 999px;')
    expect(css).toContain('.kx-panel__pill-label { min-width: 0; font-size: var(--kx-text-sm);')
  })
})
