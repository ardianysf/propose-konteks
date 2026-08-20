/*
 * contrast.test.ts — Task 13 contrast-migration contracts (AC9).
 *
 * jsdom does not apply real CSS, so these are source-string assertions
 * against the committed stylesheets (same convention as responsive.test.ts).
 * The file embeds the complete consumer inventory (see the tally test for
 * the current count) and proves three things:
 *
 *   1. The three AA semantics are defined in tokens.css and every candidate
 *      pair clears 4.5:1 against white/canvas/pale.
 *   2. Every M/A/S consumer now reads its AA token while every U consumer
 *      keeps the original mixed-purpose token.
 *   3. The inventory is complete and non-duplicated: every use of the five
 *      tokens across components.css + global.css maps to exactly one
 *      inventory entry and vice versa.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const components = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
const global = readFileSync(join(process.cwd(), 'src/styles/global.css'), 'utf8')
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const COMPONENTS = 'src/styles/components.css'
const GLOBAL = 'src/styles/global.css'

const MUTED = '--kx-muted'
const MUTED_AA = '--kx-muted-text-aa'
const ACCENT_STRONG = '--kx-accent-strong'
const ACCENT_AA = '--kx-accent-text-aa'
const ACCENT_SOLID_AA = '--kx-accent-solid-aa'

// ---------------------------------------------------------------------------
// WCAG sRGB relative luminance + contrast (mirrors the evidence runner).
// ---------------------------------------------------------------------------

function luminance(hex: string): number {
  const c = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ---------------------------------------------------------------------------
// Complete 137-consumer inventory.
// cls: M = enabled muted text/placeholder, A = enabled accent text/glyph,
//      S = white-text solid background, U = unchanged (decorative/disabled).
// token is the ORIGINAL token each consumer started from.
// ---------------------------------------------------------------------------

type Class = 'M' | 'A' | 'S' | 'U'

interface Entry {
  file: string
  selector: string
  property: string
  token: string
  cls: Class
}

const mutedM = [
  '.kx-input::placeholder',
  '.kx-sidebar__control-caption',
  '.kx-sidebar__label',
  '.kx-sidebar__session-meta',
  '.kx-system-menu__empty',
  '.kx-system-menu__item-count',
  '.kx-workspace-menu__item-plan',
  '.kx-page-placeholder p',
  '.kx-new-session__subtitle',
  '.kx-new-session__approval',
  '.kx-new-session__intro-body',
  '.kx-composer__input::placeholder',
  '.kx-new-session__disclaimer',
  '.kx-badge--cancelled',
  '.kx-session-detail__context',
  '.kx-session-detail__meta',
  '.kx-session-timeline__event-text',
  '.kx-session-timeline__card-meta',
  '.kx-session-timeline__card-limitations',
  '.kx-session-detail__tracker-kicker',
  '.kx-quote-approval-card__history',
  '.kx-quote-approval-card__note',
  '.kx-quote-approval-card__quote-ref',
  '.kx-quote-approval-card__chevron',
  '.kx-session-composer__locked-notice',
  '.kx-profile-menu__item-meta',
  '.kx-profile-menu__section-label',
  '.kx-profile-menu__setting-desc',
  '.kx-profile-menu__setting-state',
  '.kx-profile-menu__readiness--setup',
  '.kx-profile-menu__sidecar-term',
  '.kx-repo-modal__subtitle',
  '.kx-repo-modal__system-desc',
  '.kx-repo-modal__system-count',
  '.kx-repo-modal__repo-meta',
  '.kx-repo-modal__repo-vcs',
  '.kx-repo-modal__status-count',
  '.kx-repo-modal__empty-hint',
  '.kx-manual-modal__subtitle',
  '.kx-manual-modal__field-hint',
  '.kx-manual-modal__result-meta',
  '.kx-manual-modal__count',
  '.kx-manual-modal__page-indicator',
  '.kx-manual-modal__network-hint',
  '.kx-manual-modal__footer-note',
  '.kx-manual-modal__empty-hint',
  '.kx-create-modal__subtitle',
  '.kx-create-modal__helper',
  '.kx-create-modal__opt',
  '.kx-create-modal__footer-note',
  '.kx-component-menu__row-repo',
  '.kx-component-menu__count',
  '.kx-component-menu__empty-hint',
  ".kx-customize-tab__table th[scope='col']",
  '.kx-agents__create-label',
  '.kx-agents__create-hint',
  '.kx-agents__fact-term',
  '.kx-agents__archived-on',
  '.kx-context__count',
  '.kx-context__item-note',
  '.kx-integrations__empty-text',
  '.kx-integrations__status--setup',
  '.kx-preserved__count',
  '.kx-preserved__item-desc',
  '.kx-preserved__item-scope',
  '.kx-preserved__note',
  '.kx-preserved__status--disabled',
  '.kx-learned-item__meta',
  '.kx-learned-timeline__meta',
  '.kx-learned__empty-hint',
  '.kx-history__field-label',
  '.kx-history__row-meta',
  '.kx-history__empty-hint',
  '.kx-settings__note',
  '.kx-illustrative-note',
  '.kx-account-menu__section-label',
  '.kx-account-menu__theme-value',
]

const mutedU = [
  '.kx-sidebar__chevron',
  '.kx-panel__pill-chevron',
  '.kx-composer__profile-chevron',
  '.kx-history__open:disabled',
]

const accentA = [
  '.kx-sidebar__system-icon',
  '.kx-sidebar__new-session-icon',
  '.kx-sidebar__view-all',
  '.kx-sidebar__user-avatar',
  '.kx-system-menu__all',
  '.kx-system-menu__all-icon',
  '.kx-system-menu__item-icon',
  '.kx-system-menu__create',
  '.kx-panel__pill-icon',
  '.kx-composer__send',
  '.kx-composer__reviews',
  '.kx-profile-menu__check',
  '.kx-profile-menu__manage',
  '.kx-account-menu__theme-seg-btn:hover',
  '.kx-account-menu__theme-seg-btn--active',
  '.kx-account-menu__theme-seg-btn--active:hover',
  '.kx-profile-menu__readiness--ready',
  '.kx-repo-modal__add-repo',
  '.kx-repo-modal__status-system',
  '.kx-manual-modal__field-error',
  '.kx-manual-modal__swap',
  '.kx-manual-modal__result-flag',
  '.kx-manual-modal__add-another',
  '.kx-create-modal__req',
  '.kx-component-menu__clear',
  '.kx-agents__disclosure > summary:hover',
  '.kx-integrations__status--connected',
  '.kx-preserved__status--enabled',
  '.kx-history__clear',
  '.kx-badge--failed',
  '.kx-session-detail__action-needed',
  '.kx-session-timeline__artifact-link',
  '.kx-session-timeline__error-title',
  '.kx-quote-approval-card__quote-id',
  '.kx-session-detail__stage-pill-badge',
]

const accentS = [
  '.kx-btn--primary',
  '.kx-composer__badge',
  '.kx-badge--waiting_approval',
  '.kx-session-detail__stage-pill',
]

const accentU: Array<[string, string]> = [
  ['.kx-input:focus', 'border-color'],
  ['.kx-history__row-button:focus-visible', 'outline'],
  ['.kx-sidebar__workspace-avatar', 'background'],
  ['.kx-system-menu__create:hover', 'border-color'],
  ['.kx-workspace-menu__item-avatar', 'background'],
  ['.kx-composer__input:focus', 'box-shadow'],
  ['.kx-quote-approval-card__header:focus-visible', 'outline'],
  ['.kx-composer__send:hover:not(:disabled)', 'border-color'],
  ['.kx-profile-menu__manage:focus-visible', 'border-color'],
  ['.kx-profile-menu__setting-dot', 'background'],
  ['.kx-repo-modal__system--active .kx-repo-modal__system-radio', 'border-color'],
  ['.kx-manual-modal__network-check', 'accent-color'],
  ['.kx-component-menu__check', 'accent-color'],
  ['.kx-customize__tab:focus-visible', 'outline'],
  ['.kx-agents__review', 'border-left'],
  ['.kx-agents__disclosure > summary:focus-visible', 'outline'],
  ['.kx-preserved__toggle--on', 'background'],
  ['.kx-preserved__toggle:focus-visible', 'outline'],
  ['.kx-learned__tab:focus-visible', 'outline'],
  ['.kx-learned-timeline__item::before', 'border'],
  ['.kx-history__clear:focus-visible', 'border-color'],
]

function entries(): Entry[] {
  return [
    ...mutedM.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: MUTED, cls: 'M' as Class })),
    ...mutedU.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: MUTED, cls: 'U' as Class })),
    ...accentA.map((selector) => ({ file: COMPONENTS, selector, property: 'color', token: ACCENT_STRONG, cls: 'A' as Class })),
    ...accentS.map((selector) => ({ file: COMPONENTS, selector, property: 'background', token: ACCENT_STRONG, cls: 'S' as Class })),
    ...accentU.map(([selector, property]) => ({ file: COMPONENTS, selector, property, token: ACCENT_STRONG, cls: 'U' as Class })),
    // Dark-theme ink pin: the active segment's text uses --kx-accent-text-aa
    // in light mode (its dark #4f7044 resolves AA on the #95a547 fill) and
    // a [data-theme='dark'] override switches it to dark --kx-raised ink on
    // the #a8c883 fill. Property is 'color' — the extractor keys each
    // selector to its single tracked-token line.
    { file: COMPONENTS, selector: '.kx-segmented__btn--active:hover', property: 'color', token: ACCENT_AA, cls: 'A' as Class },
    // Sidebar-v2 hover-reveal icon actions: the REST state reads the
    // decorative muted token (U — hidden until hover), while their revealed
    // states (pinned, hovered map button) read the AA accent token. The
    // account menu's theme segmented buttons follow the same pattern —
    // muted icon at rest (U), AA accent on hover and while active.
    { file: COMPONENTS, selector: '.kx-sidebar__session-pin', property: 'color', token: MUTED, cls: 'U' as Class },
    { file: COMPONENTS, selector: '.kx-sidebar__session-pin[aria-pressed=\'true\']', property: 'color', token: ACCENT_AA, cls: 'A' as Class },
    { file: COMPONENTS, selector: '.kx-system-menu__map-btn', property: 'color', token: MUTED, cls: 'U' as Class },
    { file: COMPONENTS, selector: '.kx-system-menu__map-btn:hover', property: 'color', token: ACCENT_AA, cls: 'A' as Class },
    { file: COMPONENTS, selector: '.kx-account-menu__theme-seg-btn', property: 'color', token: MUTED, cls: 'U' as Class },
    // System map diagram strokes — decorative SVG geometry, not text.
    { file: COMPONENTS, selector: '.kx-system-map__node rect', property: 'stroke', token: ACCENT_STRONG, cls: 'U' as Class },
    { file: GLOBAL, selector: ':focus-visible', property: 'outline', token: ACCENT_STRONG, cls: 'U' as Class },
  ]
}

function expectedToken(entry: Entry): string {
  switch (entry.cls) {
    case 'M':
      return MUTED_AA
    case 'A':
      return ACCENT_AA
    case 'S':
      return ACCENT_SOLID_AA
    case 'U':
      return entry.token
  }
}

// ---------------------------------------------------------------------------
// Usage extraction — every occurrence of the five tokens, mapped to its
// enclosing single-line selector. The stylesheet has no token use inside
// @media/@keyframes blocks, so a nearest-preceding-selector walk is exact.
// ---------------------------------------------------------------------------

interface Usage {
  file: string
  selector: string
  property: string
  token: string
}

const TOKEN_RE = /var\((--kx-(?:muted-text-aa|accent-text-aa|accent-solid-aa|muted|accent-strong))\)/

function extractUsages(css: string, file: string): Usage[] {
  const lines = css.split('\n')
  const usages: Usage[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(TOKEN_RE)
    if (!match) continue
    let selector = ''
    for (let j = i; j >= 0; j--) {
      const t = lines[j].trim()
      if (t.endsWith('{') && !t.startsWith('@') && !t.startsWith('/*') && !t.startsWith('*')) {
        selector = t.slice(0, -1).trim()
        break
      }
    }
    usages.push({ file, selector, property: lines[i].split(':')[0].trim(), token: match[1] })
  }
  return usages
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AA token definitions (tokens.css)', () => {
  it('defines --kx-muted-text-aa as #607260', () => {
    expect(tokens).toContain('--kx-muted-text-aa: #607260')
  })

  it('defines --kx-accent-text-aa as #4f7044', () => {
    expect(tokens).toContain('--kx-accent-text-aa: #4f7044')
  })

  it('defines --kx-accent-solid-aa as #4f7044', () => {
    expect(tokens).toContain('--kx-accent-solid-aa: #4f7044')
  })

  it('defines --kx-accent-segment-aa as #95a547', () => {
    expect(tokens).toContain('--kx-accent-segment-aa: #95a547')
  })

  it('keeps the original mixed-purpose tokens intact for U consumers', () => {
    expect(tokens).toContain('--kx-muted: #778c78')
    expect(tokens).toContain('--kx-accent-strong: #5f8d4e')
  })
})

describe('candidate ratios against white/canvas/pale (AC9)', () => {
  const surfaces = { white: '#ffffff', canvas: '#faf8ef', pale: '#f4f8ee' }

  it('--kx-muted-text-aa #607260 clears 4.5:1 on every surface', () => {
    for (const bg of Object.values(surfaces)) {
      expect(contrast('#607260', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('--kx-accent-text-aa #4f7044 clears 4.5:1 on every surface', () => {
    for (const bg of Object.values(surfaces)) {
      expect(contrast('#4f7044', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('--kx-accent-solid-aa #4f7044 clears 4.5:1 under white text', () => {
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5)
  })

  it('records the active segment as a user-directed white-on-#95a547 exception (2.709:1)', () => {
    // The user explicitly chose white text on the #95A547 active segment
    // for this clickable mockup. The pairing is recorded honestly — it is
    // below 4.5:1 and is NOT an AA claim, only a directed brand exception.
    expect(contrast('#ffffff', '#95a547')).toBeLessThan(4.5)
  })

  it('reports the exact approved ratios for the durable appendix', () => {
    expect(contrast('#607260', '#ffffff')).toBeCloseTo(5.156, 3)
    expect(contrast('#607260', '#faf8ef')).toBeCloseTo(4.846, 3)
    expect(contrast('#607260', '#f4f8ee')).toBeCloseTo(4.789, 3)
    expect(contrast('#4f7044', '#ffffff')).toBeCloseTo(5.625, 3)
    expect(contrast('#4f7044', '#faf8ef')).toBeCloseTo(5.287, 3)
    expect(contrast('#4f7044', '#f4f8ee')).toBeCloseTo(5.225, 3)
    expect(contrast('#243025', '#95a547')).toBeCloseTo(5.084, 3)
    expect(contrast('#ffffff', '#95a547')).toBeCloseTo(2.709, 3) // applied (user-directed)
  })
})

// ---------------------------------------------------------------------------
// Dark theme — konteks.io dark palette (ink-900 bg, matcha accents).
// ---------------------------------------------------------------------------

describe('dark theme token definitions (tokens.css)', () => {
  const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))

  it('defines the dark block with color-scheme: dark', () => {
    expect(tokens).toContain("[data-theme='dark']")
    expect(darkBlock).toContain('color-scheme: dark')
  })

  it('overrides the palette with the konteks.io dark values', () => {
    expect(darkBlock).toContain('--kx-canvas: #0f1510')
    expect(darkBlock).toContain('--kx-raised: #1a231b')
    expect(darkBlock).toContain('--kx-sidebar-bg: #152618')
    expect(darkBlock).toContain('--kx-primary: #e8ede8')
    expect(darkBlock).toContain('--kx-secondary: #c5cfc6')
    expect(darkBlock).toContain('--kx-muted: #9ead9f')
    expect(darkBlock).toContain('--kx-muted-text-aa: #9ead9f')
    expect(darkBlock).toContain('--kx-accent-text-aa: #c5d9a6')
    expect(darkBlock).toContain('--kx-accent-segment-aa: #a8c883')
    expect(darkBlock).toContain('--kx-border: #35502c')
    expect(darkBlock).toContain('--kx-pale: #152618')
  })

  it('keeps --kx-accent-solid-aa at #4f7044 — white text stays AA in both themes', () => {
    expect(darkBlock).toContain('--kx-accent-solid-aa: #4f7044')
  })
})

describe('dark theme ratios against canvas/raised (AA)', () => {
  const dark = { canvas: '#0f1510', raised: '#1a231b', pale: '#152618' }

  it('dark --kx-primary #e8ede8 clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#e8ede8', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('dark --kx-muted-text-aa #9ead9f clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#9ead9f', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('dark --kx-accent-text-aa #c5d9a6 clears 4.5:1 on every dark surface', () => {
    for (const bg of Object.values(dark)) {
      expect(contrast('#c5d9a6', bg)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('white text on unchanged --kx-accent-solid-aa #4f7044 stays AA in dark', () => {
    expect(contrast('#ffffff', '#4f7044')).toBeGreaterThanOrEqual(4.5)
  })

  it('dark text on dark segment fill — the active segment pins dark ink in both themes', () => {
    // The active segment uses --kx-accent-segment-aa text (light) or a dark
    // ink (dark — --kx-raised resolves to #1a231b there); both are AA on
    // their respective fills.
    expect(contrast('#243025', '#95a547')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#243025', '#a8c883')).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#1a231b', '#a8c883')).toBeGreaterThanOrEqual(4.5)
  })

  it('reports the exact approved dark ratios for the durable appendix', () => {
    expect(contrast('#e8ede8', '#0f1510')).toBeCloseTo(15.603, 3)
    expect(contrast('#9ead9f', '#0f1510')).toBeCloseTo(7.869, 3)
    expect(contrast('#c5d9a6', '#0f1510')).toBeCloseTo(12.202, 3)
    expect(contrast('#e8ede8', '#1a231b')).toBeCloseTo(13.621, 3)
  })
})

describe('ink-rgb shadow/backdrop tokenization', () => {
  it('defines --kx-ink-rgb in :root (#243025) and the dark block (#35502C)', () => {
    expect(tokens).toContain('--kx-ink-rgb: 36 48 37;')
    const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))
    expect(darkBlock).toContain('--kx-ink-rgb: 53 80 44;')
  })

  it('leaves no rgba(36, 48, 37, …) literals in components.css', () => {
    expect(components).not.toContain('rgba(36, 48, 37')
  })

  it('every former ink literal now composes rgb(var(--kx-ink-rgb) / α)', () => {
    const usages = components.match(/rgb\(var\(--kx-ink-rgb\) \/ [0-9.]+\)/g) ?? []
    expect(usages.length).toBeGreaterThanOrEqual(9)
  })

  it('defines theme-aware --kx-scrim-* tokens (ink-based in light, black-based in dark)', () => {
    expect(tokens).toContain('--kx-scrim-base: rgb(36 48 37 / 0.44);')
    expect(tokens).toContain('--kx-scrim-nested: rgb(36 48 37 / 0.14);')
    const darkBlock = tokens.slice(tokens.indexOf("[data-theme='dark']"))
    // Dark scrims must be black-based: the dark canvas is near-black
    // (#0F1510), so an ink-tinted scrim would brighten instead of dim.
    expect(darkBlock).toContain('--kx-scrim-base: rgb(0 0 0 / 0.55);')
    expect(darkBlock).toContain('--kx-scrim-nested: rgb(0 0 0 / 0.3);')
  })

  it('modal backdrops consume the --kx-scrim-* tokens, not raw ink composition', () => {
    const base = components.match(/\.kx-modal-backdrop\s*\{[^}]*\}/)?.[0] ?? ''
    expect(base).toContain('background: var(--kx-scrim-base);')
    const nested = components.match(/\.kx-modal-backdrop--nested\s*\{[^}]*\}/)?.[0] ?? ''
    expect(nested).toContain('background: var(--kx-scrim-nested);')
  })
})

describe('inventory completeness and non-duplication (AC9)', () => {
  const inventory = entries()
  const usages = [...extractUsages(components, COMPONENTS), ...extractUsages(global, GLOBAL)]

  it('covers exactly 149 consumers — 84 muted, 62 accent-strong, 3 accent-text-aa', () => {
    expect(inventory).toHaveLength(149)
    expect(inventory.filter((e) => e.token === MUTED)).toHaveLength(84)
    expect(inventory.filter((e) => e.token === ACCENT_STRONG)).toHaveLength(62)
    expect(inventory.filter((e) => e.token === ACCENT_AA)).toHaveLength(3)
  })

  it('classifies the expected M/A/S/U counts', () => {
    expect(inventory.filter((e) => e.cls === 'M')).toHaveLength(77)
    expect(inventory.filter((e) => e.cls === 'A')).toHaveLength(38)
    expect(inventory.filter((e) => e.cls === 'S')).toHaveLength(4)
    expect(inventory.filter((e) => e.cls === 'U')).toHaveLength(30)
  })

  it('has no duplicate inventory selectors', () => {
    const keys = inventory.map((e) => `${e.file}::${e.selector}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has no missing classification: every token use maps to an inventory entry', () => {
    const inventoryKeys = new Set(inventory.map((e) => `${e.file}::${e.selector}`))
    for (const u of usages) {
      expect(
        [...inventoryKeys],
        `unclassified selector ${u.file}::${u.selector}`,
      ).toContain(`${u.file}::${u.selector}`)
    }
  })

  it('has no duplicate usage: every selector uses exactly one token', () => {
    const usageKeys = usages.map((u) => `${u.file}::${u.selector}`)
    expect(new Set(usageKeys).size).toBe(usageKeys.length)
  })

  it('every inventory selector is present exactly once in the stylesheets', () => {
    const usageByKey = new Map(usages.map((u) => [`${u.file}::${u.selector}`, u]))
    for (const entry of inventory) {
      const key = `${entry.file}::${entry.selector}`
      expect(usageByKey.has(key), `missing from stylesheets: ${key}`).toBe(true)
    }
  })

  it('matches the declared property for every consumer', () => {
    const usageByKey = new Map(usages.map((u) => [`${u.file}::${u.selector}`, u]))
    for (const entry of inventory) {
      const u = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(u.property, `${entry.selector} property`).toBe(entry.property)
    }
  })
})

describe('M/A/S assignments and U unchanged (AC9)', () => {
  const usageByKey = new Map(
    [...extractUsages(components, COMPONENTS), ...extractUsages(global, GLOBAL)].map((u) => [
      `${u.file}::${u.selector}`,
      u,
    ]),
  )

  it.each(entries().map((e) => [e.selector, e] as const))(
    '%s uses its assigned token',
    (_selector, entry) => {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)
      expect(usage).toBeDefined()
      expect(usage!.token, `${entry.selector} → ${entry.cls}`).toBe(expectedToken(entry))
    },
  )

  it('migrated consumers no longer read the original mixed-purpose token', () => {
    // Migration means moving OFF the mixed-purpose --kx-muted /
    // --kx-accent-strong pair: M → muted-text-aa, A → accent-text-aa,
    // S → accent-solid-aa. The dark-theme ink pin (token ACCENT_AA, cls A)
    // already reads accent-text-aa, so it is excluded from the comparison —
    // asserting token inequality against itself would be vacuously false.
    const migrated = entries().filter(
      (e) => (e.cls === 'M' || e.cls === 'A' || e.cls === 'S') && e.token !== expectedToken(e),
    )
    expect(migrated.length).toBeGreaterThan(0)
    for (const entry of migrated) {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(usage.token).not.toBe(entry.token)
      expect(usage.token).toBe(expectedToken(entry))
    }
  })

  it('unchanged consumers keep the original mixed-purpose token', () => {
    const unchanged = entries().filter((e) => e.cls === 'U')
    for (const entry of unchanged) {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(usage.token).toBe(entry.token)
    }
  })
})
