# Task 13 Accessibility Evidence — Konteks (2026-08-16)

Self-contained validation evidence for the Task 13 accessibility work (focus/overlay lifecycle, responsive rail, glow, and WCAG AA color contrast). All numbers below are reproduced from the committed inventory source and the actual runner output so the document does not depend on any untracked `.pi` file.

## 1. Result summary

| Metric | Value |
|---|---|
| Inventory total | 114 consumers (65 muted-token + 49 accent-strong-token) |
| Classification | M 61 / A 26 / S 2 / U 25 |
| Migrated (M + A + S) | 89 |
| Unchanged (U) | 25 |
| Browser-observed migrated selectors | 62 |
| Static-calculated migrated selectors (not rendered in any measured state) | 27 |
| Lowest browser-observed contrast | 4.529:1 — `.kx-composer__send` `#4f7044` on `#deebd1` |
| Observed migrated ratios below 4.5:1 | 0 |
| axe-core color-contrast violations (12 states) | 0 |

## 2. Commands and exact results

```
$ npx vitest run src/styles/contrast.test.ts
  ✓ src/styles/contrast.test.ts (131 tests) 8ms
  Test Files  1 passed (1)
       Tests  131 passed (131)

$ node .pi/orch/reviews/task-13-evidence.mjs   # exit 0
  dev server started … server stopped
  summary: total 114; muted 65; accent 49; M61/A26/S2/U25; migrated 89;
           browser-observed 62; static-calculated 27; min observed ratio 4.529;
           below45Observed []; axeContrastViolations []

$ npm test
  Test Files  22 passed (22)
       Tests  544 passed (544)

$ npm run typecheck
  tsc -b  (no errors)

$ npm run build
  vite v6.4.3 building for production… ✓ 61 modules transformed.
  ✓ built in 306ms
```

## 3. Token values and ratio matrix

| Token | Value | On white #ffffff | On canvas #faf8ef | On pale #f4f8ee | White text on token |
|---|---|---|---|---|---|
| `--kx-muted` (original, U consumers) | `#778c78` | 3.616:1 | 3.399:1 | 3.360:1 | 3.616:1 |
| `--kx-muted-text-aa` (M) | `#607260` | 5.156:1 | 4.846:1 | 4.789:1 | 5.156:1 |
| `--kx-accent-strong` (original, U consumers) | `#5f8d4e` | 3.884:1 | 3.651:1 | 3.608:1 | 3.884:1 |
| `--kx-accent-text-aa` (A) | `#4f7044` | 5.625:1 | 5.287:1 | 5.225:1 | 5.625:1 |
| `--kx-accent-solid-aa` (S) | `#4f7044` | 5.625:1 | 5.287:1 | 5.225:1 | 5.625:1 |

Before → after on the three enabled surfaces (muted chain and accent chain):

| Chain | Value | White | Canvas | Pale |
|---|---|---|---|---|
| muted before | `#778c78` | 3.616:1 | 3.399:1 | 3.360:1 |
| muted after (M) | `#607260` | 5.156:1 | 4.846:1 | 4.789:1 |
| accent before | `#5f8d4e` | 3.884:1 | 3.651:1 | 3.608:1 |
| accent after (A/S) | `#4f7044` | 5.625:1 | 5.287:1 | 5.225:1 |

The focus-visible outline keeps `--kx-accent-strong #5f8d4e`; its contrast against the canvas `#faf8ef` is 3.651:1, satisfying the 3:1 non-text requirement for focus indicators (see §7).

## 4. 12-state axe-core table

Rules: `color-contrast`, `link-name`, `button-name`, `landmark-one-main` (device scale factor 1, viewport 1440×900).

| State | Passes | Violations | Incomplete |
|---|---|---|---|
| Initial (new-session) | 3 | 0 | 1 |
| Session history | 3 | 0 | 1 |
| System menu | 3 | 0 | 1 |
| Execution profile menu | 3 | 0 | 1 |
| Component menu | 3 | 0 | 1 |
| Repository selector modal | 3 | 0 | 1 |
| Manual repository modal | 3 | 0 | 1 |
| Create system modal | 3 | 0 | 1 |
| Customize modal | 3 | 0 | 1 |
| Konteks Learned drawer | 3 | 0 | 1 |
| Account menu | 3 | 0 | 1 |
| Settings modal | 3 | 0 | 1 |

All 12 states report **0 violations** (and specifically 0 `color-contrast` violations). Each state reports **1 incomplete** result: axe rule `color-contrast` (impact `serious`) for text rendered over gradient or translucent backgrounds that axe cannot resolve (for example the workspace-avatar gradient and the active segmented button). An incomplete result is not a violation; the migrated text selectors among those nodes are verified separately by the browser-observed effective-background measurement in §5, where the lowest measured ratio is 4.529:1.

## 5. Observed vs static counts and lowest pair

- Browser-observed migrated selectors: **62** (227 rendered pair rows).
- Static-calculated migrated selectors: **27** — these are never rendered in any of the 12 deterministic states, so they are labelled `static-calculated` (never `browser-observed`) and use the approved white/canvas/pale pair matrix.
- Lowest browser-observed ratio: **4.529:1** — `.kx-composer__send` (`#4f7044` foreground on `#deebd1` background).
- Observed migrated ratios below 4.5:1: **0**.

The three reclassified status labels resolve as follows:

| Selector | Class | Method | Foreground | Background | Ratio |
|---|---|---|---|---|---|
| `.kx-profile-menu__readiness--setup` | M | static-calculated | #607260 | #ffffff | 5.156:1 |
| `.kx-integrations__status--setup` | M | browser-observed (`customize`) | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__status--disabled` | M | static-calculated | #607260 | #ffffff | 5.156:1 |

Static-calculated selectors (27) and their canonical pairs:

| Selector | Class | Foreground | Background | Ratio |
|---|---|---|---|---|
| `.kx-system-menu__empty` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-workspace-menu__item-plan` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-page-placeholder p` | M | #607260 | #faf8ef | 4.846:1 |
| `.kx-profile-menu__readiness--setup` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-repo-modal__empty-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-manual-modal__field-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-manual-modal__empty-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-component-menu__empty-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-agents__create-label` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-agents__create-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-context__count` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-context__item-note` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-integrations__empty-text` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__count` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__item-desc` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__item-scope` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__note` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-preserved__status--disabled` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-learned-timeline__meta` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-learned__empty-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-history__empty-hint` | M | #607260 | #ffffff | 5.156:1 |
| `.kx-manual-modal__field-error` | A | #4f7044 | #ffffff | 5.625:1 |
| `.kx-manual-modal__result-flag` | A | #4f7044 | #ffffff | 5.625:1 |
| `.kx-manual-modal__add-another` | A | #4f7044 | #ffffff | 5.625:1 |
| `.kx-agents__disclosure > summary:hover` | A | #4f7044 | #ffffff | 5.625:1 |
| `.kx-preserved__status--enabled` | A | #4f7044 | #f4f8ee | 5.225:1 |
| `.kx-history__clear` | A | #4f7044 | #ffffff | 5.625:1 |

## 6. Complete 114-consumer inventory appendix

This appendix is generated from the executable inventory in `src/styles/contrast.test.ts` and reproduces every consumer exactly once. Classification: **M** = enabled muted text/placeholder, **A** = enabled accent text/glyph, **S** = white-text solid background, **U** = unchanged (decorative/disabled/border/focus/gradient/toggle). Original token is the token each consumer started from; assigned token is the token it must read after migration.

Counts: M 61 / A 26 / S 2 / U 25 = 114 (65 muted + 49 accent).

### 6.1 M — enabled muted text / placeholders (61)

`--kx-muted-text-aa` (#607260), from `--kx-muted` (#778c78)

| # | Selector | File | Property | Assigned token |
|---|----------|------|----------|----------------|
| 1 | `.kx-input::placeholder` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 2 | `.kx-sidebar__control-caption` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 3 | `.kx-sidebar__label` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 4 | `.kx-sidebar__session-meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 5 | `.kx-system-menu__empty` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 6 | `.kx-system-menu__item-count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 7 | `.kx-workspace-menu__item-plan` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 8 | `.kx-page-placeholder p` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 9 | `.kx-setup-row__trigger-caption` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 10 | `.kx-composer__input::placeholder` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 11 | `.kx-composer__profile-caption` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 12 | `.kx-composer__disclaimer` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 13 | `.kx-profile-menu__item-meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 14 | `.kx-profile-menu__section-label` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 15 | `.kx-profile-menu__setting-desc` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 16 | `.kx-profile-menu__setting-state` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 17 | `.kx-profile-menu__readiness--setup` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 18 | `.kx-profile-menu__sidecar-term` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 19 | `.kx-repo-modal__subtitle` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 20 | `.kx-repo-modal__system-desc` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 21 | `.kx-repo-modal__system-count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 22 | `.kx-repo-modal__repo-meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 23 | `.kx-repo-modal__repo-vcs` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 24 | `.kx-repo-modal__status-count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 25 | `.kx-repo-modal__empty-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 26 | `.kx-manual-modal__subtitle` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 27 | `.kx-manual-modal__field-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 28 | `.kx-manual-modal__result-meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 29 | `.kx-manual-modal__count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 30 | `.kx-manual-modal__page-indicator` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 31 | `.kx-manual-modal__network-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 32 | `.kx-manual-modal__footer-note` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 33 | `.kx-manual-modal__empty-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 34 | `.kx-create-modal__subtitle` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 35 | `.kx-create-modal__helper` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 36 | `.kx-create-modal__opt` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 37 | `.kx-create-modal__footer-note` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 38 | `.kx-component-menu__row-repo` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 39 | `.kx-component-menu__count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 40 | `.kx-component-menu__empty-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 41 | `.kx-customize-tab__table th[scope='col']` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 42 | `.kx-agents__create-label` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 43 | `.kx-agents__create-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 44 | `.kx-agents__fact-term` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 45 | `.kx-agents__archived-on` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 46 | `.kx-context__count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 47 | `.kx-context__item-note` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 48 | `.kx-integrations__empty-text` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 49 | `.kx-integrations__status--setup` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 50 | `.kx-preserved__count` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 51 | `.kx-preserved__item-desc` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 52 | `.kx-preserved__item-scope` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 53 | `.kx-preserved__note` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 54 | `.kx-preserved__status--disabled` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 55 | `.kx-learned-item__meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 56 | `.kx-learned-timeline__meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 57 | `.kx-learned__empty-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 58 | `.kx-history__field-label` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 59 | `.kx-history__row-meta` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 60 | `.kx-history__empty-hint` | src/styles/components.css | color | `--kx-muted-text-aa` |
| 61 | `.kx-settings__note` | src/styles/components.css | color | `--kx-muted-text-aa` |

### 6.2 A — enabled accent text / glyphs (26)

`--kx-accent-text-aa` (#4f7044), from `--kx-accent-strong` (#5f8d4e)

| # | Selector | File | Property | Assigned token |
|---|----------|------|----------|----------------|
| 1 | `.kx-sidebar__system-icon` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 2 | `.kx-sidebar__view-all` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 3 | `.kx-sidebar__user-avatar` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 4 | `.kx-system-menu__all` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 5 | `.kx-system-menu__all-icon` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 6 | `.kx-system-menu__item-icon` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 7 | `.kx-system-menu__create` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 8 | `.kx-setup-row__trigger-icon` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 9 | `.kx-composer__profile-icon` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 10 | `.kx-composer__send` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 11 | `.kx-composer__reviews` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 12 | `.kx-profile-menu__check` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 13 | `.kx-profile-menu__manage` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 14 | `.kx-profile-menu__readiness--ready` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 15 | `.kx-repo-modal__add-repo` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 16 | `.kx-repo-modal__status-system` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 17 | `.kx-manual-modal__field-error` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 18 | `.kx-manual-modal__swap` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 19 | `.kx-manual-modal__result-flag` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 20 | `.kx-manual-modal__add-another` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 21 | `.kx-create-modal__req` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 22 | `.kx-component-menu__clear` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 23 | `.kx-agents__disclosure > summary:hover` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 24 | `.kx-integrations__status--connected` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 25 | `.kx-preserved__status--enabled` | src/styles/components.css | color | `--kx-accent-text-aa` |
| 26 | `.kx-history__clear` | src/styles/components.css | color | `--kx-accent-text-aa` |

### 6.3 S — white-text solid backgrounds (2)

`--kx-accent-solid-aa` (#4f7044), from `--kx-accent-strong` (#5f8d4e)

| # | Selector | File | Property | Assigned token |
|---|----------|------|----------|----------------|
| 1 | `.kx-btn--primary` | src/styles/components.css | background | `--kx-accent-solid-aa` |
| 2 | `.kx-composer__badge` | src/styles/components.css | background | `--kx-accent-solid-aa` |

### 6.4 U — unchanged consumers (25)

original token retained (`--kx-muted` or `--kx-accent-strong`)

| # | Selector | File | Property | Assigned token |
|---|----------|------|----------|----------------|
| 1 | `.kx-sidebar__chevron` | src/styles/components.css | color | `--kx-muted` |
| 2 | `.kx-setup-row__chevron` | src/styles/components.css | color | `--kx-muted` |
| 3 | `.kx-composer__profile-chevron` | src/styles/components.css | color | `--kx-muted` |
| 4 | `.kx-history__open:disabled` | src/styles/components.css | color | `--kx-muted` |
| 5 | `.kx-input:focus` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 6 | `.kx-sidebar__workspace-avatar` | src/styles/components.css | background | `--kx-accent-strong` |
| 7 | `.kx-system-menu__create:hover` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 8 | `.kx-workspace-menu__item-avatar` | src/styles/components.css | background | `--kx-accent-strong` |
| 9 | `.kx-composer__input:focus` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 10 | `.kx-composer__profile:hover` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 11 | `.kx-composer__send:hover:not(:disabled)` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 12 | `.kx-profile-menu__manage:focus-visible` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 13 | `.kx-profile-menu__setting-dot` | src/styles/components.css | background | `--kx-accent-strong` |
| 14 | `.kx-repo-modal__system--active .kx-repo-modal__system-radio` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 15 | `.kx-manual-modal__network-check` | src/styles/components.css | accent-color | `--kx-accent-strong` |
| 16 | `.kx-component-menu__check` | src/styles/components.css | accent-color | `--kx-accent-strong` |
| 17 | `.kx-customize__tab:focus-visible` | src/styles/components.css | outline | `--kx-accent-strong` |
| 18 | `.kx-agents__review` | src/styles/components.css | border-left | `--kx-accent-strong` |
| 19 | `.kx-agents__disclosure > summary:focus-visible` | src/styles/components.css | outline | `--kx-accent-strong` |
| 20 | `.kx-preserved__toggle--on` | src/styles/components.css | background | `--kx-accent-strong` |
| 21 | `.kx-preserved__toggle:focus-visible` | src/styles/components.css | outline | `--kx-accent-strong` |
| 22 | `.kx-learned__tab:focus-visible` | src/styles/components.css | outline | `--kx-accent-strong` |
| 23 | `.kx-learned-timeline__item::before` | src/styles/components.css | border | `--kx-accent-strong` |
| 24 | `.kx-history__clear:focus-visible` | src/styles/components.css | border-color | `--kx-accent-strong` |
| 25 | `:focus-visible` | src/styles/global.css | outline | `--kx-accent-strong` |

## 7. Task 13B1 responsive / focus / tooltip / glow measurements

Chromium measurements (device scale factor 1, zoom 100%) from the Task 13B1 runner (`task-13b-evidence.json`).

### 7.1 Viewport / sidebar / Customize

| Viewport | innerWidth | max-width:1280px match | Sidebar width | Doc scroll (w×h) | Customize (w×h, left, top) |
|---|---|---|---|---|---|
| 1281x900 | 1281 | false | 240px | 1281×900 | 790×580, left 245.5, top 160 |
| 1280x900 | 1280 | true | 64px | 1280×900 | 790×580, left 245, top 160 |
| 1200x720 | 1200 | true | 64px | 1200×720 | 790×580, left 205, top 70 |
| 1200x827 | 1200 | true | 64px | 1200×827 | 790×580, left 205, top 123.5 |
| 1200x719 | 1200 | true | 64px | 1200×719 | 790×580, left 205, top 69.5 |

Key results: no document-level horizontal overflow at any viewport (`docScrollWidth === innerWidth`); `body/html` remain `overflow: hidden`; `.kx-main` owns vertical scrolling; the collapse control is `display:flex` above 1280px and `display:none` at ≤1280px; the in-place 1280→1281 resize restores the stored preference (expanded 240px, collapsed 64px).

### 7.2 Focus outline

Every measured viewport reports the focused radio with `outline: 2px solid rgb(95,141,78)` (#5f8d4e), offset 2px, fully inside the viewport, contrast **3.651:1** against the canvas `#faf8ef`. This satisfies the 3:1 non-text contrast requirement for focus indicators.

### 7.3 Tooltip

The single inventoried tooltip — sidebar `button[aria-label="Customize"].kx-tooltip-host` with `role="tooltip"` — shows for **both** keyboard focus and hover at every measured viewport: `opacity: 1`, `visibility: visible`, `hidden: false` for focus and hover states.

### 7.4 Glow

At every measured viewport the main glow reports: `display: block`, `opacity: 1`, `z-index: 0` (behind content, which is `z-index: 1`), `pointer-events: none`, and `background-image: radial-gradient(65% 55% at 18% 0%, rgba(143, 191, 106, 0.16), rgba(0, 0, 0, 0) 62%)`. An `elementFromPoint` hit-test at the glow coordinates reaches the underlying `.kx-new-session` section (`hitIsMainOrContent: true`), confirming the glow does not intercept pointer interaction.

### 7.5 Tab order (1281×900)

Engineering mode, empty prompt: `Engineering` (selected radio) → repository trigger → component trigger → composer textarea → `Attach file` → `Add text document` → `Execution Profile` → `Voice input` → `Reviews waiting` (disabled `Send` skipped). Sidebar controls follow in the document order. Planning mode omits repository/component and substitutes `Start planning` in the same enabled slot.

## 8. Source-search notes

The three reclassified selectors were located by grepping `components.css` for the muted-token status/readiness rules:

- `.kx-profile-menu__readiness--setup` — `src/styles/components.css` (`color: var(--kx-muted)`, now `--kx-muted-text-aa`). Rendered by `src/components/composer/ExecutionProfileMenu.tsx` (the "Setup" readiness sidecar value).
- `.kx-integrations__status--setup` — `src/styles/components.css` (transparent background + 1px border chip, `color: var(--kx-muted)`, now `--kx-muted-text-aa`). Rendered by `src/components/customize/IntegrationsTab.tsx` and `src/components/customize/AgentsTab.tsx`.
- `.kx-preserved__status--disabled` — `src/styles/components.css` (transparent background + 1px border chip, `color: var(--kx-muted)`, now `--kx-muted-text-aa`). Rendered by `src/components/customize/SkillsTab.tsx` and `src/components/customize/ToolsTab.tsx`.

Genuinely disabled/icon consumers kept on `--kx-muted`: `.kx-history__open:disabled` (with `opacity: 0.55`, exempt as a disabled control) and the three icon chevrons `.kx-sidebar__chevron`, `.kx-setup-row__chevron`, `.kx-composer__profile-chevron`. The test assertion in `src/components/customize/CustomizeModal.test.tsx` for `.kx-integrations__status--setup` was updated from `--kx-muted` to `--kx-muted-text-aa`.

## 9. Known limits

- axe-core reports `color-contrast` as **incomplete** (not violated) for text over gradient/translucent backgrounds; those migrated selectors are verified through the runner's ancestor-walk alpha-compositing measurement instead.
- Two of the three reclassified selectors (`.kx-profile-menu__readiness--setup`, `.kx-preserved__status--disabled`) are not rendered by the deterministic mock data, so they are labelled `static-calculated` against the approved white surface (5.156:1).
- Contrast is a source-string contract in jsdom (`contrast.test.ts`) plus rendered-state measurement in Chromium; jsdom does not apply real CSS, so the test asserts token assignments rather than computed colors.
- The runner and its JSON are temporary orchestration artifacts under `.pi/orch/reviews/` and are not committed; this document is the durable, self-contained record.

## 10. Reproduction

1. `npx vitest run src/styles/contrast.test.ts` — proves the 114-consumer inventory, M61/A26/S2/U25 classification, token definitions, ratio contracts, and M/A/S/U assignments.
2. `node .pi/orch/reviews/task-13-evidence.mjs` — starts the Vite dev server, renders the 12 states, runs axe-core, measures effective foreground/background for every rendered migrated selector, and writes `.pi/orch/reviews/task-13-evidence.json` (then stops the server).
3. `npm test` — full unit suite (544 tests).
4. `npm run typecheck` and `npm run build` — typecheck and production build.

No server remains running after the evidence run.
