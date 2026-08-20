/*
 * Typed token name list for the catalog Tokens page (spec §2 "Token page"
 * + AC7). The NAMES here are hardcoded and typed; the VALUES are always
 * read live via getComputedStyle — this list is the contract that
 * `verify:manifest` (S6) validates against tokens.css definitions.
 */

export interface TokenDef {
  /** Custom property name, e.g. '--kx-canvas'. */
  name: string
  /** Short human note (mirrors the tokens.css comments). */
  note: string
}

export interface TokenGroup {
  id: string
  title: string
  /** 'color' renders a swatch; 'text' renders a live type preview;
   *  'value' renders the computed value chip. */
  kind: 'color' | 'text' | 'value'
  tokens: TokenDef[]
}

/** Palette — 17 tokens (14 palette + ink triplet + 2 scrims; values are
 *  theme-aware and change on the light/dark toggle). */
const COLOR_TOKENS: TokenDef[] = [
  { name: '--kx-canvas', note: 'Main content background' },
  { name: '--kx-raised', note: 'Cards, inputs, modals, popover surfaces' },
  { name: '--kx-sidebar-bg', note: 'Expanded sidebar background' },
  { name: '--kx-primary', note: 'Primary text, headings, dark surfaces' },
  { name: '--kx-secondary', note: 'Secondary text, subdued labels' },
  { name: '--kx-muted', note: 'Tertiary/muted text, icons, disabled states' },
  { name: '--kx-muted-text-aa', note: 'Enabled muted text/placeholders (AA)' },
  { name: '--kx-accent-text-aa', note: 'Enabled accent text + glyphs (AA)' },
  { name: '--kx-accent-solid-aa', note: 'White-text solid backgrounds (AA)' },
  { name: '--kx-accent-segment-aa', note: 'Active segment fill (dark text is AA)' },
  { name: '--kx-border', note: 'Dividers, input borders, hairlines' },
  { name: '--kx-pale', note: 'Hover fills, selected states, subtle washes' },
  { name: '--kx-accent', note: 'Primary action accent, highlights' },
  { name: '--kx-accent-strong', note: 'Emphasized actions, active indicators' },
  { name: '--kx-ink-rgb', note: 'Ink RGB triplet for alpha shadows/scrims' },
  { name: '--kx-scrim-base', note: 'Modal scrim (darkens the page)' },
  { name: '--kx-scrim-nested', note: 'Nested dialog scrim tint' },
]

/** Typography — 12 tokens (family + 8 sizes + 3 weights). */
const TYPE_TOKENS: TokenDef[] = [
  { name: '--kx-font-family', note: 'DM Sans stack' },
  { name: '--kx-text-3xl', note: 'Page titles' },
  { name: '--kx-text-2xl', note: 'Section titles, modal headers' },
  { name: '--kx-text-xl', note: 'Subsection titles' },
  { name: '--kx-text-l', note: 'Body emphasis, buttons' },
  { name: '--kx-text-md', note: 'Normal body/UI text (default)' },
  { name: '--kx-text-sm', note: 'Captions, meta text' },
  { name: '--kx-text-xs', note: 'Micro labels' },
  { name: '--kx-text-2xs', note: 'Badges, fine print' },
  { name: '--kx-font-normal', note: 'Regular weight (400)' },
  { name: '--kx-font-medium', note: 'Medium weight (500)' },
  { name: '--kx-font-bold', note: 'Bold weight (700)' },
]

/** Fixed dimensions — 6 tokens (shared across themes). */
const DIMENSION_TOKENS: TokenDef[] = [
  { name: '--kx-radius-main', note: 'Main canvas corner radius' },
  { name: '--kx-sidebar-w', note: 'Expanded sidebar width' },
  { name: '--kx-sidebar-rail', note: 'Collapsed sidebar icon rail width' },
  { name: '--kx-customize-w', note: 'Customize modal width (fixed)' },
  { name: '--kx-customize-h', note: 'Customize modal height (fixed)' },
  { name: '--kx-drawer-w', note: 'Konteks Learned right drawer width' },
]

export const TOKEN_GROUPS: TokenGroup[] = [
  { id: 'colors', title: 'Colors', kind: 'color', tokens: COLOR_TOKENS },
  { id: 'typography', title: 'Typography', kind: 'text', tokens: TYPE_TOKENS },
  { id: 'dimensions', title: 'Dimensions', kind: 'value', tokens: DIMENSION_TOKENS },
]

/** Every token name across all groups (for tests/verification). */
export const ALL_TOKEN_NAMES: readonly string[] = TOKEN_GROUPS.flatMap((group) =>
  group.tokens.map((token) => token.name),
)
