# Mobile-Responsive Behavior — Konteks

How the Konteks mockup adapts below desktop widths: two breakpoints collapse the shell, re-anchor every overlay, and keep bottom-anchored composers inside the dynamic viewport.

**Scope:** Verified against source (`src/**/*.css`, `src/state/mockupReducer.ts`, `src/components/shell/AppShell.tsx`). All values below are read from code, not invented.

---

## Breakpoints

| Query | Applies | Effect |
|-------|---------|--------|
| `max-width: 1280px` | 761–1280px | Sidebar forced to the 64px icon rail (`AppShell.css` grid track, `Sidebar.css` forced-rail block); sidebar-anchored menus re-anchor from `calc(var(--kx-sidebar-rail) + 12px)` (`shared.css`, `AccountMenu.css`). Stored collapse preference is untouched. |
| `max-width: 760px` | ≤760px | Full mobile layout: off-canvas sidebar drawer, floating page chrome, stacked composer, re-anchored overlays. |
| `max-height: 760px and min-width: 761px` | Short desktop windows | Vertical compaction only (`components.css`, `Composer.css`, `NewSessionPage.css`); no horizontal geometry changes. |

The 761–1280px forced rail hides both collapse toggles (`.kx-sidebar__toggle`, `.kx-sidebar__collapse`) — expansion is unavailable at that width, so no aria-state may contradict the layout. Crossing back above 1280px restores the stored preference untouched; no reducer state is involved.

Compact-height (short desktop) rules, all scoped with the `min-width: 761px` guard so mobile keeps its own rhythm:

- `components.css`: `.kx-panel` gap 12px → 10px; toolbar padding 6px 10px.
- `Composer.css`: `.kx-composer` padding 12px → 10px; input `min-height` 60px floor → 104px (desktop base).
- `NewSessionPage.css`: gap 24px, padding `24px 32px 32px`, intro image capped at 124px.

### Mobile z-index ladder (≤760px)

| Layer | z-index |
|-------|---------|
| Mobile scrim (tap-outside closer) | 45 |
| Sidebar drawer | 50 |
| Hamburger toggle | 60 |
| Floating Share button | 65 |
| Workspace / System / Account overlays | 70 |

## Shell (≤760px) — `src/components/shell/AppShell.css`

- `.kx-app` becomes `display: block` with `height: 100dvh` (dynamic viewport — visible height when the mobile address bar collapses). The base `100vh` remains the desktop/fallback value.
- The sidebar becomes a fixed off-canvas drawer: `position: fixed`, `transform: translateX(-100%)` closed, `translateX(0)` when `.kx-app--mobile-open` is set, `z-index: 50`, 200ms ease-out slide. It always renders the **expanded** look (`Sidebar.css` undoes rail geometry below 760px).
- `.kx-main` keeps `height: 100%` + `overflow-y: auto`; when the drawer opens it only **shifts** via `transform: translateX(var(--kx-sidebar-w))` — dimensions and scrolling are unchanged.
- Hamburger `.kx-app__mobile-toggle`: fixed at `12px, 12px`, 40×40px, 14px radius, raised background, `z-index: 60`; hidden (`display: none`) while the drawer is open — the scrim and Escape take over closing.
- `.kx-app__mobile-scrim`: transparent fixed layer, `z-index: 45` (below the drawer's 50) — taps outside the sidebar close the drawer.
- `Escape` closes the drawer (window-level listener mounted only while open, `AppShell.tsx`).
- Reducer state: `sidebarMobileOpen: boolean` + `TOGGLE_SIDEBAR_MOBILE` (`src/state/mockupReducer.ts`, initial value `false`). The scrim element is conditionally rendered only while open; `.kx-app--mobile-open` also guards it in CSS.
- `prefers-reduced-motion` removes the drawer/main slide transitions.
- The mobile drawer always renders expanded nav: `Sidebar.css` undoes `.kx-sidebar--rail` geometry below 760px (labels, chevrons, recent list, horizontal user row restored), and the internal collapse toggles and logo expand affordance stand down — the hamburger owns open/close. While a full-screen overlay sheet is open (`kx-app--sheet-open`, currently the Learned drawer), the hamburger hides too.

## Page headers (≤760px)

Header text is visually hidden via `.kx-u-sr-only` (`src/styles/global.css`, scoped to ≤760px) but stays in the accessibility tree. The utility is the classic 1px/clip pattern (`position: absolute; width/height: 1px; clip-path: inset(50%)`); elements carry the class at every viewport, but desktop has no rule for it and renders fully:

| Element | Treatment |
|---------|-----------|
| New Session title / subtitle / approval line | `sr-only` (`NewSessionPage.tsx`) |
| Session title / context line | `sr-only`; the header band collapses to `height: 0` (`SessionHeader.css`) |
| Share button | Stays visible as a floating fixed button, `top: 12px; right: 12px`, `z-index: 65` |

Session content gets `padding: 64px 12px 0` so the first block starts below the floating menu row.

## Composer (≤760px)

In `src/styles/components.css` (shared `.kx-panel`):

- Top row becomes a column (`flex-direction: column`, left-aligned, 8px gap).
- `.kx-panel__mode-cluster` spans `width: 100%`; its content stays left-aligned at natural width.
- Toolbar drops `space-between`; the right group (mic/send) pins right via `margin-left: auto`.
- Textarea `min-height: 60px` (`Composer.css`). Exception: the running-session composer keeps a 40px one-line floor (`SessionDetailComposer.css`, higher specificity).

Page composition:

- **New Session** (`NewSessionPage.css`): one screen at 390×844 — page padding `16px 16px 8px` with a 14px column gap, content column `flex: 1`, intro centered via `flex: 1` + `justify-content: center` (auto margins are dropped so flex-grow owns the slack), intro image capped at 84px, intro body capped at 340px. The bottom block is composer + disclaimer below it (`margin: 6px 0 0`, 10px/1.3 text) anchored 8px above the viewport bottom. On short phones (≤700px tall) the intro image is dropped entirely.
- **Running session** (`SessionDetailPage.css`): flex column; composer area uses `margin: auto -12px 8px` + sticky bottom — an 8px visible gap under the composer card. Reading blocks keep their 680px cap; only the composer area stretches full-width with 12px gutters.

## Overlays (≤760px)

| Overlay | Mobile form | Source |
|---------|-------------|--------|
| Workspace / System / Account menus | Bottom sheets (shared pattern): fixed `bottom: 0`, full width, `border-radius: 14px 14px 0 0`, `max-height: min(80dvh, 640px)`, `padding-bottom: calc(12px + env(safe-area-inset-bottom))`, `z-index: 70`. Sheet chrome inside each menu root: dark backdrop `rgb(var(--kx-ink-rgb) / 0.44)` (tap dismisses via the overlay lifecycle), drag handle (36×4), caps title — `.kx-menu__sheet-*` classes, desktop `display: none` with a `display: contents` body wrapper (`components.css`) | `WorkspaceMenu.css`, `SystemMenu.css`, `AccountMenu.css`, `components.css` |
| Konteks Learned drawer | Full-screen sheet: `.kx-drawer` gets `width: 100vw`; internal paddings clamp (`12px 16px` head, `max-width: 100%` panels) | `components.css`, `LearnedDrawer.css` |
| Response footer more-menu | Left-anchored (`left: 0`), `max-width: calc(100vw - 16px)`, `max-height: 60vh`, scrolls | `ResponseFooter.css` |
| Feedback modal | `width: min(420px, calc(100vw - 24px))`, `max-height: calc(100dvh - 24px)`, scrolls (embedded variant excluded) | `FeedbackModal.css` |
| ComponentMenu | Re-anchored to the composer panel; `max-width: calc(100vw - 32px)` | `ComponentMenu.css` |
| ExecutionProfileMenu | Cluster stacks vertically (sidecar below menu), `max-width: calc(100vw - 48px)`; both triggers go `position: static` so the cluster re-anchors to the input box | `ExecutionProfileMenu.css` |

Both composer popovers swap their mid-toolbar anchors for static positioning so the nearest positioned ancestor (`.kx-composer` / `.kx-composer__input-box`, made `position: relative` on mobile) becomes the anchor — otherwise a 320–560px menu anchored mid-toolbar would overflow the right viewport edge. The Session Mode segment aligns left (`SessionMode.css`: `align-items: flex-start`).

Desktop base geometry, for contrast: workspace menu anchors at `calc(var(--kx-sidebar-w) + 12px)`, system menu at `top: 118px` under the sidebar control, account menu right of the sidebar near the user row (all rail-aware at ≤1280px via `calc(var(--kx-sidebar-rail) + 12px)`).

## Theme & contrast

- Dark-mode sidebar logo renders white via `filter: brightness(0) invert(1)` on `.kx-sidebar__logo-img` (`Sidebar.css`); light theme is unchanged.
- Theming mechanism is unchanged: `html[data-theme]` attributes plus the pre-paint stamp script.
- Session-mode active segment: `--kx-accent-solid-aa` (#4f7044) fill with white text — AA 5.6:1 in **both** themes (`tokens.css`).

## Known mobile measurements (390×844 reference)

| Measurement | Value | Verified by |
|-------------|-------|-------------|
| First session block top | y = 64 | `padding: 64px 12px 0` on session content |
| Composer bottom edge | 836 | 844 viewport − 8px bottom margin |
| Learned drawer size | 390×844 | `width: 100vw`, `inset` full height |
| Account bottom sheet height | ≈262 | Runtime measurement harness (`mobile-measure.mjs`) |
| Mode cluster width | ≈332 | 390 − 2×16 page padding − 2×12 composer padding − 2px border |

## Do / Don't for future components

- **Do** clamp every overlay to the viewport (`min(…, 100vw - N)`, dvh-aware max-heights) and let it scroll internally.
- **Do** anchor bottom elements with a ≥8px gap using `100dvh`-aware spacing so browser chrome collapse can't hide them.
- **Do** test at 390×844 (harness: `node mobile-measure.mjs` against a running dev server).
- **Do** keep header copy in the DOM with `.kx-u-sr-only` when hiding it on mobile.
- **Don't** reintroduce fixed-width drawers or desktop anchoring (`right` of a 320px sidebar) on phones.
- **Don't** resize `.kx-main` on drawer open — shift it with `transform` only.

## Verification commands

```bash
npm run dev                                   # Start the dev server
node mobile-measure.mjs                       # 390×844 harness: drawer, scrim, header, menus
node measure-now.mjs                          # 390×844 harness: new session, composer, overlays
npx vitest run src/state/mockupReducer.test.ts  # TOGGLE_SIDEBAR_MOBILE reducer coverage
npx playwright test tests/e2e/shell.spec.ts   # Shell/rail behavior
```

The measurement harnesses drive a real Chromium at the 390×844 reference and print JSON reports (rects, computed z-index/position, hit-testing, a11y snapshots of the sr-only headings).
