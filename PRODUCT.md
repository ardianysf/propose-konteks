# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Engineers and AI coding agents** adopting Konteks components into product work: they read the manifest (`src/catalog/components.json`), the registry previews, API contracts, usage snippets, and token dependencies to consume real source — not wrappers.
- **Public showcase visitors** (confirmed by owner, this redesign): designers, engineers, and evaluators who arrive to judge the craft and coherence of the Konteks design system itself.

## Product Purpose

Konteks is a dual-output repository: a working product app (`/`) and a living design-system catalog (`/catalog`). The catalog documents and demos every production component with live previews, prop/context contracts, generated usage snippets, and token dependencies. Success means a consumer — human or AI — can find, understand, and correctly adopt any component from the catalog alone, and a public visitor leaves convinced the system is real and well-made.

## Positioning

Source-first catalog: it renders the actual production components with their real state machinery (same tokens, same CSS, same reducers, same providers) — not wrappers, not a mirrored npm package, not screenshots.

## Operating Context

- Consumers work in editors/terminals next to the repo; the catalog is read alongside code during adoption.
- AI agents follow `docs/ai-adoption.md`: manifest → registry → tokens → fixture contracts.
- Public visitors browse on desktop, arrive via link, and scan quickly before deciding to stay.

## Capabilities and Constraints

- 35 manifest entries across domains: account, composer, context, customize, reviews, session, shell, system (+ internal & utility).
- Clean-URL routing: `/catalog`, `/catalog/tokens`, `/catalog/components`, `/catalog/components/<slug>` (History API, Vite rewrites, Vercel rewrites).
- Live previews run real components through `MockupFixtureProvider` with real reducers/providers.
- Light/dark theming via `konteks-theme` storage + pre-paint stamp; must not flash wrong theme.
- Constraint (owner decision, this redesign): **production component previews and `src/styles/tokens.css` stay untouched** — the redesign owns the catalog shell (`.kx-cat-*` surface) only.
- Constraint (owner clarification): **component previews must keep using the existing production tokens** (`--kx-*`) so they stay consistent in both light and dark themes. The shell owns its palette but must ship both themes via the existing `data-theme` mechanism.
- Existing contracts must keep passing: 9 vitest suites in `src/catalog/`, Playwright catalog-shell/catalog-content/catalog-component-detail specs including WCAG2AA at 1440×900 and 1200×720.

## Brand Commitments

- Name: **Konteks**.
- The product app's **Warm Enterprise** visual world (sage greens `#8fbf6a`/`#243025`, cream canvas `#faf8ef`, DM Sans) is binding for product surfaces and component previews.
- The catalog shell is its own surface with its own visual world — chosen in this redesign.

## Evidence on Hand

- Real components in `src/components/` (the only demo material; no fabricated screenshots needed).
- `src/styles/tokens.css` light+dark palettes; `src/catalog/tokens.ts` token inventory.
- `docs/ai-adoption.md`, `README.md`, dual-output pivot plans under `docs/plans/`.
- No customer quotes, metrics, or press — do not fabricate any.

## Product Principles

1. **Real over represented**: only live production components, never mockups-of-mockups.
2. **Source-first**: every page exists to make adoption from source trivial.
3. **Legible to machines and humans alike**: the same page serves an AI agent parsing contracts and a designer judging craft.
4. **Showcase earns trust**: the catalog's own craft is evidence of the system's quality.
5. **Dual-output discipline**: app and catalog share components and tokens; neither forks the other.

## Accessibility & Inclusion

WCAG2AA is the enforced floor (catalog-content.spec.ts Axe checks at 1440×900 and 1200×720); both light and dark themes must pass.
