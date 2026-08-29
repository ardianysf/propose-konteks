# DESIGN — Konteks Catalog Shell

The design language of the catalog surface at `/catalog`. Written from the built code:
`src/catalog/catalog.css` (the whole world), `catalog.html` (direction contract),
`src/catalog/pages/*.tsx` (page archetypes), `src/catalog/partNumbers.ts`.

## 1. World

**Industrial Parts Catalog.** A procurement-grade industrial parts book: every component is a
machined part with a part number, spec rows, and precision rules. Flat technical-white paper,
hairlines and 2px ink rules, one stamp red for action, stencil blue for references, Sarabun
display numerals, mono part numbers, ruler ticks and registration marks. Light and dark are
one change of light. It refuses the sidebar-plus-cards Storybook default. Direction contract:
the comment block in `catalog.html` (seed `0f0acb7e`, kind: pick; comp A "Index Spread"
approved 2026-08-29).

## 2. Scope

- **Owns:** the catalog shell — every `.kx-cat-*` selector in `src/catalog/catalog.css`.
- **Out of scope:** production components and `src/styles/tokens.css` (`--kx-*`). Owner
  constraint: component previews keep production `--kx-*` tokens in both themes; the shell
  never restyles them. Catalog selectors never live under `src/styles/` (CSS ownership rule).
- Scroll enablement (`html.kx-catalog-page`) exists only because `global.css` locks
  overflow for the mockup app; the catalog re-enables it without taking scroll ownership.

## 3. Shell tokens

Defined on `.kx-cat-shell`; dark re-inks under `html[data-theme='dark'] .kx-cat-shell`.
The theme attribute is stamped pre-paint by the inline script in `catalog.html`
(`konteks-theme` storage → `system` fallback → `documentElement.dataset.theme`), so the
shell never flashes the wrong theme.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--kxcat-canvas` | `#f5f6f4` | `#12151a` | paper ground |
| `--kxcat-ink` | `#16181d` | `#e8eae5` | primary ink: text, 2px rules, inverted blocks |
| `--kxcat-red` | `#d0342c` | `#e0493a` | stamp red — action/active only |
| `--kxcat-blue` | `#2f6f8f` | `#6fa8d4` | stencil blue — references only |
| `--kxcat-hair` | ink 20% | 18% | standard hairline borders |
| `--kxcat-hair-soft` | ink 18% | 16% | row rules |
| `--kxcat-hair-strong` | ink 50% | 50% | badges, dashed placeholders, hover rules |
| `--kxcat-rule` | ink 25% | 22% | ruler-margin border |
| `--kxcat-ink-2` | ink 72% | 72% | secondary text (body, lede) |
| `--kxcat-ink-3` | ink 62% | 62% | tertiary (labels, notes, thead) |
| `--kxcat-ink-4` | ink 40% | 40% | quaternary (nav dots, separators) |
| `--kxcat-ink-soft` | ink 85% | 85% | hero intro body |
| `--kxcat-tick` | ink 40% | 40% | ruler minor ticks |
| `--kxcat-tick-strong` | ink 60% | 55% | ruler major ticks |
| `--kxcat-wash` | ink 3% | 4% | hover wash, paper code block |
| `--kxcat-font` | `'Sarabun', system-ui, sans-serif` | same | display + UI |
| `--kxcat-mono` | `ui-monospace, 'SF Mono', Menlo, monospace` | same | part numbers, data |

Percentages are `rgba()` over the theme ink (22,24,29 light / 232,234,229 dark).

## 4. Typography

- **Sarabun 400/500/600/700** via `@fontsource/sarabun` (loaded in `src/catalog/main.tsx`);
  display + UI face. Mono stack for part numbers, meta, data, code.
- Scale (all from `catalog.css`): counters `clamp(64px, 6.9vw, 100px)` /0.88; hero title
  `clamp(48px, 5.2vw, 76px)` /0.94, -0.03em (72px comp scale); doc & detail titles 44px /1.02,
  -0.02em; page titles 28px; domain cells 19px; index counts 30px; body 14px/1.65; lede 15px;
  intro 12.5px; labels 10px caps.
- `font-variant-numeric: tabular-nums` on every numeral that lines up: counters, counts,
  part numbers, section indices, value chips.
- Tracking: caps labels run .08–.16em (labels/thead .14em, nav .13em, brand & stamp .16em,
  mono sheet .1em); display titles go negative (-0.01 to -0.03em).

## 5. Layout idioms

- **Index spread** (`.kx-cat-hero-grid`): `38% 1fr 26px` — identity column | domain index |
  ruler margin. Overview is full-bleed; content pages cap at 960px.
- **Ruler margin** (26px): 1px left rule + repeating-linear-gradient ticks, short every 9px,
  long every 45px, 8px/16px wide.
- **Spec tables / ledgers:** caps 10px head rows over a 2px ink rule; body rows on
  hairline rules (`.kx-cat-table`, `.kx-cat-ledger-*`, `.kx-cat-parts-*` grids). Hairline/2px
  hierarchy everywhere; `grouthead`/`ds-sechead` repeat the idiom per section.
- **Plate frames** (`.kx-cat-plate`): hairline frame + caps mono strip; the interior ground
  is **literal** `#faf8ef` (light) / `#0f1510` (dark) — `.kx-cat-plate-ground` — so production
  `--kx-*` specimens resolve inside the frame on both themes.
- **Stamps:** 1px red border, red 10px caps at .16em (`.kx-cat-stamp`, "SOURCE-FIRST").
- **Part numbers:** `KX-<DOM>-<NN>` — three-letter domain code (ACC, CMP, CTX, CST, REV, SES,
  SHL, SYS) + 1-based position in the **full** manifest domain group, so numbers agree across
  index, sections, and datasheets (`src/catalog/partNumbers.ts`).
- **Registration crosshairs:** 12px corner marks on the 44px footer band (2px ink top rule),
  opacity .55, aria-hidden, pointer-events none.

## 6. Color discipline

- **Stamp red = action/active only:** current nav item, the stamp, mockup-coupled badge,
  row-hover stamp bar, selection wash, caret.
- **Stencil blue = references only:** part numbers, section indices, links, adoptable badge,
  index arrows, classification legend label.
- **Ink hierarchy** (ink → ink-2 → ink-3 → ink-4 → wash) carries everything else.
- WCAG 2 AA is the enforced floor in both themes (Playwright Axe at 1440×900 and 1200×720).

## 7. Motion grammar — the mechanical press

Fast, linear, decisive, settles; never a soft fade. 80–180ms, `linear`, transforms ≤2px, no
bounce, no entrance/scroll-linked animation.

- **State as atmosphere:** theme switch re-inks all surfaces — color properties only,
  180ms, one change of light.
- **Press-settle:** `a:active`/`button:active` sink 1px (80ms). Focus outline never transitions.
- **Displacement feedback (footer nav):** hovered/focused link sinks 1px, siblings and dots
  rise 0.5px (`:has()`), 120ms. The sheet's only neighbor-nudging effect.
- **Registration stamp (signature):** overview `.kx-cat-row` and parts rows on hover/focus —
  content registers 2px right, a 3px×16px bar wipes in from the left rule (ink → red,
  `scaleX` 140ms), hairline darkens to hair-strong. Invisible at rest.
- **Reduced-motion kill-switch:** `prefers-reduced-motion: reduce` nulls every transition and
  transform introduced here, scoped to catalog selectors only.

## 8. Responsive

- **≥900px — desktop reference.** Fluid 1280–1600 via the `clamp()` sizes and `minmax()`
  tracks declared with the layouts they scale; 1440 is bit-stable. Target viewport ≥1200
  (1440 & 1200 tested).
- **≤899px — mobile sheet.** Layout-only changes (no color changes): spread stacks, ruler
  drops, counters compact to 2×2, index thead hidden and rows become two-line blocks,
  headers stack, spec tables scroll inside their containers (min-width 620/680px), touch
  targets padded to ≥40px, sheet meta hidden.

## 9. Do / Don't

- **DON'T** restyle production previews with shell tokens — specimens keep `--kx-*`; the
  plate provides only frame, strip, and literal ground.
- **DON'T** introduce radii, drop shadows, or color gradients (the only gradients are the
  ruler tick patterns).
- **DON'T** use red or blue outside their disciplines (§6).
- **DON'T** add animations beyond the grammar (§7) — no entrances, no loops.
- **DON'T** hardcode counts — derive them from the manifest/`tokens.ts` at runtime
  (as `OverviewPage` does).
- **DO** keep the hairline/2px-rule hierarchy; a section head always ends in the 2px ink rule.
- **DO** keep all catalog CSS in `.kx-cat-*` under `src/catalog/` — never `src/styles/`.

## 10. Provenance

- Approved comp: `.impeccable/mocks/comp-a.png` — authored-HTML comp (`comp-a.html`) with
  prompt sidecar (`comp-a.png.json`), chosen by the user as model-pick (candidate 2 of 7).
- Seed key `0f0acb7e`, direction contract recorded in `catalog.html`.
- Finish gates: hero **0.9342** (verdict match), desktop **0.9397** (~93% / 94%).
- Disposition: **ship** (2026-08-29). Residuals documented in the finish review: face-metric
  drift on the thead, stamp, and title regions, and a non-material 3px row shift — none
  material to the read of the spread.
