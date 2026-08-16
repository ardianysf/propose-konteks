/*
 * contrast.test.ts — Task 13 contrast-migration contracts (AC9).
 *
 * jsdom does not apply real CSS, so these are source-string assertions
 * against the committed stylesheets (same convention as responsive.test.ts).
 * The file embeds the complete 114-consumer inventory — 65 muted-token
 * consumers and 49 accent-strong consumers — and proves three things:
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
// Complete 114-consumer inventory.
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
  '.kx-setup-row__trigger-caption',
  '.kx-composer__input::placeholder',
  '.kx-composer__profile-caption',
  '.kx-composer__disclaimer',
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
]

const mutedU = [
  '.kx-sidebar__chevron',
  '.kx-setup-row__chevron',
  '.kx-composer__profile-chevron',
  '.kx-history__open:disabled',
]

const accentA = [
  '.kx-sidebar__system-icon',
  '.kx-sidebar__view-all',
  '.kx-sidebar__user-avatar',
  '.kx-system-menu__all',
  '.kx-system-menu__all-icon',
  '.kx-system-menu__item-icon',
  '.kx-system-menu__create',
  '.kx-setup-row__trigger-icon',
  '.kx-composer__profile-icon',
  '.kx-composer__send',
  '.kx-composer__reviews',
  '.kx-profile-menu__check',
  '.kx-profile-menu__manage',
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
]

const accentS = ['.kx-btn--primary', '.kx-composer__badge']

const accentU: Array<[string, string]> = [
  ['.kx-input:focus', 'border-color'],
  ['.kx-sidebar__workspace-avatar', 'background'],
  ['.kx-system-menu__create:hover', 'border-color'],
  ['.kx-workspace-menu__item-avatar', 'background'],
  ['.kx-composer__input:focus', 'border-color'],
  ['.kx-composer__profile:hover', 'border-color'],
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

  it('reports the exact approved ratios for the durable appendix', () => {
    expect(contrast('#607260', '#ffffff')).toBeCloseTo(5.156, 3)
    expect(contrast('#607260', '#faf8ef')).toBeCloseTo(4.846, 3)
    expect(contrast('#607260', '#f4f8ee')).toBeCloseTo(4.789, 3)
    expect(contrast('#4f7044', '#ffffff')).toBeCloseTo(5.625, 3)
    expect(contrast('#4f7044', '#faf8ef')).toBeCloseTo(5.287, 3)
    expect(contrast('#4f7044', '#f4f8ee')).toBeCloseTo(5.225, 3)
  })
})

describe('inventory completeness and non-duplication (AC9)', () => {
  const inventory = entries()
  const usages = [...extractUsages(components, COMPONENTS), ...extractUsages(global, GLOBAL)]

  it('covers exactly 114 consumers — 65 muted and 49 accent-strong', () => {
    expect(inventory).toHaveLength(114)
    expect(inventory.filter((e) => e.token === MUTED)).toHaveLength(65)
    expect(inventory.filter((e) => e.token === ACCENT_STRONG)).toHaveLength(49)
  })

  it('classifies the expected M/A/S/U counts', () => {
    expect(inventory.filter((e) => e.cls === 'M')).toHaveLength(61)
    expect(inventory.filter((e) => e.cls === 'A')).toHaveLength(26)
    expect(inventory.filter((e) => e.cls === 'S')).toHaveLength(2)
    expect(inventory.filter((e) => e.cls === 'U')).toHaveLength(25)
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
    const migrated = entries().filter((e) => e.cls === 'M' || e.cls === 'A' || e.cls === 'S')
    for (const entry of migrated) {
      const usage = usageByKey.get(`${entry.file}::${entry.selector}`)!
      expect(usage.token).not.toBe(entry.token)
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
