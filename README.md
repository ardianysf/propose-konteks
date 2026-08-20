# Konteks — Clickable Mockup

A clickable, local-state-only React + TypeScript mockup of the approved **Konteks "Warm Enterprise"
visual revamp** design specification.

- **Authoritative contract:** [`docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md`](docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md) (46 acceptance criteria, AC1–AC46).
- **Implementation plan:** [`docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md`](docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md).
- **Scope:** a single-page app driven by one `mockupReducer` (route, sidebar, mode, system/repository/component
  selection, Execution Profile, and every overlay). No backend, no network calls, no persistence.

> **All content is illustrative.** Every timestamp, count, session name, system name, repository name, and
> model name shown in the mockup is placeholder data, not production fact. A visible **"Illustrative data"**
> marker renders on the Session History page and inside the Settings modal; the sidebar and the New Session
> page carry no marker (spec §2, AC46).

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies (exit 0 when up-to-date) |
| `npm test` | Run Vitest unit/component suites (`src/**/*.{test,spec}.{ts,tsx}`) |
| `npm run build` | Type-check (`tsc -b`), copy manifest/ai-adoption docs, and emit production builds to `dist/` |
| `npm run preview` | Preview production builds from `dist/` | 
| `npm run test:e2e` | Run Playwright core-flow + visual + axe checks against the dev server |
| `npm run verify:assets` | Verify the 5 first-party Konteks PNG assets (existence, size, PNG magic, SHA-256) |
| `npm run verify:manifest` | Validate `src/catalog/components.json` against repo and registry | 
| `npm run typecheck` | Type-check only (`tsc -b`) |
| `npm run dev` | Start the Vite dev server |

## Dev server URLs

| Output | URL (dev) | URL (preview) |
|--------|-----------|---------------|
| **Main mockup** | `http://localhost:5173` | `http://localhost:4173` |
| **Design system catalog** | `http://localhost:5173/catalog.html` | `http://localhost:4173/catalog.html` |

Run `npm run dev` for the dev server, or `npm run build && npm run preview` for the production preview.

## Demo states

Loading and empty variants are reachable via URL query parameters, consumed once at reducer init
(spec §15, AC43):

- `/?mock=loading` — skeleton/loading states for sessions, systems, repositories, components, and pending reviews.
- `/?mock=empty` — designed empty states for the same primary flows.
- No query (`/`) — the default populated "ready" state.

## Assets — provenance & verification

First-party production Konteks assets live in [`public/assets/konteks/`](public/assets/konteks/). Provenance
(source URLs / Figma nodes) and SHA-256 digests are recorded in
[`public/assets/konteks/ASSETS.md`](public/assets/konteks/ASSETS.md).

`npm run verify:assets` runs [`scripts/verify-assets.mjs`](scripts/verify-assets.mjs), which asserts for each of
the five required PNGs: file exists, size > 1 KiB, valid PNG magic bytes, and a SHA-256 digest matching the
`ASSETS.md` table. Success output is `OK: 5/5 Konteks assets verified` (exit 0).

## Build artifacts

The `npm run build` command produces the following files in `dist/`:

| Artifact | Source | Purpose |
|----------|--------|---------|
| `dist/index.html` | `index.html` + Vite | Main clickable mockup entry point |
| `dist/catalog.html` | `catalog.html` + Vite | Design system catalog entry point |
| `dist/components.json` | `src/catalog/components.json` | Canonical component manifest (copied verbatim) |
| `dist/ai-adoption.md` | `docs/ai-adoption.md` | AI adoption guide for component reuse (copied verbatim) |
| `dist/assets/*.css` | Vite | Bundled CSS (both outputs) |
| `dist/assets/*.js` | Vite | Bundled JavaScript (both outputs) |
| `dist/manifest.json` | Vite | Build manifest for asset references |

The copy step is handled by `scripts/copy-dist-assets.mjs` (see below), which runs after Vite to ensure `components.json` and `ai-adoption.md` are always present in `dist/`.

## Visual screenshot output

`npm run test:e2e` (specifically `tests/e2e/visual.spec.ts`) performs deterministic capture checks — real
assertions that each surface is visible, followed by a `page.screenshot()` (no snapshot-baseline diffing) —
at both **1440×900** and **1200×720** for:

Engineering · Planning · system menu · Execution Profile (with hover sidecar) · repository modal ·
component menu · Customize Agents · Customize MCP (integration tab) · Learned drawer · Session History · Settings.

Screenshots are written to the gitignored `artifacts/screenshots/<view>-<w>x<h>.png`. At 1200×720 the spec
also asserts no horizontal document overflow and that the 790×580 Customize modal fits fully within the viewport
(AC44).

## Acceptance criteria → spec cross-reference

| AC | Spec section | AC | Spec section |
|---|---|---|---|
| AC1 | §5.1, §6.1 | AC24 | §7.3 |
| AC2 | §6.1 | AC25 | §8.1 |
| AC3 | §5.1 | AC26 | §8.1 |
| AC4 | §5.1 | AC27 | §8.1 |
| AC5 | §5.2 | AC28 | §8.1 |
| AC6 | §6.1 | AC29 | §8.2 |
| AC7 | §6.1 | AC30 | §9 |
| AC8 | §6.2 | AC31 | §9 |
| AC9 | §6.1, §11 | AC32 | §9 |
| AC10 | §6.1 | AC33 | §10 |
| AC11 | §6.1, §13 | AC34 | §11 |
| AC12 | §6.1 | AC35 | §11 |
| AC13 | §6.2 | AC36 | §11 |
| AC14 | §6.2 | AC37 | §11 |
| AC15 | §7.1 | AC38 | §11 |
| AC16 | §7.1 | AC39 | §12 |
| AC17 | §7.1 | AC40 | §13 |
| AC18 | §7.2 | AC41 | §13 |
| AC19 | §7.2 | AC42 | §14 |
| AC20 | §7.2, §12 | AC43 | §15 |
| AC21 | §7.3 | AC44 | §16 |
| AC22 | §7.3 | AC45 | §16 |
| AC23 | §7.3 | AC46 | §2 |

## AI adoption guide

For AI-assisted component discovery and adoption, see [`docs/ai-adoption.md`](docs/ai-adoption.md). This guide covers:

- How to locate the catalog and component manifest
- Component classifications (`adoptable`, `mockup-coupled`, `internal`, `utility`)
- Copy-layout convention (relative imports, not npm)
- What to copy: `.tsx`, `.css`, dependencies, providers, tokens
- Token contract and CSS custom properties
- `MockupFixtureProvider` and `OverlayLifecycle` caveats
- Using the manifest for programmatic discovery
- Verification commands (`npm run verify:manifest`, `typecheck`, `build`)
- Quick-start examples for both `adoptable` and `mockup-coupled` components

## Chromium scope & known evidence limits

- Playwright runs a single **Chromium** project (`Desktop Chrome`); cross-browser (Firefox/WebKit) behavior is
  outside the mockup's verification scope.
- Axe checks in `tests/e2e/accessibility.spec.ts` target the **`wcag2aa`** tag only; stricter levels (AAA) and
  best-practice tags are intentionally excluded from the gate.
- Visual captures are **deterministic surface checks, not pixel/snapshot baselines**; they exist for human review.
- The Customize **Skills/Tools** tabs are specified as "preserve current functionality/content, adopt shell"
  (spec §11, §18) and were transcribed from the approved prototypes; reconcile against the real product before
  production use.
