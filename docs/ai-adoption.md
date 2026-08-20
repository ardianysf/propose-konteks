# AI Adoption Guide — Konteks Components

This guide helps AI developers understand how to locate, understand, and adopt components from the Konteks design system catalog.

**Scope:** This is a source-first mockup, not a published npm package. Components are copied via relative imports, not installed from a registry.

---

## Table of Contents

- [Locating the Catalog & Manifest](#locating-the-catalog--manifest)
- [Component Classifications](#component-classifications)
- [Copy-Layout Convention](#copy-layout-convention)
- [What to Copy](#what-to-copy)
- [Token Contract](#token-contract)
- [MockupFixtureProvider & OverlayLifecycle Caveats](#mockupfixtureprovider--overlaylifecycle-caveats)
- [Using the Manifest](#using-the-manifest)
- [Verification Commands](#verification-commands)

---

## Locating the Catalog & Manifest

The catalog is a dual-output design system reference that documents all components:

| Resource | Path | Purpose |
|----------|------|---------|
| Component manifest | `src/catalog/components.json` | Canonical component inventory |
| Catalog entry point | `src/catalog/main.tsx` | Catalog app (dev at `http://localhost:5173/catalog.html`) |
| Registry | `src/catalog/registry.tsx` | Runtime component registry (previews) |
| Design tokens | `src/styles/tokens.css` | All CSS custom properties (`--kx-*`) |

**Running the catalog:**

```bash
npm run dev                # Starts dev server
# Open http://localhost:5173/catalog.html
```

The catalog provides live previews, code snippets, and adoption notes for each component.

---

## Component Classifications

Every component in `components.json` has a `classification` field that determines adoption complexity:

| Classification | Meaning | Context Required |
|----------------|---------|------------------|
| `adoptable` | Standalone, presentation-only | **None** — can be copied directly |
| `mockup-coupled` | Reads/dispatches from mockup store | **Yes** — requires `MockupContext` |
| `internal` | App shell, not meaningful outside mockup | **Yes** — but not for adoption |
| `utility` | Pure functions, hooks, or adapters | **None** — just import |

**Adoption decision:**
- `adoptable` → Copy and go
- `mockup-coupled` → Requires understanding `MockupContext` and `OverlayLifecycleProvider`
- `internal` → Do not adopt (e.g., `AppShell`, `Sidebar`)
- `utility` → Import as a module (e.g., `formatTime`, `useFocusContainment`)

---

## Copy-Layout Convention

Components are adopted via **relative imports**, not npm installation. The convention:

```
your-project/
├── src/
│   ├── components/        # Copied component files
│   │   └── konteks/       # Optional namespace directory
│   │       ├── Button.tsx
│   │       └── Button.css
│   ├── styles/
│   │   └── konteks-tokens.css  # Copy of tokens.css (or reference)
```

**Import pattern:**

```tsx
// In your app
import Button from './components/konteks/Button'
import './components/konteks/Button.css'
import './styles/konteks-tokens.css'  // Required for --kx-* tokens
```

**Key rules:**
1. Keep relative imports (`./` or `../`)
2. Copy both `.tsx` and `.css` files
3. Ensure tokens are available in your CSS cascade
4. For `mockup-coupled` components, copy dependencies too (see below)

---

## What to Copy

### 1. Component Source Files

Check `sourcePath` in `components.json`:

```json
{
  "id": "account-menu",
  "sourcePath": "src/components/account/AccountMenu.tsx",
  "cssFiles": ["src/styles/components.css", "src/components/account/AccountMenu.css"]
}
```

Copy all listed files to your target project.

### 2. CSS Dependencies

`cssFiles` lists all CSS files required for the component:

- `src/styles/components.css` — Shared component styles (global class utilities)
- Component-specific CSS — e.g., `src/components/account/AccountMenu.css`

Copy these and import them in the same order.

### 3. Provider Contract (for `mockup-coupled` components)

`mockup-coupled` components require the `MockupContext` provider. Check `contextContract`:

```json
{
  "contextContract": {
    "reads": ["overlay", "systems"],
    "dispatches": ["OPEN_OVERLAY", "SET_ACTIVE_SYSTEM"]
  }
}
```

You have two options:

#### Option A: Adopt the full mockup context (for interactive previews)

Copy and wire:
- `src/state/MockupContext.tsx`
- `src/state/mockupReducer.ts`
- `src/state/initialState.ts` (if separate)
- `src/components/shell/OverlayLifecycle.tsx` (if using overlays)

Wrap your app:

```tsx
import { MockupProvider } from './state/MockupContext'
import { initialState, mockupReducer } from './state/mockupReducer'
import { useReducer } from 'react'

function App() {
  const [state, dispatch] = useReducer(mockupReducer, initialState())

  return (
    <MockupProvider value={{ state, dispatch }}>
      {/* Your copied component */}
      <AccountMenu />
    </MockupProvider>
  )
}
```

#### Option B: Stub the context (for static visual adoption)

Create a minimal stub that satisfies the `reads` and `dispatches`:

```tsx
import { type ReactNode } from 'react'
import { MockupProvider } from './state/MockupContext'
import { initialState } from './state/initialState'
import type { MockupAction } from './state/mockupReducer'

export function MockupStubProvider({ children }: { children: ReactNode }) {
  const stubState = initialState()

  const stubDispatch = (action: MockupAction) => {
    // No-op for static adoption
  }

  return (
    <MockupProvider value={{ state: stubState, dispatch: stubDispatch }}>
      {children}
    </MockupProvider>
  )
}
```

### 4. Token Dependencies

`tokenDeps` lists all CSS custom properties the component uses:

```json
{
  "tokenDeps": [
    "--kx-primary",
    "--kx-border",
    "--kx-accent"
  ]
}
```

Ensure `src/styles/tokens.css` is loaded in your CSS cascade. Copy it or `@import` it.

---

## Token Contract

All visual styling uses CSS custom properties defined in `src/styles/tokens.css`:

```css
:root {
  /* Palette */
  --kx-canvas: #faf8ef;
  --kx-raised: #fff;
  --kx-primary: #243025;
  --kx-accent: #8fbf6a;
  --kx-accent-strong: #5f8d4e;
  /* Additional tokens available in src/styles/tokens.css */
}
```

**Requirements:**
1. Load `tokens.css` before your component CSS
2. Do not override tokens unless intentionally theming
3. Token names follow `--kx-*` prefix convention

**Loading tokens:**

```css
/* In your global CSS */
@import './konteks-tokens.css';  /* Copy of src/styles/tokens.css */
/* Your app styles follow here */
```

---

## MockupFixtureProvider & OverlayLifecycle Caveats

### MockupFixtureProvider

Used in the catalog for live previews of `mockup-coupled` components. **Not needed for adoption** — it's a testing/preview utility.

**What it does:**
- Wraps the real `mockupReducer` with controlled initial state
- Enables interactive previews in the catalog
- Wires `OverlayLifecycleProvider` automatically

**For adoption:**
- Do **not** copy `MockupFixtureProvider` — use `MockupProvider` directly
- See [Provider Contract](#3-provider-contract-for-mockup-coupled-components) above

### OverlayLifecycle

Components that use overlays (e.g., `WorkspaceMenu`) call `useOverlayLifecycle()` for:
- Escape key dismissal
- Focus return to the trigger element

**Caveats:**
1. Requires `OverlayLifecycleProvider` in the component tree
2. Provider receives `overlay` and `dispatch` as props (not via MockupContext)
3. The provider is **type-only coupled** — it doesn't read MockupContext

**Wiring OverlayLifecycleProvider:**

```tsx
import { OverlayLifecycleProvider } from './components/shell/OverlayLifecycle'

function App() {
  const [state, dispatch] = useReducer(mockupReducer, initialState())

  return (
    <MockupProvider value={{ state, dispatch }}>
      {/* OverlayLifecycle is separate from MockupContext */}
      <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
        <WorkspaceMenu />
      </OverlayLifecycleProvider>
    </MockupProvider>
  )
}
```

**Special case:** Some `adoptable` components (like `WorkspaceMenu`) still use `useOverlayLifecycle` but don't require `MockupContext`. Their `contextContract` is `null`, but they need `OverlayLifecycleProvider` above them.

---

## Using the Manifest

The manifest (`src/catalog/components.json`) is the authoritative source for component metadata. Use it to:

### Programmatically discover components

```typescript
import componentsJson from './catalog/components.json'

const adoptableComponents = componentsJson.components.filter(
  (c) => c.classification === 'adoptable'
)

console.log(adoptableComponents.map((c) => ({ id: c.id, name: c.name })))
```

### Generate copy scripts

```bash
# Example: Copy all adoptable components
node -e "
import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'

const manifest = JSON.parse(readFileSync('src/catalog/components.json', 'utf8'))

manifest.components
  .filter(c => c.classification === 'adoptable')
  .forEach(c => {
    console.log(\`Copy: \${c.sourcePath}\`)
    // Add your copy implementation here
  })
"
```

### Validate component contracts

The manifest is validated by `npm run verify:manifest`, which checks:
- S1: Schema validity (ids, domains, classifications)
- S2: `sourcePath` exists on filesystem
- S3: Exports exist in source files
- S4: `propDocs` names match props interface
- S5: Manifest ↔ registry 1:1 correspondence
- S6: `tokenDeps` exist in `tokens.css`
- S7: `contextContract` shape matches classification

---

## Verification Commands

After copying components, verify your setup:

### 1. Verify manifest integrity

```bash
npm run verify:manifest
# Output: OK (<n> entries)
```

### 2. Type-check

```bash
npm run typecheck
# Should exit 0 with no errors
```

### 3. Build

```bash
npm run build
# Produces dist/index.html, dist/catalog.html, dist/components.json, dist/ai-adoption.md
```

### 4. Dev server

```bash
npm run dev
# Main mockup: http://localhost:5173
# Catalog: http://localhost:5173/catalog.html
```

### 5. Preview production build

```bash
npm run build
npm run preview
# Main mockup: http://localhost:4173
# Catalog: http://localhost:4173/catalog.html
```

---

## Known Scope & Limitations

1. **Source-first, not npm package:**
   - Components are copied via relative imports
   - No versioning or semver guarantees
   - Updates require manual re-copy

2. **Mockup data is illustrative:**
   - All timestamps, counts, names are placeholders
   - Do not use for production data decisions

3. **Chromium-only E2E:**
   - `npm run test:e2e` runs Playwright on Chromium only
   - Firefox/WebKit behavior is out of scope

4. **Accessibility:**
   - Axe checks target `wcag2aa` only
   - AAA and best-practice tags are excluded

5. **Visual captures:**
   - Screenshots are for human review, not pixel-diff baselines
   - Located in `artifacts/screenshots/`

---

## Quick Start: Adopting an Adoptable Component

Example: Adopt `CollapseIcon` (fully standalone)

1. **Check the manifest entry:**

```json
{
  "id": "collapse-icon",
  "name": "CollapseIcon",
  "classification": "adoptable",
  "sourcePath": "src/components/shell/CollapseIcon.tsx",
  "cssFiles": [],
  "tokenDeps": [],
  "propDocs": {
    "collapsed": "required, boolean — current sidebar collapsed state"
  }
}
```

2. **Copy the source file:**

```bash
cp src/components/shell/CollapseIcon.tsx your-project/src/components/CollapseIcon.tsx
```

3. **Import and use:**

```tsx
import { useState } from 'react'
import CollapseIcon from './components/CollapseIcon'

function MySidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <button onClick={() => setCollapsed(!collapsed)}>
      <CollapseIcon collapsed={collapsed} />
    </button>
  )
}
```

4. **Verify:**

```bash
npm run typecheck  # Should pass
```

That's it — no providers, no context, no CSS dependencies!

---

## Quick Start: Adopting a Mockup-Coupled Component

Example: Adopt `SessionStatusBadge`

1. **Check the manifest entry:**

```json
{
  "id": "session-status-badge",
  "name": "SessionStatusBadge",
  "classification": "mockup-coupled",
  "sourcePath": "src/components/session/SessionStatusBadge.tsx",
  "cssFiles": [
    "src/styles/components.css",
    "src/components/session/sessionBadges.css"
  ],
  "tokenDeps": ["--kx-accent-solid-aa", "--kx-primary"],
  "contextContract": {
    "reads": ["sessionDetail"],
    "dispatches": []
  }
}
```

2. **Copy files:**

```bash
cp src/components/session/SessionStatusBadge.tsx your-project/src/components/
cp src/styles/components.css your-project/src/styles/
cp src/components/session/sessionBadges.css your-project/src/components/
cp src/styles/tokens.css your-project/src/styles/
```

3. **Set up MockupContext with complete typed fixture:**

```tsx
import { MockupProvider } from './state/MockupContext'
import { initialState, mockupReducer } from './state/mockupReducer'
import { useReducer } from 'react'
import SessionStatusBadge from './components/SessionStatusBadge'
import './styles/tokens.css'
import './styles/components.css'
import './components/sessionBadges.css'

function App() {
  const [state] = useReducer(mockupReducer, {
    ...initialState(),
    sessionDetail: {
      sessionId: 'test-session',
      title: 'Test Session',
      status: 'IN_PROGRESS',
      mode: 'engineering',
      systemId: 'test-system',
      systemName: 'Test System',
      componentName: 'test-component',
      repository: 'test/repo',
      branch: 'main',
      issueRef: '#1',
      agent: 'Test Agent',
      createdBy: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentCycle: 1,
      totalCycles: 1,
      stages: [
        { id: 'ideation', label: 'Ideation', status: 'IN_PROGRESS' },
        { id: 'quote', label: 'Quote', status: 'NOT_STARTED' },
        { id: 'plan', label: 'Plan', status: 'NOT_STARTED' },
        { id: 'delivery', label: 'Delivery', status: 'NOT_STARTED' },
        { id: 'receipt', label: 'Receipt', status: 'NOT_STARTED' },
        { id: 'lessons', label: 'Lessons', status: 'NOT_STARTED' },
      ],
      quotes: [],
      delivery: {
        id: '',
        status: 'NOT_STARTED',
        artifacts: [],
      },
      timeline: [],
    },
  })

  return (
    <MockupProvider value={{ state, dispatch: () => {} }}>
      <SessionStatusBadge />
    </MockupProvider>
  )
}
```

4. **Verify:**

```bash
npm run typecheck  # Should pass
npm run dev        # Preview at http://localhost:5173
```

---

## Summary Checklist

For each component you adopt:

- [ ] Check `classification` in `components.json`
- [ ] Copy `sourcePath` file(s)
- [ ] Copy all `cssFiles` and import in order
- [ ] Copy `src/styles/tokens.css` and load it
- [ ] If `mockup-coupled`:
  - [ ] Copy `MockupContext` and reducer (or create stub)
  - [ ] Wrap component in `MockupProvider`
  - [ ] If using overlays, also wrap in `OverlayLifecycleProvider`
  - [ ] Ensure `contextContract.reads` state is populated
- [ ] Run `npm run typecheck`
- [ ] Run `npm run verify:manifest`
- [ ] Test in dev server

---

**For more details, see:**
- Design spec: `docs/superpowers/specs/2026-08-16-konteks-visual-revamp-design.md`
- Implementation plan: `docs/plans/2026-08-16-konteks-clickable-mockup-implementation.md`
- Catalog source: `src/catalog/`
