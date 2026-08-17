# Konteks Clickable Mockup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the approved Konteks "Warm Enterprise" visual revamp as a fully clickable, local-state-only React mockup that satisfies all 46 acceptance criteria of `docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md` (the authoritative contract; all §/AC references below map to that document).

**Architecture:** A single-page Vite + React + TypeScript app driven by one `mockupReducer` that owns route, sidebar, mode, system/repository/component selection, Execution Profile, and every overlay (menus, modals, drawer, Customize, Settings) — no backend, no network calls, no persistence. A persistent shell renders the white 240px collapsible sidebar plus the `#FAF8EF` matcha canvas; the canvas swaps between two pages (`NewSessionPage`, `SessionHistoryPage`) while every menu/modal/drawer/tab is a pure function of reducer state. Styling is hand-written CSS in three focused layers — `tokens.css` (Warm Enterprise palette + DM Sans scale + fixed dimensions), `global.css` (reset, focus rings, scrollbars), `components.css` (per-component classes) — with real Konteks assets served from `public/assets/konteks/`.

**Tech Stack:** Vite, React, TypeScript, CSS, Vitest, React Testing Library, Playwright, @axe-core/playwright.

---

## Source of truth & standing rules

- **Authoritative contract:** `docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md`. Every task cites the AC numbers (§17, AC1–AC46) it implements. When any prototype or asset conflicts with the spec, the spec wins (§2).
- **Subordinate references** (read-only, gitignored, never committed): approved prototypes under `.superpowers/brainstorm/<run-id>/content/` (§19 index), `Konteks2.mp4` (Account/Settings structure preservation, §14), Figma node 406:18749 (geometry/asset extraction).
- **No backend / no network:** the app performs zero `fetch`/XHR. All interaction is reducer state. DM Sans is self-hosted via `@fontsource/dm-sans` (no runtime CDN).
- **No push:** origin is configured and a root commit exists, but no task pushes. Commits stay local on the feature branch.
- **Never commit reference media:** `Konteks.mp4`, `Konteks2.mp4`, `Ask-Devin.mp4`, root `Screenshot*.png`, `untitled folder/`, `.superpowers/`, `.pi/` are already gitignored — Preflight re-verifies.
- **Component boundaries:** no component exceeds one screen-region responsibility. `Composer` owns input + toolbar only (profile/component menus are separate anchored components); `CustomizeModal` owns only the fixed 790×580 frame, header, and tab nav — tab content lives in per-tab components; `Sidebar` owns navigation chrome only; `AppShell` owns grid + overlay slots. Unit tests assert behavior/classes; pixel-exact layout (19.5px corners, 790×580 modal, 450px drawer) is asserted in Playwright because jsdom does not compute real layout.
- **Demo states:** loading/empty variants are reachable via URL query `?mock=loading|empty`, consumed once at reducer init (§15, AC43). The visible **"Illustrative data"** marker (§2, AC46) comes from a single `mockData.ts` constant. **User override:** it no longer renders in the sidebar footer or on New Session — it renders as the Session History page-level notice plus the Settings section notices.
- **Test-selection convention:** interactive elements that specs/E2E need carry stable `data-testid` values (e.g. `workspace-control`, `system-menu`, `execution-profile-menu`, `component-menu`, `customize-modal`, `learned-drawer`).

## Preflight (verified 2026-08-16 — re-run before Task 1)

1. `git -C /Users/ardian/AllJobs/Konteks remote -v` → `origin  https://gitea.sev-2.com/ardian/konteks-propose.git` (push URL present but unused — **no task pushes**).
2. `git -C /Users/ardian/AllJobs/Konteks log --oneline -1` → `9bc4b5d docs(design): add Konteks visual revamp spec` — root commit exists; history is clean.
3. `git -C /Users/ardian/AllJobs/Konteks status --porcelain` → **this plan file is initially untracked**: before its own commit the only output line is `?? docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md` — expected, not an anomaly. Commit it by itself before Task 1: `git add docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md && git commit -m "docs(plan): add Konteks clickable mockup implementation plan"`. After the plan commit, re-run `git status --porcelain` → **empty** — the repository is expected clean from that point onward and before every task (videos/screenshots/`.superpowers/`/`.pi/` correctly ignored; if any `*.mp4`/`*.png` appears, fix `.gitignore` before proceeding — never `git add -f` them).
4. After the plan commit, the repo's tracked working tree contains only `.gitignore`, `docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md`, and this plan; everything else is ignored reference media.

---

## Task 1 — Repo/toolchain scaffold and baseline smoke test

**AC:** enables all (infrastructure).

**Files**
- Create: `package.json`, `package-lock.json` (generated), `index.html`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `src/App.test.tsx`
- Modify: `.gitignore` (append `artifacts/` and `*.tsbuildinfo`)

**Steps**
1. From `/Users/ardian/AllJobs/Konteks`, run the Preflight checks; then `git checkout -b feat/konteks-clickable-mockup` → no output.
2. Failing test-first — write `src/App.test.tsx`:
   ```tsx
   import { render, screen } from '@testing-library/react'
   import App from './App'

   it('renders the Konteks app root', () => {
     render(<App />)
     expect(screen.getByRole('heading', { name: /konteks/i })).toBeInTheDocument()
   })
   ```
3. Run `npm test` → **fails** because the command runs **before `package.json` exists**: npm exits with an ENOENT `Could not read package.json` error (there is no `test` script and no Vitest runner to load yet) — this is the expected pre-scaffold baseline. Do **not** expect a Vitest/`./App`-not-found failure at this step; that module-resolution failure only becomes reachable once `package.json` (step 4) and dependencies (step 5) exist.
4. Write `package.json` exactly:
   ```json
   {
     "name": "konteks-clickable-mockup",
     "private": true,
     "version": "0.1.0",
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "tsc -b && vite build",
       "preview": "vite preview",
       "test": "vitest run",
       "test:watch": "vitest",
       "test:e2e": "playwright test",
       "typecheck": "tsc -b --noEmit",
       "verify:assets": "node scripts/verify-assets.mjs"
     },
     "dependencies": {
       "@fontsource/dm-sans": "^5.1.0",
       "react": "^18.3.1",
       "react-dom": "^18.3.1"
     },
     "devDependencies": {
       "@axe-core/playwright": "^4.10.2",
       "@playwright/test": "^1.49.0",
       "@testing-library/jest-dom": "^6.6.0",
       "@testing-library/react": "^16.1.0",
       "@testing-library/user-event": "^14.5.2",
       "@types/react": "^18.3.0",
       "@types/react-dom": "^18.3.0",
       "@vitejs/plugin-react": "^4.3.4",
       "jsdom": "^25.0.0",
       "typescript": "~5.6.2",
       "vite": "^6.0.0",
       "vitest": "^3.0.0"
     }
   }
   ```
5. Run `npm install` → exit 0, `package-lock.json` created, summary like `added ~200 packages`. Then `npx playwright install chromium` → exit 0.
6. Write `index.html` (`lang="en"`, `<title>Konteks</title>`, `<link rel="icon" href="/assets/konteks/favicon.png">`, `<div id="root">`), `vite.config.ts` (react plugin), `vitest.config.ts` (`environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`), `playwright.config.ts` (`testDir: './tests/e2e'`, `use.baseURL: 'http://localhost:5173'`, one `chromium` project, `webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true }`), `tsconfig.json` (strict, `jsx: react-jsx`, `moduleResolution: bundler`, `types: ["vitest/globals"]`), `tsconfig.node.json` (vite/playwright configs), `src/test/setup.ts` (`import '@testing-library/jest-dom/vitest'`).
7. Write `src/main.tsx` (createRoot → `<App />`) and `src/App.tsx` rendering `<main><h1>Konteks</h1></main>`, importing `@fontsource/dm-sans/400.css`, `/500.css`, `/700.css`.
8. Append to `.gitignore`: `artifacts/`, `*.tsbuildinfo`.
9. Run `npm test` → `1 passed`. Run `npm run build` → tsc clean, `dist/` emitted. Optional smoke: `npm run dev &`, `curl -s http://localhost:5173 | grep -q "<title>Konteks</title>" && echo OK` → `OK`; then kill the dev server.
10. Commit — add exactly Task 1's files (never `git add -A` here, so nothing outside this task — e.g. a not-yet-committed plan file — can be swept in; the Preflight plan commit should already have landed anyway, making the tree contain only Task 1 output):
    ```bash
    git add package.json package-lock.json index.html vite.config.ts vitest.config.ts playwright.config.ts tsconfig.json tsconfig.node.json src/main.tsx src/App.tsx src/test/setup.ts src/App.test.tsx .gitignore && git commit -m "chore(toolchain): scaffold Vite React TS app with Vitest, RTL, and Playwright"
    ```

---

## Task 2 — Assets + visual tokens / type scale / layout primitives

**AC:** 2, 3 (structure), 4, 5 (enforced by contract test).

**Files**
- Create: `public/assets/konteks/logo-text-main.png`, `public/assets/konteks/web-topbar-icon-128.png`, `public/assets/konteks/empty-sessions.png`, `public/assets/konteks/empty-results.png`, `public/assets/konteks/favicon.png`, `public/assets/konteks/ASSETS.md`, `scripts/verify-assets.mjs`, `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/components.css`, `src/styles/tokens.test.ts`
- Modify: `src/main.tsx` (import the three stylesheets after fontsource)

**Steps**
1. Failing test-first — write `src/styles/tokens.test.ts`:
   ```ts
   import { readFileSync } from 'node:fs'
   const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8')
   const palette = ['#FAF8EF', '#FFFFFF', '#FFF', '#243025', '#58735A', '#778C78', '#E2E9D5', '#F4F8EE', '#8FBF6A', '#5F8D4E']
   it.each(palette)('tokens.css defines %s', (hex) => expect(css.toUpperCase()).toContain(hex.toUpperCase()))
   it.each([24, 20, 18, 16, 13, 12, 11, 10])('type scale defines %spx', (px) => expect(css).toContain(`${px}px`))
   it('defines fixed dimensions (19.5px corners, 240px sidebar, 790x580 customize, 450px drawer)', () => {
     expect(css).toContain('19.5px'); expect(css).toContain('240px')
     expect(css).toContain('790px'); expect(css).toContain('580px'); expect(css).toContain('450px')
   })
   ```
2. Run `npm test` → new tests **fail** (file missing). Write `src/styles/tokens.css` `:root` custom properties: `--kx-canvas #FAF8EF`, `--kx-raised #FFF`, `--kx-primary #243025`, `--kx-secondary #58735A`, `--kx-muted #778C78`, `--kx-border #E2E9D5`, `--kx-pale #F4F8EE`, `--kx-accent #8FBF6A`, `--kx-accent-strong #5F8D4E`; type scale `--kx-text-3xl: 24px` … `--kx-text-2xs: 10px` (all eight sizes; comment marks MD 13 as the normal-weight default body); dimensions `--kx-radius-main: 19.5px`, `--kx-sidebar-w: 240px`, `--kx-sidebar-rail: 64px`, `--kx-customize-w: 790px`, `--kx-customize-h: 580px`, `--kx-drawer-w: 450px`. Run `npm test` → passes (guards AC4/AC5).
3. Acquire exact Konteks assets (no third-party substitutes — §5.2). Preferred source: export from Figma node 406:18749 (logo, topbar icon, empty-state illustration, favicon) into `public/assets/konteks/`. If fetching from the deployed app, use safe downloads:
   ```bash
   mkdir -p public/assets/konteks
   curl -fL --retry 2 "<exported-asset-url>/logo-text-main.png"      -o public/assets/konteks/logo-text-main.png
   curl -fL --retry 2 "<exported-asset-url>/web-topbar-icon-128.png" -o public/assets/konteks/web-topbar-icon-128.png
   ```
   If a URL 404s (`curl` exit 22), fall back to the Figma export — do **not** substitute placeholder marks. A single Konteks illustration may back both empty-state files if Figma provides only one.
4. Record provenance + checksums: for each file run `shasum -a 256 public/assets/konteks/<file>` and write value + source (Figma node or URL) into `public/assets/konteks/ASSETS.md`.
5. Write `scripts/verify-assets.mjs`: for the five required files assert exists, size > 1 KiB, PNG magic bytes (`\x89PNG\r\n\x1a\n`), and SHA-256 matching `ASSETS.md` (via `node:crypto`). Run `npm run verify:assets` → prints `OK: 5/5 Konteks assets verified`, exit 0.
6. Write `src/styles/global.css`: box-sizing reset; `body { font-family: 'DM Sans', sans-serif; font-size: 13px; color: var(--kx-primary); background: var(--kx-canvas) }`; `:focus-visible { outline: 2px solid var(--kx-accent-strong); outline-offset: 2px }`; custom scrollbars (thumb `var(--kx-border)`, hover `var(--kx-secondary)`, transparent track); `@media (prefers-reduced-motion: reduce)` disabling transitions.
7. Write `src/styles/components.css` primitives only (per-feature classes come with their tasks): `.kx-app` (grid `sidebar | main`, 100vh), `.kx-main` (`background: var(--kx-canvas)`, `border-radius: 19.5px 0 0 19.5px` — top-left/bottom-left corners meeting the sidebar, AC2), `.kx-main::before` radial matcha glow (accent-tinted `radial-gradient`, `pointer-events: none`, low opacity so it never reduces content legibility, AC3), `.kx-raised`, `.kx-btn` / `.kx-btn--primary` / `.kx-btn--ghost`, `.kx-btn:disabled` (reduced contrast + `cursor: not-allowed`), `.kx-input`, `.kx-chip`, `.kx-menu` (floating anchored, raised, shadow, custom scrollbar), `.kx-modal` + `.kx-modal-backdrop`, `.kx-drawer`, `.kx-tooltip` (shows on `:hover` **and** `:focus-within`), `.kx-icon-btn` (unboxed; hover/focus reveals soft `var(--kx-pale)` affordance), `.kx-segmented`.
8. Update `src/main.tsx` import order: dm-sans 400/500/700 → `tokens.css` → `global.css` → `components.css`. Run `npm run build` → clean. Run `npm run verify:assets` → `OK: 5/5`.
9. Commit:
    ```bash
    git add -A && git commit -m "feat(design): add Konteks assets, Warm Enterprise tokens, and layout primitives"
    ```

---

## Task 3 — Mock data + state reducer / navigation contracts

**AC:** 10, 25, 26, 32, 33, 43 (demo variants), 46 (marker).

**Files**
- Create: `src/data/mockData.ts`, `src/state/mockupReducer.ts`, `src/state/mockupReducer.test.ts`

**Steps**
1. Failing test-first — write `src/state/mockupReducer.test.ts` covering the contract (run → all fail):
   - `SET_ACTIVE_SYSTEM` with a different system **clears `selectedRepoIds`**; same-system redispatch keeps selection (AC26).
   - `TOGGLE_REPO` for a repository outside the active system is **ignored** (AC25).
   - `CREATE_SYSTEM` (name, optional description) appends the system, **makes it the active system**, clears repo selection (AC33).
   - `NAVIGATE 'session-history'` changes route only — `sidebarCollapsed` and all sidebar-affecting state untouched (AC11).
   - `CLOSE_OVERLAY` (the Escape action) closes whichever overlay is open: system menu / execution profile menu / component menu / repository modal / manual repo modal / create-system modal / customize modal / learned drawer / account menu / settings (AC45 state contract).
   - `SET_CUSTOMIZE_TAB` switches the customize overlay's active tab in place (no close/reopen) — the action Task 9's tab nav dispatches.
   - `SET_MODE 'planning'` sets the mode; `TOGGLE_COMPONENT` + `CLEAR_COMPONENTS` maintain the selection list (AC32).
   - `initialState('?mock=loading')` and `('?mock=empty')` set list variants; default `'ready'` (AC43).
2. Run `npm test` → **fails** (module missing). Implement `src/state/mockupReducer.ts`: typed `MockupState` — `route: 'new-session' | 'session-history'`; `sidebarCollapsed`; `sessionMode: 'engineering' | 'planning'`; `activeSystemId`; `selectedRepoIds`; `selectedComponentIds`; `activeProfileId`; `overlay` as a discriminated union (with payloads for customize tab, learned tab, settings section); per-list `search` strings; `demoVariant` — plus the pure `mockupReducer` and `initialState(search: string)` reading the `mock` query param once. Action types cover every contract above — `SET_ACTIVE_SYSTEM`, `TOGGLE_REPO`, `CREATE_SYSTEM`, `NAVIGATE`, `OPEN_OVERLAY` (with the union payloads, e.g. customize tab / learned tab), `CLOSE_OVERLAY`, `SET_MODE`, `TOGGLE_COMPONENT`, `CLEAR_COMPONENTS`, and `SET_CUSTOMIZE_TAB` (consumed by Task 9).
3. Write `src/data/mockData.ts`. Top of file carries the explicit marker comment `// ILLUSTRATIVE DATA — all names/counts/timestamps are placeholders, not production facts (spec AC46)` and exports the visible marker string `ILLUSTRATIVE_DATA_NOTE = 'Illustrative data'`. Use existing factual/prototype names where available (§19), e.g.:
   - `workspace: 'Refactory'`; systems with repo counts: `BSI - HRIS`, `BSI Canteen`, `MPM - Mytok`, `MPM - Portal Vendor`, `Hanoman`, `Kookree`, `Richapp`, `Online Store`, `Personal Blogspot`.
   - repositories: `bsi/hris-frontend-shared`, `bsi/hris-frontend-promotion`, `bsi/hris-frontend-pref-eval`, `bsi/canteen-backend`, `bsi/canteen-cms`, `mpm/mytok`, `richapp/fe-richapp`, `richapp/be-richapp`, …
   - execution profiles (each with planner model / executor model / authorization / readiness): `Default`, `Commerce Platform`, `Core Banking`, `Merchant Portal`, `Refactory Admin`; workspace-level Assistant + Search entries.
   - components (name + owning repo): e.g. `hris-web` / `bsi/hris-frontend-shared`, `canteen-api` / `bsi/canteen-backend`, …
   - recent sessions (system + time, most recent first): `EDP Integration Fix - Mobile`, `Review attendance integration`, `Prepare sprint proposal`, `Map frontend dependencies`, `Validate delivery evidence`; richer `sessionHistory` rows (title, mode, system, component, time).
   - `pendingReviews`, `auditHistory` (flat timeline events), account menu actions, Settings sections (General; Billing with Usage/Plans/Providers/Budgets/Top Up/Transactions; Team), Customize Skills/Tools preserved-content placeholders (filled in Task 9).
4. Run `npm test` → all reducer tests pass.
5. Commit:
    ```bash
    git add -A && git commit -m "feat(state): add illustrative mock data and mockup reducer with tests"
    ```

---

## Task 4 — App shell, sidebar collapse, routing, system floating menu

**AC:** 1, 6, 7, 8, 9 (tooltip), 10, 11, 12, 13, 14.

**Files**
- Create: `src/components/shell/AppShell.tsx`, `src/components/shell/Sidebar.tsx`, `src/components/shell/SystemMenu.tsx`, `src/components/shell/Sidebar.test.tsx`, `src/components/shell/SystemMenu.test.tsx`
- Modify: `src/App.tsx` (reducer + context provider, render `<AppShell />`), `src/styles/components.css` (sidebar/menu classes)

**Steps**
1. Failing test-first — `Sidebar.test.tsx`:
   - workspace box is the **only persistent boxed container** in the sidebar (AC6);
   - workspace control and system control both render a chevron-right affordance (AC7);
   - recent sessions render chronologically, each row showing `system + time` (AC10);
   - clicking "View all" navigates to session history and the sidebar element's `outerHTML` is **identical before/after** (AC11);
   - minimize/collapse toggles the rail-width class and restores the 240px class (AC12);
   - the user row shows a sliders icon; its `Customize` tooltip appears on keyboard focus (AC9);
   - no `All Systems` page/link exists in navigation (AC14).
2. `SystemMenu.test.tsx`: opens as a floating menu anchored to the right of the control (no `.kx-modal-backdrop`); pinned `All systems` row at top; search field filters systems; rows are icon + name + repository count with **no avatar imagery** (AC8); `Create new system` sits in a sticky footer region that stays mounted while the list container scrolls (AC13).
3. Run `npm test` → fails. Implement:
   - `AppShell.tsx`: `.kx-app` grid; left `<Sidebar />`; right `<main class="kx-main">` hosting the route switch (`NewSessionPage` placeholder now, real page in Task 5) plus overlay slots (`SystemMenu`; later tasks add menus/modals/drawer).
   - `Sidebar.tsx` boundaries — chrome only: workspace box; workspace/system controls (chevron-right; menus open to the right); user row with sliders icon + keyboard-focusable tooltip dispatching `OPEN_OVERLAY('customize')` (one-click behavior asserted in Task 9); recent sessions list; View all link; collapse toggle. Logo uses `/assets/konteks/logo-text-main.png` expanded and `web-topbar-icon-128.png` in rail mode.
   - `SystemMenu.tsx`: floating `.kx-menu` positioned right of the sidebar control; header-less pinned `All systems` row; search input; scrollable system list (max-height, custom scrollbar); sticky bottom `Create new system` dispatching `OPEN_OVERLAY('createSystem')` (modal built in Task 7).
4. Run `npm test` → all pass. `npm run dev` → visually confirm the menu opens to the right and the sticky footer survives list scrolling.
5. Commit:
    ```bash
    git add -A && git commit -m "feat(shell): add app shell, collapsible sidebar, and system floating menu"
    ```

---

## Task 5 — Engineering/Planning modes and composer visual hierarchy

**AC:** 15, 16, 17, 18, 19, 20 (placement; drawer behavior in Task 10), 21 (selector placement).

**Files**
- Create: `src/components/composer/SessionMode.tsx`, `src/components/composer/Composer.tsx`, `src/pages/NewSessionPage.tsx`, `src/pages/NewSessionPage.test.tsx`
- Modify: `src/styles/components.css` (segmented control + composer classes)

**Steps**
1. Failing test-first — `NewSessionPage.test.tsx`:
   - the Engineering/Planning segmented control renders **above** the setup controls and composer in DOM order with the dominant-hierarchy class (AC15);
   - Planning mode shows **no** repository/component setup UI, shows the CTA `Start planning` and placeholder `Describe the product outcome you want to plan…` (AC16);
   - Engineering mode shows system/repository selection and component selection alongside the composer (AC17);
   - composer renders the soft-matcha outer container class wrapping a white input class (AC18);
   - attachment / text-document / mic toolbar icons are unboxed (no border class) with hover-affordance class; send button carries the soft accent class (AC19);
   - send is disabled when input is empty (AC43 disabled);
   - disclaimer text sits left below the input and `Reviews waiting` with a round count badge sits right (AC20);
   - Execution Profile control renders bottom-left of the toolbar, after the text/document control (DOM order assertion) (AC21).
2. Run `npm test` → fails. Implement:
   - `SessionMode.tsx`: segmented control bound to `SET_MODE`.
   - `Composer.tsx` boundaries — input + toolbar + footer only: local input state; unboxed icon buttons; soft-accent send; disclaimer (left); `Reviews waiting` + round badge (right) dispatching `OPEN_OVERLAY('learned', tab 'pending')`; Execution Profile control (button only — menu wired in Task 6).
   - `NewSessionPage.tsx`: mode control dominant; Engineering-only setup row with system/repository trigger (dispatches `OPEN_OVERLAY('repositorySelector')` — modal in Task 7) and Component button (dispatches `OPEN_OVERLAY('componentMenu')` — menu in Task 8); Planning hides the setup row entirely.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(composer): add Engineering/Planning modes and composer hierarchy"
    ```

---

## Task 6 — Execution Profile anchored menu + hover sidecar

**AC:** 21, 22, 23, 24.

**Files**
- Create: `src/components/composer/ExecutionProfileMenu.tsx`, `src/components/composer/ExecutionProfileMenu.test.tsx`
- Modify: `src/components/composer/Composer.tsx` (render anchored menu when open), `src/styles/components.css`

**Steps**
1. Failing test-first — `ExecutionProfileMenu.test.tsx`:
   - renders as an anchored menu with **no backdrop element** and **no header** — a flat profile list (AC22);
   - includes `Manage / Customize Profile` which dispatches/opens Customize on the Agents tab (AC22);
   - hovering a profile row (and focusing it via keyboard) reveals the sidecar listing Planner model, Executor model, authorization, readiness for that profile (AC23);
   - Assistant and Search render under a visually separated `Workspace settings` section (divider + label class) **outside** the profile list (AC24);
   - Escape dispatches `CLOSE_OVERLAY`.
2. Run `npm test` → fails. Implement `ExecutionProfileMenu.tsx`: absolutely positioned `.kx-menu` anchored to the profile control; flat list from `mockData.profiles` with check on active; sidecar panel shown on `mouseEnter`/`focus` of a profile row; `Workspace settings` section with divider + label; `Manage / Customize Profile` → `OPEN_OVERLAY('customize', tab 'agents')`.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(composer): add anchored Execution Profile menu with hover sidecar"
    ```

---

## Task 7 — One-active-system repo modal, manual repo form, Create System

**AC:** 25, 26, 27, 28, 29, 33 (+ 43 disabled/empty/loading states for these surfaces).

**Files**
- Create: `src/components/context/RepositorySelectorModal.tsx`, `src/components/context/ManualRepositoryModal.tsx`, `src/components/context/CreateSystemModal.tsx`, and matching `.test.tsx` for each
- Modify: `src/components/shell/SystemMenu.tsx` (route `Create new system` to the modal), `src/pages/NewSessionPage.tsx` (open modal from setup trigger), `src/styles/components.css`

**Steps**
1. Failing test-first:
   - `RepositorySelectorModal.test.tsx`: repositories grouped under exactly **one active system**; checkboxes enabled only within it and rendered disabled outside it (AC25); switching active system dispatches `SET_ACTIVE_SYSTEM` (selection clearing already proven in reducer, AC26); one search input filters both system names and repository names (AC27); `Add new system` action sits at the **top** of the system list (AC27); `Add repository manually` appears **only inside the expanded active system group** (AC28); footer is a single row of actions/status (AC28); `?mock=empty` search results show a designed empty state (AC43).
   - `ManualRepositoryModal.test.tsx`: VCS Connector selector; searchable repository picker with pagination (Previous/Next) and result count; `Enter URL manually` escape hatch swaps picker for a URL input; selected repositories render as removable chips; `Add another repository` queues another selection; Execution selection; `Require private network` toggle; Cancel/Connect actions; **Connect disabled** while required fields are invalid/missing (AC29, AC43).
   - `CreateSystemModal.test.tsx`: Name required — create disabled without it; Description marked optional; helper text explaining systems group repositories/components; on create dispatches `CREATE_SYSTEM` (new system becomes active — reducer-proven, AC33).
2. Run `npm test` → fails. Implement the three modals (`kx-modal` + backdrop, Escape closes, focus moved to dialog):
   - `RepositorySelectorModal.tsx` boundaries: system rail (active + others), repo group for active system, shared search, one-line footer.
   - `ManualRepositoryModal.tsx` boundaries: connector/picker/chips/toggle only; pagination local component state; submit merges chips via `TOGGLE_REPO`-equivalent action.
   - `CreateSystemModal.tsx` boundaries: name/description/helper only.
3. Run `npm test` → all pass. Commit:
    ```bash
    git add -A && git commit -m "feat(context): add system-scoped repo modal, manual repo form, and Create System"
    ```

---

## Task 8 — Anchored flat Component menu

**AC:** 30, 31, 32 (+ 43 empty/loading for component search).

**Files**
- Create: `src/components/composer/ComponentMenu.tsx`, `src/components/composer/ComponentMenu.test.tsx`
- Modify: `src/components/composer/Composer.tsx` or `NewSessionPage.tsx` (anchor to the Component button), `src/styles/components.css`

**Steps**
1. Failing test-first — `ComponentMenu.test.tsx`:
   - opens as an anchored floating menu aligned to the Component button — **no modal/backdrop** (AC30);
   - flat rows show component name with repository underneath on the same row and **no component-type chip/label** (AC31);
   - search input filters across component and repository names (AC31);
   - multi-select via checkboxes; summary shows selection count and a `Clear` action that empties selection (AC32);
   - `?mock=empty` renders a designed empty state for no matches (AC43); Escape closes.
2. Run `npm test` → fails. Implement `ComponentMenu.tsx`: `.kx-menu` anchored under the Component button; rows from `mockData.components` filtered by state search; checkbox toggles dispatch `TOGGLE_COMPONENT`; footer `N selected` + `Clear` dispatching `CLEAR_COMPONENTS`.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(composer): add anchored flat component selector menu"
    ```

---

## Task 9 — Fixed 790×580 Customize shell + seven tabs (incl. preserved Skills/Tools)

**AC:** 9 (one-click open), 34, 35, 36, 37, 38.

**Files**
- Create: `src/components/customize/CustomizeModal.tsx`, `src/components/customize/AgentsTab.tsx`, `src/components/customize/ContextTab.tsx`, `src/components/customize/IntegrationsTab.tsx`, `src/components/customize/SkillsTab.tsx`, `src/components/customize/ToolsTab.tsx`, `src/components/customize/preservedContent.ts`, `src/components/customize/CustomizeModal.test.tsx`
- Modify: `src/components/shell/Sidebar.tsx` (sliders icon opens Customize in one click), `src/data/mockData.ts` (replace Skills/Tools placeholders with structured preserved content), `src/styles/components.css`

**Steps**
1. Failing test-first — `CustomizeModal.test.tsx`:
   - modal frame carries fixed `790×580` sizing class; switching through **all seven tabs** never changes the frame's sizing class/content shell (AC34 — pixel-exact assertion deferred to E2E Task 14);
   - header + tab nav are static (outside the scroll container) and only the content area has the scroll class (AC35);
   - tab order: Agents, Context, MCP, Connectors, VCS, Skills, Tools — all seven present (§11);
   - Agents tab hierarchy: `Create profile` action, `Active Profiles` table, compact `Review setup` sticker, plus progressive-disclosure (`details`/`summary`) regions that still expose AI role / provider / profile / archived / permission content (AC36);
   - Context tab presents Files / Skills / Repositories (AC37); MCP/Connectors/VCS render compact empty states/tables (AC37);
   - Skills and Tools render the preserved content items from `preservedContent.ts` inside the new shell — assert item names/counts match the data source (AC38);
   - opens directly on a requested tab (Agents) from the Execution Profile `Manage / Customize Profile` and from the sidebar sliders icon (AC9, AC22).
2. Run `npm test` → fails. Implement:
   - `CustomizeModal.tsx` boundaries — frame, header, `role="tablist"` nav, tab-panel switch, close; no tab content inline.
   - `AgentsTab.tsx`, `ContextTab.tsx`, `SkillsTab.tsx`, `ToolsTab.tsx`, `IntegrationsTab.tsx` (parameterized `variant: 'mcp' | 'connectors' | 'vcs'` compact empty states/tables).
   - `preservedContent.ts`: typed adapter exposing current Skills/Tools functionality/content as structured data (names, descriptions, toggles) so the new shell renders it unchanged — reconciled against the real product before implementation per spec §18 risk note.
   - `SET_CUSTOMIZE_TAB` action already in reducer (Task 3).
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(customize): add fixed 790x580 shell with Agents, Context, MCP, Connectors, VCS, Skills, Tools"
    ```

---

## Task 10 — Konteks Learned drawer and Review trigger

**AC:** 20 (click opens drawer on Pending), 39, 43 (pending/audit empty + loading).

**Files**
- Create: `src/components/reviews/LearnedDrawer.tsx`, `src/components/reviews/LearnedDrawer.test.tsx`
- Modify: `src/components/composer/Composer.tsx` (wire `Reviews waiting` click → `OPEN_OVERLAY('learned', 'pending')` if not already), `src/styles/components.css`

**Steps**
1. Failing test-first — `LearnedDrawer.test.tsx`:
   - renders as a right drawer with the fixed 450px-width class (AC39 — pixel-exact in E2E);
   - tabs Pending (default/primary) and Audit History; opening from `Reviews waiting` lands on Pending (AC20);
   - Pending lists waiting reviews for action; Audit History renders a **flat timeline** of past events (AC39);
   - `?mock=empty` shows designed empty states for both tabs; `?mock=loading` shows skeleton rows (AC43);
   - Escape closes (AC45).
2. Run `npm test` → fails. Implement `LearnedDrawer.tsx`: `.kx-drawer` right panel, tab strip, Pending list, Audit timeline (border-left spine + dots), close button; content from `mockData.pendingReviews` / `mockData.auditHistory` with demo-variant switching.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(reviews): add 450px Konteks Learned drawer with Pending and Audit History"
    ```

---

## Task 11 — Session History page

**AC:** 11, 40, 41 (+ 43 loading/empty, filters-no-results disabled state).

**Files**
- Create: `src/pages/SessionHistoryPage.tsx`, `src/pages/SessionHistoryPage.test.tsx`
- Modify: `src/components/shell/AppShell.tsx` (route the page into `.kx-main`), `src/styles/components.css`

**Steps**
1. Failing test-first — `SessionHistoryPage.test.tsx`:
   - renders as a dedicated page while the sidebar stays mounted and unchanged (AC11 — reuse the outerHTML-identity technique);
   - chronological list; each row shows **title first**, then Mode / System / Component metadata, with **time in the next column** (AC40);
   - the three-dot menu carries a hover-only visibility class (visible on row hover / `focus-within`, hidden otherwise) (AC40);
   - search input and mode/system filter controls exist at the top; a query/filter yielding no results shows a designed empty state (AC41, AC43);
   - `?mock=loading` shows skeleton rows (AC43).
2. Run `npm test` → fails. Implement `SessionHistoryPage.tsx`: header (title + search + filters), list of `mockData.sessionHistory` rows with hover three-dot menu (local open state), empty/loading variants.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(history): add Session History page with search, filters, and hover actions"
    ```

---

## Task 12 — Account menu + General/Billing/Team preserved visual refresh

**AC:** 42 (+ 9 tooltip unaffected).

**Files**
- Create: `src/components/account/AccountMenu.tsx`, `src/components/account/SettingsModal.tsx`, `src/components/account/Account.test.tsx`
- Modify: `src/components/shell/Sidebar.tsx` (user row opens account menu), `src/styles/components.css`

**Steps**
1. Failing test-first — `Account.test.tsx`:
   - account menu opens from the user row and lists **all** existing account actions from `mockData.accountActions` — no renames, reorders, removals, additions versus the data file (AC42);
   - Settings opens with sections General; Billing; Team; Billing sub-navigation shows exactly Usage, Plans, Providers, Budgets, Top Up, Transactions (AC42);
   - all surfaces use Warm Enterprise classes (raised surface, DM Sans) — visual refresh only (AC42);
   - Escape closes menu and settings; focus visible on items (AC45 support).
2. Run `npm test` → fails. Implement:
   - `AccountMenu.tsx`: anchored menu from the user row, actions from mock data (structure preserved from `Konteks2.mp4` reference — read-only local file, never committed).
   - `SettingsModal.tsx` boundaries: frame + section nav (General / Billing / Team + Billing subnav) rendering static refreshed content per section.
3. Run `npm test` → pass. Commit:
    ```bash
    git add -A && git commit -m "feat(account): preserve account menu and Settings structure with Warm Enterprise refresh"
    ```

---

## Task 13 — Responsive / accessibility / keyboard / focus / scroll behavior

**AC:** 3 (glow non-interference), 43 (states pass), 44, 45 (+ 12 collapse as width reclaim).

**Files**
- Create: `src/utils/overlays.ts` (shared Escape/overlay-close + focus-return helpers), `src/state/a11y.test.tsx` (Escape matrix — component-level)
- Modify: `src/styles/global.css` (focus-ring audit, scrollbar polish, `@media (max-width: 1280px)` adjustments), `src/styles/components.css` (1200×720 fit rules: composer max-width, modal/drawer fit), `src/components/shell/AppShell.tsx` (global keydown → `CLOSE_OVERLAY`), all overlay components (consume shared helpers)

**Steps**
1. Failing test-first — `src/state/a11y.test.tsx` render `App` and, for each overlay (system menu, execution profile menu, component menu, repository modal, manual repo modal, create-system modal, customize modal, learned drawer, account menu, settings): open it via its trigger, press Escape, assert it closes and focus returns to its trigger (AC45). Also assert tab order on the main page follows visual order (mode control → setup triggers → composer input → toolbar) (AC45).
2. Run `npm test` → fails. Implement `src/utils/overlays.ts` (`useOverlayEscape(onClose)` + focus-restore helper); wire into every overlay component and the AppShell global listener (single source, no duplication).
3. CSS pass in `global.css`/`components.css`: verify every interactive element has `:focus-visible` ring (AC45); custom scrollbars on all scroll containers (§15); `@media (max-width: 1280px)` — sidebar auto-suggest collapsed rail, composer and 790×580 modal must fit 1200×720 (frame centered with margins; `max-height` guard `calc(100vh - 48px)` **never** shrinking the 790×580 box below spec — if viewport < 828px height, allow vertical centering with page-level scroll inside `.kx-main` only) (AC44); glow `opacity`/`z-index` audit so text contrast is untouched (AC3); tooltips shown on `:focus-within` (AC45).
4. Contrast audit (quick manual pass): body text uses primary/secondary; muted `#778C78` only for large/decorative text (§16) — adjust classes if violated.
5. Run `npm test` → pass. `npm run dev` → resize to 1200×720: no horizontal page scroll, no clipped controls.
6. Commit:
    ```bash
    git add -A && git commit -m "fix(a11y): harden focus, keyboard, scroll, and responsive behavior"
    ```

---

## Task 14 — Playwright core flows, visual screenshots, axe checks, production build, README

**AC:** verifies 1–46 end-to-end (see matrix below).

**Files**
- Create: `tests/e2e/shell.spec.ts`, `tests/e2e/modes-composer.spec.ts`, `tests/e2e/execution-profile.spec.ts`, `tests/e2e/system-repository.spec.ts`, `tests/e2e/component-menu.spec.ts`, `tests/e2e/customize.spec.ts`, `tests/e2e/learned-drawer.spec.ts`, `tests/e2e/session-history.spec.ts`, `tests/e2e/account-settings.spec.ts`, `tests/e2e/accessibility.spec.ts`, `tests/e2e/visual.spec.ts`, `README.md`
- Modify: `playwright.config.ts` (finalize: `expect(timeout)`, screenshot output dir), `.gitignore` (ensure `artifacts/` ignored)

**Steps**
1. Write functional specs (each starts from `/`, uses `data-testid` selectors; expect assertions per AC):
   - `shell.spec.ts`: AC1 (240px sidebar, `#FAF8EF` canvas via `evaluate` computed style, DM Sans), AC2 (19.5px top-left/bottom-left radii), AC3 (glow layer present, `pointer-events: none`), AC6, AC7, AC8, AC10, AC11 (sidebar DOM unchanged on View all), AC12 (collapse/expand), AC13 (sticky create-new while scrolling), AC14 (no All Systems route).
   - `modes-composer.spec.ts`: AC15–AC21 (composer container contrast, unboxed icons, send disabled empty, disclaimer/badge placement via bounding-box checks, profile control position).
   - `execution-profile.spec.ts`: AC22–AC24 (anchored no-backdrop, sidecar on hover, Workspace settings separated, Manage opens Customize on Agents).
   - `system-repository.spec.ts`: AC25–AC29, AC33 (one active system; switching clears selection — assert checked boxes gone; manual form fields; Connect disabled invalid; create system becomes active).
   - `component-menu.spec.ts`: AC30–AC32 (anchored, flat rows, no type chip, search, multi-select count + Clear).
   - `customize.spec.ts`: AC34 (assert `boundingBox()` width 790 / height 580 on **every** tab), AC35 (header/nav static while content scrolls), AC36–AC38, AC9 (one-click open from sliders icon).
   - `learned-drawer.spec.ts`: AC39 (450px width box), AC20 (Reviews waiting opens on Pending), Pending/Audit rendering.
   - `session-history.spec.ts`: AC40–AC41 (row anatomy, three-dot visible only on hover via `toBeHidden`/`toBeVisible` with hover, search/filters).
   - `account-settings.spec.ts`: AC42 (menu actions, Billing sub-navigation exact entries).
2. `accessibility.spec.ts` using `AxeBuilder` from `@axe-core/playwright`: run axe on `/`, session history, and each overlay state (system menu, customize modal, learned drawer, repository modal); expect **zero violations** (tag `wcag2aa`) (AC45, §16).
3. `visual.spec.ts`: for each viewport `1440×900` and `1200×720` capture `page.screenshot()` to `artifacts/screenshots/<view>-<w>x<h>.png` (gitignored) for: new session (Engineering), planning mode, system menu open, execution profile menu + sidecar, repository modal, component menu, customize (Agents + one integration tab), learned drawer, session history, settings. Also assert at 1200×720: `document.documentElement.scrollWidth <= 1200` (no horizontal page scroll, AC44) and customize modal fully within viewport.
4. Also assert the visible `Illustrative data` marker renders (AC46 — per the user override it appears only on Session History and in the Settings notices; the sidebar and New Session render none) and demo variants load via `?mock=loading` / `?mock=empty` (AC43).
5. Run the full gate in order — expected results:
   ```bash
   npm install            # exit 0, up-to-date
   npm run verify:assets  # OK: 5/5 Konteks assets verified
   npm test               # all unit/component suites green
   npm run build          # tsc -b clean + dist/ emitted
   npm run test:e2e       # all Playwright specs green, screenshots written
   ```
6. Write `README.md`: project purpose (clickable mockup of the approved spec), scripts table (`npm install`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run verify:assets`, `npm run dev`), demo-state query params, asset provenance/verification note, and the AC→spec cross-reference.
7. Commit:
    ```bash
    git add -A && git commit -m "test(e2e): add core flows, visual captures, axe checks, and README"
    ```

---

## Acceptance criteria → task coverage map

| AC | Task | AC | Task | AC | Task | AC | Task |
|----|------|----|------|----|------|----|------|
| 1 | 4, 14 | 13 | 4, 14 | 25 | 3, 7, 14 | 37 | 9, 14 |
| 2 | 2, 4, 14 | 14 | 4, 14 | 26 | 3, 7, 14 | 38 | 9, 14 |
| 3 | 2, 13, 14 | 15 | 5, 14 | 27 | 7, 14 | 39 | 10, 14 |
| 4 | 2, 14 | 16 | 5, 14 | 28 | 7, 14 | 40 | 11, 14 |
| 5 | 2, 14 | 17 | 5, 14 | 29 | 7, 14 | 41 | 11, 14 |
| 6 | 4, 14 | 18 | 5, 14 | 30 | 8, 14 | 42 | 12, 14 |
| 7 | 4, 14 | 19 | 5, 14 | 31 | 8, 14 | 43 | 3–11, 13, 14 |
| 8 | 4, 14 | 20 | 5, 10, 14 | 32 | 3, 8, 14 | 44 | 13, 14 |
| 9 | 4, 9, 14 | 21 | 5, 6, 14 | 33 | 3, 7, 14 | 45 | 3, 13, 14 |
| 10 | 3, 4, 14 | 22 | 6, 14 | 34 | 9, 14 | 46 | 3, 14 |
| 11 | 3, 4, 11, 14 | 23 | 6, 14 | 35 | 9, 14 | | |
| 12 | 4, 13, 14 | 24 | 6, 14 | 36 | 9, 14 | | |

## Final verification checklist (run after Task 14)

```bash
npm install && npm run verify:assets   # OK: 5/5 assets
npm test                               # all unit/component green
npm run build                          # production build clean
npm run test:e2e                       # all specs green at 1440x900 and 1200x720
git status --porcelain                 # clean working tree
git log --oneline                      # 14 task commits on feat/konteks-clickable-mockup (no push)
```

Confirm: all 46 ACs covered per the matrix; no `fetch`/XHR in `src/` (`grep -rn "fetch(" src/` → empty); reference videos/screenshots absent from history; "Illustrative data" marker visible in the running mockup (Session History page notice + Settings section notices only, per the user override).

## Execution handoff options

- **Subagent-Driven (this session)** — spawn one executing-plans subagent per task in order (Tasks 1–14 are strictly sequential; each depends on the prior), reviewing diffs between tasks.
- **Parallel Session (separate executing-plans session)** — start a fresh session with the superpowers:executing-plans skill pointed at this plan file on branch `feat/konteks-clickable-mockup`; it executes Task 1 → Task 14 in order and reports back.
