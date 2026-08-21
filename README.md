# Konteks — Clickable Mockup

A local React + TypeScript mockup of the **Konteks "Warm Enterprise" visual revamp** design specification.

- **Authoritative contract:** [`docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md`](docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md) (46 acceptance criteria, AC1–AC46).
- **Implementation plan:** [`docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md`](docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md).
- **Scope:** Single-page app driven by `mockupReducer` (route, sidebar, mode, system/repository/component selection, Execution Profile, overlays). No backend, no network calls, no persistence — **except** theme preference, which uses real `localStorage` (see §Theme below).

> **All content is illustrative.** Timestamps, counts, session names, system names, repository names, and model names are placeholder data. A visible **"Illustrative data"** marker appears on Session History and in Settings; sidebar and New Session carry no marker (spec §2, AC46).

## Prerequisites

Node.js 18+ required. Install dependencies with:

```bash
npm install
```

Exits 0 when already up-to-date.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server (both mockup + catalog) |
| `npm run build` | Type-check, build both outputs, copy docs to `dist/` |
| `npm run preview` | Preview production builds from `dist/` |
| `npm test` | Run Vitest unit/component suites |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run typecheck` | Type-check only (`tsc -b`) |
| `npm run verify:assets` | Verify 5 Konteks PNG assets (existence, size, PNG magic, SHA-256) |
| `npm run verify:manifest` | Validate `src/catalog/components.json` against repo/registry |
| `npm run capture:mockup` | Capture mockup screenshots (requires `-- <label> --port 4173` or `--base-url`) |

## Local URLs

| Output | Dev | Preview |
|--------|-----|---------|
| **Main mockup** | `http://localhost:5173/` | `http://localhost:4173/` |
| **Design system catalog** | `http://localhost:5173/catalog` | `http://localhost:4173/catalog` |
| **Catalog tokens** | `http://localhost:5173/catalog/tokens` | `http://localhost:4173/catalog/tokens` |
| **Catalog components** | `http://localhost:5173/catalog/components` | `http://localhost:4173/catalog/components` |
| **Catalog component detail** | `http://localhost:5173/catalog/components/<slug>` | `http://localhost:4173/catalog/components/<slug>` |

Run `npm run dev` for development or `npm run build && npm run preview` for production preview.

## Theme

Theme preference is **real**, persisted to `localStorage` under key `konteks-theme`. Three options:
- `light` — always light
- `dark` — always dark  
- `system` — follows OS preference

The theme selector lives in the account menu (sidebar user row → click menu → see theme radio group). Both `index.html` and `catalog.html` run inline theme-stamping scripts before module load to prevent flashes on reload.

Theme lives **outside** `mockupReducer` — it's actual user state, not mock scenario state. See `src/theme.ts`.

## Demo States

Loading and empty variants are reachable via URL query parameters (consumed once at reducer init, spec §15, AC43):

- `/?mock=loading` — Skeleton/loading states for sessions, systems, repositories, components, pending reviews
- `/?mock=empty` — Designed empty states for the same primary flows
- `/` — Default populated "ready" state

## Vercel Deployment

`vercel.json` configures production routing rewrites for the design system catalog:

```json
{
  "rewrites": [
    { "source": "/catalog", "destination": "/catalog.html" },
    { "source": "/catalog/:path*", "destination": "/catalog.html" }
  ]
}
```

This enables clean URL routing (`/catalog/tokens`, `/catalog/components/<slug>`) with client-side navigation via HTML5 History API. Browser back/forward and direct deep links work correctly.

## Build Artifacts

`npm run build` produces:

| Artifact | Source | Purpose |
|----------|--------|---------|
| `dist/index.html` | `index.html` + Vite | Main mockup entry |
| `dist/catalog.html` | `catalog.html` + Vite | Catalog entry |
| `dist/components.json` | `src/catalog/components.json` | Canonical component manifest (copied) |
| `dist/ai-adoption.md` | `docs/ai-adoption.md` | AI adoption guide (copied) |
| `dist/assets/*.css` | Vite | Bundled CSS (both outputs) |
| `dist/assets/*.js` | Vite | Bundled JS (both outputs) |
| `dist/.vite/manifest.json` | Vite | Build manifest for asset references |

Copy step handled by `scripts/copy-dist-assets.mjs`.

## Repository Structure

```
src/
├── main.tsx                 # Mockup entry point
├── App.tsx                  # Mockup root + routing
├── theme.ts                 # Theme preference (localStorage)
├── state/                   # Mockup reducer, actions, selectors
├── components/              # Domain components (account, composer, context, customize, reviews, session, shell, system)
│   ├── account/             # AccountMenu, SettingsModal
│   ├── composer/            # ComponentMenu, Composer, ExecutionProfileMenu, SessionMode
│   ├── context/             # CreateSystemModal, ManualRepositoryModal, RepositorySelectorModal
│   ├── customize/           # CustomizeModal, AgentsTab, ContextTab, IntegrationsTab, SkillsTab, ToolsTab
│   ├── reviews/             # LearnedDrawer
│   ├── session/             # SessionDetailComposer, SessionHeader, SessionQuoteCard, SessionTimeline, SessionTracker
│   ├── shell/               # AppShell, Sidebar, SystemMenu, WorkspaceMenu
│   └── system/              # SystemMapModal
├── pages/                   # Page-level components (NewSessionPage, SessionDetailPage, SessionHistoryPage)
├── catalog/                 # Design system catalog (dual output)
│   ├── main.tsx             # Catalog entry
│   ├── CatalogApp.tsx       # Catalog root
│   ├── router.ts            # Clean URL router
│   ├── manifest.ts          # Typed manifest access
│   ├── registry.tsx         # Component registry for previews
│   ├── components.json      # Canonical component manifest
│   ├── tokens.ts            # Token documentation
│   ├── fixtures/            # MockupFixtureProvider for previews
│   └── pages/               # OverviewPage, TokensPage, ComponentsIndexPage, ComponentDetailPage, NotFoundPage
├── data/                    # Mock data (sessions, systems, repositories, profiles)
├── styles/                  # Global styles, tokens.css, component.css
└── utils/                   # Utilities (formatTime, etc.)

tests/
├── e2e/                     # Playwright E2E specs
│   ├── accessibility.spec.ts         # WCAG AA checks (wcag2aa tag only)
│   ├── visual.spec.ts                # Screenshot captures
│   ├── shell.spec.ts                 # Shell behavior
│   ├── session-history.spec.ts       # Session history flow
│   ├── session-detail.spec.ts        # Session detail flow
│   ├── modes-composer.spec.ts        # Composer modes
│   ├── system-repository.spec.ts     # System/repository selection
│   ├── component-menu.spec.ts        # Component menu
│   ├── execution-profile.spec.ts     # Execution profile menu
│   ├── customize.spec.ts             # Customize modal
│   ├── account-settings.spec.ts      # Account settings
│   ├── learned-drawer.spec.ts        # Learned drawer
│   ├── catalog-shell.spec.ts         # Catalog shell
│   ├── catalog-content.spec.ts       # Catalog content pages
│   └── catalog-component-detail.spec.ts # Component detail pages
└── copy-dist-assets.test.ts  # Build artifact copy verification

scripts/
├── verify-assets.mjs        # PNG asset verification (SHA-256, size, magic bytes)
├── verify-manifest.mjs      # Manifest validation (S1–S7 checks)
├── copy-dist-assets.mjs     # Copy components.json + ai-adoption.md to dist/
├── capture-mockup.mjs       # Mockup screenshot capture
└── remove-migrated-css.mjs  # CSS migration utility

public/
└── assets/konteks/          # First-party Konteks PNG assets
    ├── ASSETS.md            # Provenance and checksums
    ├── logo-text-main.png
    ├── web-topbar-icon-128.png
    ├── favicon.png
    ├── empty-sessions.png
    └── empty-results.png

docs/
├── ai-adoption.md           # AI adoption guide for component reuse
├── plans/                   # Implementation plans
├── superpowers/
│   └── specs/               # Design specifications (authoritative contract)
└── validation/              # Validation evidence and reports
```

## Test Layers

| Layer | Tool | Location | Output |
|-------|------|----------|--------|
| Unit/component | Vitest | `src/**/*.{test,spec}.{ts,tsx}` | Console (exit 0 on pass) |
| E2E | Playwright | `tests/e2e/*.spec.ts` | `artifacts/test-results/` (HTML report via `npx playwright show-report artifacts/playwright-report`) |
| Screenshot | Playwright | `tests/e2e/visual.spec.ts` | `artifacts/screenshots/` (gitignored) |
| Accessibility | Axe + Playwright | `tests/e2e/accessibility.spec.ts` | Console (wcag2aa tag only) |
| Asset verification | Node | `scripts/verify-assets.mjs` | Console |
| Manifest validation | TypeScript Compiler API | `scripts/verify-manifest.mjs` | Console |

Run `npm test` for unit/component tests, `npm run test:e2e` for E2E.

## Responsive Targets

- **Ideal:** 1440×900 (desktop)
- **Minimum:** ~1200×720 (desktop-focused target)
- Sidebar collapses to rail at ≤1280px width
- Composer and 790×580 modals must fit viewport at both target sizes
- No horizontal page scroll at 1200×720 (AC44)
- Narrow-viewport accommodation: `@media (max-width: 760px)` layout adjustments in `NewSessionPage.css` (formal design target remains desktop; narrow-viewport support is an accommodation, not a full mobile/tablet responsive implementation)

See spec §16 for full responsive requirements.

## AI Adoption Guide

For AI-assisted component discovery and adoption, see [`docs/ai-adoption.md`](docs/ai-adoption.md). Covers:

- Locating the catalog and manifest
- Component classifications (`adoptable`, `mockup-coupled`, `internal`, `utility`)
- Copy-layout convention (relative imports, not npm)
- What to copy: `.tsx`, `.css`, dependencies, providers, tokens
- Token contract and CSS custom properties
- `MockupFixtureProvider` and `OverlayLifecycle` caveats
- Using the manifest for programmatic discovery
- Verification commands (`verify:manifest`, `typecheck`, `build`)
- Quick-start examples for `adoptable` and `mockup-coupled` components

## Asset Verification

First-party production assets live in [`public/assets/konteks/`](public/assets/konteks/). Provenance and SHA-256 digests in [`ASSETS.md`](public/assets/konteks/ASSETS.md).

`npm run verify:assets` checks each of the 5 required PNGs:
- File exists
- Size > 1 KiB
- Valid PNG magic bytes (`89 50 4E 47 0D 0A 1A 0A`)
- SHA-256 digest matches `ASSETS.md`

Success output: `OK: 5/5 Konteks assets verified` (exit 0).

## Manifest Verification

`npm run verify:manifest` validates `src/catalog/components.json` against the repo and registry:

| Check | Description |
|-------|-------------|
| S1 | Schema version, unique kebab-case IDs, valid domains/classifications |
| S2 | All `sourcePath` files exist |
| S3 | All declared exports exist (via TypeScript Compiler API) |
| S4 | All documented props exist in component type |
| S5 | Manifest ↔ registry 1:1 (every ID has both) |
| S6 | All token dependencies defined in `tokens.css` |
| S7 | `contextContract` shape matches classification rules |

Exit 0 with `OK (<n> entries)` on pass; exit 1 with violation list on fail.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Theme flashes light on reload | Check `<html data-theme>` in browser inspector; inline script may be missing in `index.html` or `catalog.html` |
| `/catalog` routes 404 on Vercel | Verify `vercel.json` rewrites are deployed (check Vercel dashboard → Settings → Rewrites) |
| `npm run verify:manifest` fails | Run `npm run typecheck` first; ensure `src/catalog/components.json` and `src/catalog/registry.tsx` are in sync |
| Playwright fails to find elements | Ensure dev server is running (`npm run dev`) or use production build (`npm run build && npm run preview`) |
| Assets fail verification | Re-download from `app.konteks.io` per `ASSETS.md` URLs; verify file integrity |
| Catalog navigation breaks | Clean URLs require server-side rewrite; dev server handles this via `catalogSpaFallback()` plugin in `vite.config.ts` |
| CSS not loading after migration | Run `npm run build` and check `dist/assets/*.css`; ensure migrated CSS files are referenced in component imports |
| Type errors after changes | Run `npm run typecheck` to see full TypeScript output; check `tsconfig.json` paths |

## Known Scope Limits

- Playwright runs a single **Chromium** project (`Desktop Chrome`); cross-browser (Firefox/WebKit) behavior is outside verification scope.
- Axe checks target **`wcag2aa`** tag only; AAA and best-practice tags are excluded from the gate.
- Visual captures are **deterministic surface checks, not pixel/snapshot baselines**; they exist for human review.
- Customize **Skills/Tools** tabs preserve existing prototype content (spec §11, §18); reconcile against real product before production use.
